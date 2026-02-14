import React from 'react';

interface Props {
  query: string;
  onClear: () => void;
  onSuggestionClick: (term: string) => void;
}

const SUGGESTIONS = ['iPhone 15', 'MacBook Air', 'Sony Headphones', 'Samsung TV', 'PS5'];

const ElectronicsEmpty: React.FC<Props> = ({ query, onClear, onSuggestionClick }) => {
  return (
    <div className="elec-fade-in text-center py-20 px-6">
      <div className="mx-auto w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-6">
        <svg className="w-10 h-10 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">
        No results for &ldquo;{query}&rdquo;
      </h3>
      <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 max-w-md mx-auto">
        We couldn&rsquo;t find matching electronics. Try a different keyword or browse one of these popular searches.
      </p>

      <div className="flex flex-wrap justify-center gap-2 mb-6">
        {SUGGESTIONS.map(s => (
          <button key={s} onClick={() => onSuggestionClick(s)}
            className="px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full
                       text-sm font-medium text-gray-600 dark:text-gray-400
                       hover:border-gray-400 dark:hover:border-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
            {s}
          </button>
        ))}
      </div>

      <button onClick={onClear}
        className="text-indigo-600 dark:text-indigo-400 font-semibold text-sm hover:underline underline-offset-4">
        Clear search
      </button>
    </div>
  );
};

export default ElectronicsEmpty;
