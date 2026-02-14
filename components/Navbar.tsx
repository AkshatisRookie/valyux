import React from 'react';
import { AppSection } from '../types';
import { useTheme } from './ThemeProvider';

interface NavbarProps {
  cartCount: number;
  onCartClick: () => void;
  searchQuery: string;
  onSearchChange: (val: string) => void;
  activeSection: AppSection;
  onSectionChange: (section: AppSection) => void;
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
    label: 'Quick Commerce',
    activeColor: 'border-indigo-600 text-indigo-600',
    activeColorDark: 'dark:border-indigo-400 dark:text-indigo-400',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
      </svg>
    ),
  },
  {
    id: 'electronics',
    label: 'Electronics & Devices',
    activeColor: 'border-amber-600 text-amber-600',
    activeColorDark: 'dark:border-amber-400 dark:text-amber-400',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

const Navbar: React.FC<NavbarProps> = ({
  cartCount, onCartClick, searchQuery, onSearchChange, activeSection, onSectionChange,
}) => {
  const { resolved, toggle } = useTheme();

  return (
    <nav className="sticky top-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800
                    shadow-sm dark:shadow-black/20 transition-colors duration-300">
      {/* Main Row */}
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-3 flex items-center justify-between gap-4">
        {/* Logo */}
        <div className="flex items-center gap-2 cursor-pointer shrink-0" onClick={() => window.location.reload()}>
          <div className="w-10 h-10 bg-indigo-600 dark:bg-indigo-500 rounded-lg flex items-center justify-center
                          text-white font-black text-xl italic shadow-indigo-200 dark:shadow-indigo-900 shadow-lg">
            V
          </div>
          <span className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter">valyux</span>
        </div>

        {/* Search — grocery only */}
        {activeSection === 'grocery' && (
          <div className="flex-1 max-w-2xl relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search across BigBasket, Blinkit, Instamart, Jiomart & Zepto..."
              className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-xl py-2.5 pl-10 pr-4
                         text-sm text-gray-900 dark:text-gray-100
                         placeholder:text-gray-400 dark:placeholder:text-gray-500
                         focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900
                         transition-all outline-none"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
        )}

        {activeSection !== 'grocery' && <div className="flex-1" />}

        {/* Right actions */}
        <div className="flex items-center gap-2 md:gap-3 shrink-0">
          {/* Theme toggle */}
          <button
            onClick={toggle}
            aria-label={resolved === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors
                       text-gray-500 dark:text-gray-400"
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

          {activeSection === 'grocery' && (
            <button className="hidden md:flex items-center gap-2 px-4 py-2
                               hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors
                               font-semibold text-sm text-gray-600 dark:text-gray-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Select Location
            </button>
          )}

          {activeSection === 'grocery' && (
            <button
              onClick={onCartClick}
              className="relative bg-black dark:bg-white text-white dark:text-gray-900
                         px-5 py-2.5 rounded-xl font-bold text-sm
                         shadow-xl shadow-black/10 dark:shadow-white/10
                         hover:scale-105 transition-transform flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              My Basket
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] w-5 h-5
                                 flex items-center justify-center rounded-full border-2
                                 border-white dark:border-gray-900">
                  {cartCount}
                </span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Section Tabs */}
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        <div className="flex gap-1">
          {SECTIONS.map(section => {
            const isActive = activeSection === section.id;
            return (
              <button
                key={section.id}
                onClick={() => onSectionChange(section.id)}
                className={`flex items-center gap-2 px-5 py-2.5 text-sm font-bold transition-all border-b-2
                  ${isActive
                    ? `${section.activeColor} ${section.activeColorDark}`
                    : 'border-transparent text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:border-gray-200 dark:hover:border-gray-700'
                  }`}
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
