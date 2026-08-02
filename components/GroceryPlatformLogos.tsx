import React from 'react';
import type { Platform } from '../types';
import { usePincode } from '../context/PincodeContext';
import { getPlatformIcon, getPlatformIconFallback } from '../config/platformIcons';

const GROCERY_PLATFORMS: { platform: Platform; label: string }[] = [
  { platform: 'JioMart', label: 'JioMart' },
  { platform: 'Blinkit', label: 'Blinkit' },
  { platform: 'Instamart', label: 'Swiggy Instamart' },
  { platform: 'Zepto', label: 'Zepto' },
];

/**
 * Platform logos with delivery ETA under each (from QuickCommerce group ETA).
 */
const GroceryPlatformLogos: React.FC = () => {
  const { etaByPlatform, etaLoading, hasCoords, openByPlatform } = usePincode();

  const etaLine = (platform: Platform): string => {
    if (!hasCoords) return '—';
    if (etaLoading && !etaByPlatform[platform]) return '…';
    if (openByPlatform[platform] === false) return 'Closed';
    const t = etaByPlatform[platform];
    return t && t.trim() ? t : '—';
  };

  return (
    <div className="flex flex-col items-center justify-center mb-8 px-2">
      <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-4">
        Comparing from
      </p>
      <div
        className="flex flex-wrap items-start justify-center gap-x-4 gap-y-6 sm:gap-x-6 max-w-2xl"
        aria-label="Grocery platforms compared"
      >
        {GROCERY_PLATFORMS.map((p) => (
          <div key={p.platform} className="flex w-[4.5rem] sm:w-[5rem] flex-col items-center gap-2 text-center">
            <div
              className="
                flex h-14 w-14 sm:h-16 sm:w-16 shrink-0 items-center justify-center rounded-full overflow-hidden
                border-[3px] border-white dark:border-neutral-950 bg-white dark:bg-neutral-900
                shadow-[0_4px_14px_rgba(0,0,0,0.08)] dark:shadow-[0_4px_14px_rgba(0,0,0,0.35)]
                ring-1 ring-neutral-200/90 dark:ring-neutral-700
              "
              title={p.label}
            >
              <img
                src={getPlatformIcon(p.platform)}
                alt=""
                className="h-9 w-9 sm:h-10 sm:w-10 object-contain"
                loading="lazy"
                referrerPolicy="no-referrer"
                decoding="async"
                onError={(e) => {
                  const el = e.currentTarget;
                  const fallback = getPlatformIconFallback(p.platform);
                  if (fallback && el.src !== fallback) {
                    el.src = fallback;
                    return;
                  }
                  el.style.display = 'none';
                }}
              />
            </div>
            <p
              className="text-[10px] sm:text-[11px] font-semibold leading-tight text-neutral-700 dark:text-neutral-200 tabular-nums min-h-[2.5rem] flex items-start justify-center px-0.5"
              title={`Delivery time · ${p.label}`}
            >
              {etaLine(p.platform)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GroceryPlatformLogos;
