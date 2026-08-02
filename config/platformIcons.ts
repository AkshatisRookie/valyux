import type { Platform } from '../types';

/** Bundled Zepto icon — external CDN/favicon proxies fail on many mobile browsers. */
const ZEPTO_ICON = new URL('../assets/platforms/zepto.png', import.meta.url).href;

/** Platform logos for product cards, cart, and header strip. */
export const PLATFORM_ICONS: Record<Platform, string> = {
  JioMart: 'https://www.google.com/s2/favicons?domain=jiomart.com&sz=128',
  Blinkit: 'https://blinkit.com/favicon.ico',
  Instamart: 'https://www.google.com/s2/favicons?domain=swiggy.com&sz=128',
  Zepto: ZEPTO_ICON,
};

const PLATFORM_ICON_FALLBACKS: Partial<Record<Platform, string>> = {
  Zepto: 'https://cdn.zeptonow.com/web-static-assets-prod/artifacts/16.19.0/favicon.png',
};

export function getPlatformIcon(platform: Platform): string {
  return PLATFORM_ICONS[platform] ?? '';
}

export function getPlatformIconFallback(platform: Platform): string | undefined {
  return PLATFORM_ICON_FALLBACKS[platform];
}
