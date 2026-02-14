import { compareTwoStrings } from 'string-similarity';
import type { PlatformProduct, UnifiedProduct, SearchResponse } from '../types.js';
import { fetchFromProvider } from './provider.js';
import { buildCacheKey, getCachedResult, setCachedResult } from '../cache/cacheManager.js';

/**
 * Search all platforms for a product query.
 * Checks cache first, then calls the data provider, matches products
 * across platforms, and caches the result.
 */
export async function searchAllPlatforms(
  query: string,
  location: string = 'Delhi'
): Promise<SearchResponse> {
  // 1. Check cache
  const cacheKey = buildCacheKey(query, location);
  const cached = getCachedResult(cacheKey);
  if (cached) {
    console.log(`[Search] Cache HIT for "${query}" @ ${location}`);
    return { ...cached, meta: { ...cached.meta, cached: true } };
  }

  console.log(`[Search] Cache MISS - fetching "${query}" from provider...`);
  const startTime = Date.now();

  // 2. Fetch from provider API
  const { products, platformStatus } = await fetchFromProvider(query, location);

  console.log(`[Search] Provider returned ${products.length} products in ${Date.now() - startTime}ms`);

  // 3. Match products across platforms
  const matchedProducts = matchProducts(products);

  // 4. Build response
  const response: SearchResponse = {
    query,
    results: matchedProducts,
    meta: {
      cached: false,
      fetchedAt: new Date().toISOString(),
      totalResults: matchedProducts.length,
      platformStatus,
    },
  };

  // 5. Cache the result
  setCachedResult(cacheKey, response);

  return response;
}

// ─── Product Matching ─────────────────────────────────────────────────

const MATCH_THRESHOLD = 0.55;

interface ProductGroup {
  name: string;
  brand: string;
  quantity: string;
  imageUrl: string;
  category: string;
  normalizedKey: string;
  products: PlatformProduct[];
}

/**
 * Match products across platforms using fuzzy name similarity.
 */
function matchProducts(allProducts: PlatformProduct[]): UnifiedProduct[] {
  if (allProducts.length === 0) return [];

  const groups: ProductGroup[] = [];

  for (const product of allProducts) {
    const normalizedName = normalizeName(product.name);

    let bestGroup: ProductGroup | null = null;
    let bestScore = 0;

    for (const group of groups) {
      const nameScore = compareTwoStrings(normalizedName, group.normalizedKey);
      const qtyBonus = product.quantity && group.quantity && product.quantity === group.quantity ? 0.15 : 0;
      const brandBonus = product.brand && group.brand &&
        product.brand.toLowerCase() === group.brand.toLowerCase() ? 0.1 : 0;
      const totalScore = nameScore + qtyBonus + brandBonus;

      if (totalScore > bestScore && totalScore >= MATCH_THRESHOLD) {
        bestScore = totalScore;
        bestGroup = group;
      }
    }

    if (bestGroup) {
      const alreadyHasPlatform = bestGroup.products.some(p => p.platform === product.platform);
      if (alreadyHasPlatform) {
        const existing = bestGroup.products.find(p => p.platform === product.platform)!;
        if (product.price < existing.price) {
          bestGroup.products = bestGroup.products.filter(p => p.platform !== product.platform);
          bestGroup.products.push(product);
        }
      } else {
        bestGroup.products.push(product);
      }
      if (!bestGroup.imageUrl && product.imageUrl) {
        bestGroup.imageUrl = product.imageUrl;
      }
    } else {
      groups.push({
        name: product.name,
        brand: product.brand,
        quantity: product.quantity,
        imageUrl: product.imageUrl,
        category: guessCategory(product.name),
        normalizedKey: normalizedName,
        products: [product],
      });
    }
  }

  return groups
    .sort((a, b) => b.products.length - a.products.length)
    .map((group, idx) => ({
      id: `prod_${idx + 1}`,
      name: group.name,
      brand: group.brand,
      quantity: group.quantity,
      imageUrl: group.imageUrl,
      category: group.category,
      platformPrices: group.products
        .sort((a, b) => a.price - b.price)
        .map(p => ({
          platform: p.platform,
          price: p.price,
          originalPrice: p.originalPrice,
          deliveryTime: p.deliveryTime,
          inStock: p.inStock,
          productUrl: p.productUrl,
        })),
    }));
}

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function guessCategory(name: string): string {
  const lower = name.toLowerCase();
  const categoryKeywords: Record<string, string[]> = {
    Dairy: ['milk', 'curd', 'yogurt', 'paneer', 'cheese', 'butter', 'ghee', 'cream', 'dahi', 'lassi'],
    Vegetables: ['potato', 'onion', 'tomato', 'carrot', 'cabbage', 'capsicum', 'cauliflower', 'spinach', 'broccoli', 'peas', 'beans', 'ladyfinger', 'bhindi', 'gourd', 'palak', 'methi', 'coriander'],
    Fruits: ['apple', 'banana', 'mango', 'orange', 'grapes', 'watermelon', 'papaya', 'pomegranate', 'guava', 'pineapple', 'kiwi', 'strawberry'],
    Snacks: ['chips', 'biscuit', 'cookie', 'namkeen', 'noodle', 'maggi', 'kurkure', 'nachos', 'popcorn'],
    Beverages: ['cola', 'pepsi', 'coke', 'sprite', 'juice', 'drink', 'water', 'tea', 'coffee', 'soda'],
    Staples: ['atta', 'rice', 'dal', 'sugar', 'salt', 'flour', 'oil', 'wheat', 'maida', 'besan', 'poha', 'sooji'],
    Household: ['detergent', 'cleaner', 'soap', 'vim', 'surf', 'harpic', 'lizol', 'dishwash'],
    'Personal Care': ['shampoo', 'toothpaste', 'deodorant', 'face wash', 'body wash', 'lotion'],
  };
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some(kw => lower.includes(kw))) return category;
  }
  return 'Other';
}
