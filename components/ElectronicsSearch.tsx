
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ElectronicsProduct, ElectronicsRetailer } from '../types';
import { ELECTRONICS_PRODUCTS } from '../constants';
import { RETAILER_CONFIG } from '../config/electronicsConfig';
import { useDebounce } from '../utils/useDebounce';

/** Featured product IDs shown on the home page before any search */
const FEATURED_IDS = ['e1', 'e5', 'e8', 'e11', 'e14', 'e18', 'e3', 'e9', 'e13'];

/**
 * Simulates an API search call. In production, replace with real API calls
 * to Amazon, Flipkart, Croma, etc.
 */
async function searchElectronics(query: string): Promise<ElectronicsProduct[]> {
  // TODO: Replace with real API when ready — remove hardcoded data and fetch directly
  await new Promise(resolve => setTimeout(resolve, 600 + Math.random() * 400));
  const q = query.toLowerCase().trim();
  if (!q) return [];
  return ELECTRONICS_PRODUCTS.filter(p =>
    p.name.toLowerCase().includes(q) ||
    p.brand.toLowerCase().includes(q) ||
    p.category.toLowerCase().includes(q)
  );
}

const ElectronicsSearch: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ElectronicsProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const debouncedQuery = useDebounce(query, 500);

  const featuredProducts = useMemo(
    () => ELECTRONICS_PRODUCTS.filter(p => FEATURED_IDS.includes(p.id)),
    []
  );

  const performSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      setHasSearched(false);
      setError(null);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const data = await searchElectronics(q);
      setResults(data);
      setHasSearched(true);
    } catch {
      setError('Something went wrong while fetching results. Please try again.');
      setHasSearched(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    performSearch(debouncedQuery);
  }, [debouncedQuery, performSearch]);

  const handleBuyNow = (productId: string, retailer: ElectronicsRetailer, url: string, affiliateUrl?: string) => {
    const config = RETAILER_CONFIG[retailer];

    // Priority 1: Per-product EarnKaro Profit Link (best — goes to exact product)
    if (affiliateUrl) {
      window.open(affiliateUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    // Priority 2: General retailer affiliate link (tracks the click, but lands on homepage)
    if (config.affiliateUrl) {
      window.open(config.affiliateUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    // Priority 3: Direct product search URL (no affiliate tracking)
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const getBestDealRetailer = (product: ElectronicsProduct): ElectronicsRetailer => {
    const inStock = product.retailerPrices.filter(rp => rp.inStock);
    if (inStock.length === 0) return product.retailerPrices[0].retailer;
    const sorted = [...inStock].sort((a, b) => a.price - b.price);
    return sorted[0].retailer;
  };

  /** Renders a single product card — shared between featured & search results */
  const renderProductCard = (product: ElectronicsProduct) => {
    const bestDeal = getBestDealRetailer(product);
    return (
      <div key={product.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col hover:shadow-lg transition-shadow group">
        {/* Product Image */}
        <div className="relative aspect-square p-6 bg-gray-50">
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute top-3 left-3 bg-teal-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow">
            {product.category}
          </div>
        </div>

        {/* Product Info */}
        <div className="p-5 flex-1 flex flex-col">
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{product.brand}</div>
          <h3 className="font-bold text-gray-900 text-sm mb-4 line-clamp-2 leading-snug">{product.name}</h3>

          {/* Retailer Price Cards */}
          <div className="space-y-3 mt-auto">
            {product.retailerPrices.map(rp => {
              const isBestDeal = rp.retailer === bestDeal && rp.inStock;
              const config = RETAILER_CONFIG[rp.retailer];
              const discount = Math.round((1 - rp.price / rp.originalPrice) * 100);

              return (
                <div key={rp.retailer} className={`p-3 rounded-xl border relative ${config.colorClasses}`}>
                  {/* Best Deal Badge */}
                  {isBestDeal && (
                    <div className="absolute -top-2.5 right-3 bg-green-500 text-white text-[9px] font-bold px-2.5 py-0.5 rounded-full shadow-md flex items-center gap-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                      Best Deal
                    </div>
                  )}

                  {/* Retailer Header */}
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-2">
                      <img src={config.iconUrl} alt={rp.retailer} className="w-5 h-5 rounded object-contain" />
                      <span className={`text-xs font-bold ${config.colorClasses.split(' ')[0]}`}>{rp.retailer}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs line-through text-gray-400">₹{rp.originalPrice.toLocaleString('en-IN')}</span>
                      <span className="text-lg font-black text-gray-900">₹{rp.price.toLocaleString('en-IN')}</span>
                      {discount > 0 && (
                        <span className="text-[10px] font-bold text-green-600 bg-green-100 px-1.5 py-0.5 rounded">{discount}% off</span>
                      )}
                    </div>
                  </div>

                  {/* Action Button */}
                  <div>
                    <button
                      onClick={() => handleBuyNow(product.id, rp.retailer, rp.productUrl, rp.affiliateUrl)}
                      className="w-full text-center py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 bg-teal-600 text-white hover:bg-teal-700 shadow-sm active:scale-95"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" /></svg>
                      Buy on {rp.retailer}
                    </button>
                  </div>

                  {/* Out of stock indicator */}
                  {!rp.inStock && (
                    <div className="mt-2 text-[10px] font-bold text-red-500 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                      Currently unavailable
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      {/* Hero Banner */}
      <section className="mb-8 rounded-3xl overflow-hidden relative h-48 md:h-64 bg-gradient-to-r from-teal-600 to-cyan-600 flex items-center px-8 md:px-16 shadow-2xl shadow-teal-100">
        <div className="relative z-10 max-w-lg">
          <h1 className="text-3xl md:text-5xl font-black text-white mb-2 leading-tight">Compare Electronics Prices.</h1>
          <p className="text-teal-100 text-sm md:text-lg font-medium">Find the best deals on Amazon & Flipkart. Redirects you to official retailer pages.</p>
          <div className="mt-6 flex items-center gap-3">
            <div className="flex -space-x-3">
              <img src="https://www.amazon.in/favicon.ico" className="w-9 h-9 rounded-full border-2 border-white bg-white shadow-md object-contain p-1" alt="Amazon" title="Amazon" />
              <img src="https://www.flipkart.com/favicon.ico" className="w-9 h-9 rounded-full border-2 border-white bg-white shadow-md object-contain p-1" alt="Flipkart" title="Flipkart" />
            </div>
            <span className="text-white text-xs md:text-sm font-bold">+ Croma & more coming soon</span>
          </div>
        </div>
        <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-20 pointer-events-none">
          <svg viewBox="0 0 200 200" className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
            <path fill="#FFFFFF" d="M39.5,-51.2C52.1,-42.6,64.1,-32.4,68.6,-19.5C73.2,-6.5,70.4,9.2,63.8,22.7C57.2,36.2,46.8,47.5,34.3,55.1C21.7,62.7,7.1,66.6,-7.5,65.3C-22.1,64,-36.7,57.5,-47.4,47.3C-58.2,37,-65.1,23,-67.1,8.2C-69.1,-6.7,-66.2,-22.3,-57.8,-34.1C-49.4,-45.9,-35.5,-53.8,-22,-58.4C-8.5,-63,4.6,-64.2,17,-60.3C29.4,-56.4,26.9,-59.9,39.5,-51.2Z" transform="translate(100 100)" />
          </svg>
        </div>
      </section>

      {/* Search Input */}
      <div className="relative max-w-2xl mx-auto mb-8">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for smartphones, laptops, headphones, TVs..."
          className="w-full bg-white border border-gray-200 rounded-2xl py-4 pl-12 pr-12 text-base shadow-lg shadow-gray-100 focus:ring-2 focus:ring-teal-200 focus:border-teal-300 transition-all outline-none"
        />
        {isLoading && (
          <div className="absolute inset-y-0 right-12 flex items-center">
            <div className="w-5 h-5 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {query && !isLoading && (
          <button
            onClick={() => setQuery('')}
            className="absolute inset-y-0 right-4 flex items-center text-gray-400 hover:text-gray-600"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
              <div className="aspect-square bg-gray-200" />
              <div className="p-5 space-y-3">
                <div className="h-3 bg-gray-200 rounded w-1/4" />
                <div className="h-5 bg-gray-200 rounded w-3/4" />
                <div className="h-20 bg-gray-100 rounded-xl" />
                <div className="h-20 bg-gray-100 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="text-center py-16 bg-red-50 rounded-3xl border-2 border-dashed border-red-200">
          <svg className="w-12 h-12 mx-auto text-red-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <h3 className="text-xl font-bold text-red-800 mb-2">Oops! Something went wrong</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => performSearch(query)}
            className="bg-red-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Home Page — Featured Products (shown before any search) */}
      {!isLoading && !error && !hasSearched && (
        <>
          {/* Quick Search Suggestions */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {['iPhone 15', 'MacBook Air', 'Sony Headphones', 'Samsung TV', 'Apple Watch', 'boAt Earbuds'].map(suggestion => (
              <button
                key={suggestion}
                onClick={() => setQuery(suggestion)}
                className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm font-medium text-gray-600 hover:border-teal-300 hover:text-teal-600 transition-colors shadow-sm"
              >
                {suggestion}
              </button>
            ))}
          </div>

          {/* Featured / Trending Section */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-gray-900">Trending Deals</h2>
              <p className="text-xs text-gray-400 mt-0.5">Popular electronics with the best prices right now</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredProducts.map(renderProductCard)}
          </div>
        </>
      )}

      {/* No Results Found */}
      {!isLoading && !error && hasSearched && results.length === 0 && (
        <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
          <svg className="w-12 h-12 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-xl font-bold text-gray-800 mb-2">No products found</h3>
          <p className="text-gray-500">Try a different search term like "iPhone", "laptop", or "headphones".</p>
          <button onClick={() => setQuery('')} className="mt-4 text-teal-600 font-bold underline underline-offset-4">Clear search</button>
        </div>
      )}

      {/* Results Count */}
      {!isLoading && !error && hasSearched && results.length > 0 && (
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-gray-500 font-medium">
            Found <span className="font-bold text-gray-900">{results.length}</span> product{results.length !== 1 ? 's' : ''} for "<span className="font-bold text-gray-900">{debouncedQuery}</span>"
          </p>
        </div>
      )}

      {/* Search Results Grid */}
      {!isLoading && !error && results.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {results.map(renderProductCard)}
        </div>
      )}

      {/* Subtle Disclosure — reads as helpful info, not a commission statement */}
      {(results.length > 0 || (!hasSearched && featuredProducts.length > 0)) && !isLoading && !error && (
        <p className="text-center text-[10px] text-gray-300 mt-8 font-medium">
          Prices are indicative and may vary. Clicking "Buy" will redirect you to the official retailer page for final pricing and purchase.
        </p>
      )}
    </div>
  );
};

export default ElectronicsSearch;
