const API_BASE = process.env.VALYUX_API_URL || 'http://localhost:5000';

export interface GeminiSearchResult {
  results: any[];
  meta: { totalResults: number; fetchedAt: string };
}

/**
 * Search products via Gemini API. Requires pincode.
 */
export async function searchViaGemini(
  query: string,
  pincode: string,
  type: 'grocery' | 'electronics'
): Promise<GeminiSearchResult> {
  const params = new URLSearchParams({
    q: query.trim(),
    pincode: pincode.trim(),
    type,
  });
  const res = await fetch(`${API_BASE}/api/gemini/search?${params}`, {
    signal: AbortSignal.timeout(60000),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any)?.message || `Search failed (${res.status})`);
  }
  const data = await res.json();
  return {
    results: data.results || [],
    meta: data.meta || { totalResults: 0, fetchedAt: new Date().toISOString() },
  };
}
