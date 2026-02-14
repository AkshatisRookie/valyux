import React, { useState, useEffect, useCallback } from 'react';
import ElectronicsSearchBar from './ElectronicsSearchBar';
import ElectronicsFilters from './ElectronicsFilters';
import ElectronicsSort from './ElectronicsSort';
import ElectronicsResults from './ElectronicsResults';
import ElectronicsLoading from './ElectronicsLoading';
import ElectronicsEmpty from './ElectronicsEmpty';
import ElectronicsError from './ElectronicsError';
import { useElectronicsSearch, useFeaturedProducts } from './hooks';
import { DEFAULT_FILTERS } from './types';
import type { Filters, SortOption } from './types';

/* ================================================================== */
/*  Animation CSS — injected once, supports dark mode                  */
/* ================================================================== */

const STYLE_ID = 'valyux-electronics-anims';

const ANIMATION_CSS = `
@keyframes elecFadeSlideUp {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes elecFadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}
@keyframes elecShimmer {
  0%   { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
.elec-card-enter {
  animation: elecFadeSlideUp 0.45s ease-out both;
}
.elec-fade-in {
  animation: elecFadeIn 0.35s ease-out both;
}
.elec-shimmer {
  background: linear-gradient(90deg, #f0f0f0 25%, #e5e5e5 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: elecShimmer 1.4s ease-in-out infinite;
}
html.dark .elec-shimmer {
  background: linear-gradient(90deg, #1f2937 25%, #374151 50%, #1f2937 75%);
  background-size: 200% 100%;
}
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
@media (prefers-reduced-motion: reduce) {
  .elec-card-enter, .elec-fade-in {
    animation: none !important; opacity: 1 !important; transform: none !important;
  }
  .elec-shimmer { animation: none !important; }
}
`;

/* ================================================================== */
/*  Quick-search suggestion chips                                      */
/* ================================================================== */

const QUICK_SUGGESTIONS = [
  'iPhone 15', 'MacBook Air', 'Sony Headphones', 'Samsung TV',
  'Apple Watch', 'PS5', 'boAt Earbuds', 'iPad Air',
];

/* ================================================================== */
/*  Component                                                          */
/* ================================================================== */

