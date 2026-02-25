import React, { useState, useEffect, useRef } from 'react';
import FlightSearchForm from './FlightSearchForm';
import FlightResults from './FlightResults';
import FlightFilters from './FlightFilters';
import FlightSort from './FlightSort';
import FlightLoading from './FlightLoading';
import FlightEmpty from './FlightEmpty';
import CloudScrollTop from './CloudScrollTop';
import { useFlightSearch, useAvailableAirlines, useAvailablePlatforms, usePriceRange, useActiveFlightFiltersCount } from './hooks';
import { DEFAULT_FLIGHT_FILTERS } from './types';
import type { FlightFilters as FiltersType, FlightSortOption, FlightSearchParams } from './types';

/* ================================================================== */
/*  Takeoff animation overlay                                          */
/* ================================================================== */

const TakeoffOverlay: React.FC<{ visible: boolean }> = ({ visible }) => {
  if (!visible) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gradient-to-br from-sky-900 via-sky-800 to-indigo-900
                    fl-takeoff-overlay">
      {/* Clouds */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <div key={i}
            className="absolute bg-white/10 rounded-full fl-cloud-drift"
            style={{
              width: `${120 + i * 60}px`,
              height: `${40 + i * 20}px`,
              top: `${15 + i * 12}%`,
              left: `-${150 + i * 40}px`,
              animationDelay: `${i * 200}ms`,
              animationDuration: `${1.5 + i * 0.3}s`,
            }}
          />
        ))}
      </div>

      {/* Airplane */}
      <div className="fl-plane-takeoff relative z-10">
        <svg className="w-20 h-20 text-white drop-shadow-2xl" fill="currentColor" viewBox="0 0 24 24">
          <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
        </svg>
      </div>

      {/* Text */}
      <div className="absolute bottom-1/4 text-center fl-fade-in-up" style={{ animationDelay: '400ms' }}>
        <div className="text-white text-lg font-black tracking-wide">Finding the best flights</div>
        <div className="text-sky-300 text-sm mt-1 font-medium">Comparing across all platforms...</div>
      </div>
    </div>
  );
};

/* ================================================================== */
/*  SmartFare explainer                                                */
/* ================================================================== */

const SmartFareExplainer: React.FC = () => (
  <div className="bg-gradient-to-r from-sky-50 to-indigo-50 dark:from-sky-900/20 dark:to-indigo-900/20
                  border border-sky-200 dark:border-sky-800 rounded-2xl p-5 fl-fade-in">
    <div className="flex items-start gap-3">
      <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-800 flex items-center justify-center shrink-0">
        <span className="text-lg font-black text-sky-600 dark:text-sky-400">✦</span>
      </div>
      <div>
        <h3 className="text-sm font-black text-gray-900 dark:text-white mb-1">Valyux SmartFare</h3>
        <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
          Our algorithm ranks flights by overall value — not just price. It considers fare competitiveness,
          travel time, number of stops, schedule convenience, and airline quality to find you the
          best flight, not just the cheapest.
        </p>
      </div>
    </div>
  </div>
);

/* ================================================================== */
/*  CSS animations — injected once                                     */
/* ================================================================== */

const FLIGHT_CSS = `
  @keyframes flFadeSlideUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes flFadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes flFadeInUp {
    from { opacity: 0; transform: translateY(24px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes flShimmer {
    0%   { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
  @keyframes flPlaneTakeoff {
    0%   { transform: translate(0, 0) rotate(-15deg) scale(1); opacity: 1; }
    60%  { transform: translate(100px, -120px) rotate(-25deg) scale(1.2); opacity: 1; }
    100% { transform: translate(250px, -300px) rotate(-30deg) scale(0.6); opacity: 0; }
  }
  @keyframes flCloudDrift {
    0%   { transform: translateX(0); opacity: 0; }
    20%  { opacity: 1; }
    100% { transform: translateX(calc(100vw + 300px)); opacity: 0; }
  }
  @keyframes flOverlayExit {
    0%   { opacity: 1; }
    100% { opacity: 0; }
  }

  .fl-card {
    animation: flFadeSlideUp 0.4s ease-out both;
  }
  .fl-fade-in {
    animation: flFadeIn 0.5s ease-out both;
  }
  .fl-fade-in-up {
    animation: flFadeInUp 0.6s ease-out both;
  }
  .fl-shimmer {
    background: linear-gradient(90deg, #f0f0f0 25%, #e5e5e5 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: flShimmer 1.4s ease-in-out infinite;
  }
  html.dark .fl-shimmer {
    background: linear-gradient(90deg, #1f2937 25%, #374151 50%, #1f2937 75%);
    background-size: 200% 100%;
  }
  .fl-plane-takeoff {
    animation: flPlaneTakeoff 1.8s ease-in-out forwards;
  }
  .fl-cloud-drift {
    animation: flCloudDrift 2s ease-out forwards;
  }
  .fl-takeoff-overlay {
    animation: flOverlayExit 0.5s ease-out 1.6s forwards;
    pointer-events: none;
  }

  @media (prefers-reduced-motion: reduce) {
    .fl-card, .fl-fade-in, .fl-fade-in-up, .fl-plane-takeoff, .fl-cloud-drift, .fl-takeoff-overlay {
      animation: none !important;
    }
  }
`;

