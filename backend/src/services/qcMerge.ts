import { compareTwoStrings } from 'string-similarity';
import type { Platform } from '../config/platforms.js';
import { mapApiPlatformName } from '../config/qcPlatforms.js';

const SIM_THRESHOLD = 0.68;

export interface QcFlatProduct {
  id: string;
  name: string;
  brand: string;
  mrp: number;
  offer_price: number;
  quantity?: string;
  images?: string[];
  deeplink?: string;
  available?: boolean;
  platform?: { name?: string; sla?: string };
  _sourceKey: string;
}

export interface UnifiedProductOut {
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
    productUrl?: string;
    externalItemId: string;
  }>;
}

function signature(p: QcFlatProduct): string {
  const b = (p.brand || '').toLowerCase().trim();
  const n = (p.name || '').toLowerCase().replace(/\s+/g, ' ').trim();
  const q = (p.quantity || '').toLowerCase().replace(/\s+/g, ' ').trim();
  return `${b} ${n} ${q}`.trim() || n;
}

/** Normalize quantity for comparison (e.g. "500 ml" vs "500ml" => same) */
export function normalizeQuantity(q: string): string {
  return (q || '').toLowerCase().replace(/\s+/g, '').replace(/\.0+(?=\D|$)/g, '').trim();
}

/** Only group items with same/similar quantity; different sizes (1L vs 500ml) stay separate */
export function quantityCompatible(a: QcFlatProduct, b: QcFlatProduct): boolean {
  const qa = normalizeQuantity(a.quantity || '');
  const qb = normalizeQuantity(b.quantity || '');
  if (!qa || !qb) return true; // allow grouping when either has no quantity
  if (qa === qb) return true;
  const qaNorm = qa.replace(/(\d+)\s*(ml|l|g|kg|pc|pcs|nos?)$/i, '$1$2');
  const qbNorm = qb.replace(/(\d+)\s*(ml|l|g|kg|pc|pcs|nos?)$/i, '$1$2');
  return qaNorm === qbNorm;
}

export function flattenQcResults(data: unknown): QcFlatProduct[] {
  const d = data as Record<string, unknown>;
  const results =
    d?.data && typeof d.data === 'object'
      ? (d.data as Record<string, unknown>).results
      : null;
  if (!results || typeof results !== 'object') return [];

  const out: QcFlatProduct[] = [];
  for (const [sourceKey, arr] of Object.entries(results)) {
    if (!Array.isArray(arr)) continue;
    for (const raw of arr) {
      const p = raw as Record<string, unknown>;
      const plat = p.platform as Record<string, unknown> | undefined;
      const id = String(p.id ?? p.item_id ?? `${sourceKey}-${out.length}`);
      const name = String(p.name ?? 'Product');
      const brand = String(p.brand ?? '');
      const mrp = Number(p.mrp) || 0;
      const offer = Number(p.offer_price ?? p.price) || mrp;
      const qty = typeof p.quantity === 'string' ? p.quantity : '';
      let images: string[] = [];
      if (Array.isArray(p.images)) images = p.images.map(String);
      else if (typeof p.image === 'string') images = [p.image];
      const deeplink = typeof p.deeplink === 'string' ? p.deeplink : undefined;

      out.push({
        id,
        name,
        brand,
        mrp,
        offer_price: offer,
        quantity: qty,
        images,
        deeplink,
        available: p.available !== false,
        platform: plat
          ? {
              name: String(plat.name ?? ''),
              sla: typeof plat.sla === 'string' ? plat.sla : '',
            }
          : undefined,
        _sourceKey: sourceKey,
      });
    }
  }
  return out;
}

function toPlatformPrice(
  p: QcFlatProduct,
  etaMap: Partial<Record<Platform, string>>
): UnifiedProductOut['platformPrices'][0] | null {
  const apiName = p.platform?.name || p._sourceKey;
  const plat = mapApiPlatformName(apiName);
  if (!plat) return null;
  const sla = p.platform?.sla || etaMap[plat] || '—';
  return {
    platform: plat,
    price: p.offer_price,
    originalPrice: p.mrp || p.offer_price,
    deliveryTime: sla,
    productUrl: p.deeplink,
    externalItemId: p.id,
  };
}

type Enriched = QcFlatProduct & { pp: NonNullable<ReturnType<typeof toPlatformPrice>> };

export function mergeAndUnify(
  apiJson: unknown,
  etaByPlatform: Partial<Record<Platform, string>>
): UnifiedProductOut[] {
  const flat = flattenQcResults(apiJson);
  const enriched: Enriched[] = [];
  for (const item of flat) {
    const pp = toPlatformPrice(item, etaByPlatform);
    if (!pp) continue;
    enriched.push({ ...item, pp });
  }

  const groups: { rep: string; items: Enriched[] }[] = [];
  for (const item of enriched) {
    const sig = signature(item);
    let placed = false;
    for (const g of groups) {
      const repItem = g.items[0];
      if (
        quantityCompatible(repItem, item) &&
        compareTwoStrings(g.rep, sig) >= SIM_THRESHOLD
      ) {
        g.items.push(item);
        placed = true;
        break;
      }
    }
    if (!placed) groups.push({ rep: sig, items: [item] });
  }

  const unified: UnifiedProductOut[] = [];
  let idx = 0;
  for (const g of groups) {
    idx += 1;
    const byPlat = new Map<Platform, Enriched>();
    for (const it of g.items) {
      const existing = byPlat.get(it.pp.platform);
      if (!existing || it.pp.price < existing.pp.price) {
        byPlat.set(it.pp.platform, it);
      }
    }
    const platformPrices = [...byPlat.values()]
      .map((it) => it.pp)
      .sort((a, b) => a.price - b.price);
    if (platformPrices.length === 0) continue;

    const first = g.items[0];
    const img =
      first.images?.[0] ||
      'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=400&q=80';

    unified.push({
      id: `qc_${idx}_${platformPrices[0].externalItemId}`,
      name: first.name,
      brand: first.brand,
      quantity: first.quantity || '',
      imageUrl: img,
      category: 'Other',
      platformPrices,
    });
  }

  return unified;
}
