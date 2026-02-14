import React from 'react';

const ElectronicsLoading: React.FC = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i}
          className="bg-white dark:bg-gray-800/90 rounded-2xl border border-gray-100 dark:border-gray-700/60 overflow-hidden"
          style={{ animationDelay: `${i * 80}ms` }}>
          <div className="aspect-square elec-shimmer" />
          <div className="p-5 space-y-3">
            <div className="h-2.5 w-16 rounded-full elec-shimmer" />
            <div className="h-4 w-full rounded-full elec-shimmer" />
            <div className="h-4 w-3/4 rounded-full elec-shimmer" />
            <div className="h-px w-full rounded bg-gray-200 dark:bg-gray-700 my-3" />
            <div className="h-28 rounded-xl elec-shimmer" />
            <div className="h-28 rounded-xl elec-shimmer" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default ElectronicsLoading;
