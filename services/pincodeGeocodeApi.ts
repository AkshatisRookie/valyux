import { fetchBackend } from './backendFetch';

export async function geocodePincode(
  pincode: string,
  signal?: AbortSignal
): Promise<{ lat: string; lon: string; label: string }> {
  const params = new URLSearchParams({ pincode: pincode.trim() });
  const res = await fetchBackend(`/api/location/pincode-geocode?${params}`, {
    timeoutMs: 20000,
    retries: 2,
    signal,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string })?.error || 'Could not locate pincode');
  }
  return res.json();
}
