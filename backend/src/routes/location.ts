import { Router, type Request, type Response } from 'express';
import NodeCache from 'node-cache';

const router = Router();

/** Mapbox Geocoding (forward + reverse). */
const MAPBOX_BASE =
  process.env.MAPBOX_GEOCODING_BASE || 'https://api.mapbox.com/geocoding/v5/mapbox.places';
const MAPBOX_ACCESS_TOKEN = (process.env.MAPBOX_ACCESS_TOKEN || '').trim();
const MAPBOX_COUNTRY = (process.env.MAPBOX_COUNTRY || 'in').toLowerCase();

/** LocationIQ (Nominatim-compatible) — fallback when Mapbox is unreachable or not configured. */
const LOCATIONIQ_API_KEY = (process.env.LOCATIONIQ_API_KEY || '').trim();
const LOCATIONIQ_BASE = (process.env.LOCATIONIQ_BASE || 'https://us1.locationiq.com/v1').replace(/\/$/, '');

type GeocodingProvider = 'mapbox' | 'locationiq';

function resolveProviderOrder(): GeocodingProvider[] {
  const forced = (process.env.GEOCODING_PROVIDER || '').trim().toLowerCase();
  if (forced === 'mapbox') return MAPBOX_ACCESS_TOKEN ? ['mapbox'] : [];
  if (forced === 'locationiq') return LOCATIONIQ_API_KEY ? ['locationiq'] : [];
  const providers: GeocodingProvider[] = [];
  if (MAPBOX_ACCESS_TOKEN) providers.push('mapbox');
  if (LOCATIONIQ_API_KEY) providers.push('locationiq');
  return providers;
}

function geocodingNotConfigured(res: Response): void {
  res.status(500).json({
    error: 'Geocoding not configured',
    message: 'Set MAPBOX_ACCESS_TOKEN and/or LOCATIONIQ_API_KEY in backend environment',
  });
}

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
const scheduleUpstream = createGlobalRpsScheduler(LOCATIONIQ_RPS, LOCATIONIQ_MAX_QUEUE_MS);
const LOCATIONIQ_COOLDOWN_SECONDS = Number(process.env.LOCATIONIQ_COOLDOWN_SECONDS || '60') || 60;
const geocodeCooldownCache = new NodeCache({ stdTTL: LOCATIONIQ_COOLDOWN_SECONDS, checkperiod: 30 });

const autocompleteCache = new NodeCache({ stdTTL: 3600, checkperiod: 600 }); // 1h
const reverseCache = new NodeCache({ stdTTL: 3600, checkperiod: 600 }); // 1h
const reverseCooldownCache = new NodeCache({ stdTTL: 600, checkperiod: 60 }); // 10m
const autocompleteCooldownCache = new NodeCache({ stdTTL: 120, checkperiod: 60 }); // 2m

const UPSTREAM_TIMEOUT_MS = Number(process.env.GEOCODING_TIMEOUT_MS || '15000') || 15000;

interface MapboxFeature {
  id?: string;
  place_name?: string;
  text?: string;
  /** [lon, lat] */
  center?: [number, number];
  place_type?: string[];
  context?: Array<{ id?: string; text?: string }>;
}

interface LocationIqAddress {
  postcode?: string;
  city?: string;
  town?: string;
  village?: string;
  state?: string;
  suburb?: string;
  neighbourhood?: string;
  road?: string;
}

interface LocationIqItem {
  place_id?: string | number;
  lat?: string;
  lon?: string;
  display_name?: string;
  address?: LocationIqAddress;
}

class UpstreamGeocodeError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly bodySnippet = '',
    readonly isRateLimited = false,
    readonly isNetwork = false
  ) {
    super(message);
    this.name = 'UpstreamGeocodeError';
  }
}

function shouldTryNextProvider(err: UpstreamGeocodeError): boolean {
  if (err.isNetwork) return true;
  if (err.status === undefined) return true;
  return err.status >= 500 || err.status === 408 || err.status === 429;
}

async function fetchUpstreamJson(url: string, init: RequestInit, label: string): Promise<unknown> {
  try {
    const upstream = await fetch(url, {
      ...init,
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });

    if (!upstream.ok) {
      const bodyText = await upstream.text().catch(() => '');
      const snippet = bodyText.slice(0, 300);
      throw new UpstreamGeocodeError(
        `${label} upstream ${upstream.status}`,
        upstream.status,
        snippet,
        upstream.status === 429
      );
    }

    return upstream.json();
  } catch (err) {
    if (err instanceof UpstreamGeocodeError) throw err;
    const msg = err instanceof Error ? err.message : String(err);
    const cause =
      err instanceof Error && err.cause instanceof Error
        ? err.cause.message
        : err instanceof Error && err.cause
          ? String(err.cause)
          : '';
    console.error(`[${label}] network error`, msg, cause || '');
    throw new UpstreamGeocodeError(msg, undefined, cause, false, true);
  }
}

