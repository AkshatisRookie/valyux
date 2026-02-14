now /**
 * EarnKaro Affiliate Link Generator
 * 
 * Wraps product URLs (Amazon, Flipkart, etc.) with EarnKaro Profit Link format.
 * Configure your EarnKaro Sub-ID in the .env file for tracking.
 * 
 * Format: https://ekaro.in/enkr?url=<encoded_product_url>&sid=<sub_id>
 */

/**
 * Generates an EarnKaro Profit Link by wrapping a product URL.
 * @param productUrl - The original product URL (e.g., Amazon or Flipkart link)
 * @returns The EarnKaro affiliate link
 */
export function generateEarnKaroLink(productUrl: string): string {
  const subId = process.env.EARNKARO_SUB_ID || '';
  const encodedUrl = encodeURIComponent(productUrl.trim());
  const base = `https://ekaro.in/enkr?url=${encodedUrl}`;
  return subId ? `${base}&sid=${subId}` : base;
}

/**
 * Async version that simulates EarnKaro API processing delay.
 * In production, this could be replaced with a direct EarnKaro API call.
 * @param productUrl - The original product URL
 * @returns Promise resolving to the EarnKaro affiliate link
 */
export async function generateEarnKaroLinkAsync(productUrl: string): Promise<string> {
  // Simulate API call delay (replace with real API call in production)
  await new Promise(resolve => setTimeout(resolve, 800));
  return generateEarnKaroLink(productUrl);
}
