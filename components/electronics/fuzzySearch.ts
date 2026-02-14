import Fuse from 'fuse.js';
import type { Product } from './types';

/* ------------------------------------------------------------------ */
/*  Fuse.js configuration                                              */
/*  Weighted search: product name matters most, brand next, then cat   */
/* ------------------------------------------------------------------ */

const FUSE_OPTIONS: Fuse.IFuseOptions<Product> = {
  keys: [
    { name: 'name', weight: 3 },
    { name: 'brand', weight: 2 },
    { name: 'category', weight: 1.5 },
    { name: 'description', weight: 0.5 },
  ],
  threshold: 0.35,          // 0 = exact, 1 = match anything — 0.35 is a sweet spot
  distance: 150,             // how far apart matched characters can be
  includeScore: true,
  minMatchCharLength: 2,
  ignoreLocation: true,      // search the ENTIRE string, not just the beginning
  shouldSort: true,          // best matches first
  findAllMatches: true,
};

/* ------------------------------------------------------------------ */
/*  Create a Fuse index from a product list                            */
/* ------------------------------------------------------------------ */

export function createFuseIndex(products: Product[]): Fuse<Product> {
  return new Fuse(products, FUSE_OPTIONS);
}

/* ------------------------------------------------------------------ */
/*  Fuzzy search products — returns scored results                     */
/* ------------------------------------------------------------------ */

export interface ScoredProduct {
  item: Product;
  score: number;           // 0 = perfect match, 1 = no match
}

export function fuzzySearch(
  index: Fuse<Product>,
  query: string,
): ScoredProduct[] {
  const q = query.trim();
  if (!q || q.length < 2) return [];

  return index.search(q).map(r => ({
    item: r.item,
    score: r.score ?? 1,
  }));
}

/* ------------------------------------------------------------------ */
/*  Instant suggestions — lightweight, returns top N                   */
/* ------------------------------------------------------------------ */

export function getInstantSuggestions(
  index: Fuse<Product>,
  query: string,
  limit = 5,
): Product[] {
  const q = query.trim();
  if (!q || q.length < 1) return [];

  return index
    .search(q, { limit })
    .map(r => r.item);
}
