const QCOMPL_API_URL = (process.env.QCOMPL_API_URL || 'http://148.113.1.102:6893').replace(/\/$/, '');
const QCOMPL_API_KEY = process.env.QCOMPL_API_KEY || '';

export interface QcomPlProduct {
  product_id: string | number;
  product_name: string;
  product_url: string;
  mrp: number;
  selling_price: number;
  discount_price: number;
  availability: string;
  inventory?: number;
  description?: string;
  delivery_details: Record<string, string>;
}

export interface QcomPlResponse {
  keyword: string;
  pincode: string;
  products: QcomPlProduct[];
}

/**
 * Fetch products from QcomPl API for a given platform.
 * @throws Error on non-2xx response
 */
export async function fetchQcomPl(
  keyword: string,
  pincode: string,
  platform: 'swiggyIM' | 'blinkit'
): Promise<QcomPlResponse> {
  if (!QCOMPL_API_KEY) {
    throw new Error('QCOMPL_API_KEY not configured');
  }

  const url = `${QCOMPL_API_URL}/QcomPl`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      keyword: keyword.trim(),
      pincode: pincode.trim(),
      platform,
      apikey: QCOMPL_API_KEY,
    }),
    signal: AbortSignal.timeout(30000),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`QcomPl API error ${res.status}: ${body.slice(0, 200)}`);
  }

  const data = (await res.json()) as QcomPlResponse;
  return {
    keyword: data.keyword ?? keyword,
    pincode: data.pincode ?? pincode,
    products: Array.isArray(data.products) ? data.products : [],
  };
}
