import type { Platform } from './platforms.js';

/**
 * Comma-separated `platforms` value for upstream GET /v1/groupsearch and /v1/groupeta, e.g.
 * `/v1/groupsearch?q=atta&lat=12.9021&lon=77.6639&platforms=BlinkIt,Zepto,Swiggy,BigBasket`
 * (pincode is appended by our backend when available). One request returns all listed platforms;
 * results are merged in `mergeAndUnify`.
 */
export const QC_GROUP_PLATFORMS =
  process.env.QC_GROUP_PLATFORMS || 'BlinkIt,Zepto,Swiggy,BigBasket';

const API_TO_APP: Record<string, Platform | null> = {
  blinkit: 'Blinkit',
  zepto: 'Zepto',
  swiggy: 'Instamart',
  'swiggy instamart': 'Instamart',
  bigbasket: 'BigBasket',
  jiomart: null,
  dmart: null,
  minutes: null,
};

export function mapApiPlatformName(raw: string): Platform | null {
  const k = raw.trim().toLowerCase();
  if (API_TO_APP[k] !== undefined) return API_TO_APP[k];
  if (k.includes('blink')) return 'Blinkit';
  if (k.includes('zepto')) return 'Zepto';
  if (k.includes('swiggy') || k.includes('instamart')) return 'Instamart';
  if (k.includes('big') && k.includes('basket')) return 'BigBasket';
  if (k.includes('jiomart') || k.includes('jio mart')) return null;
  return null;
}
