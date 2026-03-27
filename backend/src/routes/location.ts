import { Router, type Request, type Response } from 'express';
import NodeCache from 'node-cache';

const router = Router();

/** Nominatim — see https://operations.osmfoundation.org/policies/nominatim/ */
const NOMINATIM = 'https://nominatim.openstreetmap.org/search';

const USER_AGENT = process.env.NOMINATIM_USER_AGENT || 'Valyux/1.0 (contact:support@valyux.local)';
const LOCATIONIQ_KEY = (process.env.LOCATIONIQ_API_KEY || '').trim();

/**
 * Simple in-memory scheduler to keep upstream calls under a global RPS cap.
 * This is per-backend-instance; if you scale horizontally, move this to a shared limiter/queue.
 */
function createGlobalRpsScheduler(rps: number, maxQueueMs: number) {
  const intervalMs = Math.max(1, Math.floor(1000 / Math.max(1, rps)));
  let nextAt = Date.now();

  return async function schedule(): Promise<void> {
    const now = Date.now();
    const scheduled = Math.max(now, nextAt);
    const waitMs = scheduled - now;

    if (waitMs > maxQueueMs) {
      throw new Error('UPSTREAM_QUEUE_FULL');
    }

    nextAt = scheduled + intervalMs;

    if (waitMs <= 0) return;
    await new Promise<void>((resolve) => setTimeout(resolve, waitMs));
  };
}

const LOCATIONIQ_RPS = Number(process.env.LOCATIONIQ_RPS || '2') || 2;
const LOCATIONIQ_MAX_QUEUE_MS = Number(process.env.LOCATIONIQ_MAX_QUEUE_MS || '12000') || 12000;
const scheduleLocationIq = createGlobalRpsScheduler(LOCATIONIQ_RPS, LOCATIONIQ_MAX_QUEUE_MS);
const LOCATIONIQ_COOLDOWN_SECONDS = Number(process.env.LOCATIONIQ_COOLDOWN_SECONDS || '60') || 60;
const locationIqCooldownCache = new NodeCache({ stdTTL: LOCATIONIQ_COOLDOWN_SECONDS, checkperiod: 30 });

// Nominatim enforces strict rate limits. Cache to avoid repeated calls
// when users refresh or trigger "use current location" multiple times.
const autocompleteCache = new NodeCache({ stdTTL: 3600, checkperiod: 600 }); // 1h
const reverseCache = new NodeCache({ stdTTL: 3600, checkperiod: 600 }); // 1h
// When Nominatim returns 429, the rate-limit often persists for a few minutes.
// Use a longer cooldown to prevent repeated calls from keeping you in 429 mode.
const reverseCooldownCache = new NodeCache({ stdTTL: 600, checkperiod: 60 }); // 10m

// Also protect autocomplete endpoint from hammering Nominatim.
const autocompleteCooldownCache = new NodeCache({ stdTTL: 120, checkperiod: 60 }); // 2m

interface NominatimItem {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
  address?: {
    postcode?: string;
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    suburb?: string;
    neighbourhood?: string;
    road?: string;
  };
}

function extractPincode(item: NominatimItem): string | null {
  const raw = item.address?.postcode?.trim() || '';
  const digitsOnly = raw.replace(/\D/g, '');
  if (digitsOnly.length === 6) return digitsOnly;
  const m = item.display_name.match(/\b(\d{6})\b/);
  return m ? m[1] : null;
}

function shortLabel(item: NominatimItem): string {
  const a = item.address;
  if (!a) return item.display_name.split(',').slice(0, 3).join(',').trim();
  const parts: string[] = [];
  if (a.road || a.neighbourhood || a.suburb) {
    parts.push([a.road, a.neighbourhood, a.suburb].filter(Boolean).join(', '));
  }
  const locality = a.city || a.town || a.village || '';
  if (locality) parts.push(locality);
  if (a.state) parts.push(a.state);
  const joined = parts.filter(Boolean).join(' · ');
  return joined || item.display_name.split(',').slice(0, 2).join(',').trim();
}

