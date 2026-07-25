export type Platform = 'JioMart' | 'Blinkit' | 'Instamart' | 'Zepto';

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
}