function extractPincodeFromFeature(feature: MapboxFeature): string | null {
  const placeTypes = feature.place_type || [];

  if (placeTypes.includes('postcode')) {
    const digits = String(feature.text || '').replace(/\D/g, '');
    if (digits.length === 6) return digits;
  }

  const ctx = feature.context || [];
  const pc = ctx.find((c) => (c.id || '').toLowerCase().startsWith('postcode.'));
  if (pc?.text) {
    const digits = String(pc.text).replace(/\D/g, '');
    if (digits.length === 6) return digits;
  }

  return null;
}

function extractPincodeFromLocationIq(item: LocationIqItem): string | null {
  const raw = item.address?.postcode?.trim() || '';
  const digitsOnly = raw.replace(/\D/g, '');
  if (digitsOnly.length === 6) return digitsOnly;
  const displayName = String(item.display_name || '');
  const m = displayName.match(/\b(\d{6})\b/);
  return m ? m[1] : null;
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

function shortLabelFromLocationIq(item: LocationIqItem): string {
  const a = item.address;
  if (!a) return shortLabelFromPlaceName(String(item.display_name || ''));
  const parts: string[] = [];
  if (a.road || a.neighbourhood || a.suburb) {
    parts.push([a.road, a.neighbourhood, a.suburb].filter(Boolean).join(', '));
  }
  const locality = a.city || a.town || a.village || '';
  if (locality) parts.push(locality);
  if (a.state) parts.push(a.state);
  const joined = parts.filter(Boolean).join(' · ');
  return joined || shortLabelFromPlaceName(String(item.display_name || ''));
}

interface AddressSuggestion {
  id: string;
  label: string;
  fullLabel: string;
  pincode: string;
  lat: string;
  lon: string;
}

async function autocompleteMapbox(q: string): Promise<AddressSuggestion[]> {
  const url = `${MAPBOX_BASE}/${encodeURIComponent(q)}.json`;
  const params = new URLSearchParams({
    access_token: MAPBOX_ACCESS_TOKEN,
    country: MAPBOX_COUNTRY,
    limit: '8',
    types: 'address,place,postcode',
    autocomplete: 'true',
  });

  const data = (await fetchUpstreamJson(
    `${url}?${params.toString()}`,
    { headers: { Accept: 'application/json' } },
    'location/autocomplete/mapbox'
  )) as { features?: MapboxFeature[] };

  const features = Array.isArray(data.features) ? data.features : [];
  return features
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
    .filter((x): x is AddressSuggestion => x !== null);
}

async function autocompleteLocationIq(q: string): Promise<AddressSuggestion[]> {
  const url = new URL(`${LOCATIONIQ_BASE}/autocomplete`);
  url.searchParams.set('key', LOCATIONIQ_API_KEY);
  url.searchParams.set('q', q);
  url.searchParams.set('limit', '8');
  url.searchParams.set('countrycodes', 'in');
  url.searchParams.set('dedupe', '1');

  const data = (await fetchUpstreamJson(
    url.toString(),
    { headers: { Accept: 'application/json' } },
    'location/autocomplete/locationiq'
  )) as LocationIqItem[];

  const items = Array.isArray(data) ? data : [];
  return items
    .map((item) => {
      const pincode = extractPincodeFromLocationIq(item);
      if (!pincode || !item.lat || !item.lon) return null;
      const fullLabel = String(item.display_name || '');
      return {
        id: String(item.place_id ?? `${pincode}:${fullLabel}`),
        label: shortLabelFromLocationIq(item),
        fullLabel,
        pincode,
        lat: String(item.lat),
        lon: String(item.lon),
      };
    })
    .filter((x): x is AddressSuggestion => x !== null);
}

async function pincodeGeocodeMapbox(pincode: string): Promise<{
  pincode: string;
  lat: string;
  lon: string;
  label: string;
}> {
  const url = `${MAPBOX_BASE}/${encodeURIComponent(pincode)}.json`;
  const params = new URLSearchParams({
    access_token: MAPBOX_ACCESS_TOKEN,
    country: MAPBOX_COUNTRY,
    limit: '1',
    types: 'postcode',
  });

  const data = (await fetchUpstreamJson(
    `${url}?${params.toString()}`,
    { headers: { Accept: 'application/json' } },
    'location/pincode-geocode/mapbox'
  )) as { features?: MapboxFeature[] };

  const first = Array.isArray(data.features) ? data.features[0] : undefined;
  if (!first?.center || first.center.length !== 2) {
    throw new UpstreamGeocodeError('Pincode not found', 404);
  }

  const [lon, lat] = first.center;
  return {
    pincode: extractPincodeFromFeature(first) || pincode,
    lat: String(lat),
    lon: String(lon),
    label: shortLabelFromPlaceName(String(first.place_name || `Pincode ${pincode}`)),
  };
}

async function pincodeGeocodeLocationIq(pincode: string): Promise<{
  pincode: string;
  lat: string;
  lon: string;
  label: string;
}> {
  const url = new URL(`${LOCATIONIQ_BASE}/search`);
  url.searchParams.set('key', LOCATIONIQ_API_KEY);
  url.searchParams.set('q', `${pincode} India`);
  url.searchParams.set('limit', '1');
  url.searchParams.set('countrycodes', 'in');
  url.searchParams.set('addressdetails', '1');

  const data = (await fetchUpstreamJson(
    url.toString(),
    { headers: { Accept: 'application/json' } },
    'location/pincode-geocode/locationiq'
  )) as LocationIqItem[];

  const first = Array.isArray(data) ? data[0] : undefined;
  if (!first?.lat || !first.lon) {
    throw new UpstreamGeocodeError('Pincode not found', 404);
  }

  return {
    pincode: extractPincodeFromLocationIq(first) || pincode,
    lat: String(first.lat),
    lon: String(first.lon),
    label: shortLabelFromLocationIq(first),
  };
}

async function reverseGeocodeMapbox(lat: number, lon: number): Promise<{
  pincode: string;
  addressLabel: string;
  lat: string;
  lon: string;
}> {
  const url = `${MAPBOX_BASE}/${encodeURIComponent(String(lon))},${encodeURIComponent(String(lat))}.json`;
  const params = new URLSearchParams({
    access_token: MAPBOX_ACCESS_TOKEN,
    country: MAPBOX_COUNTRY,
    limit: '1',
    types: 'postcode,address,place',
    reverse_geocode: 'true',
  });

  const data = (await fetchUpstreamJson(
    `${url}?${params.toString()}`,
    { headers: { Accept: 'application/json' } },
    'location/reverse/mapbox'
  )) as { features?: MapboxFeature[] };

  const first = Array.isArray(data.features) ? data.features[0] : undefined;
  const extractedPincode = first ? extractPincodeFromFeature(first) : null;
  if (!first || !extractedPincode) {
    throw new UpstreamGeocodeError('Could not extract pincode from your location', 404);
  }

  return {
    pincode: extractedPincode,
    addressLabel: shortLabelFromPlaceName(String(first.place_name || `${lat},${lon}`)),
    lat: String(first.center?.[1] ?? lat),
    lon: String(first.center?.[0] ?? lon),
  };
}

async function reverseGeocodeLocationIq(lat: number, lon: number): Promise<{
  pincode: string;
  addressLabel: string;
  lat: string;
  lon: string;
}> {
  const url = new URL(`${LOCATIONIQ_BASE}/reverse`);
  url.searchParams.set('key', LOCATIONIQ_API_KEY);
  url.searchParams.set('lat', String(lat));
  url.searchParams.set('lon', String(lon));
  url.searchParams.set('format', 'json');
  url.searchParams.set('addressdetails', '1');

  const data = (await fetchUpstreamJson(
    url.toString(),
    { headers: { Accept: 'application/json' } },
    'location/reverse/locationiq'
  )) as LocationIqItem;

  const item: LocationIqItem = {
    place_id: data.place_id,
    lat: String(data.lat ?? lat),
    lon: String(data.lon ?? lon),
    display_name: String(data.display_name ?? `${lat},${lon}`),
    address: data.address,
  };

  const pincode = extractPincodeFromLocationIq(item);
  if (!pincode) {
    throw new UpstreamGeocodeError('Could not extract pincode from your location', 404);
  }

  return {
    pincode,
    addressLabel: shortLabelFromLocationIq(item),
    lat: String(item.lat),
    lon: String(item.lon),
  };
}

async function runWithProviderFallback<T>(
  label: string,
  runners: Array<{ provider: GeocodingProvider; run: () => Promise<T> }>
): Promise<T> {
  let lastErr: UpstreamGeocodeError | null = null;

  for (let i = 0; i < runners.length; i++) {
    const { provider, run } = runners[i];
    try {
      await scheduleUpstream();
      return await run();
    } catch (err) {
      if (!(err instanceof UpstreamGeocodeError)) throw err;
      lastErr = err;
      const hasNext = i < runners.length - 1;
      console.error(`[${label}] ${provider} failed`, err.message, err.bodySnippet || '');
      if (hasNext && shouldTryNextProvider(err)) {
        console.warn(`[${label}] falling back from ${provider} to ${runners[i + 1].provider}`);
        continue;
      }
      throw err;
    }
  }

  throw lastErr ?? new UpstreamGeocodeError(`${label} failed`);
}

function handleUpstreamFailure(
  res: Response,
  label: string,
  err: unknown,
  opts?: { cooldownKey?: string; reverseKey?: string }
): void {
  if (err instanceof Error && err.message === 'UPSTREAM_QUEUE_FULL') {
    res.setHeader('Retry-After', '15');
    res.status(429).json({
      error: 'Server busy',
      message: 'High traffic. Please enter your pincode below or try again in a few seconds.',
      retryAfterSeconds: 15,
    });
    return;
  }

  if (err instanceof UpstreamGeocodeError) {
    if (err.isRateLimited) {
      if (opts?.reverseKey) reverseCooldownCache.set(opts.reverseKey, '1');
      geocodeCooldownCache.set('global', '1');
      res.setHeader('Retry-After', '120');
      res.status(429).json({
        error: 'Too many requests',
        message:
          'Geocoding provider rate-limited (429). Please use pincode search below or wait a few minutes and try again.',
        retryAfterSeconds: 120,
      });
      return;
    }

    if (err.status === 404) {
      res.status(404).json({ error: err.message });
      return;
    }

    const looksLikeHtml = /^\s*</.test(err.bodySnippet) && /<html|<!doctype/i.test(err.bodySnippet);
    res.status(err.status && err.status < 500 ? err.status : 502).json({
      error: `${label} failed`,
      status: err.status,
      message: looksLikeHtml ? 'Upstream returned an HTML error page' : err.bodySnippet || err.message,
    });
    return;
  }

  const msg = err instanceof Error ? err.message : `${label} failed`;
  res.status(500).json({ error: msg });
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

  const providers = resolveProviderOrder();
  if (providers.length === 0) {
    geocodingNotConfigured(res);
    return;
  }

  if (geocodeCooldownCache.get<string>('global')) {
    res.setHeader('Retry-After', String(LOCATIONIQ_COOLDOWN_SECONDS));
    res.status(429).json({
      error: 'Too many requests',
      message: 'Geocoding provider rate-limited. Please use pincode search below and try again later.',
      retryAfterSeconds: LOCATIONIQ_COOLDOWN_SECONDS,
    });
    return;
  }

  const runners = providers.map((provider) => ({
    provider,
    run: () => (provider === 'mapbox' ? autocompleteMapbox(q) : autocompleteLocationIq(q)),
  }));

  try {
    const results = await runWithProviderFallback('location/autocomplete', runners);
    const payload = { results };
    autocompleteCache.set(cacheKey, payload);
    res.json(payload);
  } catch (err) {
    if (err instanceof UpstreamGeocodeError && err.isRateLimited) {
      autocompleteCooldownCache.set('global', '1');
    }
    handleUpstreamFailure(res, 'Address lookup', err);
  }
});

