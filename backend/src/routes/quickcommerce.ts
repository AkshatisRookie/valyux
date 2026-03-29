import { Router, type Request, type Response } from 'express';
import NodeCache from 'node-cache';
import type { Platform } from '../config/platforms.js';
import { QC_GROUP_PLATFORMS, mapApiPlatformName } from '../config/qcPlatforms.js';
import { mergeAndUnify } from '../services/qcMerge.js';

const router = Router();
const BASE = (process.env.QUICKCOMMERCE_API_BASE || 'https://api.quickcommerceapi.com').replace(/\/$/, '');
const API_KEY = process.env.QUICKCOMMERCE_API_KEY || '';

/** Search: 5 min. ETA: 24h for same coordinates. */
const searchCache = new NodeCache({ stdTTL: 300, checkperiod: 60 });
const etaCache = new NodeCache({ stdTTL: 86400, checkperiod: 600 });

function requireKey(res: Response): boolean {
  if (!API_KEY) {
    res.status(503).json({
      error: 'QuickCommerce API not configured',
      message: 'Set QUICKCOMMERCE_API_KEY in backend .env',
    });
    return false;
  }
  return true;
}

async function fetchJson(url: string): Promise<unknown> {
  const res = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'X-API-Key': API_KEY,
    },
    signal: AbortSignal.timeout(60000),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`QuickCommerce ${res.status}: ${text.slice(0, 400)}`);
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new Error('Invalid JSON from QuickCommerce');
  }
}

interface EtaCacheValue {
  etaByPlatform: Partial<Record<Platform, string>>;
  openByPlatform: Partial<Record<Platform, boolean>>;
}

function buildEtaAndOpen(data: unknown): EtaCacheValue {
  const d = data as Record<string, unknown>;
  const inner = d?.data && typeof d.data === 'object' ? (d.data as Record<string, unknown>) : null;
  const results = inner?.results;
  const etaByPlatform: Partial<Record<Platform, string>> = {};
  const openByPlatform: Partial<Record<Platform, boolean>> = {};
  if (!Array.isArray(results)) return { etaByPlatform, openByPlatform };
  for (const r of results) {
    if (!r || typeof r !== 'object') continue;
    const row = r as Record<string, unknown>;
    const name = String(row.platform ?? '');
    const plat = mapApiPlatformName(name);
    if (!plat) continue;
    const eta = row.eta != null ? String(row.eta) : '';
    if (eta) etaByPlatform[plat] = eta;
    const open = row.open;
    openByPlatform[plat] = open === true || open === 'true';
  }
  return { etaByPlatform, openByPlatform };
}

async function getOrFetchGroupEta(
  lat: string,
  lon: string,
  pincode: string
): Promise<EtaCacheValue> {
  const key = `eta:v2:${lat}:${lon}:${pincode}:${QC_GROUP_PLATFORMS}`;
  const hit = etaCache.get<EtaCacheValue>(key);
  if (hit) return hit;

  const params = new URLSearchParams({
    lat,
    lon,
    platforms: QC_GROUP_PLATFORMS,
  });
  if (pincode) params.set('pincode', pincode);

  const url = `${BASE}/v1/groupeta?${params}`;
  const json = await fetchJson(url);
  const value = buildEtaAndOpen(json);
  etaCache.set(key, value);
  return value;
}

/** GET /api/qc/groupeta?lat=&lon=&pincode= */
router.get('/qc/groupeta', async (req: Request, res: Response): Promise<void> => {
  if (!requireKey(res)) return;
  const lat = String(req.query.lat ?? '').trim();
  const lon = String(req.query.lon ?? '').trim();
  const pincode = String(req.query.pincode ?? '').trim();

  if (!lat || !lon || Number.isNaN(Number(lat)) || Number.isNaN(Number(lon))) {
    res.status(400).json({ error: 'Valid lat and lon required' });
    return;
  }

  try {
    const key = `eta:v2:${lat}:${lon}:${pincode}:${QC_GROUP_PLATFORMS}`;
    const hit = etaCache.get<EtaCacheValue>(key);
    if (hit) {
      res.json({ cached: true, etaByPlatform: hit.etaByPlatform, openByPlatform: hit.openByPlatform });
      return;
    }
    const { etaByPlatform, openByPlatform } = await getOrFetchGroupEta(lat, lon, pincode);
    res.json({ cached: false, etaByPlatform, openByPlatform });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'ETA failed';
    console.error('[qc/groupeta]', msg);
    res.status(502).json({ error: 'QuickCommerce ETA failed', message: msg });
  }
});

/** GET /api/qc/groupsearch?q=&lat=&lon=&pincode= */
router.get('/qc/groupsearch', async (req: Request, res: Response): Promise<void> => {
  if (!requireKey(res)) return;
  const q = String(req.query.q ?? '').trim();
  const lat = String(req.query.lat ?? '').trim();
  const lon = String(req.query.lon ?? '').trim();
  const pincode = String(req.query.pincode ?? '').trim();

  if (q.length < 2) {
    res.status(400).json({ error: 'Query must be at least 2 characters' });
    return;
  }
  if (!lat || !lon || Number.isNaN(Number(lat)) || Number.isNaN(Number(lon))) {
    res.status(400).json({ error: 'Valid lat and lon required' });
    return;
  }

  const cacheKey = `gs:${q.toLowerCase()}:${lat}:${lon}:${pincode}:${QC_GROUP_PLATFORMS}`;
  const cached = searchCache.get<unknown>(cacheKey);
  if (cached) {
    const { etaByPlatform: etaMap } = await getOrFetchGroupEta(lat, lon, pincode).catch(() => ({ etaByPlatform: {}, openByPlatform: {} }));
    const results = mergeAndUnify(cached, etaMap);
    res.json({
      results,
      meta: { totalResults: results.length, fetchedAt: new Date().toISOString(), cached: true },
    });
    return;
  }

  try {
    const { etaByPlatform: etaMap } = await getOrFetchGroupEta(lat, lon, pincode);

    const params = new URLSearchParams({
      q,
      lat,
      lon,
      platforms: QC_GROUP_PLATFORMS,
    });
    if (pincode) params.set('pincode', pincode);

    const url = `${BASE}/v1/groupsearch?${params}`;
    const json = await fetchJson(url);
    searchCache.set(cacheKey, json);

    const results = mergeAndUnify(json, etaMap);
    res.json({
      results,
      meta: { totalResults: results.length, fetchedAt: new Date().toISOString(), cached: false },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Search failed';
    console.error('[qc/groupsearch]', msg);
    res.status(502).json({ error: 'QuickCommerce search failed', message: msg });
  }
});

export default router;
