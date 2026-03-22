import { Router, type Request, type Response } from 'express';
import { fetchQcomPl, type QcomPlProduct } from '../services/qcomPl.js';
import { PLATFORM_META } from '../config/platforms.js';
import type { Platform } from '../config/platforms.js';

const router = Router();

const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=400&q=80';

function normalizeProductName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

function extractDeliveryTime(deliveryDetails: Record<string, string> | undefined): string {
  if (!deliveryDetails || typeof deliveryDetails !== 'object') return '—';
  const key = Object.keys(deliveryDetails).find((k) =>
    k.toLowerCase().includes('time')
  );
  return key ? (deliveryDetails[key] || '—') : '—';
}

function rawToPlatformPrice(
  raw: QcomPlProduct,
  platform: 'Blinkit' | 'Instamart'
): { platform: Platform; price: number; originalPrice: number; deliveryTime: string; productUrl: string } {
  const meta = PLATFORM_META[platform];
  const deliveryTime = extractDeliveryTime(raw.delivery_details) || meta?.avgDeliveryTime || '—';
  return {
    platform,
    price: Number(raw.selling_price) || 0,
    originalPrice: Number(raw.mrp) || Number(raw.selling_price) || 0,
    deliveryTime,
    productUrl: raw.product_url || '',
  };
}

interface MergedProduct {
  id: string;
  name: string;
  brand: string;
  quantity: string;
  imageUrl: string;
  category: string;
  platformPrices: Array<{
    platform: Platform;
    price: number;
    originalPrice: number;
    deliveryTime: string;
    productUrl: string;
  }>;
}

function mergeResults(
  blinkitProducts: QcomPlProduct[],
  swiggyProducts: QcomPlProduct[]
): MergedProduct[] {
  const byNormalized = new Map<string, MergedProduct>();
  let idx = 0;

  const add = (raw: QcomPlProduct, platform: 'Blinkit' | 'Instamart') => {
    const key = normalizeProductName(raw.product_name);
    const pp = rawToPlatformPrice(raw, platform);
    if (byNormalized.has(key)) {
      const existing = byNormalized.get(key)!;
      if (!existing.platformPrices.some((p) => p.platform === platform)) {
        existing.platformPrices.push(pp);
      }
    } else {
      const id = `qcom_${idx++}_${String(raw.product_id)}`;
      byNormalized.set(key, {
        id,
        name: raw.product_name || 'Product',
        brand: '',
        quantity: '',
        imageUrl: '',
        category: 'Other',
        platformPrices: [pp],
      });
    }
  };

  for (const p of blinkitProducts) add(p, 'Blinkit');
  for (const p of swiggyProducts) add(p, 'Instamart');

  return Array.from(byNormalized.values()).map((p) => ({
    ...p,
    imageUrl: p.imageUrl || PLACEHOLDER_IMAGE,
  }));
}

/** GET /api/grocery/search?q=...&pincode=... */
router.get('/grocery/search', async (req: Request, res: Response): Promise<void> => {
  const query = (req.query.q as string || '').trim();
  const pincode = (req.query.pincode as string || '').trim();

  if (!query || query.length < 2) {
    res.status(400).json({ error: 'Query must be at least 2 characters' });
    return;
  }

  if (!pincode || !/^\d{6}$/.test(pincode)) {
    res.status(400).json({ error: 'Valid 6-digit pincode required' });
    return;
  }

  if (!process.env.QCOMPL_API_KEY) {
    res.status(503).json({
      error: 'QcomPl API not configured. Set QCOMPL_API_URL and QCOMPL_API_KEY in backend .env',
    });
    return;
  }

  try {
    const [blinkitRes, swiggyRes] = await Promise.allSettled([
      fetchQcomPl(query, pincode, 'blinkit'),
      fetchQcomPl(query, pincode, 'swiggyIM'),
    ]);

    const blinkitProducts =
      blinkitRes.status === 'fulfilled' ? blinkitRes.value.products : [];
    const swiggyProducts =
      swiggyRes.status === 'fulfilled' ? swiggyRes.value.products : [];

    if (blinkitProducts.length === 0 && swiggyProducts.length === 0) {
      const reasons: string[] = [];
      if (blinkitRes.status === 'rejected')
        reasons.push(`Blinkit: ${blinkitRes.reason?.message || 'failed'}`);
      if (swiggyRes.status === 'rejected')
        reasons.push(`Swiggy IM: ${swiggyRes.reason?.message || 'failed'}`);
      res.status(502).json({
        error: 'Live API unavailable',
        message: reasons.length ? reasons.join('; ') : 'No products returned',
      });
      return;
    }

    const products = mergeResults(blinkitProducts, swiggyProducts);

    res.json({
      query,
      pincode,
      results: products,
      meta: { totalResults: products.length, fetchedAt: new Date().toISOString() },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Search failed';
    console.error('[Grocery Search] Error:', msg);
    res.status(500).json({ error: 'Search failed', message: msg });
  }
});

export default router;
