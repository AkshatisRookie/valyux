import type { Platform } from './platforms.js';

/**
 * Comma-separated `platforms` value for upstream GET /v1/groupsearch and /v1/groupeta, e.g.
 * `/v1/groupsearch?q=atta&lat=12.9021&lon=77.6639&platforms=BlinkIt,Zepto,Swiggy,JioMart`
 * (pincode is appended by our backend when available). One request returns all listed platforms;
 * results are merged in `mergeAndUnify`.
 */
function normalizeQcPlatforms(raw: string): string {
  const tokens = raw
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);

  const normalized = tokens.map((t) => {
    const k = t.toLowerCase();
    switch (k) {
      case 'blinkit':
        return 'BlinkIt';
      case 'zepto':
        return 'Zepto';
      case 'swiggy':
        return 'Swiggy';
      case 'bigbasket':
        return 'BigBasket';
      case 'dmart':
        return 'DMart';
      case 'jiomart':
        return 'JioMart';
      case 'minutes':
        return 'Minutes';
      default:
        // Keep as-is for forward compatibility, but trimmed.
        return t;
    }
  });

  return normalized.join(',');
}

export const QC_GROUP_PLATFORMS = normalizeQcPlatforms(
  process.env.QC_GROUP_PLATFORMS || 'BlinkIt,Zepto,Swiggy,JioMart',
);

const API_TO_APP: Record<string, Platform | null> = {
  blinkit: 'Blinkit',
  zepto: 'Zepto',
  swiggy: 'Instamart',
  'swiggy instamart': 'Instamart',
  bigbasket: null,
  jiomart: 'JioMart',
  dmart: null,
  minutes: null,
};

export function mapApiPlatformName(raw: string): Platform | null {
  const k = raw.trim().toLowerCase();
  if (API_TO_APP[k] !== undefined) return API_TO_APP[k];
  if (k.includes('blink')) return 'Blinkit';
  if (k.includes('zepto')) return 'Zepto';
  if (k.includes('swiggy') || k.includes('instamart')) return 'Instamart';
  if (k.includes('big') && k.includes('basket')) return null;
  if (k.includes('jiomart') || k.includes('jio mart')) return 'JioMart';
  return null;
}
