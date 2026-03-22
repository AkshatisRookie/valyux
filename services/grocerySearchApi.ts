const API_BASE = process.env.VALYUX_API_URL || 'http://localhost:5000';

export interface GrocerySearchResult {
  results: any[];
  meta: { totalResults: number; fetchedAt: string };
}

/**
 * Search grocery products via live QcomPl API (Blinkit + Swiggy Instamart).
 * Requires pincode.
 */
export async function searchGroceryLive(
  query: string,
  pincode: string
): Promise<GrocerySearchResult> {
  const params = new URLSearchParams({
    q: query.trim(),
    pincode: pincode.trim(),
  });
  const res = await fetch(`${API_BASE}/api/grocery/search?${params}`, {
    signal: AbortSignal.timeout(60000),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any)?.message || (err as any)?.error || `Search failed (${res.status})`);
  }
  const data = await res.json();
  return {
    results: data.results || [],
    meta: data.meta || { totalResults: 0, fetchedAt: new Date().toISOString() },
  };
}
