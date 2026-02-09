
export type Platform = 'BigBasket' | 'Blinkit' | 'Instamart' | 'Jiomart' | 'Zepto';

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
