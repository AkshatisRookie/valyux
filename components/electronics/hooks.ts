import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useDebounce } from '../../utils/useDebounce';
import { MOCK_PRODUCTS, FEATURED_IDS } from './mockData';
import { bestPrice } from './types';
import type { Product, Filters, SortOption, Category } from './types';

const API_BASE = 'http://localhost:5000/api';

/* ------------------------------------------------------------------ */
/*  useElectronicsSearch                                               */
/* ------------------------------------------------------------------ */

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
      let items: Product[] = data.results;

      // Client-side retailer filter (backend doesn't filter by retailer)
      if (f.retailers.length > 0) {
        items = items.filter(p =>
          p.retailerOffers.some(o => f.retailers.includes(o.retailer)),
        );
      }

      setResults(items);
      setHasSearched(true);
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') return;

      // Fallback to local mock data
      console.warn('Backend unavailable, using local mock data');
      let items = MOCK_PRODUCTS.filter(p => {
        const lq = q.toLowerCase();
        return (
          p.name.toLowerCase().includes(lq) ||
          p.brand.toLowerCase().includes(lq) ||
          p.category.toLowerCase().includes(lq)
        );
      });

      // Apply filters
      if (f.category !== 'All') items = items.filter(p => p.category === f.category);
      if (f.inStockOnly) items = items.filter(p => p.retailerOffers.some(o => o.inStock));
      if (f.retailers.length > 0) {
        items = items.filter(p =>
          p.retailerOffers.some(o => f.retailers.includes(o.retailer)),
        );
      }

      // Apply sort
      switch (s) {
        case 'price-low':  items.sort((a, b) => bestPrice(a) - bestPrice(b)); break;
        case 'price-high': items.sort((a, b) => bestPrice(b) - bestPrice(a)); break;
        case 'discount':   items.sort((a, b) => Math.max(...b.retailerOffers.map(o => o.discount)) - Math.max(...a.retailerOffers.map(o => o.discount))); break;
      }

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

/* ------------------------------------------------------------------ */
/*  useFeaturedProducts                                                */
/* ------------------------------------------------------------------ */

export function useFeaturedProducts(): Product[] {
  return useMemo(
    () => MOCK_PRODUCTS.filter(p => FEATURED_IDS.includes(p.id)),
    [],
  );
}

/* ------------------------------------------------------------------ */
/*  useCyclingPlaceholder — animates the search bar placeholder        */
/* ------------------------------------------------------------------ */

const PLACEHOLDERS = [
  'Search for iPhones...',
  'Search for MacBooks...',
  'Search for headphones...',
  'Search for smart TVs...',
  'Search for smartwatches...',
  'Search for gaming consoles...',
];

export function useCyclingPlaceholder(interval = 3000): string {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setIdx(i => (i + 1) % PLACEHOLDERS.length), interval);
    return () => clearInterval(timer);
  }, [interval]);
  return PLACEHOLDERS[idx];
}

/* ------------------------------------------------------------------ */
/*  useActiveFiltersCount — quick count for "Clear filters" visibility */
/* ------------------------------------------------------------------ */

export function useActiveFiltersCount(filters: Filters): number {
  let count = 0;
  if (filters.category !== 'All') count++;
  if (filters.retailers.length > 0) count++;
  if (filters.inStockOnly) count++;
  return count;
}
