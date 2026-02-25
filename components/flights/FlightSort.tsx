import React from 'react';
import type { FlightSortOption } from './types';

interface Props {
  sort: FlightSortOption;
  onChange: (s: FlightSortOption) => void;
  resultCount: number;
}

const OPTIONS: { value: FlightSortOption; label: string; icon: string }[] = [
  { value: 'best',     label: 'SmartFare',  icon: '✦' },
  { value: 'cheapest', label: 'Cheapest',   icon: '₹' },
  { value: 'fastest',  label: 'Fastest',    icon: '⚡' },
  { value: 'earliest', label: 'Earliest',   icon: '🌅' },
  { value: 'latest',   label: 'Latest',     icon: '🌙' },
];

const FlightSort: React.FC<Props> = ({ sort, onChange, resultCount }) => (
  <div className="flex flex-wrap items-center justify-between gap-3">
    <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">
      {resultCount} flight{resultCount !== 1 ? 's' : ''} found
    </span>
    <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
      {OPTIONS.map(o => (
        <button key={o.value} onClick={() => onChange(o.value)}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1
            ${sort === o.value
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}>
          <span className="text-[10px]">{o.icon}</span>
          {o.label}
        </button>
      ))}
    </div>
  </div>
);

export default FlightSort;
