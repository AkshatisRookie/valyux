import { Router, type Request, type Response } from 'express';
import { PLATFORM_META } from '../config/platforms.js';
import type { Platform } from '../config/platforms.js';

const router = Router();
const SCRAPER_API_URL = process.env.SCRAPER_API_URL || '';
const SCRAPER_API_KEY = process.env.SCRAPER_API_KEY || '';

/** Grocery platforms */
const GROCERY_PLATFORMS: Platform[] = ['BigBasket', 'Blinkit', 'Instamart', 'Jiomart', 'Zepto'];

/** Electronics platforms */
const ELECTRONICS_PLATFORMS = ['Amazon', 'Flipkart'] as const;
const ELECTRONICS_SEARCH_URLS: Record<string, string> = {
  Amazon: 'https://www.amazon.in/s?k=',
  Flipkart: 'https://www.flipkart.com/search?q=',
};

function buildProductUrl(platform: string, query: string): string {
  if (ELECTRONICS_SEARCH_URLS[platform]) {
    return `${ELECTRONICS_SEARCH_URLS[platform]}${encodeURIComponent(query)}`;
  }
  const meta = PLATFORM_META[platform as Platform];
  if (meta) {
    const base = meta.baseUrl.replace(/\/$/, '');
    const paths: Record<string, string> = {
      BigBasket: '/ps/?q=',
      Blinkit: '/s/?q=',
      Instamart: '?q=',
      Jiomart: '/search?q=',
      Zepto: '/search?q=',
    };
    return `${base}${paths[platform] || '/search?q='}${encodeURIComponent(query)}`;
  }
  return '';
}

/** GET /api/gemini/search?q=...&pincode=...&type=grocery|electronics */
router.get('/gemini/search', async (req: Request, res: Response): Promise<void> => {
  const query = (req.query.q as string || '').trim();
  const pincode = (req.query.pincode as string || '').trim();
  const type = (req.query.type as string || 'grocery').toLowerCase();

  if (!query || query.length < 2) {
    res.status(400).json({ error: 'Query must be at least 2 characters' });
    return;
  }

  if (!pincode || !/^\d{6}$/.test(pincode)) {
    res.status(400).json({ error: 'Valid 6-digit pincode required' });
    return;
  }

  if (!SCRAPER_API_URL || !SCRAPER_API_KEY) {
    res.status(503).json({ error: 'Scraper API not configured. Set SCRAPER_API_URL and SCRAPER_API_KEY in backend .env' });
    return;
  }

  const isElectronics = type === 'electronics';
  try {
    const upstreamUrl = new URL(SCRAPER_API_URL);
    upstreamUrl.searchParams.set('q', query);
    upstreamUrl.searchParams.set('pincode', pincode);
    upstreamUrl.searchParams.set('type', type);

    const upstreamRes = await fetch(upstreamUrl.toString(), {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${SCRAPER_API_KEY}`,
      },
    });

    if (!upstreamRes.ok) {
      const body = await upstreamRes.text();
      console.error('[Scraper API] error', upstreamRes.status, body.slice(0, 300));
      res.status(502).json({ error: 'Upstream scraper API failed' });
      return;
    }

    const data = await upstreamRes.json();
    const rawProducts = Array.isArray(data.products) ? data.products : [];

    const products = rawProducts.map((p: any, idx: number) => {
      if (isElectronics) {
        const offers = (p.offers || p.prices || []).map((o: any) => ({
          retailer: o.retailer || o.platform || 'Amazon',
          price: Number(o.price) || Number(o.selling_price) || 0,
          originalPrice: Number(o.originalPrice) || Number(o.mrp) || Number(o.price) || 0,
          productUrl: o.productUrl || o.url || buildProductUrl(o.retailer || o.platform, query),
          inStock: o.inStock !== false && o.available !== false,
          discount:
            Math.round(
              (1 - (Number(o.price) || 0) / (Number(o.originalPrice) || Number(o.mrp) || 1)) * 100,
            ) || 0,
          offers: [] as string[],
          deliveryTime: o.deliveryTime || '1-2 days',
        }));
        return {
          id: `e${idx + 1}`,
          name: p.name || 'Product',
          brand: p.brand || '',
          category: p.category || 'Electronics',
          imageUrl: p.imageUrl || 'https://images.unsplash.com/photo-1556656793-08538906a9f8?w=400&q=80',
          retailerOffers: offers,
        };
      }

      const platformPrices = (p.platformPrices || p.prices || []).map((pp: any) => ({
        platform: pp.platform || GROCERY_PLATFORMS[0],
        price: Number(pp.price) || Number(pp.selling_price) || 0,
        originalPrice: Number(pp.originalPrice) || Number(pp.mrp) || Number(pp.price) || 0,
        deliveryTime: pp.deliveryTime || pp.eta || PLATFORM_META[pp.platform as Platform]?.avgDeliveryTime || '15 mins',
        inStock: pp.inStock !== false && pp.available !== false,
        productUrl: pp.productUrl || pp.url || buildProductUrl(pp.platform, query),
      }));

      return {
        id: `prod_${idx + 1}`,
        name: p.name || 'Product',
        brand: p.brand || '',
        quantity: p.quantity || '',
        category: p.category || 'Other',
        imageUrl: p.imageUrl || 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=400&q=80',
        platformPrices,
      };
    });

    res.json({
      query,
      pincode,
      type,
      results: products,
      meta: { totalResults: products.length, fetchedAt: new Date().toISOString() },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Search failed';
    console.error(`[Groq Search] Error: ${msg}`);
    res.status(500).json({ error: 'Search failed', message: msg });
  }
});

export default router;
