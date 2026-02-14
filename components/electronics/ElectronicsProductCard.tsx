import React from 'react';
import type { Product, Retailer } from './types';
import { bestRetailer, savingsAmount } from './types';

/* ------------------------------------------------------------------ */
/*  Retailer branding                                                  */
/* ------------------------------------------------------------------ */

const RETAILER_META: Record<Retailer, {
  icon: string;
  label: string;
  accentText: string;
  accentTextDark: string;
  btnClasses: string;
  rowBg: string;
  rowBgDark: string;
}> = {
  Amazon: {
    icon: 'https://www.amazon.in/favicon.ico',
    label: 'Amazon',
    accentText: 'text-[#ff9900]',
    accentTextDark: 'dark:text-[#ffad33]',
    btnClasses: 'bg-[#ff9900] hover:bg-[#e68a00] text-white',
    rowBg: 'bg-orange-50/60 border-orange-200/70',
    rowBgDark: 'dark:bg-orange-950/20 dark:border-orange-800/30',
  },
  Flipkart: {
    icon: 'https://www.flipkart.com/favicon.ico',
    label: 'Flipkart',
    accentText: 'text-[#2874f0]',
    accentTextDark: 'dark:text-[#5c9aff]',
    btnClasses: 'bg-[#2874f0] hover:bg-[#1a5dc7] text-white',
    rowBg: 'bg-blue-50/60 border-blue-200/70',
    rowBgDark: 'dark:bg-blue-950/20 dark:border-blue-800/30',
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
  const best = bestRetailer(product);
  const savings = savingsAmount(product);

  const handleBuy = (offer: Product['retailerOffers'][number]) => {
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
      {/* ── Image ──────────────────────────────────────────────── */}
      <div className="relative aspect-square bg-gradient-to-br from-gray-50 to-gray-100
                      dark:from-gray-900 dark:to-gray-800 overflow-hidden">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-full object-contain p-8
                     group-hover:scale-105 transition-transform duration-500 ease-out"
          loading="lazy"
        />

        {/* Category */}
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

      {/* ── Product info ───────────────────────────────────────── */}
      <div className="p-5 flex-1 flex flex-col">
        <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500
                      uppercase tracking-[0.12em] mb-1">
          {product.brand}
        </p>
        <h3 className="text-[13px] font-semibold text-gray-900 dark:text-gray-100
                       leading-snug line-clamp-2 mb-4">
          {product.name}
        </h3>

        {/* ── Section divider ──────────────────────────────────── */}
        <div className="flex items-center gap-2.5 mb-4">
          <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
          <span className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest whitespace-nowrap">
            Compare Prices
          </span>
          <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
        </div>

        {/* ── Retailer offer blocks ────────────────────────────── */}
        <div className="space-y-3 mt-auto">
          {product.retailerOffers.map((offer) => {
            const meta = RETAILER_META[offer.retailer];
            const isBest = offer.retailer === best && offer.inStock;
            const isOnlyInStock = product.retailerOffers.filter(o => o.inStock).length <= 1;

            return (
              <div
                key={offer.retailer}
                className={`rounded-xl border p-4 transition-all duration-200 relative
                  ${isBest && !isOnlyInStock
                    ? 'border-emerald-300 dark:border-emerald-600/50 bg-emerald-50/50 dark:bg-emerald-900/15 ring-1 ring-emerald-200/50 dark:ring-emerald-700/30'
                    : `${meta.rowBg} ${meta.rowBgDark}`
                  }
                  ${!offer.inStock ? 'opacity-50 grayscale-[30%]' : ''}
                `}
              >
                {/* Best price badge */}
                {isBest && !isOnlyInStock && (
                  <span className="absolute -top-2.5 right-4
                                   bg-emerald-500 dark:bg-emerald-600 text-white
                                   text-[8px] font-black px-2.5 py-0.5 rounded-full
                                   shadow-md shadow-emerald-500/30 tracking-wider uppercase">
                    Best Price
                  </span>
                )}

                {/* Retailer header */}
                <div className="flex items-center gap-2 mb-3">
                  <img src={meta.icon} alt={offer.retailer}
                       className="w-5 h-5 rounded-sm object-contain" />
                  <span className={`text-sm font-bold ${meta.accentText} ${meta.accentTextDark}`}>
                    {meta.label}
                  </span>
                </div>

                {/* Price row */}
                <div className="flex items-baseline gap-2 mb-1.5">
                  <span className="text-xl font-black text-gray-900 dark:text-white tabular-nums tracking-tight">
                    ₹{offer.price.toLocaleString('en-IN')}
                  </span>
                  {offer.originalPrice > offer.price && (
                    <span className="text-xs line-through text-gray-400 dark:text-gray-500 tabular-nums">
                      ₹{offer.originalPrice.toLocaleString('en-IN')}
                    </span>
                  )}
                  {offer.discount > 0 && (
                    <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400
                                     bg-emerald-100 dark:bg-emerald-900/40 px-1.5 py-0.5 rounded-md">
                      {offer.discount}% off
                    </span>
                  )}
                </div>

                {/* Offers */}
                {offer.offers.length > 0 && offer.inStock && (
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-1">
                    <svg className="w-3 h-3 text-amber-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    {offer.offers.join(' · ')}
                  </p>
                )}

                {/* Out of stock */}
                {!offer.inStock && (
                  <p className="text-[11px] font-bold text-red-500 dark:text-red-400 mb-3 flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    Currently unavailable
                  </p>
                )}

                {/* CTA Button — full width, retailer branded */}
                {offer.inStock ? (
                  <button
                    onClick={() => handleBuy(offer)}
                    className={`w-full py-2.5 rounded-lg text-sm font-bold
                               transition-all duration-200 active:scale-[0.97]
                               shadow-sm hover:shadow-md ${meta.btnClasses}`}
                  >
                    Buy on {meta.label}
                    <svg className="inline-block w-3.5 h-3.5 ml-1.5 -mt-px" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </button>
                ) : (
                  <div className="w-full py-2.5 rounded-lg text-sm font-bold text-center
                                  bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed">
                    Unavailable
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Savings callout ──────────────────────────────────── */}
        {savings > 0 && best && (
          <div className="mt-4 flex items-center gap-2 px-3 py-2 rounded-lg
                          bg-emerald-50 dark:bg-emerald-900/20
                          border border-emerald-200/60 dark:border-emerald-700/30">
            <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              ₹{savings.toLocaleString('en-IN')} cheaper on {best}
            </span>
          </div>
        )}
      </div>

      {/* ── Disclosure footer ──────────────────────────────────── */}
      <div className="px-5 pb-4 pt-1">
        <p className="text-[9px] text-gray-300 dark:text-gray-600 text-center font-medium">
          Redirects to official retailer site
        </p>
      </div>
    </div>
  );
};

export default ElectronicsProductCard;
