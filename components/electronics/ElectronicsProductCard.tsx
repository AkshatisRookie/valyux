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

type AddToCartPayload = { productId: string; name: string; imageUrl: string; brand: string; retailer: 'Amazon' | 'Flipkart'; price: number; productUrl: string };

interface Props {
  product: Product;
  index: number;
  onAddToCart?: (item: AddToCartPayload) => void;
}

const ElectronicsProductCard: React.FC<Props> = ({ product, index, onAddToCart }) => {
  const insight = computeDealInsight(product);
  const savings = savingsAmount(product);
  const badge = DEAL_BADGE_CONFIG[insight.label];

  const sortedOffers = [...product.retailerOffers].sort((a, b) => {
    if (a.inStock !== b.inStock) return a.inStock ? -1 : 1;
    return a.price - b.price;
  });

  const bestOffer = sortedOffers[0];
  const alternatives = sortedOffers.slice(1);

  const handleBuy = (offer: RetailerOffer) => {
    window.open(offer.affiliateUrl || offer.productUrl, '_blank', 'noopener,noreferrer');
  };

  const handleAddToCart = (offer: RetailerOffer) => {
    if (!onAddToCart || !offer.inStock) return;
    onAddToCart({
      productId: product.id,
      name: product.name,
      imageUrl: product.imageUrl,
      brand: product.brand,
      retailer: offer.retailer,
      price: offer.price,
      productUrl: offer.affiliateUrl || offer.productUrl,
    });
  };

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden flex flex-col">
      <div className="relative aspect-[4/3] bg-neutral-50 dark:bg-neutral-800 overflow-hidden">
        <img src={product.imageUrl} alt={product.name} className="w-full h-full object-contain p-4" loading="lazy" />
        <span className="absolute top-2 left-2 bg-neutral-800/80 dark:bg-neutral-600 text-white text-[10px] font-medium px-2 py-0.5 rounded">
          {product.category}
        </span>
        {savings > 0 && (
          <span className="absolute top-2 right-2 bg-yellow-400 text-neutral-900 text-xs font-semibold px-2 py-0.5 rounded">
            Save ₹{savings.toLocaleString('en-IN')}
          </span>
        )}
      </div>

      <div className="p-4 flex-1 flex flex-col">
        <p className="text-xs text-neutral-500 mb-0.5">{product.brand}</p>
        <h3 className="text-sm font-medium text-neutral-900 dark:text-white line-clamp-2 mb-3">{product.name}</h3>

        <div className="flex items-center gap-2 mb-3">
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${badge.bgLight} ${badge.bgDark} ${badge.textLight} ${badge.textDark}`}>
            {insight.label} Deal
          </span>
          {insight.isPriceMatch && (
            <span className="text-[10px] font-medium text-neutral-600 dark:text-neutral-400">Price Match</span>
          )}
        </div>

        {bestOffer && bestOffer.inStock && (
          <div className="mb-3">
            {!insight.isPriceMatch && alternatives.length > 0 && alternatives.some(a => a.inStock) && (
              <p className="text-[10px] font-semibold text-yellow-600 dark:text-yellow-400 mb-1.5">Best price</p>
            )}
            <BestDealBlock offer={bestOffer} onBuy={handleBuy} onAddToCart={onAddToCart ? () => handleAddToCart(bestOffer) : undefined} />
          </div>
        )}

        {alternatives.length > 0 && (
          <div className="space-y-1.5 mt-auto">
            {alternatives.map(offer => (
              <AlternativeRow
                key={offer.retailer}
                offer={offer}
                bestPrice={bestOffer?.inStock ? bestOffer.price : null}
                isPriceMatch={insight.isPriceMatch}
                onBuy={handleBuy}
                onAddToCart={onAddToCart && offer.inStock ? () => handleAddToCart(offer) : undefined}
              />
            ))}
          </div>
        )}

        {savings > 0 && insight.bestRetailer && !insight.isPriceMatch && (
          <p className="mt-3 text-xs text-neutral-500">
            Best on {insight.bestRetailer} — save ₹{savings.toLocaleString('en-IN')}
          </p>
        )}
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
  onAddToCart?: () => void;
}> = ({ offer, onBuy, onAddToCart }) => {
  const meta = RETAILER_META[offer.retailer];

  return (
    <div className="rounded-lg border border-yellow-200 dark:border-yellow-800 bg-yellow-50/50 dark:bg-yellow-900/10 p-3">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <img src={meta.icon} alt={offer.retailer} className="w-4 h-4 rounded-sm" />
          <span className={`text-sm font-semibold ${meta.accentText} ${meta.accentTextDark}`}>{meta.label}</span>
        </div>
        {offer.discount > 0 && (
          <span className="text-[10px] font-semibold text-yellow-700 dark:text-yellow-400">{offer.discount}% off</span>
        )}
      </div>
      <div className="flex items-baseline gap-2 mb-2">
        <span className="text-xl font-bold text-neutral-900 dark:text-white tabular-nums">₹{offer.price.toLocaleString('en-IN')}</span>
        {offer.originalPrice > offer.price && (
          <span className="text-xs line-through text-neutral-500">₹{offer.originalPrice.toLocaleString('en-IN')}</span>
        )}
      </div>
      {offer.offers.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {offer.offers.map((o, i) => (
            <span key={i} className="text-[10px] text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-700 px-1.5 py-0.5 rounded">
              {o}
            </span>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => onBuy(offer)}
          className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 active:scale-[0.97] ${meta.btnClasses}`}
        >
          Buy on {meta.label}
          <svg className="inline-block w-3.5 h-3.5 ml-1.5 -mt-px" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </button>
        {onAddToCart && (
          <button
            onClick={onAddToCart}
            className="py-2.5 px-3 rounded-lg text-sm font-bold bg-yellow-400 hover:bg-yellow-500 text-neutral-900 transition-all duration-200 active:scale-[0.97]"
            title="Add to cart"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </button>
        )}
      </div>
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
  onAddToCart?: () => void;
}> = ({ offer, bestPrice, isPriceMatch, onBuy, onAddToCart }) => {
  const meta = RETAILER_META[offer.retailer];
  const priceDiff = bestPrice && offer.inStock ? offer.price - bestPrice : 0;

  if (isPriceMatch && offer.inStock) {
    return <BestDealBlock offer={offer} onBuy={onBuy} onAddToCart={onAddToCart} />;
  }

  return (
    <div className={`rounded-lg border p-3 transition-all duration-200
      ${offer.inStock
        ? 'border-gray-200/80 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/30'
        : 'border-gray-100 dark:border-gray-700/30 bg-gray-50/30 dark:bg-gray-800/20 opacity-50 grayscale-[30%]'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
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

        {offer.inStock ? (
          <div className="flex items-center gap-1 shrink-0">
            {onAddToCart && (
              <button
                onClick={onAddToCart}
                className="p-1.5 rounded-lg bg-yellow-400 hover:bg-yellow-500 text-neutral-900"
                title="Add to cart"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </button>
            )}
            <button
              onClick={() => onBuy(offer)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all duration-200 active:scale-[0.97] ${meta.btnSecondary}`}
            >
              View
              <svg className="inline-block w-3 h-3 ml-1 -mt-px" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
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
