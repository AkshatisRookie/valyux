import React from 'react';

interface Props {
  hasFilters: boolean;
  onClearFilters: () => void;
}

const FlightEmpty: React.FC<Props> = ({ hasFilters, onClearFilters }) => (
  <div className="text-center py-16 px-6">
    <div className="text-6xl mb-4">
      <svg className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
          d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
      </svg>
    </div>
    <h3 className="text-lg font-black text-gray-900 dark:text-white mb-2">
      {hasFilters ? 'No flights match your filters' : 'No flights found'}
    </h3>
    <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6">
      {hasFilters
        ? 'Try adjusting your filters or search criteria to see more results.'
        : 'Search for flights between two cities to see the best deals across all platforms.'}
    </p>
    {hasFilters && (
      <button onClick={onClearFilters}
        className="px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-sm font-bold
                   shadow-md hover:shadow-lg transition-all">
        Clear all filters
      </button>
    )}
  </div>
);

export default FlightEmpty;
