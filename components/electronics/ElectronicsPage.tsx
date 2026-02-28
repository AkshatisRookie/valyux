import React, { useState, useEffect, useCallback } from 'react';
import ElectronicsResults from './ElectronicsResults';
import ElectronicsLoading from './ElectronicsLoading';
import ElectronicsError from './ElectronicsError';
import { useElectronicsSearch, useFeaturedProducts } from './hooks';
import { DEFAULT_FILTERS } from './types';
import type { Filters, SortOption } from './types';
import { STATIC_ELECTRONICS_PRODUCTS } from './staticProducts';

const STYLE_ID = 'valyux-electronics';
const ANIMATION_CSS = `.no-scrollbar::-webkit-scrollbar{display:none}.no-scrollbar{-ms-overflow-style:none;scrollbar-width:none}`;

const QUICK_SUGGESTIONS = [
  'iPhone 15', 'MacBook Air', 'Sony Headphones', 'Samsung TV',
  'Apple Watch', 'PS5', 'boAt Earbuds', 'iPad Air',
];

interface ElectronicsPageProps {
  pincode: string;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onAddToCart?: (item: { productId: string; name: string; imageUrl: string; brand: string; retailer: 'Amazon' | 'Flipkart'; price: number; productUrl: string }) => void;
}

const ElectronicsPage: React.FC<ElectronicsPageProps> = ({
  pincode,
  searchQuery,
  onSearchChange,
  onAddToCart,
}) => {
  useEffect(() => {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = ANIMATION_CSS;
    document.head.appendChild(style);
    return () => { document.getElementById(STYLE_ID)?.remove(); };
  }, []);

  const [filters, setFilters] = useState<Filters>({ ...DEFAULT_FILTERS });
  const [sort, setSort] = useState<SortOption>('relevance');

  const { results, isLoading, error, hasSearched } = useElectronicsSearch(
    searchQuery,
    filters,
    sort,
    pincode,
  );

  const filteredResults = useFeaturedProducts(results, filters, sort);

  const handleRetry = useCallback(() => {
    onSearchChange(searchQuery + ' ');
    setTimeout(() => onSearchChange(searchQuery.trim()), 50);
  }, [searchQuery, onSearchChange]);

  const showResults = hasSearched && !isLoading && !error && filteredResults.length > 0;
  const showEmpty = hasSearched && !isLoading && !error && results.length === 0;
  const showLoading = isLoading;
  const showError = !!error && !isLoading;
  const showLanding = !hasSearched && !isLoading && !error;
  const showStatic = showLanding && searchQuery.trim().length < 2;

  return (
    <>
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-neutral-900 dark:text-white">Compare prices</h1>
        <p className="text-sm text-neutral-500 mt-0.5">Pincode {pincode} · Amazon, Flipkart</p>
      </div>

      <div className="mb-6 overflow-x-auto pb-2 -mx-4 px-4 no-scrollbar">
        <div className="flex gap-2">
          {QUICK_SUGGESTIONS.map(s => (
            <button
              key={s}
              onClick={() => onSearchChange(s)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                searchQuery.trim() === s
                  ? 'bg-yellow-400 text-neutral-900'
                  : 'bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {searchQuery.trim().length >= 2 && (
        <div className="mb-4 text-sm text-neutral-500">
          {isLoading && <span>Searching...</span>}
          {!isLoading && filteredResults.length > 0 && <span>{filteredResults.length} results</span>}
          {error && !isLoading && <span className="text-red-600 dark:text-red-400">{error}</span>}
        </div>
      )}

      {showStatic && <ElectronicsResults products={STATIC_ELECTRONICS_PRODUCTS} onAddToCart={onAddToCart} />}

      {showResults && <ElectronicsResults products={filteredResults} onAddToCart={onAddToCart} />}

      {showLoading && filteredResults.length === 0 && !showStatic && <ElectronicsLoading />}

      {showError && <ElectronicsError message={error ?? undefined} onRetry={handleRetry} />}

      {!isLoading && filteredResults.length === 0 && !showError && !showStatic && (
        <div className="text-center py-16">
          <p className="text-neutral-500 dark:text-neutral-400 text-sm">
            {searchQuery.trim().length >= 2
              ? 'No results. Try "iPhone", "laptop", or "headphones".'
              : 'Search above to compare prices.'}
          </p>
          {searchQuery.trim().length >= 2 && (
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {QUICK_SUGGESTIONS.slice(0, 4).map(s => (
                <button
                  key={s}
                  onClick={() => onSearchChange(s)}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 hover:bg-yellow-400 hover:text-neutral-900"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
          {searchQuery.trim().length >= 2 && (
            <button
              onClick={() => onSearchChange('')}
              className="mt-4 text-sm font-medium text-yellow-600 dark:text-yellow-400"
            >
              Clear
            </button>
          )}
        </div>
      )}

      {(showResults || showLanding) && (
        <p className="text-center text-xs text-neutral-500 mt-4">Prices indicative. We may earn a commission.</p>
      )}
    </>
  );
};

export default ElectronicsPage;
