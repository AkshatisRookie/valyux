import React, { useState, useMemo } from 'react';
import { CartItem, AIAnalysis, Platform, AppSection, ElectronicsCartItem } from '../types';
import { analyzeCartCheapest } from '../services/geminiService';
import { getPlatformCheckoutUrl, getPlatformSearchUrl } from '../config/affiliateLinks';

interface CartDrawerProps {
  activeSection: AppSection;
  groceryItems: CartItem[];
  electronicsItems: ElectronicsCartItem[];
  onClose: () => void;
  onUpdateGroceryQuantity: (productId: string, platform: string, delta: number) => void;
  onUpdateElectronicsQuantity: (productId: string, retailer: string, delta: number) => void;
}

const PLATFORM_ICONS: Record<Platform, string> = {
  BigBasket: 'https://www.bigbasket.com/favicon.ico',
  Blinkit: 'https://blinkit.com/favicon.ico',
  Instamart: 'https://www.google.com/s2/favicons?domain=swiggy.com&sz=128',
  Jiomart: 'https://www.jiomart.com/favicon.ico',
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
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);

  const items = activeSection === 'grocery' ? groceryItems : electronicsItems;
  const itemCount = activeSection === 'grocery'
    ? groceryItems.reduce((acc, i) => acc + i.quantity, 0)
    : electronicsItems.reduce((acc, i) => acc + i.quantity, 0);

  const platformTotals = useMemo(() => {
    const totals: Record<Platform, number> = {
      BigBasket: 0, Blinkit: 0, Instamart: 0, Jiomart: 0, Zepto: 0,
    };
    groceryItems.forEach(item => {
      (['BigBasket', 'Blinkit', 'Instamart', 'Jiomart', 'Zepto'] as Platform[]).forEach(platform => {
        const priceObj = item.product.platformPrices.find(pp => pp.platform === platform);
        if (priceObj) totals[platform] += priceObj.price * item.quantity;
      });
    });
    return totals;
  }, [groceryItems]);

  const cheapestPlatform = useMemo(() => {
    if (groceryItems.length === 0) return null;
    let minPlatform: Platform = 'BigBasket';
    let minTotal = platformTotals['BigBasket'];
    (Object.keys(platformTotals) as Platform[]).forEach(platform => {
      if (platformTotals[platform] < minTotal) {
        minTotal = platformTotals[platform];
        minPlatform = platform;
      }
    });
    return { platform: minPlatform, total: minTotal };
  }, [platformTotals, groceryItems]);

  const groceryTotal = groceryItems.reduce((acc, item) => {
    const price = item.product.platformPrices.find(pp => pp.platform === item.selectedPlatform)?.price || 0;
    return acc + price * item.quantity;
  }, 0);

  const electronicsTotal = electronicsItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const currentTotal = activeSection === 'grocery' ? groceryTotal : electronicsTotal;

  const handleAIAnalysis = async () => {
    if (groceryItems.length === 0) return;
    setIsAnalyzing(true);
    try {
      const result = await analyzeCartCheapest(groceryItems);
      setAnalysis(result);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGroceryCheckout = () => {
    if (!cheapestPlatform) return;
    const searchQuery = groceryItems.slice(0, 3).map(i => i.product.name).join(' ');
    const url = searchQuery.trim()
      ? getPlatformSearchUrl(cheapestPlatform.platform, searchQuery)
      : getPlatformCheckoutUrl(cheapestPlatform.platform);
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md bg-white dark:bg-gray-900 h-full shadow-2xl flex flex-col transition-colors duration-300">
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-white dark:bg-gray-900 sticky top-0 z-10">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            {activeSection === 'grocery' ? 'Grocery' : 'Electronics'} Cart ({itemCount})
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {activeSection === 'grocery' && (
            <>
              {groceryItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-gray-400 dark:text-gray-600">
                  <svg className="w-16 h-16 mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  <p>Your basket is empty</p>
                </div>
              ) : (
                groceryItems.map(item => (
                  <div
                    key={`${item.product.id}-${item.selectedPlatform}`}
                    className="flex gap-4 bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm"
                  >
                    <img
                      src={item.product.imageUrl}
                      alt={item.product.name}
                      className="w-20 h-20 object-contain bg-gray-50 dark:bg-gray-900 rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">
                        {item.product.name}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        {item.product.quantity} · {item.selectedPlatform}
                      </p>
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="font-bold text-sm text-gray-900 dark:text-white">
                          ₹{item.product.platformPrices.find(p => p.platform === item.selectedPlatform)?.price}
                        </span>
                        <div className="flex items-center gap-2">
                          <a
                            href={getPlatformSearchUrl(item.selectedPlatform, item.product.name)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
                          >
                            Open on {item.selectedPlatform}
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                          <div className="flex items-center gap-0 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 px-2 py-1">
                            <button
                              onClick={() => onUpdateGroceryQuantity(item.product.id, item.selectedPlatform, -1)}
                              className="text-xl font-bold w-6 h-6 flex items-center justify-center text-gray-600 dark:text-gray-300"
                            >
                              -
                            </button>
                            <span className="text-sm font-bold w-4 text-center text-gray-900 dark:text-white">{item.quantity}</span>
                            <button
                              onClick={() => onUpdateGroceryQuantity(item.product.id, item.selectedPlatform, 1)}
                              className="text-xl font-bold w-6 h-6 flex items-center justify-center text-gray-600 dark:text-gray-300"
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

              {groceryItems.length > 0 && !analysis && (
                <button
                  onClick={handleAIAnalysis}
                  disabled={isAnalyzing}
                  className="w-full mt-4 bg-indigo-600 dark:bg-indigo-500 text-white p-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors disabled:opacity-50"
                >
                  {isAnalyzing ? (
                    <>
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Calculating Best Values...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Optimize with AI
                    </>
                  )}
                </button>
              )}

              {analysis && (
                <div className="mt-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/40 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="bg-indigo-600 dark:bg-indigo-500 text-white p-1 rounded">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0012 18.75c-1.03 0-1.959-.44-2.618-1.141l-.548-.547z" />
                      </svg>
                    </div>
                    <h3 className="text-sm font-bold text-indigo-900 dark:text-indigo-300 uppercase">Valyux AI Analysis</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Cheapest Platform ({analysis.cheapestPlatformTotal?.platform ?? '—'})</span>
                      <span className="font-bold text-gray-900 dark:text-white">₹{Number(analysis.cheapestPlatformTotal?.total ?? 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600 dark:text-gray-400 font-bold text-green-700 dark:text-green-400">Optimal Split Strategy</span>
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
              )}
            </>
          )}

          {activeSection === 'electronics' && (
            <>
              {electronicsItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-gray-400 dark:text-gray-600">
                  <svg className="w-16 h-16 mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  <p>Your electronics cart is empty</p>
                </div>
              ) : (
                electronicsItems.map(item => (
                  <div
                    key={`${item.productId}-${item.retailer}`}
                    className="flex gap-4 bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm"
                  >
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-20 h-20 object-contain bg-gray-50 dark:bg-gray-900 rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">{item.name}</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1.5">
                        {RETAILER_ICONS[item.retailer] && (
                          <span className="w-4 h-4 rounded-full shrink-0 overflow-hidden inline-flex items-center justify-center bg-white dark:bg-gray-700 ring-1 ring-gray-200 dark:ring-gray-600">
                            <img src={RETAILER_ICONS[item.retailer]} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          </span>
                        )}
                        {item.brand} · {item.retailer}
                      </p>
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="font-bold text-sm text-gray-900 dark:text-white">₹{item.price}</span>
                        <div className="flex items-center gap-2">
                          <a
                            href={item.productUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
                          >
                            Open on {item.retailer}
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                          <div className="flex items-center gap-0 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 px-2 py-1">
                            <button
                              onClick={() => onUpdateElectronicsQuantity(item.productId, item.retailer, -1)}
                              className="text-xl font-bold w-6 h-6 flex items-center justify-center text-gray-600 dark:text-gray-300"
                            >
                              -
                            </button>
                            <span className="text-sm font-bold w-4 text-center text-gray-900 dark:text-white">{item.quantity}</span>
                            <button
                              onClick={() => onUpdateElectronicsQuantity(item.productId, item.retailer, 1)}
                              className="text-xl font-bold w-6 h-6 flex items-center justify-center text-gray-600 dark:text-gray-300"
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

        <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] dark:shadow-[0_-4px_10px_rgba(0,0,0,0.3)]">
          <div className="flex justify-between items-center mb-4">
            <div>
              <span className="text-gray-500 dark:text-gray-400 font-medium block text-xs">Total</span>
              <span className="text-xl font-black text-gray-900 dark:text-white">₹{currentTotal.toFixed(2)}</span>
            </div>
            {activeSection === 'grocery' && cheapestPlatform && (
              <div className="text-right">
                <span className="text-green-600 dark:text-green-400 font-bold block text-[10px] uppercase">Best Single Price</span>
                <span className="text-sm font-bold text-gray-800 dark:text-gray-200">₹{cheapestPlatform.total.toFixed(2)}</span>
              </div>
            )}
          </div>
          {activeSection === 'grocery' ? (
            <button
              disabled={groceryItems.length === 0}
              onClick={handleGroceryCheckout}
              className="w-full bg-yellow-400 hover:bg-yellow-500 text-neutral-900 py-4 rounded-xl font-bold flex flex-col items-center justify-center gap-1 transition-colors disabled:bg-gray-200 disabled:text-gray-400"
            >
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span>Checkout on {cheapestPlatform?.platform || 'Platform'}</span>
              </div>
              {cheapestPlatform && (
                <span className="text-[10px] font-medium opacity-70 flex items-center gap-1">
                  <img src={PLATFORM_ICONS[cheapestPlatform.platform]} alt="" className="w-3 h-3 rounded-full" />
                  Cheapest total: ₹{cheapestPlatform.total.toFixed(2)}
                </span>
              )}
            </button>
          ) : (
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              Open each item link above to buy on the retailer site.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CartDrawer;
