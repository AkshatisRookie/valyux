import type { CartItem, Platform, PlatformPrice, Product } from '../types';

const GROCERY_CART = 'valyux-grocery-cart';
const GROCERY_SEARCH = 'valyux-grocery-search';

const PLATFORMS: Platform[] = ['JioMart', 'Blinkit', 'Instamart', 'Zepto'];

function isPlatform(x: unknown): x is Platform {
  return typeof x === 'string' && PLATFORMS.includes(x as Platform);
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
  const pps = Array.isArray(o.platformPrices)
    ? (o.platformPrices.map(parsePlatformPrice).filter(Boolean) as PlatformPrice[])
    : [];
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
  return {
    product,
    selectedPlatform: o.selectedPlatform,
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
