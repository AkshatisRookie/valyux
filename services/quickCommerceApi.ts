const API_BASE = process.env.VALYUX_API_URL || 'http://localhost:5000';

export interface GroupSearchResponse {
  results: unknown[];
  meta: { totalResults: number; fetchedAt: string; cached?: boolean };
}

export async function searchGroupQuickCommerce(
  query: string,
  lat: string,
  lon: string,
  pincode: string
): Promise<GroupSearchResponse> {
  const params = new URLSearchParams({
    q: query.trim(),
    lat: lat.trim(),
    lon: lon.trim(),
    pincode: pincode.trim(),
  });
  const res = await fetch(`${API_BASE}/api/qc/groupsearch?${params}`, {
    signal: AbortSignal.timeout(90000),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { message?: string })?.message ||
        (err as { error?: string })?.error ||
        `Search failed (${res.status})`
    );
  }
  const data = await res.json();
  return {
    results: data.results || [],
    meta: data.meta || { totalResults: 0, fetchedAt: new Date().toISOString() },
  };
}

export interface GroupEtaResponse {
  etaByPlatform: Partial<Record<string, string>>;
  openByPlatform: Partial<Record<string, boolean>>;
}

export async function fetchGroupEta(
  lat: string,
  lon: string,
  pincode: string
): Promise<GroupEtaResponse> {
  const params = new URLSearchParams({
    lat: lat.trim(),
    lon: lon.trim(),
    pincode: pincode.trim(),
  });
  const res = await fetch(`${API_BASE}/api/qc/groupeta?${params}`, {
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string })?.message || 'ETA failed');
  }
  const data = await res.json();
  return {
    etaByPlatform: (data.etaByPlatform || {}) as Partial<Record<string, string>>,
    openByPlatform: (data.openByPlatform || {}) as Partial<Record<string, boolean>>,
  };
}
