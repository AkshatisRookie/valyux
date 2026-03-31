
import React, { useState } from 'react';
import { Product, Platform } from '../types';
import { getPlatformSearchUrl } from '../config/affiliateLinks';

const getProductLink = (platform: Platform, productName: string, productUrl?: string) =>
  productUrl || getPlatformSearchUrl(platform, productName);

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product, platform: Platform) => void;
}

const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=400&q=80';

/** Keeps digits and units (e.g. "7 mins") on one line and aligned on the same baseline (fixes mobile font-metrics quirks). */
function DeliveryTimeLabel({ value, className }: { value: string; className?: string }) {
  const cleaned = value.replace(/\s+/g, ' ').trim();
  const match = cleaned.match(/^(\d+)\s*(.+)$/);
  const base = className ?? 'text-[10px] text-neutral-500 dark:text-neutral-400';
  if (match) {
    const [, num, rest] = match;
    return (
      <span className={`inline-flex items-baseline gap-0.5 whitespace-nowrap ${base}`}>
        <span className="tabular-nums font-semibold leading-none">{num}</span>
        <span className="leading-none">{rest}</span>
      </span>
    );
  }
  return <span className={`whitespace-nowrap leading-none ${base}`}>{cleaned}</span>;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart }) => {
  const sortedPrices = [...product.platformPrices].sort((a, b) => a.price - b.price);
  const cheapestPrice = sortedPrices[0];
  const otherPrices = sortedPrices.slice(1);
  const discountPct = cheapestPrice && cheapestPrice.originalPrice > cheapestPrice.price
    ? Math.round((1 - cheapestPrice.price / cheapestPrice.originalPrice) * 100)
    : 0;

  const [menuOpen, setMenuOpen] = useState(false);

  const getPlatformColor = (platform: Platform) => {
    switch (platform) {
      case 'JioMart': return 'text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20';
      case 'Blinkit':   return 'text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20';
      case 'Instamart':  return 'text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20';
      case 'Zepto':     return 'text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20';
      default:          return 'text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800';
    }
  };

  const getPlatformIcon = (platform: Platform) => {
    switch (platform) {
      case 'JioMart': return 'https://www.google.com/s2/favicons?domain=jiomart.com&sz=128';
      case 'Blinkit':   return 'https://blinkit.com/favicon.ico';
      case 'Instamart':  return 'https://www.google.com/s2/favicons?domain=swiggy.com&sz=128';
      case 'Zepto':     return 'https://www.zepto.com/favicon.ico';
      default:          return '';
    }
  };

  if (!cheapestPrice) {
    return (
      <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4 text-sm text-neutral-500">
        No prices available
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden flex flex-col">
      <div className="relative aspect-square p-4 bg-neutral-50 dark:bg-neutral-800">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-contain"
            onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE; }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-neutral-400">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" /></svg>
          </div>
        )}
        {discountPct > 0 && (
          <span className="absolute top-2 left-2 bg-yellow-400 text-neutral-900 text-xs font-semibold px-2 py-0.5 rounded">
            {discountPct}% off
          </span>
        )}
      </div>

      <div className="p-3 flex-1 flex flex-col">
        <p className="text-xs text-neutral-500 mb-0.5">{product.brand}</p>
        <h3 className="font-medium text-neutral-900 dark:text-white text-sm line-clamp-2 mb-1">{product.name}</h3>
        <p className="text-xs text-neutral-500 mb-3">{product.quantity}</p>
        <div className="mb-3 flex flex-wrap items-center gap-1.5">
          {product.platformPrices.length >= 2 ? (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800">
              Compared ({product.platformPrices.length})
            </span>
          ) : (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-neutral-50 text-neutral-700 border border-neutral-200 dark:bg-neutral-900/40 dark:text-neutral-300 dark:border-neutral-700">
              Not compared
            </span>
          )}
        </div>

        {/* Best price — icon left; price + actions on top, delivery time on next line (avoids overlap on narrow screens) */}
        <div className={`mt-auto rounded-lg border px-2.5 py-2.5 ${getPlatformColor(cheapestPrice.platform)} ring-1 ring-yellow-400/80`}>
          <div className="flex gap-2">
            <span className="mt-0.5 w-3.5 h-3.5 shrink-0 rounded-full overflow-hidden inline-flex items-center justify-center bg-white/80 dark:bg-neutral-700/80 ring-1 ring-black/5 dark:ring-white/10">
              <img src={getPlatformIcon(cheapestPrice.platform)} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </span>
            <div className="min-w-0 flex-1 flex flex-col gap-0.5 items-end text-right">
              <div className="flex w-full items-center justify-end gap-1">
                <span className="text-base font-bold tabular-nums whitespace-nowrap">₹{cheapestPrice.price}</span>
                <a
                  href={getProductLink(cheapestPrice.platform, product.name, cheapestPrice.productUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white p-0.5"
                  title="Open on app"
                >
                  ↗
                </a>
                <button
                  type="button"
                  onClick={() => onAddToCart(product, cheapestPrice.platform)}
                  className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg bg-neutral-200 dark:bg-neutral-600 hover:bg-yellow-400 hover:text-neutral-900 text-sm font-bold"
                >
                  +
                </button>
              </div>
              {cheapestPrice.deliveryTime && (
                <div className="w-full flex justify-end">
                  <DeliveryTimeLabel value={cheapestPrice.deliveryTime} />
                </div>
              )}
            </div>
          </div>
        </div>

        {otherPrices.length > 0 && (
          <div className="mt-2">
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className="w-full flex items-center justify-between text-left text-xs font-medium text-neutral-600 dark:text-neutral-300 py-2 px-2 rounded-lg border border-neutral-200 dark:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-800/80"
            >
              <span>Other platforms ({otherPrices.length})</span>
              <svg className={`w-4 h-4 transition-transform ${menuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {menuOpen && (
              <ul className="mt-1 space-y-1 border border-neutral-100 dark:border-neutral-700 rounded-lg p-1.5 bg-neutral-50/80 dark:bg-neutral-900/50">
                {otherPrices.map((pp) => (
                  <li
                    key={pp.platform}
                    className={`flex items-start gap-2 py-1.5 px-2 rounded-md ${getPlatformColor(pp.platform)}`}
                  >
                    <div className="flex gap-1.5 min-w-0 flex-1">
                      <span className="mt-0.5 w-3 h-3 shrink-0 rounded-full overflow-hidden inline-flex">
                        <img src={getPlatformIcon(pp.platform)} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </span>
                      <div className="min-w-0 flex-1 flex flex-col gap-0.5 items-end text-right">
                        <div className="flex w-full items-center justify-end gap-1">
                          <span className="text-xs font-semibold tabular-nums whitespace-nowrap">₹{pp.price}</span>
                          <a
                            href={getProductLink(pp.platform, product.name, pp.productUrl)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="shrink-0 text-neutral-600 dark:text-neutral-400 p-0.5"
                          >
                            ↗
                          </a>
                          <button
                            type="button"
                            onClick={() => onAddToCart(product, pp.platform)}
                            className="shrink-0 w-6 h-6 flex items-center justify-center rounded bg-white/60 dark:bg-neutral-700 hover:bg-yellow-400 text-xs font-bold"
                          >
                            +
                          </button>
                        </div>
                        {pp.deliveryTime && (
                          <div className="w-full flex justify-end">
                            <DeliveryTimeLabel
                              value={pp.deliveryTime}
                              className="text-[9px] text-neutral-500 dark:text-neutral-400"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      <div className="px-3 py-2 bg-neutral-50 dark:bg-neutral-800/80 border-t border-neutral-100 dark:border-neutral-700 flex justify-between items-center text-xs">
        <span className="text-neutral-500">From</span>
        <span className="font-semibold tabular-nums text-yellow-600 dark:text-yellow-400">₹{cheapestPrice.price}</span>
      </div>
    </div>
  );
};

export default ProductCard;
