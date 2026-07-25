import React from 'react';
import { useTheme } from './ThemeProvider';

const valyuxLogo = new URL('../assets/valyux-icon.svg', import.meta.url).href;

interface NavbarProps {
  cartCount: number;
  onCartClick: () => void;
  searchQuery: string;
  onSearchChange: (val: string) => void;
  onSearchSubmit?: () => void;
  onLogoClick?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({
  cartCount,
  onCartClick,
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  onLogoClick,
}) => {
  const { resolved, toggle } = useTheme();

  return (
    <nav className="sticky top-0 z-40 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800">
      <div className="max-w-6xl mx-auto px-4 pt-2 pb-2 sm:pt-2.5 sm:pb-2 flex flex-col gap-2">
        <div className="flex flex-row items-center justify-between gap-3 w-full min-h-0">
          <button
            type="button"
            className="flex items-center shrink-0 cursor-pointer text-left min-w-0"
            onClick={() => onLogoClick?.()}
          >
            <span className="inline-flex items-center gap-1.5 sm:gap-2 text-lg sm:text-xl font-bold text-neutral-900 dark:text-white tracking-tight leading-none whitespace-nowrap">
              <img
                src={valyuxLogo}
                alt=""
                className="h-[2.22em] w-[2.22em] sm:h-[2.22em] sm:w-[2.22em] rounded-lg object-contain shrink-0"
                aria-hidden
              />
              <span className="leading-none">Valyux</span>
            </span>
          </button>

          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
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
              onClick={onCartClick}
              className="relative flex items-center gap-1.5 sm:gap-2 bg-yellow-400 hover:bg-yellow-500 text-neutral-900 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-semibold text-sm"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              Cart
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs min-w-[18px] h-[18px] flex items-center justify-center rounded-full">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="w-full min-w-0">
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search products..."
              className="w-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-full py-2.5 pl-11 pr-4 text-sm outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400 placeholder:text-neutral-400"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  onSearchSubmit?.();
                  (e.currentTarget as HTMLInputElement).blur();
                }
              }}
            />
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
