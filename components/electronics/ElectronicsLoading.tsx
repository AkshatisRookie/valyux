import React from 'react';

const ElectronicsLoading: React.FC = () => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
          <div className="aspect-[4/3] bg-neutral-200 dark:bg-neutral-700" />
          <div className="p-4 space-y-3">
            <div className="h-3 w-20 rounded bg-neutral-200 dark:bg-neutral-700" />
            <div className="h-4 w-full rounded bg-neutral-200 dark:bg-neutral-700" />
            <div className="h-10 rounded bg-neutral-200 dark:bg-neutral-700" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default ElectronicsLoading;
