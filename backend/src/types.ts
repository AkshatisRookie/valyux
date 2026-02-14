import type { Platform } from './config/platforms.js';

/**
 * A single product from one platform (returned by the data provider API).
 */
export interface PlatformProduct {
  name: string;
  brand: string;
  price: number;
  originalPrice: number;
  quantity: string;
  imageUrl: string;
  deliveryTime: string;
  inStock: boolean;
  platform: Platform;
  productUrl: string;
}

/**
 * Result from querying a single platform.
 */
export interface PlatformResult {
  platform: Platform;
  status: 'success' | 'error' | 'timeout';
  products: PlatformProduct[];
  error?: string;
  durationMs: number;
}

/**
 * The unified product type returned by the API.
 * Groups the same product across multiple platforms for comparison.
 */
export interface UnifiedProduct {
  id: string;
  name: string;
  brand: string;
  quantity: string;
  imageUrl: string;
  category: string;
  platformPrices: {
    platform: Platform;
    price: number;
    originalPrice: number;
    deliveryTime: string;
    inStock: boolean;
    productUrl: string;
  }[];
}

/**
 * Full search API response.
 */
export interface SearchResponse {
  query: string;
  results: UnifiedProduct[];
  meta: {
    cached: boolean;
    fetchedAt: string;
    totalResults: number;
    platformStatus: Record<string, 'success' | 'error' | 'timeout'>;
  };
}
