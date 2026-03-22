const API_BASE = process.env.VALYUX_API_URL || 'http://localhost:5000';

export interface AddressSuggestion {
  id: string;
  label: string;
  fullLabel: string;
  pincode: string;
  lat: string;
  lon: string;
}

/**
 * Address autocomplete (India) via backend → OpenStreetMap Nominatim.
 */
export async function fetchAddressSuggestions(query: string): Promise<AddressSuggestion[]> {
  const q = query.trim();
  if (q.length < 3) return [];

  const params = new URLSearchParams({ q });
  const res = await fetch(`${API_BASE}/api/location/autocomplete?${params}`, {
    signal: AbortSignal.timeout(20000),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string })?.message || `Address search failed (${res.status})`);
  }

  const data = await res.json();
  return Array.isArray(data.results) ? data.results : [];
}
