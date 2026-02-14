import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Fuse from 'fuse.js';
import { useDebounce } from '../../utils/useDebounce';
import { MOCK_PRODUCTS, FEATURED_IDS } from './mockData';
import { bestPrice } from './types';
import { createFuseIndex, getInstantSuggestions } from './fuzzySearch';
import type { Product, Filters, SortOption } from './types';

const API_BASE = 'http://localhost:5000/api';

/* ================================================================== */
/*  Shared Fuse.js index for client-side fuzzy search                  */
/* ================================================================== */

const fuseIndex: Fuse<Product> = createFuseIndex(MOCK_PRODUCTS);

/* ================================================================== */
/*  applyFiltersAndSort — shared logic for both backend + fallback     */
/* ================================================================== */

function applyFiltersAndSort(
  items: Product[],
  filters: Filters,
  sort: SortOption,
): Product[] {
  let out = [...items];

  // Category filter
  if (filters.category !== 'All') {
    out = out.filter(p => p.category === filters.category);
  }

  // Retailer filter — keep products that have at least one offer from the selected retailers
  if (filters.retailers.length > 0) {
    out = out.filter(p =>
      p.retailerOffers.some(o => filters.retailers.includes(o.retailer)),
    );
  }

  // In-stock filter
  if (filters.inStockOnly) {
    out = out.filter(p => p.retailerOffers.some(o => o.inStock));
  }

  // Sort
  switch (sort) {
    case 'price-low':
      out.sort((a, b) => bestPrice(a) - bestPrice(b));
      break;
    case 'price-high':
      out.sort((a, b) => bestPrice(b) - bestPrice(a));
      break;
    case 'discount':
      out.sort((a, b) =>
        Math.max(...b.retailerOffers.map(o => o.discount)) -
        Math.max(...a.retailerOffers.map(o => o.discount)),
      );
      break;
    default: // 'relevance' — keep Fuse.js order (best match first)
      break;
  }

  return out;
}

/* ================================================================== */
/*  useElectronicsSearch — fuzzy search + filters on ALL states        */
/* ================================================================== */

interface SearchResult {
  results: Product[];
  isLoading: boolean;
  error: string | null;
  hasSearched: boolean;
}

export function useElectronicsSearch(
  query: string,
  filters: Filters,
  sort: SortOption,
): SearchResult {
  const [results, setResults] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const debouncedQuery = useDebounce(query, 400);

  const fetchResults = useCallback(async (q: string, f: Filters, s: SortOption) => {
    // ── No query: clear search results (landing page shows filtered featured) ──
    if (!q.trim()) {
      setResults([]);
      setHasSearched(false);
      setError(null);
      return;
    }

    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setIsLoading(true);
    setError(null);

    try {
      // Try backend first
      const params = new URLSearchParams({ q, sort: s });
      if (f.category !== 'All') params.set('category', f.category);
      if (f.inStockOnly) params.set('inStockOnly', 'true');

      const res = await fetch(`${API_BASE}/electronics/search?${params}`, {
        signal: abortRef.current.signal,
      });
      if (!res.ok) throw new Error('Backend error');
      const data = await res.json();

      // Apply filters & sort to backend results
      const items = applyFiltersAndSort(data.results as Product[], f, s);
      setResults(items);
      setHasSearched(true);
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') return;

      // ── Fallback: Fuse.js fuzzy search on local mock data ──
      console.warn('Backend unavailable, using Fuse.js fuzzy search');
      const fuseResults = fuseIndex.search(q.trim()).map(r => r.item);
      const items = applyFiltersAndSort(fuseResults, f, s);
      setResults(items);
      setHasSearched(true);
      setError(null); // silent fallback
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchResults(debouncedQuery, filters, sort);
    return () => { abortRef.current?.abort(); };
  }, [debouncedQuery, filters, sort, fetchResults]);

  return { results, isLoading, error, hasSearched };
}

/* ================================================================== */
/*  useFeaturedProducts — NOW respects filters & sort                  */
/* ================================================================== */

export function useFeaturedProducts(filters: Filters, sort: SortOption): Product[] {
  return useMemo(() => {
    const featured = MOCK_PRODUCTS.filter(p => FEATURED_IDS.includes(p.id));
    return applyFiltersAndSort(featured, filters, sort);
  }, [filters, sort]);
}

/* ================================================================== */
/*  useInstantSuggestions — real-time fuzzy suggestions as user types   */
/* ================================================================== */

export function useInstantSuggestions(query: string, limit = 5): Product[] {
  return useMemo(() => {
    if (!query.trim() || query.trim().length < 1) return [];
    return getInstantSuggestions(fuseIndex, query, limit);
  }, [query, limit]);
}

/* ================================================================== */
/*  useCyclingPlaceholder — animates the search bar placeholder        */
/* ================================================================== */

const PLACEHOLDERS = [
  'Search "iPhone 15"...',
  'Try "MacBook Air"...',
  'Search "Sony headphones"...',
  'Try "Samsung TV"...',
  'Search "Apple Watch"...',
  'Try "PS5"...',
];

export function useCyclingPlaceholder(interval = 3000): string {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setIdx(i => (i + 1) % PLACEHOLDERS.length), interval);
    return () => clearInterval(timer);
  }, [interval]);
  return PLACEHOLDERS[idx];
}

/* ================================================================== */
/*  useActiveFiltersCount                                              */
/* ================================================================== */

export function useActiveFiltersCount(filters: Filters): number {
  let count = 0;
  if (filters.category !== 'All') count++;
  if (filters.retailers.length > 0) count += filters.retailers.length;
  if (filters.inStockOnly) count++;
  return count;
}
