import type { Product, Platform } from '../types';

import { fetchBackend } from './backendFetch';

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
  const url = `/api/search?q=${encodeURIComponent(query)}&location=${encodeURIComponent(location)}`;

  const response = await fetchBackend(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    timeoutMs: 90000,
    retries: 2,
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
    const response = await fetchBackend('/api/health', { timeoutMs: 5000, retries: 0 });
    return response.ok;
  } catch {
    return false;
  }
}
