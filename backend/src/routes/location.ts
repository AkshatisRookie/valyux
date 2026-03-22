import { Router, type Request, type Response } from 'express';

const router = Router();

/** Nominatim — see https://operations.osmfoundation.org/policies/nominatim/ */
const NOMINATIM = 'https://nominatim.openstreetmap.org/search';

const USER_AGENT = process.env.NOMINATIM_USER_AGENT || 'Valyux/1.0 (contact:support@valyux.local)';

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
      console.error('[Nominatim]', upstream.status, await upstream.text().then((t) => t.slice(0, 200)));
      res.status(502).json({ error: 'Address lookup failed' });
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

    res.json({ results });
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

export default router;
