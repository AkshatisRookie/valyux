import { Router, type Request, type Response } from 'express';
import NodeCache from 'node-cache';

const router = Router();

/** Mapbox Geocoding (forward + reverse). */
const MAPBOX_BASE =
  process.env.MAPBOX_GEOCODING_BASE || 'https://api.mapbox.com/geocoding/v5/mapbox.places';
const MAPBOX_ACCESS_TOKEN = (process.env.MAPBOX_ACCESS_TOKEN || '').trim();
const MAPBOX_COUNTRY = (process.env.MAPBOX_COUNTRY || 'in').toLowerCase();

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

interface MapboxFeature {
  id?: string;
  place_name?: string;
  text?: string;
  /** [lon, lat] */
  center?: [number, number];
  place_type?: string[];
  context?: Array<{ id?: string; text?: string }>;
}

function extractPincodeFromFeature(feature: MapboxFeature): string | null {
  const placeTypes = feature.place_type || [];

  // If this feature is already a postcode, Mapbox usually puts it in `text`.
  if (placeTypes.includes('postcode')) {
    const digits = String(feature.text || '').replace(/\D/g, '');
    if (digits.length === 6) return digits;
  }

  // Otherwise, check context entries like { id: 'postcode.560001', text: '560001' }.
  const ctx = feature.context || [];
  const pc = ctx.find((c) => (c.id || '').toLowerCase().startsWith('postcode.'));
  if (pc?.text) {
    const digits = String(pc.text).replace(/\D/g, '');
    if (digits.length === 6) return digits;
  }

  return null;
}

function shortLabelFromPlaceName(placeName: string): string {
  const cleaned = (placeName || '').replace(/\s+/g, ' ').trim();
  if (!cleaned) return '';
  const parts = cleaned
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean)
    .filter((p) => p.toLowerCase() !== 'india');
  return (parts.slice(0, 3).join(', ') || cleaned).trim();
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

  if (!MAPBOX_ACCESS_TOKEN) {
    res.status(500).json({
      error: 'Mapbox access token missing',
      message: 'Set MAPBOX_ACCESS_TOKEN in backend/.env',
    });
    return;
  }

  const url = `${MAPBOX_BASE}/${encodeURIComponent(q)}.json`;
  const params = new URLSearchParams({
    access_token: MAPBOX_ACCESS_TOKEN,
    country: MAPBOX_COUNTRY,
    limit: '8',
    // Include postcode so we can populate `pincode` for live grocery search.
    types: 'address,place,postcode',
    autocomplete: 'true',
  });

  try {
    const upstream = await fetch(`${url}?${params.toString()}`, {
      headers: { Accept: 'application/json' },
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

    const data = (await upstream.json()) as { features?: MapboxFeature[] };
    const features = Array.isArray(data.features) ? data.features : [];

    const results = features
      .map((feature) => {
        const pincode = extractPincodeFromFeature(feature);
        if (!pincode) return null;
        const center = feature.center;
        if (!center || center.length !== 2) return null;
        const [lon, lat] = center;

        const placeName = String(feature.place_name || '');
        return {
          id: String(feature.id ?? `${pincode}:${placeName}`),
          label: shortLabelFromPlaceName(placeName),
          fullLabel: placeName,
          pincode,
          lat: String(lat),
          lon: String(lon),
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

  if (!MAPBOX_ACCESS_TOKEN) {
    res.status(500).json({
      error: 'Mapbox access token missing',
      message: 'Set MAPBOX_ACCESS_TOKEN in backend/.env',
    });
    return;
  }

  const url = `${MAPBOX_BASE}/${encodeURIComponent(pincode)}.json`;
  const params = new URLSearchParams({
    access_token: MAPBOX_ACCESS_TOKEN,
    country: MAPBOX_COUNTRY,
    limit: '1',
    types: 'postcode',
  });

  try {
    const upstream = await fetch(`${url}?${params.toString()}`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(15000),
    });
    if (!upstream.ok) {
      res.status(502).json({ error: 'Geocoding failed' });
      return;
    }
    const data = (await upstream.json()) as { features?: MapboxFeature[] };
    const features = Array.isArray(data.features) ? data.features : [];
    const first = features[0];
    if (!first) {
      res.status(404).json({ error: 'Could not locate pincode' });
      return;
    }

    const center = first.center;
    if (!center || center.length !== 2) {
      res.status(404).json({ error: 'Could not locate pincode' });
      return;
    }

    const [lon, lat] = center;
    res.json({
      pincode: extractPincodeFromFeature(first) || pincode,
      lat: String(lat),
      lon: String(lon),
      label: shortLabelFromPlaceName(String(first.place_name || `Pincode ${pincode}`)),
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

  if (!MAPBOX_ACCESS_TOKEN) {
    res.status(500).json({
      error: 'Mapbox access token missing',
      message: 'Set MAPBOX_ACCESS_TOKEN in backend/.env',
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

  const url = `${MAPBOX_BASE}/${encodeURIComponent(String(lon))},${encodeURIComponent(String(lat))}.json`;
  const params = new URLSearchParams({
    access_token: MAPBOX_ACCESS_TOKEN,
    country: MAPBOX_COUNTRY,
    limit: '1',
    types: 'postcode,address,place',
    reverse_geocode: 'true',
  });

  try {
    // Global upstream throttle: keeps bursts (e.g. many users clicking at once) under LocationIQ limits.
    await scheduleLocationIq();

    const upstream = await fetch(`${url}?${params.toString()}`, {
      headers: { Accept: 'application/json' },
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

    const data = (await upstream.json()) as { features?: MapboxFeature[] };
    const features = Array.isArray(data.features) ? data.features : [];
    const first = features[0];
    if (!first) {
      res.status(404).json({ error: 'Could not extract pincode from your location' });
      return;
    }

    const extractedPincode = extractPincodeFromFeature(first);
    if (!extractedPincode) {
      res.status(404).json({ error: 'Could not extract pincode from your location' });
      return;
    }

    const payload = {
      pincode: extractedPincode,
      addressLabel: shortLabelFromPlaceName(String(first.place_name || `${lat},${lon}`)),
      lat: String(first.center?.[1] ?? lat),
      lon: String(first.center?.[0] ?? lon),
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
