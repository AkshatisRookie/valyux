import { fetchBackend } from './backendFetch';

export interface AddressSuggestion {
  id: string;
  label: string;
  fullLabel: string;
  pincode: string;
  lat: string;
  lon: string;
}

export interface ReverseGeocodeResult {
  pincode: string;
  addressLabel: string;
  lat: string;
  lon: string;
}

/**
 * Address autocomplete (India) via backend → Mapbox Geocoding.
 */
export async function fetchAddressSuggestions(query: string): Promise<AddressSuggestion[]> {
  const q = query.trim();
  if (q.length < 3) return [];

  const params = new URLSearchParams({ q });
  const res = await fetchBackend(`/api/location/autocomplete?${params}`, { timeoutMs: 20000, retries: 2 });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string })?.message || `Address search failed (${res.status})`);
  }

  const data = await res.json();
  return Array.isArray(data.results) ? data.results : [];
}

/**
 * Reverse geocode lat/lon to {pincode, addressLabel} via backend → Mapbox Geocoding.
 */
export async function reverseGeocodeLatLon(lat: number, lon: number): Promise<ReverseGeocodeResult> {
  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lon),
  });

  const res = await fetchBackend(`/api/location/reverse?${params}`, { timeoutMs: 20000, retries: 2 });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg =
      (err as { message?: string })?.message ||
      (err as { error?: string })?.error ||
      `Reverse geocode failed (${res.status})`;
    const retryAfter = (err as { retryAfterSeconds?: number })?.retryAfterSeconds;
    throw new Error(retryAfter ? `${msg} (try again in ~${retryAfter}s)` : msg);
  }

  return res.json();
}
