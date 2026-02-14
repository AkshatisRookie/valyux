
export type Platform = 'BigBasket' | 'Blinkit' | 'Instamart' | 'Jiomart' | 'Zepto';

export type ElectronicsRetailer = 'Amazon' | 'Flipkart';

export type AppSection = 'grocery' | 'electronics';

export interface PlatformPrice {
  platform: Platform;
  price: number;
  originalPrice: number;
  deliveryTime: string;
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  quantity: string;
  imageUrl: string;
  category: string;
  platformPrices: PlatformPrice[];
}

export interface CartItem {
  product: Product;
  selectedPlatform: Platform;
  quantity: number;
}

export interface AIAnalysis {
  cheapestPlatformTotal: {
    platform: Platform;
    total: number;
  };
  optimalSplitTotal: number;
  savingsVsHighest: number;
  recommendation: string;
}

export interface RetailerPrice {
  retailer: ElectronicsRetailer;
  price: number;
  originalPrice: number;
  productUrl: string;
  inStock: boolean;
  /** Optional per-product EarnKaro Profit Link. If set, "Buy" redirects here instead of the general retailer affiliate link. */
  affiliateUrl?: string;
}

export interface ElectronicsProduct {
  id: string;
  name: string;
  brand: string;
  category: string;
  imageUrl: string;
  retailerPrices: RetailerPrice[];
}
