
import { GoogleGenAI, Type } from "@google/genai";
import { CartItem, AIAnalysis, Platform } from "../types";

const PLATFORMS: Platform[] = ['BigBasket', 'Blinkit', 'Instamart', 'Zepto'];

function getOpenPlatforms(openByPlatform: Partial<Record<Platform, boolean>>): Platform[] {
  return PLATFORMS.filter(p => openByPlatform[p] !== false);
}

function getFallbackAnalysis(
  items: CartItem[],
  openByPlatform?: Partial<Record<Platform, boolean>>
): AIAnalysis {
  const platforms = openByPlatform ? getOpenPlatforms(openByPlatform) : PLATFORMS;

  // Mirror the fee logic used in the UI.
  const FREE_DELIVERY_THRESHOLD = 200;
  const DELIVERY_FEE = 30;
  const deliveryFee = (subtotal: number) => (subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE);

  // 1) Compute realistic totals for "single-platform" (platform must have ALL items).
  const fullCartTotals = platforms
    .map((platform) => {
      let subtotal = 0;
      for (const item of items) {
        const priceObj = item.product.platformPrices.find((pp) => pp.platform === platform);
        // Missing price => platform can't fulfill the whole cart (treat as unavailable, not 0).
        if (!priceObj) return null;
        subtotal += priceObj.price * item.quantity;
      }

      const total = subtotal + deliveryFee(subtotal);
      return { platform, subtotal, total };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  // 2) Compute realistic split total:
  //    For each cart line, pick cheapest available platform,
  //    then group by platform and apply delivery fee per platform-group.
  const splitGroupSubtotals = new Map<Platform, number>();
  for (const item of items) {
    const openPrices = openByPlatform
      ? item.product.platformPrices.filter((pp) => openByPlatform[pp.platform] !== false)
      : item.product.platformPrices;

    if (openPrices.length === 0) {
      // If even one item is unavailable on all open platforms, we can't give meaningful totals.
      return {
        cheapestPlatformTotal: { platform: PLATFORMS[0], total: 0 },
        optimalSplitTotal: 0,
        savingsVsHighest: 0,
        recommendation: 'Some items are not available in the open platforms. Try adjusting your cart or location.',
      };
    }

    const cheapest = openPrices.reduce((prev, curr) => (curr.price < prev.price ? curr : prev));
    const lineSubtotal = cheapest.price * item.quantity;
    splitGroupSubtotals.set(cheapest.platform, (splitGroupSubtotals.get(cheapest.platform) || 0) + lineSubtotal);
  }

  const optimalSplitTotal = Array.from(splitGroupSubtotals.entries()).reduce((acc, [platform, subtotal]) => {
    return acc + subtotal + deliveryFee(subtotal);
  }, 0);

  // If at least one platform can fulfill the whole cart, compare against the worst full-cart option.
  if (fullCartTotals.length > 0) {
    const cheapest = fullCartTotals.reduce((prev, curr) => (curr.total < prev.total ? curr : prev));
    const highest = fullCartTotals.reduce((prev, curr) => (curr.total > prev.total ? curr : prev));

    return {
      cheapestPlatformTotal: { platform: cheapest.platform, total: cheapest.total },
      optimalSplitTotal,
      savingsVsHighest: highest.total - optimalSplitTotal,
      recommendation: `If you want a single order, ${cheapest.platform} is the cheapest. Splitting can reduce your total further.`,
    };
  }

  // Otherwise no single platform covers every item. Recommend split without pretending single-order savings.
  return {
    cheapestPlatformTotal: { platform: platforms[0] || PLATFORMS[0], total: 0 },
    optimalSplitTotal,
    savingsVsHighest: 0,
    recommendation: 'No single platform has prices for every item in your cart, so Smart Cart will split your order across the cheapest available platform per item.',
  };
}

function normalizeAnalysis(raw: unknown): AIAnalysis | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const cpt = o.cheapestPlatformTotal;
  const platform =
    typeof cpt === 'object' && cpt !== null && typeof (cpt as Record<string, unknown>).platform === 'string'
      ? (cpt as Record<string, unknown>).platform as string
      : '';
  const validPlatform = PLATFORMS.includes(platform as Platform) ? (platform as Platform) : PLATFORMS[0];
  const total = typeof cpt === 'object' && cpt !== null && (cpt as Record<string, unknown>).total != null
    ? Number((cpt as Record<string, unknown>).total)
    : 0;
  const optimalSplitTotal = typeof o.optimalSplitTotal === 'number' ? o.optimalSplitTotal : Number(o.optimalSplitTotal) || 0;
  const savingsVsHighest = typeof o.savingsVsHighest === 'number' ? o.savingsVsHighest : Number(o.savingsVsHighest) || 0;
  const recommendation = typeof o.recommendation === 'string' ? o.recommendation : 'See your best options above.';

  if (!Number.isFinite(total) || !Number.isFinite(optimalSplitTotal) || !Number.isFinite(savingsVsHighest)) {
    return null;
  }
  return {
    cheapestPlatformTotal: { platform: validPlatform, total },
    optimalSplitTotal,
    savingsVsHighest,
    recommendation
  };
}

const geminiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || '';
const ai = geminiKey ? new GoogleGenAI({ apiKey: geminiKey }) : null;

export const analyzeCartCheapest = async (
  items: CartItem[],
  openByPlatform?: Partial<Record<Platform, boolean>>
): Promise<AIAnalysis> => {
  if (items.length === 0) {
    throw new Error("Cart is empty");
  }

  if (!ai) {
    return getFallbackAnalysis(items, openByPlatform);
  }

  const openPlatforms = openByPlatform ? getOpenPlatforms(openByPlatform) : PLATFORMS;
  const cartData = items.map(item => ({
    name: item.product.name,
    quantity: item.quantity,
    prices: item.product.platformPrices
      .filter(pp => openPlatforms.includes(pp.platform))
      .reduce((acc, p) => ({ ...acc, [p.platform]: p.price }), {})
  }));

  const prompt = `Analyze this grocery cart data and provide a summary of savings. 
  Cart Items: ${JSON.stringify(cartData)}
  
  Calculate (only consider platforms that appear in the prices object for each item):
  2. The absolute cheapest total if we split the order (buying each item where it's cheapest).
  3. A friendly recommendation on where to buy.
  Return valid JSON only.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            cheapestPlatformTotal: {
              type: Type.OBJECT,
              properties: {
                platform: { type: Type.STRING },
                total: { type: Type.NUMBER }
              },
              required: ["platform", "total"]
            },
            optimalSplitTotal: { type: Type.NUMBER },
            savingsVsHighest: { type: Type.NUMBER },
            recommendation: { type: Type.STRING }
          },
          required: ["cheapestPlatformTotal", "optimalSplitTotal", "savingsVsHighest", "recommendation"]
        }
      }
    });

    const rawText =
      (response && typeof (response as { text?: string }).text === 'string' && (response as { text: string }).text) ||
      (response && (response as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> }).candidates?.[0]?.content?.parts?.[0]?.text) ||
      '';
    const parsed = rawText ? (() => { try { return JSON.parse(rawText.replace(/^[\s\S]*?(\{[\s\S]*\})[\s\S]*$/, '$1')); } catch { return null; } })() : null;
    const normalized = parsed ? normalizeAnalysis(parsed) : null;
    if (normalized) {
      const openPlatforms = openByPlatform ? getOpenPlatforms(openByPlatform) : PLATFORMS;
      if (openPlatforms.length > 0 && !openPlatforms.includes(normalized.cheapestPlatformTotal.platform)) {
        return getFallbackAnalysis(items, openByPlatform);
      }
      return normalized;
    }
    return getFallbackAnalysis(items, openByPlatform);
  } catch {
    return getFallbackAnalysis(items, openByPlatform);
  }
};