/** GET /api/location/pincode-geocode?pincode=560001 — center point for manual pincode entry */
router.get('/location/pincode-geocode', async (req: Request, res: Response): Promise<void> => {
  const pincode = (req.query.pincode as string || '').trim();
  if (!/^\d{6}$/.test(pincode)) {
    res.status(400).json({ error: 'Valid 6-digit pincode required' });
    return;
  }

  const providers = resolveProviderOrder();
  if (providers.length === 0) {
    geocodingNotConfigured(res);
    return;
  }

  const runners = providers.map((provider) => ({
    provider,
    run: () => (provider === 'mapbox' ? pincodeGeocodeMapbox(pincode) : pincodeGeocodeLocationIq(pincode)),
  }));

  try {
    const payload = await runWithProviderFallback('location/pincode-geocode', runners);
    res.json(payload);
  } catch (err) {
    handleUpstreamFailure(res, 'Geocoding', err);
  }
});

/** GET /api/location/reverse?lat=..&lon=..
 * Reverse geocode via Mapbox (preferred) or LocationIQ fallback.
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

  const key = `rev:${lat.toFixed(2)}:${lon.toFixed(2)}`;

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

  const providers = resolveProviderOrder();
  if (providers.length === 0) {
    geocodingNotConfigured(res);
    return;
  }

  if (geocodeCooldownCache.get<string>('global')) {
    res.setHeader('Retry-After', String(LOCATIONIQ_COOLDOWN_SECONDS));
    res.status(429).json({
      error: 'Too many requests',
      message: 'Geocoding provider rate-limited. Please use pincode search below and try again later.',
      retryAfterSeconds: LOCATIONIQ_COOLDOWN_SECONDS,
    });
    return;
  }

  const runners = providers.map((provider) => ({
    provider,
    run: () => (provider === 'mapbox' ? reverseGeocodeMapbox(lat, lon) : reverseGeocodeLocationIq(lat, lon)),
  }));

  try {
    const payload = await runWithProviderFallback('location/reverse', runners);
    reverseCache.set(key, payload);
    res.json(payload);
  } catch (err) {
    handleUpstreamFailure(res, 'Reverse geocoding', err, { reverseKey: key });
  }
});

export default router;
