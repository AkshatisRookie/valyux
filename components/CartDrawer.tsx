import React, { useState, useMemo } from 'react';
import { CartItem, Platform } from '../types';
import { usePincode } from '../context/PincodeContext';
import { getPlatformSearchUrl } from '../config/affiliateLinks';
import { getPlatformIcon, getPlatformIconFallback } from '../config/platformIcons';

interface CartDrawerProps {
  items: CartItem[];
  onClose: () => void;
  onUpdateQuantity: (productId: string, platform: string, delta: number) => void;
}

const PLATFORM_ICONS: Record<Platform, string> = {
  JioMart: getPlatformIcon('JioMart'),
  Blinkit: getPlatformIcon('Blinkit'),
  Instamart: getPlatformIcon('Instamart'),
  Zepto: getPlatformIcon('Zepto'),
};

const CartDrawer: React.FC<CartDrawerProps> = ({ items, onClose, onUpdateQuantity }) => {
  const { openByPlatform } = usePincode();
  const [showCheckoutMessage, setShowCheckoutMessage] = useState(false);

  const normalizeNameForCompare = (s: string) =>
    (s || '')
      .toLowerCase()
      .replace(/[^a-z0-9 ]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  const normalizeQtyForCompare = (q: string) =>
    (q || '')
      .toLowerCase()
      .replace(/\s+/g, '')
      .replace(/\.0+(?=\D|$)/g, '')
      .trim();

  const tokenSimilarity = (a: string, b: string) => {
    const ta = a.split(' ').filter(Boolean);
    const tb = b.split(' ').filter(Boolean);
    if (ta.length === 0 || tb.length === 0) return 0;
    if (a === b) return 1;
    if (a.includes(b) || b.includes(a)) return 1;
    const setA = new Set(ta);
    const setB = new Set(tb);
    let inter = 0;
    for (const t of setA) if (setB.has(t)) inter += 1;
    return inter / Math.max(setA.size, setB.size);
  };

  const itemCount = items.reduce((acc, i) => acc + i.quantity, 0);

  const platformTotals = useMemo(() => {
    const totals: Record<Platform, number> = {
      JioMart: 0, Blinkit: 0, Instamart: 0, Zepto: 0,
    };
    const openPlatforms = (['JioMart', 'Blinkit', 'Instamart', 'Zepto'] as Platform[]).filter(
      (p) => openByPlatform[p] !== false
    );
    items.forEach(item => {
      openPlatforms.forEach(platform => {
        const priceObj = item.product.platformPrices.find(pp => pp.platform === platform);
        if (priceObj) totals[platform] += priceObj.price * item.quantity;
      });
    });
    return totals;
  }, [items, openByPlatform]);

  const cheapestPlatform = useMemo(() => {
    if (items.length === 0) return null;
    const openPlatforms = (['JioMart', 'Blinkit', 'Instamart', 'Zepto'] as Platform[]).filter(
      (p) => openByPlatform[p] !== false
    );
    let minPlatform: Platform | null = null;
    let minTotal = Infinity;
    openPlatforms.forEach(platform => {
      const total = platformTotals[platform];
      if (total > 0 && total < minTotal) {
        minTotal = total;
        minPlatform = platform;
      }
    });
    return minPlatform ? { platform: minPlatform, total: minTotal } : null;
  }, [platformTotals, items, openByPlatform]);

  const linePrice = (item: CartItem) =>
    item.product.platformPrices.find((pp) => pp.platform === item.selectedPlatform)?.price || 0;

  const groceryTotal = items.reduce((acc, item) => acc + linePrice(item) * item.quantity, 0);

  const FREE_DELIVERY_THRESHOLD = 200;
  const DELIVERY_FEE = 30;
  const deliveryFee = groceryTotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
  const totalWithDelivery = groceryTotal + deliveryFee;
  const cheapestPlatformDeliveryFee = cheapestPlatform
    ? cheapestPlatform.total >= FREE_DELIVERY_THRESHOLD
      ? 0
      : DELIVERY_FEE
    : 0;
  const cheapestPlatformTotalWithDelivery = cheapestPlatform
    ? cheapestPlatform.total + cheapestPlatformDeliveryFee
    : 0;

  const openLink = (item: CartItem) => {
    const url =
      item.product.platformPrices.find((p) => p.platform === item.selectedPlatform)?.productUrl ||
      getPlatformSearchUrl(item.selectedPlatform, item.product.name);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md h-full flex flex-col bg-white dark:bg-neutral-950 shadow-2xl transition-colors duration-300">
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center bg-white dark:bg-neutral-950 sticky top-0 z-10 shrink-0">
          <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
            Grocery Cart ({itemCount})
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors"
          >
            <svg className="w-6 h-6 text-neutral-600 dark:text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white dark:bg-neutral-950 min-h-0">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-neutral-400 dark:text-neutral-500">
              <svg className="w-16 h-16 mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <p>Your basket is empty</p>
            </div>
          ) : (
            (() => {
              const groups: Array<{
                canonicalName: string;
                canonicalBrand: string;
                items: CartItem[];
              }> = [];
              for (const item of items) {
                const itemName = normalizeNameForCompare(item.product.name);
                const itemBrand = normalizeNameForCompare(item.product.brand || '');

                const target = groups.find((g) => {
                  const gName = normalizeNameForCompare(g.canonicalName);
                  const sim = tokenSimilarity(itemName, gName);
                  if (sim < 0.72) return false;
                  const gBrand = normalizeNameForCompare(g.canonicalBrand || '');
                  if (itemBrand && gBrand && itemBrand !== gBrand) return false;
                  return true;
                });

                if (!target) {
                  groups.push({
                    canonicalName: item.product.name,
                    canonicalBrand: item.product.brand || '',
                    items: [item],
                  });
                } else {
                  target.items.push(item);
                }
              }

              return groups.map((group) => {
                const brandPrefix = group.canonicalBrand ? `${group.canonicalBrand} · ` : '';
                const variantQtys = Array.from(
                  new Set(group.items.map((it) => normalizeQtyForCompare(it.product.quantity)))
                ).filter(Boolean);

                return (
                  <div key={`group-${group.canonicalName}`} className="space-y-2">
                    <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-800 dark:bg-neutral-900">
                      <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                        {brandPrefix}
                        {group.canonicalName}
                      </h4>
                      {variantQtys.length > 0 && (
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                          Variants:{' '}
                          {variantQtys
                            .map((q) => group.items.find((it) => normalizeQtyForCompare(it.product.quantity) === q)?.product.quantity || q)
                            .join(' · ')}
                        </p>
                      )}
                    </div>

                    {group.items.map((item) => (
                      <div
                        key={`${item.product.id}-${item.selectedPlatform}`}
                        className="flex gap-4 rounded-lg border border-neutral-200 bg-neutral-50 p-3 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
                      >
                        <img
                          src={item.product.imageUrl}
                          alt={item.product.name}
                          className="h-20 w-20 rounded object-contain bg-white dark:bg-neutral-950"
                        />
                        <div className="min-w-0 flex-1">
                          <h4 className="truncate text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                            {group.canonicalName}
                          </h4>
                          <p className="mb-1 text-xs text-neutral-500 dark:text-neutral-400">
                            {item.product.quantity} · Cart: {item.selectedPlatform}
                          </p>
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="text-sm font-bold text-neutral-900 dark:text-white">
                              ₹{linePrice(item)}
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => openLink(item)}
                                className="flex items-center gap-0.5 text-[10px] font-bold text-indigo-600 hover:underline dark:text-indigo-400"
                              >
                                Open {item.selectedPlatform}
                                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                              </button>
                              <div className="flex items-center gap-0 rounded-lg border border-neutral-200 bg-white px-2 py-1 dark:border-neutral-700 dark:bg-neutral-800">
                                <button
                                  onClick={() => onUpdateQuantity(item.product.id, item.selectedPlatform, -1)}
                                  className="flex h-6 w-6 items-center justify-center text-xl font-bold text-neutral-600 dark:text-neutral-300"
                                >
                                  -
                                </button>
                                <span className="w-4 text-center text-sm font-bold text-neutral-900 dark:text-white">{item.quantity}</span>
                                <button
                                  onClick={() => onUpdateQuantity(item.product.id, item.selectedPlatform, 1)}
                                  className="flex h-6 w-6 items-center justify-center text-xl font-bold text-neutral-600 dark:text-neutral-300"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              });
            })()
          )}

          {items.length > 0 && (
            <div className="mt-4 rounded-xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-900/80">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-yellow-400/90 text-neutral-900">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-bold text-neutral-900 dark:text-white">Smart Buy Cart</h3>
                    <span className="rounded-full bg-neutral-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300">
                      Soon
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">
                    One-tap optimized checkout is on the way. For now, use <strong>Open</strong> on each line to buy on the app you chose.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="shrink-0 border-t border-neutral-200 bg-white p-4 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] dark:border-neutral-800 dark:bg-neutral-950 dark:shadow-[0_-4px_10px_rgba(0,0,0,0.35)]">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <span className="block text-xs font-medium text-neutral-500 dark:text-neutral-400">Total</span>
              <span className="text-xl font-black text-neutral-900 dark:text-white">₹{totalWithDelivery.toFixed(2)}</span>
            </div>
            {cheapestPlatform && (
              <div className="text-right">
                <span className="block text-[10px] font-bold uppercase text-green-600 dark:text-green-400">Best Single Price</span>
                <span className="text-sm font-bold text-neutral-800 dark:text-neutral-200">₹{cheapestPlatformTotalWithDelivery.toFixed(2)}</span>
              </div>
            )}
          </div>
          <div className="space-y-2">
            {showCheckoutMessage && (
              <div className="rounded-lg border border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/40 p-3 text-sm">
                <p className="font-medium text-amber-900 dark:text-amber-100">
                  This only works in app — coming soon.
                </p>
                <p className="mt-1 text-amber-800 dark:text-amber-200/90">
                  Till then, use the &quot;Open&quot; links above each item to add products to your cart in the respective app.
                </p>
                <button
                  type="button"
                  onClick={() => setShowCheckoutMessage(false)}
                  className="mt-2 text-xs font-semibold text-amber-700 dark:text-amber-300 underline"
                >
                  Dismiss
                </button>
              </div>
            )}
            <div className="rounded-lg border border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900/30 p-2">
              {deliveryFee === 0 ? (
                <p className="text-center text-[10px] font-medium text-neutral-800 dark:text-neutral-200">
                  Delivery charge removed (free over ₹{FREE_DELIVERY_THRESHOLD})
                </p>
              ) : (
                <p className="text-center text-[10px] font-medium text-neutral-800 dark:text-neutral-200">
                  Delivery: ₹{DELIVERY_FEE} · Add ₹{Math.max(0, Math.ceil(FREE_DELIVERY_THRESHOLD - groceryTotal))} more to remove delivery charge
                </p>
              )}
            </div>
            <button
              type="button"
              disabled={items.length === 0}
              onClick={() => items.length > 0 && setShowCheckoutMessage(true)}
              className="flex w-full flex-col items-center justify-center gap-1 rounded-xl bg-yellow-400 py-4 font-bold text-neutral-900 transition-colors hover:bg-yellow-500 disabled:bg-neutral-200 disabled:text-neutral-400 dark:disabled:bg-neutral-800 dark:disabled:text-neutral-500"
            >
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span>Browse checkout on {cheapestPlatform?.platform || 'Platform'}</span>
              </div>
              {cheapestPlatform && (
                <span className="text-[10px] font-medium opacity-70 flex items-center gap-1">
                  <img src={PLATFORM_ICONS[cheapestPlatform.platform]} alt="" className="w-3 h-3 rounded-full" />
                  Cheapest single-app total: ₹{cheapestPlatform.total.toFixed(2)}
                </span>
              )}
            </button>
            <p className="text-center text-[10px] font-medium text-neutral-500 dark:text-neutral-400 px-1">
              Checkout in app — coming soon. Use the &quot;Open&quot; links above to add items.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartDrawer;
