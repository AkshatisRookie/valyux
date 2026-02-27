import React from 'react';

interface Props {
  query: string;
  onClear: () => void;
  onSuggestionClick: (term: string) => void;
}

const SUGGESTIONS = ['iPhone 15', 'MacBook Air', 'Sony Headphones', 'Samsung TV', 'PS5'];

const ElectronicsEmpty: React.FC<Props> = ({ query, onClear, onSuggestionClick }) => {
  return (
    <div className="text-center py-12">
      <p className="text-neutral-600 dark:text-neutral-400 font-medium mb-1">No results for &ldquo;{query}&rdquo;</p>
      <p className="text-sm text-neutral-500 mb-6">Try another search or pick below.</p>
      <div className="flex flex-wrap justify-center gap-2 mb-6">
        {SUGGESTIONS.map(s => (
          <button
            key={s}
            onClick={() => onSuggestionClick(s)}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 hover:bg-yellow-400 hover:text-neutral-900"
          >
            {s}
          </button>
        ))}
      </div>
      <button onClick={onClear} className="text-sm font-medium text-yellow-600 dark:text-yellow-400 hover:underline">
        Clear search
      </button>
    </div>
  );
};

export default ElectronicsEmpty;
