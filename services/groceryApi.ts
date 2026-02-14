import type { Product, Platform } from '../types';

const API_BASE = process.env.VALYUX_API_URL || 'http://localhost:5000';

/**
 * Response shape from the backend search endpoint.
 */
interface SearchApiResponse {
  query: string;
  results: Array<{
    id: string;
    name: string;
    brand: string;
    quantity: string;
    imageUrl: string;
    category: string;
    platformPrices: Array<{
      platform: Platform;
      price: number;
      originalPrice: number;
      deliveryTime: string;
      inStock: boolean;
      productUrl: string;
    }>;
  }>;
  meta: {
    cached: boolean;
    scrapedAt: string;
    totalResults: number;
    platformStatus: Record<Platform, 'success' | 'error' | 'timeout'>;
  };
}

export interface SearchResult {
  products: Product[];
  meta: SearchApiResponse['meta'];
}

/**
 * Search for grocery products via the backend API.
 * Returns products in the same shape as the frontend's Product type.
 */
export async function searchProducts(
  query: string,
  location: string = 'Delhi'
): Promise<SearchResult> {
  const url = `${API_BASE}/api/search?q=${encodeURIComponent(query)}&location=${encodeURIComponent(location)}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(90000), // 90 second timeout
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(
      (errorBody as any)?.message || `Search failed with status ${response.status}`
    );
  }

  const data: SearchApiResponse = await response.json();

  // Map API response to frontend Product type
  const products: Product[] = data.results.map((item) => ({
    id: item.id,
    name: item.name,
    brand: item.brand,
    quantity: item.quantity,
    imageUrl: item.imageUrl,
    category: item.category,
    platformPrices: item.platformPrices.map((pp) => ({
      platform: pp.platform,
      price: pp.price,
      originalPrice: pp.originalPrice,
      deliveryTime: pp.deliveryTime,
    })),
  }));

  return { products, meta: data.meta };
}

/**
 * Check if the backend is reachable.
 */
export async function checkHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/api/health`, {
      signal: AbortSignal.timeout(5000),
    });
    return response.ok;
  } catch {
    return false;
  }
}
