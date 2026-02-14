import React from 'react';
import type { SortOption } from './types';

interface Props {
  value: SortOption;
  onChange: (s: SortOption) => void;
  resultCount: number;
  query: string;
}

const OPTIONS: { id: SortOption; label: string }[] = [
  { id: 'relevance',  label: 'Relevance' },
  { id: 'price-low',  label: 'Price: Low \u2192 High' },
  { id: 'price-high', label: 'Price: High \u2192 Low' },
  { id: 'discount',   label: 'Best Discount' },
];

const ElectronicsSort: React.FC<Props> = ({ value, onChange, resultCount, query }) => {
  return (
    <div className="elec-fade-in flex flex-col sm:flex-row sm:items-center justify-between gap-3"
         style={{ animationDelay: '120ms' }}>
      <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
        {resultCount > 0 && (
          <>
            Showing <span className="font-bold text-gray-900 dark:text-gray-100">{resultCount}</span>{' '}
            result{resultCount !== 1 ? 's' : ''}
            {query && (
              <> for &ldquo;<span className="font-bold text-gray-900 dark:text-gray-100">{query}</span>&rdquo;</>
            )}
          </>
        )}
      </p>

      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
        {OPTIONS.map(o => (
          <button key={o.id} onClick={() => onChange(o.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-200
              ${value === o.id
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}>
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ElectronicsSort;
