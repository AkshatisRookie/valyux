import React from 'react';
import { CATEGORIES, DEFAULT_FILTERS } from './types';
import type { Filters, Category, Retailer } from './types';

interface Props {
  filters: Filters;
  onChange: (f: Filters) => void;
}

const RETAILER_OPTIONS: { id: Retailer; label: string; icon: string }[] = [
  { id: 'Amazon',   label: 'Amazon',   icon: 'https://www.amazon.in/favicon.ico' },
  { id: 'Flipkart', label: 'Flipkart', icon: 'https://www.flipkart.com/favicon.ico' },
];

const CAT_ICONS: Record<string, string> = {
  All:         'M4 6h16M4 12h16M4 18h16',
  Smartphones: 'M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z',
  Laptops:     'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  Audio:       'M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z',
  TVs:         'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  Wearables:   'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  Tablets:     'M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z',
  Gaming:      'M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z',
};

const ElectronicsFilters: React.FC<Props> = ({ filters, onChange }) => {
  const hasActive = filters.category !== 'All' || filters.retailers.length > 0 || filters.inStockOnly;

  const setCategory = (c: Category) => onChange({ ...filters, category: c });

  const toggleRetailer = (r: Retailer) => {
    const next = filters.retailers.includes(r)
      ? filters.retailers.filter(x => x !== r)
      : [...filters.retailers, r];
    onChange({ ...filters, retailers: next });
  };

  const toggleInStock = () => onChange({ ...filters, inStockOnly: !filters.inStockOnly });
  const clearAll = () => onChange({ ...DEFAULT_FILTERS });

  return (
    <div className="elec-fade-in space-y-4" style={{ animationDelay: '80ms' }}>
      {/* Category chips */}
      <div className="overflow-x-auto pb-1 -mx-1 no-scrollbar">
        <div className="flex gap-2 px-1">
          {CATEGORIES.map(cat => {
            const active = filters.category === cat;
            return (
              <button key={cat} onClick={() => setCategory(cat)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap
                           transition-all duration-200 border
                  ${active
                    ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 border-gray-900 dark:border-gray-100 shadow-md'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}>
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={CAT_ICONS[cat] || CAT_ICONS.All} />
                </svg>
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Second row */}
      <div className="flex flex-wrap items-center gap-2">
        {RETAILER_OPTIONS.map(r => {
          const active = filters.retailers.includes(r.id);
          return (
            <button key={r.id} onClick={() => toggleRetailer(r.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold
                         transition-all duration-200 border
                ${active
                  ? 'bg-indigo-600 dark:bg-indigo-500 text-white border-indigo-600 dark:border-indigo-500'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500'
                }`}>
              <img src={r.icon} alt={r.label} className="w-3.5 h-3.5 rounded" />
              {r.label} only
            </button>
          );
        })}

        <button onClick={toggleInStock}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold
                     transition-all duration-200 border
            ${filters.inStockOnly
              ? 'bg-emerald-600 dark:bg-emerald-500 text-white border-emerald-600 dark:border-emerald-500'
              : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500'
            }`}>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
          In Stock
        </button>

        {hasActive && (
          <button onClick={clearAll}
            className="ml-1 text-xs font-semibold text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300
                       transition-colors underline underline-offset-2">
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
};

export default ElectronicsFilters;
