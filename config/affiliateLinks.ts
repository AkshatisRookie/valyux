import type { Platform } from '../types';

const DEFAULT_URLS: Record<Platform, string> = {
  BigBasket: 'https://www.bigbasket.com',
  Blinkit: 'https://blinkit.com',
  Instamart: 'https://www.swiggy.com/instamart',
  Jiomart: 'https://www.jiomart.com',
  Zepto: 'https://www.zepto.com',
};

// Search path per platform (?q= or /search?q= etc.) – built from default base so search always works
const SEARCH_PATHS: Record<Platform, string> = {
  BigBasket: '/ps/?q=',
  Blinkit: '/s/?q=',
  Instamart: '?q=',
  Jiomart: '/search?q=',
  Zepto: '/search?q=',
};

// Referenced explicitly so Parcel injects them from .env at build time (backup for when you have affiliate links)
const AFFILIATE_URLS: Record<Platform, string> = {
  BigBasket: process.env.AFFILIATE_BIGBASKET || DEFAULT_URLS.BigBasket,
  Blinkit: process.env.AFFILIATE_BLINKIT || DEFAULT_URLS.Blinkit,
  Instamart: process.env.AFFILIATE_INSTAMART || DEFAULT_URLS.Instamart,
  Jiomart: process.env.AFFILIATE_JIOMART || DEFAULT_URLS.Jiomart,
  Zepto: process.env.AFFILIATE_ZEPTO || DEFAULT_URLS.Zepto,
};

/**
 * Checkout URL for a platform. Uses your affiliate link from .env if set (no 3rd party API).
 * See env.example for variable names.
 */
export function getPlatformCheckoutUrl(platform: Platform): string {
  const url = AFFILIATE_URLS[platform];
  return url && url.startsWith('http') ? url : DEFAULT_URLS[platform];
}

/**
 * Opens the platform's search page with the given query so the user can add the product directly.
 * Uses default base URLs so search paths work; when you set affiliate links, checkout still uses those.
 */
export function getPlatformSearchUrl(platform: Platform, searchQuery: string): string {
  const base = DEFAULT_URLS[platform].replace(/\/$/, '');
  const path = SEARCH_PATHS[platform];
  const encoded = encodeURIComponent(searchQuery.trim());
  return `${base}${path}${encoded}`;
}
