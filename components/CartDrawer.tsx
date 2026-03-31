import React, { useState, useMemo } from 'react';
import { CartItem, AIAnalysis, Platform, AppSection, ElectronicsCartItem } from '../types';
import { usePincode } from '../context/PincodeContext';
import { analyzeCartCheapest } from '../services/geminiService';
import { getPlatformSearchUrl } from '../config/affiliateLinks';

interface CartDrawerProps {
  activeSection: AppSection;
  groceryItems: CartItem[];
  electronicsItems: ElectronicsCartItem[];
  onClose: () => void;
  onUpdateGroceryQuantity: (productId: string, platform: string, delta: number) => void;
  onUpdateElectronicsQuantity: (productId: string, retailer: string, delta: number) => void;
  /** After Smart Cart: apply per-line deeplinks to cheapest platform */
  onApplyGroceryOptimization?: (items: CartItem[]) => void;
}

const PLATFORM_ICONS: Record<Platform, string> = {
  JioMart: 'https://www.jiomart.com/favicon.ico',
  Blinkit: 'https://blinkit.com/favicon.ico',
  Instamart: 'https://www.google.com/s2/favicons?domain=swiggy.com&sz=128',
  Zepto: 'https://www.zepto.com/favicon.ico',
};

/* Direct favicons so logos load on mobile (Google s2/favicons can fail there) */
const RETAILER_ICONS: Record<string, string> = {
  Amazon: 'https://www.amazon.in/favicon.ico',
  Flipkart: 'https://www.flipkart.com/favicon.ico',
};

