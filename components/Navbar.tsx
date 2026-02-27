import React from 'react';
import { AppSection } from '../types';
import { useTheme } from './ThemeProvider';
import logo from '../assets/valyux-logo.png';

interface NavbarProps {
  cartCount: number;
  onCartClick: () => void;
  searchQuery: string;
  onSearchChange: (val: string) => void;
  activeSection: AppSection;
  onSectionChange: (section: AppSection) => void;
  pincode?: string;
  onPincodeChange?: (p: string) => void;
}

/* ------------------------------------------------------------------ */
/*  Section config — each section has its own accent                   */
/* ------------------------------------------------------------------ */

const SECTIONS: {
  id: AppSection;
  label: string;
  icon: React.ReactNode;
  activeColor: string;       // light
  activeColorDark: string;   // dark
}[] = [
  {
    id: 'grocery',
    label: 'Grocery',
    activeColor: 'border-yellow-500 text-yellow-600 dark:text-yellow-400',
    activeColorDark: 'dark:border-yellow-500',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
      </svg>
    ),
  },
  {
    id: 'electronics',
    label: 'Electronics',
    activeColor: 'border-yellow-500 text-yellow-600 dark:text-yellow-400',
    activeColorDark: 'dark:border-yellow-500',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    id: 'flights',
    label: 'Flights',
    activeColor: 'border-sky-600 text-sky-600',
    activeColorDark: 'dark:border-sky-400 dark:text-sky-400',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
      </svg>
    ),
  },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

const Navbar: React.FC<NavbarProps> = ({
  cartCount, onCartClick, searchQuery, onSearchChange, activeSection, onSectionChange,
  pincode = '', onPincodeChange,
}) => {
  const { resolved, toggle } = useTheme();

  return (
    <nav className="sticky top-0 z-40 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 shrink-0 cursor-pointer" onClick={() => window.location.reload()}>
          <img
            src={logo}
            alt="Valyux"
            className="w-9 h-9 rounded-lg object-contain bg-neutral-900 dark:bg-neutral-800 p-0.5"
          />
          <span className="hidden sm:inline-block text-xl font-bold text-neutral-900 dark:text-white">valyux</span>
        </div>

        <div className="flex-1 max-w-xl">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </span>
            <input
              type="text"
              placeholder={activeSection === 'grocery' ? 'Search products...' : 'Search electronics...'}
              className="w-full bg-neutral-100 dark:bg-neutral-800 border-0 rounded-lg py-2.5 pl-9 pr-4 text-sm outline-none placeholder:text-neutral-500"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={toggle}
            aria-label="Toggle theme"
            className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500"
          >
            {resolved === 'dark' ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>

          <button
            onClick={() => onPincodeChange?.('')}
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-sm text-neutral-600 dark:text-neutral-400"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            {pincode ? pincode : 'Location'}
          </button>

          <button
            onClick={onCartClick}
            className="relative flex items-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-neutral-900 px-4 py-2 rounded-lg font-semibold text-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
            Cart
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs min-w-[18px] h-[18px] flex items-center justify-center rounded-full">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 border-t border-neutral-100 dark:border-neutral-800">
        <div className="flex gap-0">
          {SECTIONS.map(section => {
            const isActive = activeSection === section.id;
            return (
              <button
                key={section.id}
                onClick={() => onSectionChange(section.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px
                  ${isActive ? `${section.activeColor} ${section.activeColorDark}` : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'}`}
              >
                {section.icon}
                {section.label}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
