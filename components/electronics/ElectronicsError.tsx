import React from 'react';

interface Props {
  message?: string;
  onRetry: () => void;
}

const ElectronicsError: React.FC<Props> = ({ message, onRetry }) => {
  return (
    <div className="elec-fade-in text-center py-20 px-6 bg-red-50/60 dark:bg-red-900/10 rounded-3xl
                    border-2 border-dashed border-red-200 dark:border-red-800/40">
      <div className="mx-auto w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-5">
        <svg className="w-8 h-8 text-red-400 dark:text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>

      <h3 className="text-xl font-bold text-red-800 dark:text-red-300 mb-2">Something went wrong</h3>
      <p className="text-red-600 dark:text-red-400 text-sm mb-6 max-w-sm mx-auto">
        {message || 'We couldn\u2019t fetch the latest prices. Please check your connection and try again.'}
      </p>

      <button onClick={onRetry}
        className="inline-flex items-center gap-2 px-6 py-2.5 bg-red-600 text-white font-bold text-sm rounded-xl
                   hover:bg-red-700 active:scale-95 transition-all shadow-sm">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        Try again
      </button>
    </div>
  );
};

export default ElectronicsError;
