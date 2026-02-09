
import React, { useState, useMemo } from 'react';
import { CartItem, AIAnalysis, Platform } from '../types';
import { analyzeCartCheapest } from '../services/geminiService';
import { getPlatformCheckoutUrl, getPlatformSearchUrl } from '../config/affiliateLinks';

interface CartDrawerProps {
  items: CartItem[];
  onClose: () => void;
  onUpdateQuantity: (productId: string, platform: string, delta: number) => void;
}

const PLATFORM_ICONS: Record<Platform, string> = {
  'BigBasket': 'https://www.bigbasket.com/favicon.ico',
  'Blinkit': 'https://blinkit.com/favicon.ico',
  'Instamart': 'https://www.google.com/s2/favicons?domain=swiggy.com&sz=128',
  'Jiomart': 'https://www.jiomart.com/favicon.ico',
  'Zepto': 'https://www.zepto.com/favicon.ico'
};

const CartDrawer: React.FC<CartDrawerProps> = ({ items, onClose, onUpdateQuantity }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);

  // Calculate the cost if we bought everything from each specific platform
  const platformTotals = useMemo(() => {
    const totals: Record<Platform, number> = {
      'BigBasket': 0,
      'Blinkit': 0,
      'Instamart': 0,
      'Jiomart': 0,
      'Zepto': 0
    };

    items.forEach(item => {
      ['BigBasket', 'Blinkit', 'Instamart', 'Jiomart', 'Zepto'].forEach((p) => {
        const platform = p as Platform;
        const priceObj = item.product.platformPrices.find(pp => pp.platform === platform);
        if (priceObj) {
          totals[platform] += priceObj.price * item.quantity;
        }
      });
    });

    return totals;
  }, [items]);

  // Find the overall cheapest platform for this specific basket
  const cheapestPlatform = useMemo(() => {
    if (items.length === 0) return null;
    let minPlatform: Platform = 'BigBasket';
    let minTotal = platformTotals['BigBasket'];

    (Object.keys(platformTotals) as Platform[]).forEach(platform => {
      if (platformTotals[platform] < minTotal) {
        minTotal = platformTotals[platform];
        minPlatform = platform;
      }
    });

    return { platform: minPlatform, total: minTotal };
  }, [platformTotals, items]);

  // Current subtotal based on user's manual selections
  const currentTotal = items.reduce((acc, item) => {
    const price = item.product.platformPrices.find(pp => pp.platform === item.selectedPlatform)?.price || 0;
    return acc + (price * item.quantity);
  }, 0);

  const handleAIAnalysis = async () => {
    if (items.length === 0) return;
    setIsAnalyzing(true);
    try {
      const result = await analyzeCartCheapest(items);
      setAnalysis(result);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCheckout = () => {
    if (!cheapestPlatform) return;
    // Build search query from cart item names so user lands on results and can add easily
    const searchQuery = items.slice(0, 3).map((i) => i.product.name).join(' ');
    const url = searchQuery.trim()
      ? getPlatformSearchUrl(cheapestPlatform.platform, searchQuery)
      : getPlatformCheckoutUrl(cheapestPlatform.platform);
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col">
        <div className="p-4 border-b flex justify-between items-center bg-white sticky top-0 z-10">
          <h2 className="text-lg font-bold">My Shopping Basket ({items.length})</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <svg className="w-16 h-16 mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
              <p>Your basket is empty</p>
            </div>
          ) : (
            items.map((item) => (
              <div key={`${item.product.id}-${item.selectedPlatform}`} className="flex gap-4 bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                <img src={item.product.imageUrl} alt={item.product.name} className="w-20 h-20 object-contain bg-gray-50 rounded" />
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm truncate">{item.product.name}</h4>
                  <p className="text-xs text-gray-500 mb-1">{item.product.quantity} • {item.selectedPlatform}</p>
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="font-bold text-sm">₹{item.product.platformPrices.find(p => p.platform === item.selectedPlatform)?.price}</span>
                    <div className="flex items-center gap-2">
                      <a
                        href={getPlatformSearchUrl(item.selectedPlatform, item.product.name)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] font-bold text-indigo-600 hover:underline flex items-center gap-0.5"
                      >
                        Open on {item.selectedPlatform}
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                      </a>
                      <div className="flex items-center gap-0 border rounded-lg bg-gray-50 px-2 py-1">
                        <button onClick={() => onUpdateQuantity(item.product.id, item.selectedPlatform, -1)} className="text-xl font-bold w-6 h-6 flex items-center justify-center">-</button>
                        <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                        <button onClick={() => onUpdateQuantity(item.product.id, item.selectedPlatform, 1)} className="text-xl font-bold w-6 h-6 flex items-center justify-center">+</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}

          {items.length > 0 && !analysis && (
            <button 
              onClick={handleAIAnalysis}
              disabled={isAnalyzing}
              className="w-full mt-4 bg-indigo-600 text-white p-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {isAnalyzing ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Calculating Best Values...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  Optimize with AI
                </>
              )}
            </button>
          )}

          {analysis && (
            <div className="mt-4 bg-indigo-50 border border-indigo-100 rounded-xl p-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center gap-2 mb-3">
                <div className="bg-indigo-600 text-white p-1 rounded">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0012 18.75c-1.03 0-1.959-.44-2.618-1.141l-.548-.547z" /></svg>
                </div>
                <h3 className="text-sm font-bold text-indigo-900 uppercase">Valyux AI Analysis</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Cheapest Platform ({analysis.cheapestPlatformTotal?.platform ?? '—'})</span>
                  <span className="font-bold">₹{Number(analysis.cheapestPlatformTotal?.total ?? 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600 font-bold text-green-700">Optimal Split Strategy</span>
                  <span className="font-bold text-green-700">₹{Number(analysis.optimalSplitTotal ?? 0).toFixed(2)}</span>
                </div>
                <div className="bg-green-600/10 text-green-700 text-[10px] font-bold px-2 py-1 rounded inline-block">
                  SAVE ₹{Number(analysis.savingsVsHighest ?? 0).toFixed(2)} vs MAX
                </div>
                <p className="text-xs text-indigo-800 italic leading-relaxed mt-2 border-t border-indigo-100 pt-2">
                  "{analysis.recommendation ?? ''}"
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 bg-white border-t border-gray-100 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
          <div className="flex justify-between items-center mb-4">
            <div>
              <span className="text-gray-500 font-medium block text-xs">Basket Total</span>
              <span className="text-xl font-black">₹{currentTotal.toFixed(2)}</span>
            </div>
            {cheapestPlatform && (
              <div className="text-right">
                <span className="text-green-600 font-bold block text-[10px] uppercase">Best Single Price</span>
                <span className="text-sm font-bold text-gray-800">₹{cheapestPlatform.total.toFixed(2)}</span>
              </div>
            )}
          </div>
          <button 
            disabled={items.length === 0}
            onClick={handleCheckout}
            className="w-full bg-black text-white py-4 rounded-xl font-bold flex flex-col items-center justify-center gap-1 hover:bg-gray-800 transition-colors disabled:bg-gray-200 disabled:text-gray-400"
          >
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              <span>Checkout on {cheapestPlatform?.platform || 'Platform'}</span>
            </div>
            {cheapestPlatform && (
              <span className="text-[10px] font-medium opacity-70 flex items-center gap-1">
                <img src={PLATFORM_ICONS[cheapestPlatform.platform]} alt="" className="w-3 h-3 rounded-full" />
                Cheapest available total: ₹{cheapestPlatform.total.toFixed(2)}
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CartDrawer;