/* ================================================================== */
/*  FlightsPage                                                        */
/* ================================================================== */

const FlightsPage: React.FC = () => {
  const [filters, setFilters] = useState<FiltersType>({ ...DEFAULT_FLIGHT_FILTERS });
  const [sort, setSort] = useState<FlightSortOption>('best');
  const [showTakeoff, setShowTakeoff] = useState(false);
  const [showFilters, setShowFilters] = useState(true);
  const resultsRef = useRef<HTMLDivElement>(null);

  const { results, isLoading, hasSearched, search } = useFlightSearch(filters, sort);
  const airlines = useAvailableAirlines(results);
  const platforms = useAvailablePlatforms(results);
  const priceRange = usePriceRange(results);
  const activeFilterCount = useActiveFlightFiltersCount(filters);

  useEffect(() => {
    const tag = document.getElementById('fl-style');
    if (!tag) {
      const s = document.createElement('style');
      s.id = 'fl-style';
      s.textContent = FLIGHT_CSS;
      document.head.appendChild(s);
    }
    return () => { document.getElementById('fl-style')?.remove(); };
  }, []);

  const handleSearch = (params: FlightSearchParams) => {
    setShowTakeoff(true);
    setTimeout(() => {
      search(params);
      setShowTakeoff(false);
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 200);
    }, 2000);
  };

  return (
    <div className="min-h-screen">
      <TakeoffOverlay visible={showTakeoff} />

      {/* ── Hero section ──────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-sky-600 via-sky-700 to-indigo-800
                          dark:from-sky-900 dark:via-indigo-900 dark:to-gray-900">
        {/* Decorative elements */}
        <div className="absolute inset-0">
          <div className="absolute top-10 left-[10%] w-64 h-64 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-[15%] w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl" />
          {/* Subtle grid */}
          <div className="absolute inset-0 opacity-[0.03]"
            style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
          {/* Floating plane */}
          <svg className="absolute top-8 right-[8%] w-24 h-24 text-white/10" fill="currentColor" viewBox="0 0 24 24">
            <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
          </svg>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 lg:px-8 pt-12 pb-10">
          <div className="fl-fade-in-up">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-3 py-1 mb-4">
              <span className="text-sky-200 text-xs font-bold">✦ SmartFare</span>
              <span className="text-white/60 text-xs">Find the best value, not just the cheapest</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-2">
              Compare Flights
            </h1>
            <p className="text-sky-200 text-lg font-medium max-w-xl mb-8">
              Search once, compare across MakeMyTrip, Goibibo, Cleartrip & more.
              Our SmartFare algorithm finds you the best overall deal.
            </p>
          </div>

          {/* Search form */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl dark:shadow-black/40 p-6 fl-fade-in-up"
            style={{ animationDelay: '200ms' }}>
            <FlightSearchForm onSearch={handleSearch} isLoading={isLoading || showTakeoff} />
          </div>
        </div>
      </section>

      {/* ── Results section ───────────────────────────────────────── */}
      <div ref={resultsRef} className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
        {!hasSearched && !isLoading && (
          <div className="space-y-6">
            <SmartFareExplainer />
            <div className="text-center py-16">
              <svg className="w-20 h-20 mx-auto text-gray-200 dark:text-gray-700 mb-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
              </svg>
              <h2 className="text-xl font-black text-gray-900 dark:text-white mb-2">Where do you want to go?</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Enter your departure and destination above to find the best flight deals.
              </p>
            </div>
          </div>
        )}

        {isLoading && <FlightLoading />}

        {hasSearched && !isLoading && (
          <div className="space-y-4">
            {/* Sort bar + filter toggle */}
            <div className="flex items-center gap-3">
              <button onClick={() => setShowFilters(!showFilters)}
                className="lg:hidden flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700
                           bg-white dark:bg-gray-900 text-sm font-bold text-gray-700 dark:text-gray-300 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 010 2H4a1 1 0 01-1-1zm4 6a1 1 0 011-1h8a1 1 0 010 2H8a1 1 0 01-1-1zm4 6a1 1 0 011-1h0a1 1 0 010 2h0a1 1 0 01-1-1z" />
                </svg>
                Filters
                {activeFilterCount > 0 && (
                  <span className="w-5 h-5 rounded-full bg-sky-600 text-white text-[10px] font-black flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </button>
              <div className="flex-1">
                <FlightSort sort={sort} onChange={setSort} resultCount={results.length} />
              </div>
            </div>

            {/* Main layout: filters sidebar + results */}
            <div className="flex gap-6">
              {/* Sidebar filters (desktop always, mobile toggle) */}
              <aside className={`shrink-0 w-72 ${showFilters ? 'block' : 'hidden'} lg:block`}>
                <div className="sticky top-24">
                  <FlightFilters
                    filters={filters}
                    onChange={setFilters}
                    airlines={airlines}
                    platforms={platforms}
                    priceRange={priceRange}
                  />
                </div>
              </aside>

              {/* Results */}
              <div className="flex-1 min-w-0">
                {results.length > 0 ? (
                  <FlightResults results={results} />
                ) : (
                  <FlightEmpty
                    hasFilters={activeFilterCount > 0}
                    onClearFilters={() => setFilters({ ...DEFAULT_FLIGHT_FILTERS })}
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <CloudScrollTop />
    </div>
  );
};

export default FlightsPage;
