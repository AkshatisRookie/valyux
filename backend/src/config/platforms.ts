/**
 * Platform configuration for all supported quick commerce platforms.
 */

export type Platform = 'JioMart' | 'Blinkit' | 'Instamart' | 'Zepto';

export const ALL_PLATFORMS: Platform[] = ['JioMart', 'Blinkit', 'Instamart', 'Zepto'];

export interface PlatformMeta {
  name: Platform;
  displayName: string;
  baseUrl: string;
  avgDeliveryTime: string;
  /** Icon color for frontend badges */
  color: string;
}

export const PLATFORM_META: Record<Platform, PlatformMeta> = {
  Blinkit: {
    name: 'Blinkit',
    displayName: 'Blinkit',
    baseUrl: 'https://blinkit.com',
    avgDeliveryTime: '10 mins',
    color: '#F8CB46',
  },
  Zepto: {
    name: 'Zepto',
    displayName: 'Zepto',
    baseUrl: 'https://www.zeptonow.com',
    avgDeliveryTime: '8 mins',
    color: '#7B2D8E',
  },
  JioMart: {
    name: 'JioMart',
    displayName: 'JioMart',
    baseUrl: 'https://www.jiomart.com',
    avgDeliveryTime: '15 mins',
    color: '#00A0E0',
  },
  Instamart: {
    name: 'Instamart',
    displayName: 'Swiggy Instamart',
    baseUrl: 'https://www.swiggy.com/instamart',
    avgDeliveryTime: '12 mins',
    color: '#FC8019',
  },
};
