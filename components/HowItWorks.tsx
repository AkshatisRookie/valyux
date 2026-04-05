import React from 'react';

const STEPS: {
  title: string;
  points: string[];
  icon: React.ReactNode;
}[] = [
  {
    title: 'Lock your area',
    points: ['Enter your pincode or use current location to show live prices and delivery times.'],
    icon: (
      <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.75}
          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
        />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    title: 'Search once, see everyone',
    points: ['Use the search bar and see apps compared side by side in a grid.'],
    icon: (
      <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.75}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
    ),
  },
  {
    title: 'Buy on the winner',
    points: ['Use Open and complete checkout in the partner app you trust.'],
    icon: (
      <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.75}
          d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
        />
      </svg>
    ),
  },
];

const HowItWorks: React.FC = () => {
  return (
    <section className="mb-10" aria-labelledby="how-it-works-heading">
      <h2
        id="how-it-works-heading"
        className="mb-4 text-left text-xl font-bold tracking-tight text-neutral-900 dark:text-white sm:text-2xl"
      >
        How it works
      </h2>
      <div className="flex flex-col gap-3 sm:gap-4">
        {STEPS.map((step) => (
          <div
            key={step.title}
            className="flex gap-4 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-700 dark:bg-neutral-800/80 dark:shadow-[0_2px_12px_rgba(0,0,0,0.2)] sm:p-5"
          >
            <div
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-yellow-100 text-yellow-800 dark:bg-yellow-400/15 dark:text-yellow-400"
              aria-hidden
            >
              {step.icon}
            </div>
            <div className="min-w-0 flex-1 pt-0.5">
              <h3 className="text-base font-bold text-neutral-900 dark:text-white">{step.title}</h3>
              <ul className="mt-2 list-none space-y-1.5 p-0 text-sm text-neutral-600 dark:text-neutral-400">
                {step.points.map((p) => (
                  <li key={p} className="leading-snug">
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default HowItWorks;