const ElectronicsPage: React.FC = () => {
  /* ── Animation injection ────────────────────────────────────────── */
  useEffect(() => {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = ANIMATION_CSS;
    document.head.appendChild(style);
    return () => { document.getElementById(STYLE_ID)?.remove(); };
  }, []);

  /* ── State ──────────────────────────────────────────────────────── */
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<Filters>({ ...DEFAULT_FILTERS });
  const [sort, setSort] = useState<SortOption>('relevance');

  const { results, isLoading, error, hasSearched } = useElectronicsSearch(query, filters, sort);

  // Featured products NOW respect filters and sort
  const featured = useFeaturedProducts(filters, sort);

  /* ── Handlers ───────────────────────────────────────────────────── */
  const handleClear = useCallback(() => {
    setQuery('');
    setFilters({ ...DEFAULT_FILTERS });
    setSort('relevance');
  }, []);

  const handleSuggestion = useCallback((term: string) => setQuery(term), []);

  const handleRetry = useCallback(() => {
    const q = query;
    setQuery('');
    setTimeout(() => setQuery(q), 50);
  }, [query]);

  /* ── Render flags ───────────────────────────────────────────────── */
  const showLanding = !hasSearched && !isLoading && !error;
  const showResults = hasSearched && !isLoading && !error && results.length > 0;
  const showEmpty   = hasSearched && !isLoading && !error && results.length === 0;
  const showLoading = isLoading;
  const showError   = !!error && !isLoading;

  return (
    <div className="space-y-6">
      {/* ══ Hero strip ════════════════════════════════════════════════ */}
      <section
        className="elec-fade-in rounded-3xl overflow-hidden relative px-8 md:px-14 py-10
                   bg-gradient-to-br from-[#0f1111] via-[#131a22] to-[#1a2744]
                   dark:from-[#0a0d12] dark:via-[#0f1318] dark:to-[#141d2e]
                   flex flex-col items-center text-center shadow-2xl
                   border border-transparent dark:border-gray-800/50"
      >
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-[#ff9900]/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-[#2874f0]/10 rounded-full blur-3xl" />

        <div className="relative z-10 max-w-xl">
          <h1 className="text-2xl md:text-4xl font-black text-white mb-2 leading-tight tracking-tight">
            Compare. Choose. Save.
          </h1>
          <p className="text-gray-400 text-sm md:text-base font-medium mb-5">
            Real-time prices from Amazon &amp; Flipkart — find the best deal instantly.
          </p>
          <div className="flex items-center justify-center gap-3">
            <div className="flex -space-x-2">
              <img src="https://www.amazon.in/favicon.ico"
                   className="w-8 h-8 rounded-full border-2 border-white/20 bg-white p-1 object-contain shadow" alt="Amazon" />
              <img src="https://www.flipkart.com/favicon.ico"
                   className="w-8 h-8 rounded-full border-2 border-white/20 bg-white p-1 object-contain shadow" alt="Flipkart" />
            </div>
            <span className="text-gray-500 text-xs font-bold">+ Croma &amp; more coming soon</span>
          </div>
        </div>
      </section>

      {/* ══ Search bar (with instant fuzzy suggestions) ═══════════════ */}
      <ElectronicsSearchBar value={query} onChange={setQuery} isLoading={isLoading} />

      {/* ══ Filters (work on ALL states now) ══════════════════════════ */}
      <ElectronicsFilters filters={filters} onChange={setFilters} />

      {/* ══ Sort (shown for both landing + search results) ════════════ */}
      {(showResults || (showLanding && featured.length > 0)) && (
        <ElectronicsSort
          value={sort}
          onChange={setSort}
          resultCount={showResults ? results.length : featured.length}
          query={query}
        />
      )}

      {/* ══ Landing — filtered featured products ══════════════════════ */}
      {showLanding && (
        <>
          <div className="elec-fade-in flex flex-wrap justify-center gap-2" style={{ animationDelay: '160ms' }}>
            {QUICK_SUGGESTIONS.map(s => (
              <button key={s} onClick={() => handleSuggestion(s)}
                className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700
                           rounded-full text-sm font-medium text-gray-600 dark:text-gray-300
                           hover:border-gray-400 dark:hover:border-gray-500
                           hover:text-gray-900 dark:hover:text-white
                           transition-all duration-200 shadow-sm hover:shadow active:scale-95">
                {s}
              </button>
            ))}
          </div>

          {featured.length > 0 ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-black text-gray-900 dark:text-gray-100">Trending Deals</h2>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                    Popular electronics with the best prices right now
                  </p>
                </div>
              </div>
              <ElectronicsResults products={featured} />
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-1">No deals match your filters</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Try adjusting your filters to see more products.</p>
              <button onClick={() => setFilters({ ...DEFAULT_FILTERS })}
                className="text-indigo-600 dark:text-indigo-400 font-semibold text-sm hover:underline underline-offset-4">
                Clear all filters
              </button>
            </div>
          )}
        </>
      )}

      {/* ══ Search states ═════════════════════════════════════════════ */}
      {showLoading && <ElectronicsLoading />}
      {showResults && <ElectronicsResults products={results} />}
      {showEmpty   && <ElectronicsEmpty query={query} onClear={handleClear} onSuggestionClick={handleSuggestion} />}
      {showError   && <ElectronicsError message={error ?? undefined} onRetry={handleRetry} />}

      {/* ══ Disclosure ════════════════════════════════════════════════ */}
      {(showResults || (showLanding && featured.length > 0)) && (
        <p className="text-center text-[10px] text-gray-300 dark:text-gray-600 mt-4 font-medium">
          Prices are indicative and may vary. Clicking &ldquo;Buy&rdquo; redirects you to the official retailer page.
          We may earn a commission at no extra cost to you.
        </p>
      )}
    </div>
  );
};

export default ElectronicsPage;
