import type { ElectronicsRetailer } from '../types';

interface RetailerConfig {
  name: string;
  baseUrl: string;
  searchPath: string;
  colorClasses: string;
  iconUrl: string;
  /** Pre-generated affiliate link. If set, "Buy" button redirects here directly. */
  affiliateUrl: string;
}

/**
 * Configuration for each electronics retailer.
 * Add new retailers here (e.g., Croma) to expand platform support.
 */
export const RETAILER_CONFIG: Record<ElectronicsRetailer, RetailerConfig> = {
  Amazon: {
    name: 'Amazon',
    baseUrl: 'https://www.amazon.in',
    searchPath: '/s?k=',
    colorClasses: 'text-stone-700 border-stone-200 bg-stone-50',
    iconUrl: 'https://www.amazon.in/favicon.ico',
    affiliateUrl: '', // Add your Amazon EarnKaro Profit Link here when ready
  },
  Flipkart: {
    name: 'Flipkart',
    baseUrl: 'https://www.flipkart.com',
    searchPath: '/search?q=',
    colorClasses: 'text-blue-600 border-blue-200 bg-blue-50',
    iconUrl: 'https://www.flipkart.com/favicon.ico',
    affiliateUrl: 'https://fktr.in/u0Lg96q',
  },
};

/**
 * Generates a search URL for a given retailer and query.
 */
export function getRetailerSearchUrl(retailer: ElectronicsRetailer, query: string): string {
  const config = RETAILER_CONFIG[retailer];
  return `${config.baseUrl}${config.searchPath}${encodeURIComponent(query.trim())}`;
}
