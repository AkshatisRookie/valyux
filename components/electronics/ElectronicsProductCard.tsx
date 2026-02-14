import React from 'react';
import type { Product, Retailer, RetailerOffer } from './types';
import { savingsAmount } from './types';
import { computeDealInsight, DEAL_BADGE_CONFIG } from './dealInsight';

/* ------------------------------------------------------------------ */
/*  Retailer branding                                                  */
/* ------------------------------------------------------------------ */

const RETAILER_META: Record<Retailer, {
  icon: string;
  label: string;
  accentText: string;
  accentTextDark: string;
  btnClasses: string;
  btnSecondary: string;
}> = {
  Amazon: {
    icon: 'https://www.amazon.in/favicon.ico',
    label: 'Amazon',
    accentText: 'text-[#ff9900]',
    accentTextDark: 'dark:text-[#ffad33]',
    btnClasses: 'bg-[#ff9900] hover:bg-[#e68a00] text-white shadow-sm hover:shadow-md',
    btnSecondary: 'border border-[#ff9900]/40 text-[#ff9900] hover:bg-[#ff9900]/10 dark:border-[#ffad33]/30 dark:text-[#ffad33]',
  },
  Flipkart: {
    icon: 'https://www.flipkart.com/favicon.ico',
    label: 'Flipkart',
    accentText: 'text-[#2874f0]',
    accentTextDark: 'dark:text-[#5c9aff]',
    btnClasses: 'bg-[#2874f0] hover:bg-[#1a5dc7] text-white shadow-sm hover:shadow-md',
    btnSecondary: 'border border-[#2874f0]/40 text-[#2874f0] hover:bg-[#2874f0]/10 dark:border-[#5c9aff]/30 dark:text-[#5c9aff]',
  },
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

interface Props {
  product: Product;
  index: number;
}

const ElectronicsProductCard: React.FC<Props> = ({ product, index }) => {
  const insight = computeDealInsight(product);
  const savings = savingsAmount(product);
  const badge = DEAL_BADGE_CONFIG[insight.label];

  // Sort offers: cheapest in-stock first (the "recommended" deal)
  const sortedOffers = [...product.retailerOffers].sort((a, b) => {
    if (a.inStock !== b.inStock) return a.inStock ? -1 : 1;
    return a.price - b.price;
  });

  const bestOffer = sortedOffers[0];
  const alternatives = sortedOffers.slice(1);

  const handleBuy = (offer: RetailerOffer) => {
    window.open(offer.affiliateUrl || offer.productUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      className="elec-card-enter bg-white dark:bg-gray-800/90 rounded-2xl
                 border border-gray-200/80 dark:border-gray-700/60
                 overflow-hidden flex flex-col
                 hover:-translate-y-1.5 hover:shadow-2xl dark:hover:shadow-black/40
                 transition-all duration-300 group"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* ── Image ────────────────────────────────────────────────── */}
      <div className="relative aspect-[4/3] bg-gradient-to-br from-gray-50 to-gray-100
                      dark:from-gray-900 dark:to-gray-800 overflow-hidden">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-full object-contain p-6
                     group-hover:scale-105 transition-transform duration-500 ease-out"
          loading="lazy"
        />

        {/* Category pill */}
        <span className="absolute top-3 left-3 bg-gray-900/75 dark:bg-white/15
                         text-white text-[10px] font-bold px-2.5 py-1 rounded-full
                         backdrop-blur-sm tracking-wide">
          {product.category}
        </span>

        {/* Savings badge */}
        {savings > 0 && (
          <span className="absolute top-3 right-3 bg-emerald-500 dark:bg-emerald-600
                           text-white text-[10px] font-bold px-2.5 py-1 rounded-full
                           flex items-center gap-1 shadow-lg shadow-emerald-500/30">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
            </svg>
            Save ₹{savings.toLocaleString('en-IN')}
          </span>
        )}
      </div>

      {/* ── Product info ─────────────────────────────────────────── */}
      <div className="p-5 flex-1 flex flex-col">
        <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500
                      uppercase tracking-[0.12em] mb-1">
          {product.brand}
        </p>
        <h3 className="text-[13px] font-semibold text-gray-900 dark:text-gray-100
                       leading-snug line-clamp-2 mb-3">
          {product.name}
        </h3>

        {/* ── Deal score badge ─────────────────────────────────── */}
        <div className="flex items-center gap-2 mb-4">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold
                            ${badge.bgLight} ${badge.bgDark} ${badge.textLight} ${badge.textDark}`}>
            <span className="text-[8px] tracking-tight">{badge.icon}</span>
            {insight.label} Deal
          </span>
          {insight.isPriceMatch && (
            <span className="text-[10px] font-bold text-violet-600 dark:text-violet-400
                             bg-violet-50 dark:bg-violet-900/20 px-2 py-0.5 rounded-md">
              Price Match
            </span>
          )}
        </div>

        {/* ── Divider ──────────────────────────────────────────── */}
        <div className="flex items-center gap-2.5 mb-4">
          <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
          <span className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest whitespace-nowrap">
            Where to Buy
          </span>
          <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
        </div>

        {/* ── Best deal (RECOMMENDED) ─────────────────────────── */}
        {bestOffer && bestOffer.inStock && (
          <div className="mb-3">
            {/* Recommended label */}
            {!insight.isPriceMatch && alternatives.length > 0 && alternatives.some(a => a.inStock) && (
              <div className="flex items-center gap-1.5 mb-2">
                <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Recommended
                </span>
              </div>
            )}

            <BestDealBlock offer={bestOffer} onBuy={handleBuy} />
          </div>
        )}

        {/* ── Alternatives ────────────────────────────────────── */}
        {alternatives.length > 0 && (
          <div className="space-y-2 mt-auto">
            {!insight.isPriceMatch && bestOffer.inStock && (
              <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                Also available
              </p>
            )}

            {alternatives.map(offer => (
              <AlternativeRow
                key={offer.retailer}
                offer={offer}
                bestPrice={bestOffer?.inStock ? bestOffer.price : null}
                isPriceMatch={insight.isPriceMatch}
                onBuy={handleBuy}
              />
            ))}
          </div>
        )}

        {/* ── Savings insight ─────────────────────────────────── */}
        {savings > 0 && insight.bestRetailer && !insight.isPriceMatch && (
          <div className="mt-4 flex items-center gap-2 px-3 py-2 rounded-lg
                          bg-emerald-50 dark:bg-emerald-900/20
                          border border-emerald-200/60 dark:border-emerald-700/30">
            <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              Choose {insight.bestRetailer} and save ₹{savings.toLocaleString('en-IN')}
            </span>
          </div>
        )}
      </div>

      {/* ── Disclosure ────────────────────────────────────────── */}
      <div className="px-5 pb-4 pt-1">
        <p className="text-[9px] text-gray-300 dark:text-gray-600 text-center font-medium">
          Redirects to official retailer site
        </p>
      </div>
    </div>
  );
};

/* ================================================================== */
/*  Best Deal Block — the primary CTA, visually dominant               */
/* ================================================================== */

const BestDealBlock: React.FC<{
  offer: RetailerOffer;
  onBuy: (o: RetailerOffer) => void;
}> = ({ offer, onBuy }) => {
  const meta = RETAILER_META[offer.retailer];

  return (
    <div className="rounded-xl border border-emerald-200/80 dark:border-emerald-700/40
                    bg-gradient-to-br from-emerald-50/60 to-white dark:from-emerald-900/15 dark:to-gray-800/50
                    p-4 transition-all duration-200">
      {/* Retailer + price */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <img src={meta.icon} alt={offer.retailer} className="w-5 h-5 rounded-sm" />
          <span className={`text-sm font-bold ${meta.accentText} ${meta.accentTextDark}`}>
            {meta.label}
          </span>
        </div>
        {offer.discount > 0 && (
          <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400
                           bg-emerald-100 dark:bg-emerald-900/40 px-1.5 py-0.5 rounded-md">
            {offer.discount}% off
          </span>
        )}
      </div>

      {/* Price hero */}
      <div className="flex items-baseline gap-2 mb-2">
        <span className="text-2xl font-black text-gray-900 dark:text-white tabular-nums tracking-tight">
          ₹{offer.price.toLocaleString('en-IN')}
        </span>
        {offer.originalPrice > offer.price && (
          <span className="text-xs line-through text-gray-400 dark:text-gray-500 tabular-nums">
            ₹{offer.originalPrice.toLocaleString('en-IN')}
          </span>
        )}
      </div>

      {/* Offers */}
      {offer.offers.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {offer.offers.map((o, i) => (
            <span key={i} className="inline-flex items-center gap-1 text-[10px] font-semibold
                                     text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700/50
                                     px-2 py-0.5 rounded-md">
              <svg className="w-3 h-3 text-amber-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              {o}
            </span>
          ))}
        </div>
      )}

      {/* Primary CTA */}
      <button
        onClick={() => onBuy(offer)}
        className={`w-full py-2.5 rounded-lg text-sm font-bold
                   transition-all duration-200 active:scale-[0.97] ${meta.btnClasses}`}
      >
        Buy on {meta.label}
        <svg className="inline-block w-3.5 h-3.5 ml-1.5 -mt-px" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
      </button>
    </div>
  );
};

/* ================================================================== */
/*  Alternative Row — compact, shows price delta vs best               */
/* ================================================================== */

const AlternativeRow: React.FC<{
  offer: RetailerOffer;
  bestPrice: number | null;
  isPriceMatch: boolean;
  onBuy: (o: RetailerOffer) => void;
}> = ({ offer, bestPrice, isPriceMatch, onBuy }) => {
  const meta = RETAILER_META[offer.retailer];
  const priceDiff = bestPrice && offer.inStock ? offer.price - bestPrice : 0;

  // If price match, render as equal deal (same visual weight as best)
  if (isPriceMatch && offer.inStock) {
    return <BestDealBlock offer={offer} onBuy={onBuy} />;
  }

  return (
    <div className={`rounded-lg border p-3 transition-all duration-200
      ${offer.inStock
        ? 'border-gray-200/80 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/30'
        : 'border-gray-100 dark:border-gray-700/30 bg-gray-50/30 dark:bg-gray-800/20 opacity-50 grayscale-[30%]'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        {/* Retailer + price */}
        <div className="flex items-center gap-2 min-w-0">
          <img src={meta.icon} alt={offer.retailer} className="w-4 h-4 rounded-sm shrink-0" />
          <span className={`text-xs font-bold ${meta.accentText} ${meta.accentTextDark} shrink-0`}>
            {meta.label}
          </span>
          <span className="text-sm font-black text-gray-900 dark:text-white tabular-nums">
            ₹{offer.price.toLocaleString('en-IN')}
          </span>
          {priceDiff > 0 && (
            <span className="text-[10px] font-bold text-red-500/80 dark:text-red-400/70 tabular-nums whitespace-nowrap">
              +₹{priceDiff.toLocaleString('en-IN')}
            </span>
          )}
          {offer.discount > 0 && (
            <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
              {offer.discount}% off
            </span>
          )}
        </div>

        {/* CTA */}
        {offer.inStock ? (
          <button
            onClick={() => onBuy(offer)}
            className={`shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-bold
                       transition-all duration-200 active:scale-[0.97] ${meta.btnSecondary}`}
          >
            View
            <svg className="inline-block w-3 h-3 ml-1 -mt-px" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        ) : (
          <span className="shrink-0 text-[10px] font-bold text-red-400 dark:text-red-500">
            Out of stock
          </span>
        )}
      </div>

      {/* Offers (compact) */}
      {offer.offers.length > 0 && offer.inStock && (
        <p className="mt-1.5 pl-6 text-[10px] text-gray-500 dark:text-gray-400 flex items-center gap-1">
          <svg className="w-3 h-3 text-amber-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          {offer.offers.join(' · ')}
        </p>
      )}
    </div>
  );
};

export default ElectronicsProductCard;
