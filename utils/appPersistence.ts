import type {
  AppSection,
  CartItem,
  ElectronicsCartItem,
  ElectronicsRetailer,
  Platform,
  PlatformPrice,
  Product,
} from '../types';

const GROCERY_CART = 'valyux-grocery-cart';
const ELECTRONICS_CART = 'valyux-electronics-cart';
const GROCERY_SEARCH = 'valyux-grocery-search';
const ELECTRONICS_SEARCH = 'valyux-electronics-search';
const ACTIVE_SECTION = 'valyux-active-section';

const PLATFORMS: Platform[] = ['JioMart', 'Blinkit', 'Instamart', 'Zepto'];
const RETAILERS: ElectronicsRetailer[] = ['Amazon', 'Flipkart'];
const SECTIONS: AppSection[] = ['grocery', 'electronics', 'flights'];

function isPlatform(x: unknown): x is Platform {
  return typeof x === 'string' && PLATFORMS.includes(x as Platform);
}

function isRetailer(x: unknown): x is ElectronicsRetailer {
  return typeof x === 'string' && RETAILERS.includes(x as ElectronicsRetailer);
}

function parsePlatformPrice(raw: unknown): PlatformPrice | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  if (!isPlatform(o.platform)) return null;
  return {
    platform: o.platform,
    price: Number(o.price) || 0,
    originalPrice: Number(o.originalPrice) || 0,
    deliveryTime: typeof o.deliveryTime === 'string' ? o.deliveryTime : '—',
    productUrl: typeof o.productUrl === 'string' ? o.productUrl : undefined,
    externalItemId: typeof o.externalItemId === 'string' ? o.externalItemId : undefined,
  };
}

function parseProduct(raw: unknown): Product | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const id = typeof o.id === 'string' ? o.id : '';
  const name = typeof o.name === 'string' ? o.name : '';
  if (!id || !name) return null;
  const pps = Array.isArray(o.platformPrices) ? o.platformPrices.map(parsePlatformPrice).filter(Boolean) as PlatformPrice[] : [];
  return {
    id,
    name,
    brand: typeof o.brand === 'string' ? o.brand : '',
    quantity: typeof o.quantity === 'string' ? o.quantity : '',
    imageUrl: typeof o.imageUrl === 'string' ? o.imageUrl : '',
    category: typeof o.category === 'string' ? o.category : 'Other',
    platformPrices: pps,
  };
}

function parseCartItem(raw: unknown): CartItem | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const product = parseProduct(o.product);
  if (!product || !isPlatform(o.selectedPlatform)) return null;
  const quantity = Number(o.quantity);
  if (!Number.isFinite(quantity) || quantity < 1) return null;
  const item: CartItem = {
    product,
    selectedPlatform: o.selectedPlatform,
    quantity: Math.floor(quantity),
  };
  if (typeof o.optimizedBuyUrl === 'string') item.optimizedBuyUrl = o.optimizedBuyUrl;
  if (isPlatform(o.optimizedPlatform)) item.optimizedPlatform = o.optimizedPlatform;
  return item;
}

function parseElectronicsCartItem(raw: unknown): ElectronicsCartItem | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.productId !== 'string' || !o.productId) return null;
  if (typeof o.name !== 'string') return null;
  if (!isRetailer(o.retailer)) return null;
  const quantity = Number(o.quantity);
  if (!Number.isFinite(quantity) || quantity < 1) return null;
  return {
    productId: o.productId,
    name: o.name,
    imageUrl: typeof o.imageUrl === 'string' ? o.imageUrl : '',
    brand: typeof o.brand === 'string' ? o.brand : '',
    retailer: o.retailer,
    price: Number(o.price) || 0,
    productUrl: typeof o.productUrl === 'string' ? o.productUrl : '',
    quantity: Math.floor(quantity),
  };
}

function readJson(key: string): unknown {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function loadGroceryCart(): CartItem[] {
  const parsed = readJson(GROCERY_CART);
  if (!Array.isArray(parsed)) return [];
  return parsed.map(parseCartItem).filter((x): x is CartItem => x !== null);
}

export function saveGroceryCart(items: CartItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(GROCERY_CART, JSON.stringify(items));
  } catch {
    /* ignore quota / private mode */
  }
}

export function loadElectronicsCart(): ElectronicsCartItem[] {
  const parsed = readJson(ELECTRONICS_CART);
  if (!Array.isArray(parsed)) return [];
  return parsed.map(parseElectronicsCartItem).filter((x): x is ElectronicsCartItem => x !== null);
}

export function saveElectronicsCart(items: ElectronicsCartItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ELECTRONICS_CART, JSON.stringify(items));
  } catch {
    /* ignore */
  }
}

export function loadGrocerySearch(): string {
  if (typeof window === 'undefined') return '';
  try {
    const raw = localStorage.getItem(GROCERY_SEARCH);
    return typeof raw === 'string' ? raw : '';
  } catch {
    return '';
  }
}

export function saveGrocerySearch(q: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(GROCERY_SEARCH, q);
  } catch {
    /* ignore */
  }
}

export function loadElectronicsSearch(): string {
  if (typeof window === 'undefined') return '';
  try {
    const raw = localStorage.getItem(ELECTRONICS_SEARCH);
    return typeof raw === 'string' ? raw : '';
  } catch {
    return '';
  }
}

export function saveElectronicsSearch(q: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ELECTRONICS_SEARCH, q);
  } catch {
    /* ignore */
  }
}

export function loadActiveSection(): AppSection {
  if (typeof window === 'undefined') return 'grocery';
  try {
    const raw = localStorage.getItem(ACTIVE_SECTION);
    if (typeof raw === 'string' && SECTIONS.includes(raw as AppSection)) return raw as AppSection;
  } catch {
    /* ignore */
  }
  return 'grocery';
}

export function saveActiveSection(section: AppSection): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ACTIVE_SECTION, section);
  } catch {
    /* ignore */
  }
}
