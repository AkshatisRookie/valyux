/* ------------------------------------------------------------------ */
/*  Normalized types for the Electronics comparison UI                 */
/*  Mirrors the shape returned by the backend stub / real APIs later   */
/* ------------------------------------------------------------------ */

export type Retailer = 'Amazon' | 'Flipkart';

export interface RetailerOffer {
  retailer: Retailer;
  price: number;
  originalPrice: number;
  productUrl: string;
  affiliateUrl?: string;
  inStock: boolean;
  discount: number;        // percentage
  offers: string[];        // e.g. ["No-cost EMI", "Bank offer ₹1000"]
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: Category;
  imageUrl: string;
  description?: string;
  retailerOffers: RetailerOffer[];
}

export const CATEGORIES = [
  'All',
  'Smartphones',
  'Laptops',
  'Audio',
  'TVs',
  'Wearables',
  'Tablets',
  'Gaming',
] as const;

export type Category = (typeof CATEGORIES)[number];

export type SortOption = 'relevance' | 'price-low' | 'price-high' | 'discount';

export interface Filters {
  category: Category;
  retailers: Retailer[];
  inStockOnly: boolean;
}

export const DEFAULT_FILTERS: Filters = {
  category: 'All',
  retailers: [],
  inStockOnly: false,
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/** Lowest in-stock price for a product (used for sorting / badges). */
export function bestPrice(product: Product): number {
  const inStock = product.retailerOffers.filter(o => o.inStock);
  if (inStock.length === 0) return Infinity;
  return Math.min(...inStock.map(o => o.price));
}

/** The retailer offering the best (lowest in-stock) price. */
export function bestRetailer(product: Product): Retailer | null {
  const inStock = product.retailerOffers.filter(o => o.inStock);
  if (inStock.length === 0) return null;
  const sorted = [...inStock].sort((a, b) => a.price - b.price);
  return sorted[0].retailer;
}

/** Savings between most expensive and cheapest in-stock offer. */
export function savingsAmount(product: Product): number {
  const prices = product.retailerOffers.filter(o => o.inStock).map(o => o.price);
  if (prices.length < 2) return 0;
  return Math.max(...prices) - Math.min(...prices);
}
