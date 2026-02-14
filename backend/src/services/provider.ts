import type { Platform } from '../config/platforms.js';
import type { PlatformProduct } from '../types.js';
import { ALL_PLATFORMS, PLATFORM_META } from '../config/platforms.js';

/**
 * FoodSpark API provider.
 *
 * This service calls the FoodSpark (or similar) grocery price comparison API
 * and transforms the response into our internal PlatformProduct format.
 *
 * When you get your FoodSpark API key:
 *   1. Add FOODSPARK_API_KEY to your .env file
 *   2. Update the API_BASE if the endpoint differs
 *   3. Adjust the response mapping in `mapResponse()` to match the actual API shape
 */

const API_BASE = process.env.FOODSPARK_API_URL || 'https://api.foodspark.in/v1';
const API_KEY = process.env.FOODSPARK_API_KEY || '';
const REQUEST_TIMEOUT = parseInt(process.env.API_TIMEOUT || '15000', 10);

/**
 * Search for products across all platforms using FoodSpark API.
 * Returns products grouped by platform.
 */
export async function fetchFromProvider(
  query: string,
  location: string
): Promise<{ products: PlatformProduct[]; platformStatus: Record<string, 'success' | 'error' | 'timeout'> }> {

  if (!API_KEY) {
    console.warn('[Provider] No FOODSPARK_API_KEY set. Returning mock data.');
    return getMockData(query);
  }

  try {
    console.log(`[Provider] Calling FoodSpark API for "${query}" @ ${location}`);
    const startTime = Date.now();

    const response = await fetch(`${API_BASE}/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
        'X-Api-Key': API_KEY,
      },
      body: JSON.stringify({
        query,
        location,
        platforms: ALL_PLATFORMS.map(p => p.toLowerCase()),
        limit: 20,
      }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT),
    });

    if (!response.ok) {
      throw new Error(`FoodSpark API returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const elapsed = Date.now() - startTime;
    console.log(`[Provider] Got response in ${elapsed}ms`);

    return mapResponse(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[Provider] API call failed: ${message}`);

    // Return empty results with error status
    const platformStatus: Record<string, 'success' | 'error' | 'timeout'> = {};
    for (const p of ALL_PLATFORMS) {
      platformStatus[p] = message.includes('timeout') ? 'timeout' : 'error';
    }
    return { products: [], platformStatus };
  }
}

/**
 * Map the FoodSpark API response to our internal format.
 *
 * TODO: Adjust this mapping when you have the actual API documentation.
 * The shape below is a reasonable guess for typical grocery price APIs.
 */
function mapResponse(data: any): {
  products: PlatformProduct[];
  platformStatus: Record<string, 'success' | 'error' | 'timeout'>;
} {
  const products: PlatformProduct[] = [];
  const platformStatus: Record<string, 'success' | 'error' | 'timeout'> = {};

  // Initialize all platforms as error (will be overridden if data exists)
  for (const p of ALL_PLATFORMS) {
    platformStatus[p] = 'error';
  }

  // Expected shape: { results: [ { platform, items: [...] } ] }
  // OR: { products: [ { name, prices: [ { platform, price, ... } ] } ] }
  // Adjust based on actual FoodSpark API docs

  const results = data?.results || data?.data || data?.products || [];

  if (Array.isArray(results)) {
    for (const item of results) {
      // Shape A: grouped by platform
      if (item.platform && Array.isArray(item.items)) {
        const platform = normalizePlatformName(item.platform);
        if (!platform) continue;
        platformStatus[platform] = 'success';

        for (const prod of item.items) {
          products.push(mapProduct(prod, platform));
        }
      }

      // Shape B: each item has a platform field
      if (item.platform && item.name) {
        const platform = normalizePlatformName(item.platform);
        if (!platform) continue;
        platformStatus[platform] = 'success';
        products.push(mapProduct(item, platform));
      }

      // Shape C: each item has prices from multiple platforms
      if (item.name && Array.isArray(item.prices)) {
        for (const priceEntry of item.prices) {
          const platform = normalizePlatformName(priceEntry.platform);
          if (!platform) continue;
          platformStatus[platform] = 'success';
          products.push({
            name: item.name,
            brand: item.brand || '',
            price: priceEntry.selling_price || priceEntry.price || 0,
            originalPrice: priceEntry.mrp || priceEntry.original_price || priceEntry.price || 0,
            quantity: item.quantity || item.weight || item.pack_size || '',
            imageUrl: item.image || item.image_url || '',
            deliveryTime: PLATFORM_META[platform]?.avgDeliveryTime || '15 mins',
            inStock: priceEntry.in_stock !== false,
            platform,
            productUrl: priceEntry.url || priceEntry.product_url || '',
          });
        }
      }
    }
  }

  return { products, platformStatus };
}

/** Map a single product object to our PlatformProduct type. */
function mapProduct(raw: any, platform: Platform): PlatformProduct {
  return {
    name: raw.name || raw.product_name || raw.title || '',
    brand: raw.brand || raw.brand_name || '',
    price: raw.selling_price || raw.sale_price || raw.price || 0,
    originalPrice: raw.mrp || raw.original_price || raw.market_price || raw.price || 0,
    quantity: raw.quantity || raw.weight || raw.pack_size || raw.unit || '',
    imageUrl: raw.image || raw.image_url || raw.thumbnail || '',
    deliveryTime: raw.delivery_time || PLATFORM_META[platform]?.avgDeliveryTime || '15 mins',
    inStock: raw.in_stock !== false && raw.available !== false,
    platform,
    productUrl: raw.url || raw.product_url || raw.deep_link || '',
  };
}

/** Normalize various platform name formats to our Platform type. */
function normalizePlatformName(name: string): Platform | null {
  const lower = (name || '').toLowerCase().trim();
  const map: Record<string, Platform> = {
    blinkit: 'Blinkit',
    zepto: 'Zepto',
    bigbasket: 'BigBasket',
    'big basket': 'BigBasket',
    instamart: 'Instamart',
    'swiggy instamart': 'Instamart',
    swiggy: 'Instamart',
    jiomart: 'Jiomart',
    'jio mart': 'Jiomart',
  };
  return map[lower] || null;
}

// ─── Mock data (used when no API key is configured) ───────────────────

function getMockData(query: string): {
  products: PlatformProduct[];
  platformStatus: Record<string, 'success' | 'error' | 'timeout'>;
} {
  const q = query.toLowerCase();
  const platformStatus: Record<string, 'success' | 'error' | 'timeout'> = {};
  for (const p of ALL_PLATFORMS) platformStatus[p] = 'success';

  const products: PlatformProduct[] = [];

  // Generate realistic mock products for common searches
  const mockCatalog = getMockCatalog(q);

  for (const mock of mockCatalog) {
    for (const platformPrice of mock.prices) {
      products.push({
        name: mock.name,
        brand: mock.brand,
        price: platformPrice.price,
        originalPrice: platformPrice.originalPrice,
        quantity: mock.quantity,
        imageUrl: mock.imageUrl,
        deliveryTime: PLATFORM_META[platformPrice.platform]?.avgDeliveryTime || '15 mins',
        inStock: true,
        platform: platformPrice.platform,
        productUrl: `${PLATFORM_META[platformPrice.platform]?.baseUrl || ''}/search?q=${encodeURIComponent(query)}`,
      });
    }
  }

  return { products, platformStatus };
}

interface MockProduct {
  name: string;
  brand: string;
  quantity: string;
  imageUrl: string;
  prices: { platform: Platform; price: number; originalPrice: number }[];
}

function getMockCatalog(query: string): MockProduct[] {
  const catalog: Record<string, MockProduct[]> = {
    milk: [
      {
        name: 'Amul Taaza Toned Fresh Milk',
        brand: 'Amul',
        quantity: '500 ml',
        imageUrl: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=270/app/assets/products/sliding_images/jpeg/bb47c32e-48d5-4cbb-a0e5-abd2f7db8e5c.jpg',
        prices: [
          { platform: 'Blinkit', price: 31, originalPrice: 31 },
          { platform: 'Zepto', price: 30, originalPrice: 31 },
          { platform: 'BigBasket', price: 31, originalPrice: 31 },
          { platform: 'Instamart', price: 30, originalPrice: 31 },
          { platform: 'Jiomart', price: 29, originalPrice: 31 },
        ],
      },
      {
        name: 'Amul Gold Full Cream Milk',
        brand: 'Amul',
        quantity: '500 ml',
        imageUrl: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=270/app/assets/products/sliding_images/jpeg/84a3ca76-5880-42a8-8ff6-a5e93a787498.jpg',
        prices: [
          { platform: 'Blinkit', price: 35, originalPrice: 36 },
          { platform: 'Zepto', price: 34, originalPrice: 36 },
          { platform: 'BigBasket', price: 36, originalPrice: 36 },
          { platform: 'Instamart', price: 35, originalPrice: 36 },
          { platform: 'Jiomart', price: 34, originalPrice: 36 },
        ],
      },
      {
        name: 'Mother Dairy Full Cream Milk',
        brand: 'Mother Dairy',
        quantity: '500 ml',
        imageUrl: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=270/app/assets/products/sliding_images/jpeg/5c56d3b2-4ed1-4bc4-87f7-00d82bfcc9a7.jpg',
        prices: [
          { platform: 'Blinkit', price: 32, originalPrice: 33 },
          { platform: 'Zepto', price: 31, originalPrice: 33 },
          { platform: 'BigBasket', price: 33, originalPrice: 33 },
          { platform: 'Instamart', price: 32, originalPrice: 33 },
        ],
      },
      {
        name: 'Nestle a+ Toned Milk',
        brand: 'Nestle',
        quantity: '500 ml',
        imageUrl: '',
        prices: [
          { platform: 'Blinkit', price: 33, originalPrice: 34 },
          { platform: 'Zepto', price: 32, originalPrice: 34 },
          { platform: 'BigBasket', price: 34, originalPrice: 34 },
        ],
      },
    ],
    atta: [
      {
        name: 'Aashirvaad Superior MP Atta',
        brand: 'Aashirvaad',
        quantity: '5 kg',
        imageUrl: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=270/app/assets/products/sliding_images/jpeg/ccb95f72-5441-4b0e-9cbb-d0e02a11c13d.jpg',
        prices: [
          { platform: 'Blinkit', price: 294, originalPrice: 319 },
          { platform: 'Zepto', price: 289, originalPrice: 319 },
          { platform: 'BigBasket', price: 299, originalPrice: 319 },
          { platform: 'Instamart', price: 295, originalPrice: 319 },
          { platform: 'Jiomart', price: 285, originalPrice: 319 },
        ],
      },
    ],
    rice: [
      {
        name: 'India Gate Basmati Rice - Super',
        brand: 'India Gate',
        quantity: '5 kg',
        imageUrl: '',
        prices: [
          { platform: 'Blinkit', price: 449, originalPrice: 500 },
          { platform: 'Zepto', price: 439, originalPrice: 500 },
          { platform: 'BigBasket', price: 455, originalPrice: 500 },
          { platform: 'Instamart', price: 445, originalPrice: 500 },
          { platform: 'Jiomart', price: 430, originalPrice: 500 },
        ],
      },
    ],
    bread: [
      {
        name: 'Harvest Gold White Bread',
        brand: 'Harvest Gold',
        quantity: '400 g',
        imageUrl: '',
        prices: [
          { platform: 'Blinkit', price: 40, originalPrice: 45 },
          { platform: 'Zepto', price: 38, originalPrice: 45 },
          { platform: 'BigBasket', price: 42, originalPrice: 45 },
          { platform: 'Instamart', price: 40, originalPrice: 45 },
          { platform: 'Jiomart', price: 39, originalPrice: 45 },
        ],
      },
    ],
    sugar: [
      {
        name: 'Trust Classic Sulphurless Sugar',
        brand: 'Trust',
        quantity: '1 kg',
        imageUrl: '',
        prices: [
          { platform: 'Blinkit', price: 47, originalPrice: 50 },
          { platform: 'Zepto', price: 45, originalPrice: 50 },
          { platform: 'BigBasket', price: 48, originalPrice: 50 },
          { platform: 'Instamart', price: 46, originalPrice: 50 },
          { platform: 'Jiomart', price: 44, originalPrice: 50 },
        ],
      },
    ],
    oil: [
      {
        name: 'Fortune Refined Sunflower Oil',
        brand: 'Fortune',
        quantity: '1 L',
        imageUrl: '',
        prices: [
          { platform: 'Blinkit', price: 155, originalPrice: 175 },
          { platform: 'Zepto', price: 149, originalPrice: 175 },
          { platform: 'BigBasket', price: 159, originalPrice: 175 },
          { platform: 'Instamart', price: 152, originalPrice: 175 },
          { platform: 'Jiomart', price: 148, originalPrice: 175 },
        ],
      },
    ],
  };

  // Find matching mock data
  for (const [key, products] of Object.entries(catalog)) {
    if (query.includes(key)) return products;
  }

  // Default: generate a generic product for the query
  return [
    {
      name: `${query.charAt(0).toUpperCase() + query.slice(1)} (Search Result)`,
      brand: '',
      quantity: '',
      imageUrl: '',
      prices: [
        { platform: 'Blinkit', price: 99, originalPrice: 120 },
        { platform: 'Zepto', price: 95, originalPrice: 120 },
        { platform: 'BigBasket', price: 105, originalPrice: 120 },
        { platform: 'Instamart', price: 98, originalPrice: 120 },
        { platform: 'Jiomart', price: 92, originalPrice: 120 },
      ],
    },
  ];
}