const CartDrawer: React.FC<CartDrawerProps> = ({
  activeSection,
  groceryItems,
  electronicsItems,
  onClose,
  onUpdateGroceryQuantity,
  onUpdateElectronicsQuantity,
  onApplyGroceryOptimization,
}) => {
  const { openByPlatform } = usePincode();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [showCheckoutMessage, setShowCheckoutMessage] = useState(false);

  // Used to group "same-ish" product names in the cart UI (quantity variants stay separate).
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

  const items = activeSection === 'grocery' ? groceryItems : electronicsItems;
  const itemCount = activeSection === 'grocery'
    ? groceryItems.reduce((acc, i) => acc + i.quantity, 0)
    : electronicsItems.reduce((acc, i) => acc + i.quantity, 0);

  const platformTotals = useMemo(() => {
    const totals: Record<Platform, number> = {
      JioMart: 0, Blinkit: 0, Instamart: 0, Zepto: 0,
    };
    const openPlatforms = (['JioMart', 'Blinkit', 'Instamart', 'Zepto'] as Platform[]).filter(
      (p) => openByPlatform[p] !== false
    );
    groceryItems.forEach(item => {
      openPlatforms.forEach(platform => {
        const priceObj = item.product.platformPrices.find(pp => pp.platform === platform);
        if (priceObj) totals[platform] += priceObj.price * item.quantity;
      });
    });
    return totals;
  }, [groceryItems, openByPlatform]);

  const cheapestPlatform = useMemo(() => {
    if (groceryItems.length === 0) return null;
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
  }, [platformTotals, groceryItems, openByPlatform]);

  const linePrice = (item: CartItem) => {
    if (item.optimizedPlatform) {
      return (
        item.product.platformPrices.find((pp) => pp.platform === item.optimizedPlatform)?.price ??
        item.product.platformPrices.find((pp) => pp.platform === item.selectedPlatform)?.price ??
        0
      );
    }
    return item.product.platformPrices.find((pp) => pp.platform === item.selectedPlatform)?.price || 0;
  };

  const groceryTotal = groceryItems.reduce((acc, item) => acc + linePrice(item) * item.quantity, 0);

  const electronicsTotal = electronicsItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const currentTotal = activeSection === 'grocery' ? groceryTotal : electronicsTotal;
  const FREE_DELIVERY_THRESHOLD = 200;
  const DELIVERY_FEE = 30;
  const deliveryFee = activeSection === 'grocery'
    ? groceryTotal >= FREE_DELIVERY_THRESHOLD
      ? 0
      : DELIVERY_FEE
    : 0;
  const totalWithDelivery = currentTotal + deliveryFee;
  const cheapestPlatformDeliveryFee = cheapestPlatform
    ? cheapestPlatform.total >= FREE_DELIVERY_THRESHOLD
      ? 0
      : DELIVERY_FEE
    : 0;
  const cheapestPlatformTotalWithDelivery = cheapestPlatform
    ? cheapestPlatform.total + cheapestPlatformDeliveryFee
    : 0;

  const handleAIAnalysis = async () => {
    if (groceryItems.length === 0) return;
    setIsAnalyzing(true);
    try {
      const result = await analyzeCartCheapest(groceryItems, openByPlatform);
      setAnalysis(result);
      const optimized: CartItem[] = groceryItems.map((item) => {
        const openPrices = item.product.platformPrices.filter((pp) => openByPlatform[pp.platform] !== false);
        const sorted = [...openPrices].sort((a, b) => a.price - b.price);
        const best = sorted[0];
        if (!best) return item;
        const url = best.productUrl || getPlatformSearchUrl(best.platform, item.product.name);
        return {
          ...item,
          selectedPlatform: best.platform,
          optimizedBuyUrl: url,
          optimizedPlatform: best.platform,
        };
      });
      onApplyGroceryOptimization?.(optimized);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGroceryCheckout = () => {
    if (groceryItems.length === 0) return;
    setShowCheckoutMessage(true);
  };

  const openLink = (item: CartItem) => {
    const url =
      item.optimizedBuyUrl ||
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
            {activeSection === 'grocery' ? 'Grocery' : 'Electronics'} Cart ({itemCount})
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
          {activeSection === 'grocery' && (
            <>
              {groceryItems.length === 0 ? (
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
                  for (const item of groceryItems) {
                    const itemName = normalizeNameForCompare(item.product.name);
                    const itemBrand = normalizeNameForCompare(item.product.brand || '');

                    const target = groups.find((g) => {
                      const gName = normalizeNameForCompare(g.canonicalName);
                      const sim = tokenSimilarity(itemName, gName);
                      if (sim < 0.72) return false;
                      const gBrand = normalizeNameForCompare(g.canonicalBrand || '');
                      if (itemBrand && gBrand && itemBrand !== gBrand) return false;
                      return true; // quantity variants allowed inside the group
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
                                {item.optimizedPlatform && (
                                  <span className="block text-indigo-600 dark:text-indigo-400 font-medium">
                                    Smart link → {item.optimizedPlatform}
                                  </span>
                                )}
                              </p>
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <span className="text-sm font-bold text-neutral-900 dark:text-white">
                                  ₹
                                  {item.optimizedPlatform
                                    ? item.product.platformPrices.find((p) => p.platform === item.optimizedPlatform)?.price ??
                                      item.product.platformPrices.find((p) => p.platform === item.selectedPlatform)?.price
                                    : item.product.platformPrices.find((p) => p.platform === item.selectedPlatform)?.price}
                                </span>
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => openLink(item)}
                                    className="flex items-center gap-0.5 text-[10px] font-bold text-indigo-600 hover:underline dark:text-indigo-400"
                                  >
                                    Open {item.optimizedPlatform || item.selectedPlatform}
                                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                  </button>
                                  <div className="flex items-center gap-0 rounded-lg border border-neutral-200 bg-white px-2 py-1 dark:border-neutral-700 dark:bg-neutral-800">
                                    <button
                                      onClick={() => onUpdateGroceryQuantity(item.product.id, item.selectedPlatform, -1)}
                                      className="flex h-6 w-6 items-center justify-center text-xl font-bold text-neutral-600 dark:text-neutral-300"
                                    >
                                      -
                                    </button>
                                    <span className="w-4 text-center text-sm font-bold text-neutral-900 dark:text-white">{item.quantity}</span>
                                    <button
                                      onClick={() => onUpdateGroceryQuantity(item.product.id, item.selectedPlatform, 1)}
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

              {groceryItems.length > 0 && !analysis && (
                <div className="mt-4 space-y-2">
                  <button
                    type="button"
                    onClick={handleAIAnalysis}
                    disabled={isAnalyzing}
                    className="w-full bg-indigo-600 dark:bg-indigo-500 text-white p-4 rounded-xl font-bold flex flex-col items-center justify-center gap-1 hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors disabled:opacity-50"
                  >
                    {isAnalyzing ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Calculating…
                      </span>
                    ) : (
                      <>
                        <span className="flex items-center gap-2">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          Smart Cart · Optimize with AI
                        </span>
                        <span className="text-[11px] font-normal opacity-90">
                          We&apos;ll attach the best deeplink per item and show next steps.
                        </span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {analysis && (
                <div className="mt-4 space-y-3">
                  <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4 dark:border-indigo-900/50 dark:bg-indigo-950/40">
                    <div className="mb-3 flex items-center gap-2">
                      <div className="rounded bg-indigo-600 p-1 text-white dark:bg-indigo-500">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0012 18.75c-1.03 0-1.959-.44-2.618-1.141l-.548-.547z" />
                        </svg>
                      </div>
                      <h3 className="text-sm font-bold text-indigo-900 dark:text-indigo-300 uppercase">Valyux AI Analysis</h3>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-neutral-600 dark:text-neutral-400">Cheapest Platform ({analysis.cheapestPlatformTotal?.platform ?? '—'})</span>
                        <span className="font-bold text-neutral-900 dark:text-white">₹{Number(analysis.cheapestPlatformTotal?.total ?? 0).toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-bold text-green-700 dark:text-green-400">Optimal Split Strategy</span>
                        <span className="font-bold text-green-700 dark:text-green-400">₹{Number(analysis.optimalSplitTotal ?? 0).toFixed(2)}</span>
                      </div>
                      <div className="bg-green-600/10 dark:bg-green-500/10 text-green-700 dark:text-green-400 text-[10px] font-bold px-2 py-1 rounded inline-block">
                        SAVE ₹{Number(analysis.savingsVsHighest ?? 0).toFixed(2)} vs MAX
                      </div>
                      <p className="text-xs text-indigo-800 dark:text-indigo-300 italic leading-relaxed mt-2 border-t border-indigo-100 dark:border-indigo-800/40 pt-2">
                        &ldquo;{analysis.recommendation ?? ''}&rdquo;
                      </p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-amber-200 bg-amber-50/90 p-4 dark:border-amber-800/50 dark:bg-amber-950/30">
                    <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wide mb-2">
                      Smart Cart — do this next
                    </h4>
                    <ol className="list-decimal list-inside space-y-2 text-xs text-amber-950 dark:text-amber-100/90 leading-relaxed">
                      <li>Each item below now uses a <strong>direct product link</strong> on the cheapest app we found (tap &quot;Open&quot;).</li>
                      <li>Open <strong>one app at a time</strong> and add that line item to the cart there.</li>
                      <li>Repeat for the next item — you may jump between Blinkit, Zepto, etc.</li>
                      <li>Pay inside each partner app when you&apos;re ready (see checkout note below).</li>
                    </ol>
                  </div>
                </div>
              )}
            </>
          )}

          {activeSection === 'electronics' && (
            <>
              {electronicsItems.length === 0 ? (
                <div className="flex h-64 flex-col items-center justify-center text-neutral-400 dark:text-neutral-500">
                  <svg className="mb-4 h-16 w-16 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  <p>Your electronics cart is empty</p>
                </div>
              ) : (
                electronicsItems.map(item => (
                  <div
                    key={`${item.productId}-${item.retailer}`}
                    className="flex gap-4 rounded-lg border border-neutral-200 bg-neutral-50 p-3 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
                  >
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="h-20 w-20 rounded object-contain bg-white dark:bg-neutral-950"
                    />
                    <div className="min-w-0 flex-1">
                      <h4 className="truncate text-sm font-semibold text-neutral-900 dark:text-neutral-100">{item.name}</h4>
                      <p className="mb-1 flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
                        {RETAILER_ICONS[item.retailer] && (
                          <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white ring-1 ring-neutral-200 dark:bg-neutral-700 dark:ring-neutral-600">
                            <img src={RETAILER_ICONS[item.retailer]} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                          </span>
                        )}
                        {item.brand} · {item.retailer}
                      </p>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-sm font-bold text-neutral-900 dark:text-white">₹{item.price}</span>
                        <div className="flex items-center gap-2">
                          <a
                            href={item.productUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-0.5 text-[10px] font-bold text-indigo-600 hover:underline dark:text-indigo-400"
                          >
                            Open on {item.retailer}
                            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                          <div className="flex items-center gap-0 rounded-lg border border-neutral-200 bg-white px-2 py-1 dark:border-neutral-700 dark:bg-neutral-800">
                            <button
                              onClick={() => onUpdateElectronicsQuantity(item.productId, item.retailer, -1)}
                              className="flex h-6 w-6 items-center justify-center text-xl font-bold text-neutral-600 dark:text-neutral-300"
                            >
                              -
                            </button>
                            <span className="w-4 text-center text-sm font-bold text-neutral-900 dark:text-white">{item.quantity}</span>
                            <button
                              onClick={() => onUpdateElectronicsQuantity(item.productId, item.retailer, 1)}
                              className="flex h-6 w-6 items-center justify-center text-xl font-bold text-neutral-600 dark:text-neutral-300"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </>
          )}
        </div>

        <div className="shrink-0 border-t border-neutral-200 bg-white p-4 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] dark:border-neutral-800 dark:bg-neutral-950 dark:shadow-[0_-4px_10px_rgba(0,0,0,0.35)]">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <span className="block text-xs font-medium text-neutral-500 dark:text-neutral-400">Total</span>
              <span className="text-xl font-black text-neutral-900 dark:text-white">₹{totalWithDelivery.toFixed(2)}</span>
            </div>
            {activeSection === 'grocery' && cheapestPlatform && (
              <div className="text-right">
                <span className="block text-[10px] font-bold uppercase text-green-600 dark:text-green-400">Best Single Price</span>
                <span className="text-sm font-bold text-neutral-800 dark:text-neutral-200">₹{cheapestPlatformTotalWithDelivery.toFixed(2)}</span>
              </div>
            )}
          </div>
          {activeSection === 'grocery' ? (
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
              {activeSection === 'grocery' && (
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
              )}
              <button
                type="button"
                disabled={groceryItems.length === 0}
                onClick={handleGroceryCheckout}
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
          ) : (
            <p className="text-center text-xs text-neutral-500 dark:text-neutral-400">
              Open each item link above to buy on the retailer site.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CartDrawer;
