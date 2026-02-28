import React, { useState } from 'react';
import type { Product, Retailer, RetailerOffer } from './types';

/** Circle logo with fallback letter when image fails (e.g. on mobile) */
const RetailerLogo: React.FC<{ iconUrl: string; label: string }> = ({ iconUrl, label }) => {
  const [failed, setFailed] = useState(false);
  const letter = label.charAt(0);
  return (
    <span className="w-3.5 h-3.5 rounded-full shrink-0 overflow-hidden inline-flex items-center justify-center bg-white/80 dark:bg-neutral-700/80 ring-1 ring-black/5 dark:ring-white/10 text-[10px] font-bold text-neutral-600 dark:text-neutral-300">
      {failed ? (
        letter
      ) : (
        <img src={iconUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" onError={() => setFailed(true)} />
      )}
    </span>
  );
};

/* ------------------------------------------------------------------ */
/*  Retailer branding — same row style as grocery (easy to add more)  */
/* ------------------------------------------------------------------ */

/* Use direct favicons so logos load on mobile (Google s2/favicons often blocked/fails there) */
const RETAILER_META: Record<Retailer, { icon: string; label: string; rowBg: string }> = {
  Amazon: {
    icon: 'https://www.amazon.in/favicon.ico',
    label: 'Amazon',
    rowBg: 'text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20',
  },
  Flipkart: {
    icon: 'https://www.flipkart.com/favicon.ico',
    label: 'Flipkart',
    rowBg: 'text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20',
  },
};

/* Add more retailers here when needed, e.g.:
  Myntra: { icon: '...', label: 'Myntra', rowBg: '...' },
*/

type AddToCartPayload = { productId: string; name: string; imageUrl: string; brand: string; retailer: 'Amazon' | 'Flipkart'; price: number; productUrl: string };

interface Props {
  product: Product;
  index: number;
  onAddToCart?: (item: AddToCartPayload) => void;
}

const ElectronicsProductCard: React.FC<Props> = ({ product, index, onAddToCart }) => {
  const sortedOffers = [...product.retailerOffers].sort((a, b) => {
    if (a.inStock !== b.inStock) return a.inStock ? -1 : 1;
    return a.price - b.price;
  });

  const bestOffer = sortedOffers.find(o => o.inStock) ?? sortedOffers[0];
  const isCheapest = (offer: RetailerOffer) => offer.retailer === bestOffer?.retailer && offer.inStock;

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
      </div>

      <div className="p-3 flex-1 flex flex-col min-w-0 overflow-hidden">
        <p className="text-xs text-neutral-500 mb-0.5">{product.brand}</p>
        <h3 className="font-medium text-neutral-900 dark:text-white text-sm line-clamp-2 mb-3">{product.name}</h3>

        {/* Same row layout as grocery: one row per platform/retailer */}
        <div className="space-y-1.5 mt-auto">
          {sortedOffers.map((offer) => {
            const meta = RETAILER_META[offer.retailer];
            const best = isCheapest(offer);
            return (
              <div
                key={offer.retailer}
                className={`flex items-center justify-between gap-2 py-2 px-2.5 rounded-lg ${meta.rowBg} ${best ? 'ring-1 ring-yellow-400' : ''} ${!offer.inStock ? 'opacity-60' : ''}`}
              >
                <div className="flex items-center gap-1.5 min-w-0 flex-1 overflow-hidden">
                  <RetailerLogo iconUrl={meta.icon} label={meta.label} />
                  <div className="min-w-0 flex flex-col gap-0.5">
                    <span className="text-xs font-medium truncate">
                      {meta.label}
                      {best && <span className="ml-1 text-[10px] font-semibold text-yellow-700 dark:text-yellow-400">Best</span>}
                    </span>
                    {offer.deliveryTime && (
                      <span className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate">{offer.deliveryTime}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-xs line-through text-neutral-500">₹{offer.originalPrice.toLocaleString('en-IN')}</span>
                  <span className="text-sm font-semibold whitespace-nowrap">₹{offer.price.toLocaleString('en-IN')}</span>
                  <a
                    href={offer.affiliateUrl || offer.productUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white p-0.5"
                    title="Open"
                  >
                    ↗
                  </a>
                  {offer.inStock && onAddToCart ? (
                    <button
                      onClick={() => handleAddToCart(offer)}
                      className="w-6 h-6 flex items-center justify-center rounded bg-neutral-200 dark:bg-neutral-600 hover:bg-yellow-400 hover:text-neutral-900 text-sm font-bold shrink-0"
                    >
                      +
                    </button>
                  ) : (
                    !offer.inStock && <span className="text-[10px] text-red-500 dark:text-red-400 font-medium">Out</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Same footer as grocery: Lowest retailer + price */}
      {bestOffer && (
        <div className="px-3 py-2 bg-neutral-50 dark:bg-neutral-800/80 border-t border-neutral-100 dark:border-neutral-700 flex justify-between items-center text-xs">
          <span className="text-neutral-500">Lowest</span>
          <span className="font-semibold text-yellow-600 dark:text-yellow-400">
            {RETAILER_META[bestOffer.retailer].label} ₹{bestOffer.price.toLocaleString('en-IN')}
          </span>
        </div>
      )}
    </div>
  );
};

export default ElectronicsProductCard;
