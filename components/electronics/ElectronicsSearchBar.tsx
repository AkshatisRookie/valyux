import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useCyclingPlaceholder, useInstantSuggestions } from './hooks';
import { bestPrice, bestRetailer } from './types';
import type { Product } from './types';

interface Props {
  value: string;
  onChange: (v: string) => void;
  isLoading: boolean;
}

const ElectronicsSearchBar: React.FC<Props> = ({ value, onChange, isLoading }) => {
  const placeholder = useCyclingPlaceholder(3000);
  const suggestions = useInstantSuggestions(value, 5);

  const [isFocused, setIsFocused] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const showDropdown = isFocused && value.length >= 1 && suggestions.length > 0;

  // Reset highlight when suggestions change
  useEffect(() => setHighlightIdx(-1), [suggestions]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = useCallback((product: Product) => {
    onChange(product.name);
    setIsFocused(false);
    inputRef.current?.blur();
  }, [onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!showDropdown) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIdx(i => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIdx(i => Math.max(i - 1, -1));
    } else if (e.key === 'Enter' && highlightIdx >= 0) {
      e.preventDefault();
      handleSelect(suggestions[highlightIdx]);
    } else if (e.key === 'Escape') {
      setIsFocused(false);
    }
  }, [showDropdown, highlightIdx, suggestions, handleSelect]);

  return (
    <div ref={wrapperRef} className="elec-fade-in relative w-full max-w-2xl mx-auto z-20">
      {/* Search input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <svg className="w-5 h-5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          aria-label="Search electronics"
          aria-expanded={showDropdown}
          aria-autocomplete="list"
          className={`w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700
                     py-4 pl-12 pr-14 text-base text-gray-900 dark:text-gray-100
                     shadow-lg shadow-gray-100/80 dark:shadow-black/20
                     focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800
                     focus:border-indigo-300 dark:focus:border-indigo-600
                     transition-all duration-200 outline-none
                     placeholder:text-gray-400 dark:placeholder:text-gray-500
                     ${showDropdown ? 'rounded-t-2xl rounded-b-none border-b-0' : 'rounded-2xl'}`}
        />

        {isLoading && (
          <div className="absolute inset-y-0 right-12 flex items-center">
            <div className="w-5 h-5 border-2 border-indigo-400 dark:border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {value && !isLoading && (
          <button onClick={() => { onChange(''); setIsFocused(true); }} aria-label="Clear search"
            className="absolute inset-y-0 right-4 flex items-center text-gray-400 dark:text-gray-500
                       hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* ── Suggestions dropdown ──────────────────────────────────── */}
      {showDropdown && (
        <div className="absolute left-0 right-0 bg-white dark:bg-gray-800
                        border border-t-0 border-gray-200 dark:border-gray-700
                        rounded-b-2xl shadow-2xl shadow-gray-200/60 dark:shadow-black/40
                        overflow-hidden">
          <div className="px-4 pt-2 pb-1">
            <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
              Instant matches
            </span>
          </div>

          <div className="pb-2" role="listbox">
            {suggestions.map((product, i) => {
              const price = bestPrice(product);
              const best = bestRetailer(product);
              const isHighlighted = i === highlightIdx;

              return (
                <button
                  key={product.id}
                  role="option"
                  aria-selected={isHighlighted}
                  onClick={() => handleSelect(product)}
                  onMouseEnter={() => setHighlightIdx(i)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors
                    ${isHighlighted
                      ? 'bg-indigo-50 dark:bg-indigo-900/20'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700/40'
                    }`}
                >
                  {/* Thumbnail */}
                  <img src={product.imageUrl} alt=""
                    className="w-10 h-10 rounded-lg object-contain bg-gray-100 dark:bg-gray-700 shrink-0" />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                      {product.name}
                    </p>
                    <div className="flex items-center gap-2 text-[11px]">
                      <span className="font-bold text-gray-900 dark:text-white tabular-nums">
                        From ₹{price === Infinity ? '—' : price.toLocaleString('en-IN')}
                      </span>
                      {best && (
                        <span className="text-gray-400 dark:text-gray-500">
                          on {best}
                        </span>
                      )}
                      <span className="text-gray-300 dark:text-gray-600">·</span>
                      <span className="text-gray-400 dark:text-gray-500">{product.category}</span>
                    </div>
                  </div>

                  {/* Arrow */}
                  <svg className="w-4 h-4 text-gray-300 dark:text-gray-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              );
            })}
          </div>

          {/* Footer hint */}
          <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-700/50">
            <p className="text-[10px] text-gray-400 dark:text-gray-500 text-center">
              <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-[9px] font-bold">↵</kbd>
              {' '}to search all · <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-[9px] font-bold">↑↓</kbd>
              {' '}to navigate
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ElectronicsSearchBar;
