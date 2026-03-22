const API_BASE = process.env.VALYUX_API_URL || 'http://localhost:5000';

export async function geocodePincode(pincode: string): Promise<{ lat: string; lon: string; label: string }> {
  const params = new URLSearchParams({ pincode: pincode.trim() });
  const res = await fetch(`${API_BASE}/api/location/pincode-geocode?${params}`, {
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string })?.error || 'Could not locate pincode');
  }
  return res.json();
}
