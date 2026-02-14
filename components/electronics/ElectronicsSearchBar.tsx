import React from 'react';
import { useCyclingPlaceholder } from './hooks';

interface Props {
  value: string;
  onChange: (v: string) => void;
  isLoading: boolean;
}

const ElectronicsSearchBar: React.FC<Props> = ({ value, onChange, isLoading }) => {
  const placeholder = useCyclingPlaceholder(3000);

  return (
    <div className="elec-fade-in relative w-full max-w-2xl mx-auto">
      <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
        <svg className="w-5 h-5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label="Search electronics"
        className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl
                   py-4 pl-12 pr-14 text-base text-gray-900 dark:text-gray-100
                   shadow-lg shadow-gray-100/80 dark:shadow-black/20
                   focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800 focus:border-indigo-300 dark:focus:border-indigo-600
                   transition-all duration-200 outline-none
                   placeholder:text-gray-400 dark:placeholder:text-gray-500"
      />

      {isLoading && (
        <div className="absolute inset-y-0 right-12 flex items-center">
          <div className="w-5 h-5 border-2 border-indigo-400 dark:border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {value && !isLoading && (
        <button onClick={() => onChange('')} aria-label="Clear search"
          className="absolute inset-y-0 right-4 flex items-center text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default ElectronicsSearchBar;
