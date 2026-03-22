import React from 'react';

interface ComingSoonPlaceholderProps {
  title: string;
  description?: string;
}

/**
 * Shown when Electronics / Flights are gated. Full page components remain in App.tsx behind FEATURE flags.
 */
const ComingSoonPlaceholder: React.FC<ComingSoonPlaceholderProps> = ({
  title,
  description = 'We are building something great. Check back soon.',
}) => (
  <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
    <div className="mb-4 rounded-2xl bg-yellow-100 dark:bg-yellow-900/30 p-4">
      <svg className="w-12 h-12 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </div>
    <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">{title}</h2>
    <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-sm">{description}</p>
    <span className="mt-6 inline-flex items-center rounded-full bg-neutral-100 dark:bg-neutral-800 px-3 py-1 text-xs font-semibold text-neutral-600 dark:text-neutral-400">
      Coming soon
    </span>
  </div>
);

export default ComingSoonPlaceholder;
