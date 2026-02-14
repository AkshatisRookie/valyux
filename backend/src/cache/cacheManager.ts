import NodeCache from 'node-cache';
import type { SearchResponse } from '../types.js';

const TTL = parseInt(process.env.CACHE_TTL || '600', 10); // default 10 minutes

/**
 * In-memory cache for search results.
 * Key format: "search:<normalized_query>:<location>"
 */
const cache = new NodeCache({
  stdTTL: TTL,
  checkperiod: 120,
  useClones: false,
});

export function buildCacheKey(query: string, location: string): string {
  const normalizedQuery = query.trim().toLowerCase().replace(/\s+/g, ' ');
  const normalizedLocation = location.trim().toLowerCase();
  return `search:${normalizedQuery}:${normalizedLocation}`;
}

export function getCachedResult(key: string): SearchResponse | undefined {
  return cache.get<SearchResponse>(key);
}

export function setCachedResult(key: string, data: SearchResponse): void {
  cache.set(key, data);
}

export function getCacheStats() {
  return cache.getStats();
}
