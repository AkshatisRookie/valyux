import React from 'react';

const valyuxLogo = new URL('../assets/valyux-icon.svg', import.meta.url).href;

interface FloatingCartBarProps {
  itemCount: number;
  /** Subtotal in ₹ (same basis as cart line totals, before delivery fee). */
  totalRupee: number;
  onViewCart: () => void;
}

const FloatingCartBar: React.FC<FloatingCartBarProps> = ({ itemCount, totalRupee, onViewCart }) => {
  if (itemCount <= 0) return null;

  const itemsLabel = itemCount === 1 ? '1 item' : `${itemCount} items`;
  const formatted = Math.round(totalRupee).toLocaleString('en-IN');

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 flex justify-center pointer-events-none px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2">
      <button
        type="button"
        onClick={onViewCart}
        className="pointer-events-auto flex w-full max-w-lg items-center gap-3 rounded-full bg-white pl-2.5 pr-4 py-2.5 text-left text-black shadow-lg shadow-black/15 ring-1 ring-black/10 transition hover:ring-black/20 active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-black/30 dark:bg-black dark:text-white dark:shadow-black/50 dark:ring-white/15 dark:hover:ring-white/25 dark:focus-visible:ring-white/40"
        aria-label={`View cart, ${itemsLabel}, ${formatted} rupees`}
      >
        <span className="flex shrink-0 items-center justify-center">
          <img
            src={valyuxLogo}
            alt=""
            className="h-9 w-9 rounded-lg object-contain"
            aria-hidden
          />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-normal text-black/75 dark:text-white/80">{itemsLabel}</span>
          <span className="block text-base font-bold tabular-nums text-black dark:text-white">₹{formatted}</span>
        </span>
        <span className="flex shrink-0 items-center gap-1 text-sm font-bold text-black dark:text-white">
          View Cart
          <svg className="h-3.5 w-3.5 text-current" viewBox="0 0 12 12" fill="currentColor" aria-hidden>
            <path d="M4 2 L9 6 L4 10 z" />
          </svg>
        </span>
      </button>
    </div>
  );
};

export default FloatingCartBar;
