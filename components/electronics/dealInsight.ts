import type { Product, Retailer } from './types';

/* ------------------------------------------------------------------ */
/*  Deal Insight — computes a "deal quality" score for each product    */
/*  Inspired by how Skyscanner rates flights: users need a clear       */
/*  signal of whether a deal is good WITHOUT reading every detail.     */
/* ------------------------------------------------------------------ */

export interface DealInsight {
  score: number;                          // 0–100
  label: 'Excellent' | 'Great' | 'Good' | 'Fair';
  color: string;                          // tailwind color namespace
  bestRetailer: Retailer | null;
  bestPrice: number;
  priceDiff: number;                      // absolute ₹ difference
  percentDiff: number;                    // relative %
  isPriceMatch: boolean;                  // true when diff < 1%
}

export function computeDealInsight(product: Product): DealInsight {
  const inStock = product.retailerOffers.filter(o => o.inStock);

  // Fallback for no-stock products
  if (inStock.length === 0) {
    return {
      score: 0, label: 'Fair', color: 'gray',
      bestRetailer: null, bestPrice: Infinity,
      priceDiff: 0, percentDiff: 0, isPriceMatch: false,
    };
  }

  const sorted = [...inStock].sort((a, b) => a.price - b.price);
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];

  /* ── Scoring rubric ──────────────────────────────────────────────── */

  // 1) Discount score (0–40): average discount percentage across offers
  const avgDiscount = inStock.reduce((s, o) => s + o.discount, 0) / inStock.length;
  const discountScore = Math.min(avgDiscount, 40);

  // 2) Offers score (0–20): bonus if retailers provide extra perks
  const hasOffers = inStock.some(o => o.offers.length > 0);
  const offersScore = hasOffers ? 20 : 0;

  // 3) Availability score (0–15): full stock across retailers is better
  const allInStock = product.retailerOffers.every(o => o.inStock);
  const availabilityScore = allInStock ? 15 : 5;

  // 4) Price competition score (0–25): bigger spread = more savings possible
  const spread = worst.price > 0 ? (worst.price - best.price) / best.price * 100 : 0;
  const competitionScore = Math.min(spread * 5, 25); // 5% diff = 25 pts

  const score = Math.round(
    Math.min(discountScore + offersScore + availabilityScore + competitionScore, 100),
  );

  const label: DealInsight['label'] =
    score >= 80 ? 'Excellent' :
    score >= 60 ? 'Great' :
    score >= 40 ? 'Good' : 'Fair';

  const color =
    score >= 80 ? 'emerald' :
    score >= 60 ? 'blue' :
    score >= 40 ? 'amber' : 'gray';

  const priceDiff = worst.price - best.price;
  const percentDiff = best.price > 0 ? Math.round(priceDiff / best.price * 100) : 0;
  const isPriceMatch = priceDiff < best.price * 0.01; // < 1% difference

  return {
    score, label, color,
    bestRetailer: best.retailer,
    bestPrice: best.price,
    priceDiff, percentDiff, isPriceMatch,
  };
}

/* ------------------------------------------------------------------ */
/*  Deal score badge config (for the card UI)                          */
/* ------------------------------------------------------------------ */

export const DEAL_BADGE_CONFIG: Record<DealInsight['label'], {
  bgLight: string;
  bgDark: string;
  textLight: string;
  textDark: string;
  icon: string; // emoji/text
}> = {
  Excellent: {
    bgLight: 'bg-emerald-100', bgDark: 'dark:bg-emerald-900/30',
    textLight: 'text-emerald-700', textDark: 'dark:text-emerald-400',
    icon: '★★★★★',
  },
  Great: {
    bgLight: 'bg-blue-100', bgDark: 'dark:bg-blue-900/30',
    textLight: 'text-blue-700', textDark: 'dark:text-blue-400',
    icon: '★★★★☆',
  },
  Good: {
    bgLight: 'bg-amber-100', bgDark: 'dark:bg-amber-900/30',
    textLight: 'text-amber-700', textDark: 'dark:text-amber-400',
    icon: '★★★☆☆',
  },
  Fair: {
    bgLight: 'bg-gray-100', bgDark: 'dark:bg-gray-800',
    textLight: 'text-gray-600', textDark: 'dark:text-gray-400',
    icon: '★★☆☆☆',
  },
};
