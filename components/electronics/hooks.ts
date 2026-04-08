import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useDebounce } from '../../utils/useDebounce';
import { searchViaGemini } from '../../services/geminiSearchApi';
import { bestPrice } from './types';
import type { Product, Filters, SortOption } from './types';

const API_BASE = process.env.VALYUX_API_URL || 'http://localhost:8080';

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
  pincode: string,
): SearchResult {
  const [results, setResults] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const debouncedQuery = useDebounce(query, 400);

  const fetchResults = useCallback(async (q: string, p: string, f: Filters, s: SortOption) => {
    if (!q.trim()) {
      setResults([]);
      setHasSearched(false);
      setError(null);
      return;
    }

    if (!p || !/^\d{6}$/.test(p)) {
      setError('Valid pincode required');
      setResults([]);
      setHasSearched(true);
      return;
    }

    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setIsLoading(true);
    setError(null);

    try {
      const result = await searchViaGemini(q, p, 'electronics');
      const raw = result.results || [];
      const products: Product[] = raw.map((p: any, i: number) => ({
        id: p.id || `e${i + 1}`,
        name: p.name || 'Product',
        brand: p.brand || '',
        category: (f.category !== 'All' ? f.category : (p.category || 'Electronics')) as any,
        imageUrl: p.imageUrl || 'https://images.unsplash.com/photo-1556656793-08538906a9f8?w=400&q=80',
        retailerOffers: (p.retailerOffers || []).map((o: any) => ({
          retailer: o.retailer,
          price: Number(o.price) || 0,
          originalPrice: Number(o.originalPrice) || Number(o.price) || 0,
          productUrl: o.productUrl || '',
          inStock: o.inStock !== false,
          discount: o.discount ?? Math.round((1 - (Number(o.price) || 0) / (Number(o.originalPrice) || 1)) * 100),
          offers: o.offers || [],
          deliveryTime: o.deliveryTime,
        })),
      }));
      const items = applyFiltersAndSort(products, f, s);
      setResults(items);
      setHasSearched(true);
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setError(err instanceof Error ? err.message : 'Search failed');
      setResults([]);
      setHasSearched(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchResults(debouncedQuery, pincode, filters, sort);
    return () => { abortRef.current?.abort(); };
  }, [debouncedQuery, pincode, filters, sort, fetchResults]);

  return { results, isLoading, error, hasSearched };
}

/* ================================================================== */
/*  useFeaturedProducts — NOW respects filters & sort                  */
/* ================================================================== */

export function useFeaturedProducts(products: Product[], filters: Filters, sort: SortOption): Product[] {
  return useMemo(() => applyFiltersAndSort(products, filters, sort), [products, filters, sort]);
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
