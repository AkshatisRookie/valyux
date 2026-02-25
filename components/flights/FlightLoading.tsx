import React from 'react';

const FlightLoading: React.FC = () => (
  <div className="space-y-3">
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i}
        className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5
                   animate-pulse"
        style={{ animationDelay: `${i * 100}ms` }}>
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-10 h-10 rounded-xl fl-shimmer" />
            <div className="space-y-1.5">
              <div className="w-16 h-3 rounded fl-shimmer" />
              <div className="w-12 h-2 rounded fl-shimmer" />
            </div>
          </div>
          <div className="flex-1 flex items-center gap-3">
            <div className="w-12 h-6 rounded fl-shimmer" />
            <div className="flex-1 h-[2px] fl-shimmer rounded-full" />
            <div className="w-12 h-6 rounded fl-shimmer" />
          </div>
          <div className="flex sm:flex-col items-center sm:items-end gap-2">
            <div className="w-20 h-3 rounded-full fl-shimmer" />
            <div className="w-16 h-7 rounded fl-shimmer" />
            <div className="w-14 h-3 rounded fl-shimmer" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

export default FlightLoading;
