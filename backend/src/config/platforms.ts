/**
 * Platform configuration for all supported quick commerce platforms.
 */

export type Platform = 'BigBasket' | 'Blinkit' | 'Instamart' | 'Jiomart' | 'Zepto';

export const ALL_PLATFORMS: Platform[] = ['BigBasket', 'Blinkit', 'Instamart', 'Jiomart', 'Zepto'];

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
  BigBasket: {
    name: 'BigBasket',
    displayName: 'BigBasket',
    baseUrl: 'https://www.bigbasket.com',
    avgDeliveryTime: '15 mins',
    color: '#84C225',
  },
  Instamart: {
    name: 'Instamart',
    displayName: 'Swiggy Instamart',
    baseUrl: 'https://www.swiggy.com/instamart',
    avgDeliveryTime: '12 mins',
    color: '#FC8019',
  },
  Jiomart: {
    name: 'Jiomart',
    displayName: 'JioMart',
    baseUrl: 'https://www.jiomart.com',
    avgDeliveryTime: '20 mins',
    color: '#0078AD',
  },
};
