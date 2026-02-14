
import { GoogleGenAI, Type } from "@google/genai";
import { CartItem, AIAnalysis, Platform } from "../types";

const PLATFORMS: Platform[] = ['BigBasket', 'Blinkit', 'Instamart', 'Jiomart', 'Zepto'];

function getFallbackAnalysis(items: CartItem[]): AIAnalysis {
  const totals = PLATFORMS.map(p => ({
    platform: p,
    total: items.reduce((acc, item) => {
      const price = item.product.platformPrices.find(pp => pp.platform === p)?.price || 0;
      return acc + (price * item.quantity);
    }, 0)
  }));
  const optimalSplit = items.reduce((acc, item) => {
    const minPrice = Math.min(...item.product.platformPrices.map(pp => pp.price));
    return acc + (minPrice * item.quantity);
  }, 0);
  const cheapest = totals.reduce((prev, curr) => (prev.total < curr.total ? prev : curr));
  return {
    cheapestPlatformTotal: cheapest,
    optimalSplitTotal: optimalSplit,
    savingsVsHighest: Math.max(...totals.map(t => t.total)) - optimalSplit,
    recommendation: `Based on your cart, buying from ${cheapest.platform} is your best bet for a single-platform order, but splitting your order could save you even more!`
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

const ai = new GoogleGenAI({
	apiKey:
		process.env.GEMINI_API_KEY ||
		process.env.API_KEY ||
		"AIzaSyA8vAtCfHVBO05Y2tJUEJtqIppYH_GpyU0",
});

export const analyzeCartCheapest = async (items: CartItem[]): Promise<AIAnalysis> => {
  if (items.length === 0) {
    throw new Error("Cart is empty");
  }

  const cartData = items.map(item => ({
    name: item.product.name,
    quantity: item.quantity,
    prices: item.product.platformPrices.reduce((acc, p) => ({ ...acc, [p.platform]: p.price }), {})
  }));

  const prompt = `Analyze this grocery cart data and provide a summary of savings. 
  Cart Items: ${JSON.stringify(cartData)}
  
  Calculate:
  1. The total if bought entirely from BigBasket, Blinkit, Instamart, Jiomart, or Zepto.
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
    if (normalized) return normalized;
    return getFallbackAnalysis(items);
  } catch {
    return getFallbackAnalysis(items);
  }
};