/** GET /api/location/autocomplete?q=... */
router.get('/location/autocomplete', async (req: Request, res: Response): Promise<void> => {
  const q = (req.query.q as string || '').trim();
  if (q.length < 3) {
    res.status(400).json({ error: 'Query must be at least 3 characters' });
    return;
  }

  if (autocompleteCooldownCache.get<string>('global')) {
    res.status(429).json({
      error: 'Address lookup rate-limited',
      message: 'Please try again in a few minutes.',
    });
    return;
  }

  const cacheKey = `ac:${q.toLowerCase()}`;
  const cached = autocompleteCache.get<{ results: unknown[] }>(cacheKey);
  if (cached) {
    res.json(cached);
    return;
  }

  const url = new URL(NOMINATIM);
  url.searchParams.set('q', q);
  url.searchParams.set('format', 'json');
  url.searchParams.set('addressdetails', '1');
  url.searchParams.set('countrycodes', 'in');
  url.searchParams.set('limit', '8');

  try {
    const upstream = await fetch(url.toString(), {
      headers: {
        Accept: 'application/json',
        'User-Agent': USER_AGENT,
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!upstream.ok) {
      const bodyText = await upstream.text().catch(() => '');
      console.error('[location/autocomplete] Upstream failed', upstream.status, bodyText.slice(0, 300));
      if (upstream.status === 429) {
        autocompleteCooldownCache.set('global', '1');
      }
      res.status(502).json({
        error: 'Address lookup failed',
        status: upstream.status,
        message: bodyText.slice(0, 300) || 'Upstream returned an error',
      });
      return;
    }

    const data = (await upstream.json()) as NominatimItem[];

    const results = data
      .map((item) => {
        const pincode = extractPincode(item);
        if (!pincode) return null;
        return {
          id: String(item.place_id),
          label: shortLabel(item),
          fullLabel: item.display_name,
          pincode,
          lat: item.lat,
          lon: item.lon,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);

    const payload = { results };
    autocompleteCache.set(cacheKey, payload);
    res.json(payload);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Search failed';
    console.error('[location/autocomplete]', msg);
    res.status(500).json({ error: 'Search failed', message: msg });
  }
});

/** GET /api/location/pincode-geocode?pincode=560001 — center point for manual pincode entry */
router.get('/location/pincode-geocode', async (req: Request, res: Response): Promise<void> => {
  const pincode = (req.query.pincode as string || '').trim();
  if (!/^\d{6}$/.test(pincode)) {
    res.status(400).json({ error: 'Valid 6-digit pincode required' });
    return;
  }

  const url = new URL(NOMINATIM);
  url.searchParams.set('q', `${pincode} India`);
  url.searchParams.set('format', 'json');
  url.searchParams.set('addressdetails', '1');
  url.searchParams.set('countrycodes', 'in');
  url.searchParams.set('limit', '1');

  try {
    const upstream = await fetch(url.toString(), {
      headers: {
        Accept: 'application/json',
        'User-Agent': USER_AGENT,
      },
      signal: AbortSignal.timeout(15000),
    });
    if (!upstream.ok) {
      res.status(502).json({ error: 'Geocoding failed' });
      return;
    }
    const data = (await upstream.json()) as NominatimItem[];
    const first = Array.isArray(data) && data[0];
    if (!first) {
      res.status(404).json({ error: 'Could not locate pincode' });
      return;
    }
    res.json({
      pincode,
      lat: first.lat,
      lon: first.lon,
      label: shortLabel(first),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Geocode failed';
    res.status(500).json({ error: msg });
  }
});

/** GET /api/location/reverse?lat=..&lon=..
 * Uses LocationIQ reverse geocoding to extract the nearest pincode + address label.
 */
router.get('/location/reverse', async (req: Request, res: Response): Promise<void> => {
  const latRaw = String(req.query.lat ?? '').trim();
  const lonRaw = String(req.query.lon ?? '').trim();
  const lat = Number(latRaw);
  const lon = Number(lonRaw);

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    res.status(400).json({ error: 'Valid lat and lon required' });
    return;
  }

  // Round coordinates to increase cache hits.
  // 2 decimals ~ 1km, enough for stable pincode extraction.
  const key = `rev:${lat.toFixed(2)}:${lon.toFixed(2)}`;

  // If Nominatim rate-limited recently, avoid hammering it.
  if (reverseCooldownCache.get<string>(key)) {
    res.status(429).json({
      error: 'Reverse geocoding rate-limited. Please try again in a moment.',
    });
    return;
  }
  const cached = reverseCache.get<{ pincode: string; addressLabel: string; lat: string; lon: string }>(key);
  if (cached) {
    res.json(cached);
    return;
  }

  if (!LOCATIONIQ_KEY) {
    res.status(500).json({
      error: 'LocationIQ API key missing',
      message: 'Set LOCATIONIQ_API_KEY in backend/.env',
    });
    return;
  }

  // If LocationIQ rate-limited recently, fail fast so we don't keep hammering upstream.
  if (locationIqCooldownCache.get<string>('global')) {
    res.setHeader('Retry-After', String(LOCATIONIQ_COOLDOWN_SECONDS));
    res.status(429).json({
      error: 'Too many requests',
      message: 'Geocoding provider rate-limited. Please use pincode search below and try again later.',
      retryAfterSeconds: LOCATIONIQ_COOLDOWN_SECONDS,
    });
    return;
  }

  const url = new URL('https://us1.locationiq.com/v1/reverse');
  url.searchParams.set('key', LOCATIONIQ_KEY);
  url.searchParams.set('lat', String(lat));
  url.searchParams.set('lon', String(lon));
  url.searchParams.set('format', 'json');

  try {
    // Global upstream throttle: keeps bursts (e.g. many users clicking at once) under LocationIQ limits.
    await scheduleLocationIq();

    const upstream = await fetch(url.toString(), {
      headers: {
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!upstream.ok) {
      const bodyText = await upstream.text().catch(() => '');
      const snippet = bodyText.slice(0, 300);
      const looksLikeHtml = /^\s*</.test(bodyText) && /<html|<!doctype/i.test(bodyText);

      // Helps quickly diagnose issues like 401/403 (bad key) / 429 (rate limits).
      console.error('[location/reverse] Upstream failed', upstream.status, snippet);

      if (upstream.status === 429) {
        reverseCooldownCache.set(key, '1');
        locationIqCooldownCache.set('global', '1');
        res.setHeader('Retry-After', '120');
        res.status(429).json({
          error: 'Too many requests',
          message:
            'Geocoding provider rate-limited (429). Please use pincode search below or wait a few minutes and try again.',
          retryAfterSeconds: 120,
        });
        return;
      }

      res.status(502).json({
        error: 'Reverse geocoding failed',
        status: upstream.status,
        message: looksLikeHtml ? 'Upstream returned an HTML error page' : (snippet || 'Upstream returned an error'),
      });
      return;
    }

    const data = (await upstream.json()) as {
      lat?: string;
      lon?: string;
      display_name?: string;
      address?: {
        postcode?: string;
        city?: string;
        town?: string;
        village?: string;
        state?: string;
        suburb?: string;
        neighbourhood?: string;
        road?: string;
      };
    };

    const item: NominatimItem = {
      place_id: 0,
      lat: String(data.lat ?? lat),
      lon: String(data.lon ?? lon),
      display_name: String(data.display_name ?? `${lat},${lon}`),
      address: data.address,
    };

    const pincode = extractPincode(item);
    if (!pincode) {
      res.status(404).json({ error: 'Could not extract pincode from your location' });
      return;
    }

    const payload = {
      pincode,
      addressLabel: shortLabel(item),
      lat: String(item.lat),
      lon: String(item.lon),
    };
    reverseCache.set(key, payload);
    res.json(payload);
  } catch (err) {
    if (err instanceof Error && err.message === 'UPSTREAM_QUEUE_FULL') {
      res.setHeader('Retry-After', '15');
      res.status(429).json({
        error: 'Server busy',
        message: 'High traffic. Please enter your pincode below or try again in a few seconds.',
        retryAfterSeconds: 15,
      });
      return;
    }
    const msg = err instanceof Error ? err.message : 'Reverse geocode failed';
    res.status(500).json({ error: msg });
  }
});

export default router;
