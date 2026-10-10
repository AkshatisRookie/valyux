import type { Platform } from '../types';

const DEFAULT_URLS: Record<Platform, string> = {
  JioMart: 'https://www.jiomart.com',
  Blinkit: 'https://blinkit.com',
  Instamart: 'https://www.swiggy.com/instamart',
  Zepto: 'https://www.zepto.com',
};

// Search path per platform (?q= or /search?q= etc.) – built from default base so search always works
const SEARCH_PATHS: Record<Platform, string> = {
  JioMart: '/search?q=',
  Blinkit: '/s/?q=',
  Instamart: '?q=',
  Zepto: '/search?q=',
};

// Referenced explicitly so Parcel injects them from .env at build time (backup for when you have affiliate links)
const AFFILIATE_URLS: Record<Platform, string> = {
  JioMart: process.env.AFFILIATE_JIOMART || DEFAULT_URLS.JioMart,
  Blinkit: process.env.AFFILIATE_BLINKIT || DEFAULT_URLS.Blinkit,
  Instamart: process.env.AFFILIATE_INSTAMART || DEFAULT_URLS.Instamart,
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

const INSTAMART_ITEM_BASE = 'https://instamart.in/item/';

/** Instamart `/p/--ID` URLs 404; working format is `/item/{ID}` without leading dashes. */
function instamartItemId(raw?: string): string | null {
  if (!raw) return null;
  const fromUrl = raw.match(/instamart\.in\/(?:p|item)\/[-_]*([A-Za-z0-9]+)/i);
  if (fromUrl?.[1]) return fromUrl[1];
  const cleaned = raw.replace(/^[-_]+/, '').trim();
  return /^[A-Za-z0-9]+$/.test(cleaned) ? cleaned : null;
}

/**
 * Product open-in-app URL. Instamart always uses https://instamart.in/item/{id}.
 */
export function getProductLink(
  platform: Platform,
  productName: string,
  productUrl?: string,
  itemId?: string
): string {
  if (platform === 'Instamart') {
    const id = instamartItemId(itemId) || instamartItemId(productUrl);
    if (id) return `${INSTAMART_ITEM_BASE}${id}`;
  }
  return productUrl || getPlatformSearchUrl(platform, productName);
}
