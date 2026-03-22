import React, { useState } from 'react';
import type { Platform } from '../types';
import { usePincode } from '../context/PincodeContext';
import bigbasketLogo from '../assets/bigbasket-icon.jpg';

const BIGBASKET_FALLBACK =
  'https://www.google.com/s2/favicons?domain=bigbasket.com&sz=128';

/**
 * Green “bb” square only — bottom “bigbasket” wordmark is cropped off.
 */
function BigBasketIconMark({ className }: { className?: string }) {
  const [src, setSrc] = useState<string>(bigbasketLogo);
  const [cropped, setCropped] = useState(true);

  return (
    <div className={`relative overflow-hidden rounded-xl ${className ?? ''}`} title="BigBasket">
      <img
        src={src}
        alt=""
        draggable={false}
        onError={() => {
          if (src !== BIGBASKET_FALLBACK) setSrc(BIGBASKET_FALLBACK);
          setCropped(false);
        }}
        className={
          cropped
            ? 'pointer-events-none absolute left-0 top-0 w-full select-none object-cover object-top'
            : 'pointer-events-none h-full w-full select-none object-contain p-0.5'
        }
        style={cropped ? { height: '200%' } : undefined}
      />
    </div>
  );
}

const GROCERY_PLATFORMS: { platform: Platform; label: string; icon: string }[] = [
  { platform: 'BigBasket', label: 'BigBasket', icon: '' },
  { platform: 'Blinkit', label: 'Blinkit', icon: 'https://www.google.com/s2/favicons?domain=blinkit.com&sz=128' },
  { platform: 'Instamart', label: 'Swiggy Instamart', icon: 'https://www.google.com/s2/favicons?domain=swiggy.com&sz=128' },
  { platform: 'Zepto', label: 'Zepto', icon: 'https://www.google.com/s2/favicons?domain=zepto.com&sz=128' },
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
                flex h-14 w-14 sm:h-16 sm:w-16 shrink-0 items-center justify-center rounded-full
                border-[3px] border-white dark:border-neutral-950 bg-white dark:bg-neutral-900
                shadow-[0_4px_14px_rgba(0,0,0,0.08)] dark:shadow-[0_4px_14px_rgba(0,0,0,0.35)]
                ring-1 ring-neutral-200/90 dark:ring-neutral-700
              "
              title={p.label}
            >
              {p.platform === 'BigBasket' ? (
                <BigBasketIconMark className="h-9 w-9 sm:h-10 sm:w-10" />
              ) : (
                <img
                  src={p.icon}
                  alt=""
                  className="h-9 w-9 sm:h-10 sm:w-10 object-contain"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  decoding="async"
                  onError={(e) => {
                    const el = e.target as HTMLImageElement;
                    el.style.display = 'none';
                  }}
                />
              )}
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
