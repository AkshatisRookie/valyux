
export type Platform = 'BigBasket' | 'Blinkit' | 'Instamart' | 'Zepto';

export type ElectronicsRetailer = 'Amazon' | 'Flipkart';

export type AppSection = 'grocery' | 'electronics' | 'flights';

export interface PlatformPrice {
  platform: Platform;
  price: number;
  originalPrice: number;
  deliveryTime: string;
  productUrl?: string;
  /** From QuickCommerce search / item APIs */
  externalItemId?: string;
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
  /** Set after "Optimize with AI" — deeplink for cheapest platform for this line */
  optimizedBuyUrl?: string;
  /** Platform the optimized link targets */
  optimizedPlatform?: Platform;
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

/** Cart item for electronics: one product + chosen retailer offer. */
export interface ElectronicsCartItem {
  productId: string;
  name: string;
  imageUrl: string;
  brand: string;
  retailer: ElectronicsRetailer;
  price: number;
  productUrl: string;
  quantity: number;
}
