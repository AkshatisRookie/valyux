/** GA4 measurement ID from build env (Vercel / local `.env`). */
export function getGaMeasurementId(): string | null {
  const raw = process.env.GA_MEASUREMENT_ID;
  const id = typeof raw === 'string' ? raw.trim() : '';
  if (!id || !id.startsWith('G-')) return null;
  return id;
}

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

/** Virtual page views for SPA (section changes). No-op if GA is not configured. */
export function gaTrackPageView(pagePath: string, pageTitle?: string): void {
  if (typeof window === 'undefined' || !getGaMeasurementId()) return;
  const title = pageTitle || (typeof document !== 'undefined' ? document.title : '');
  const run = (): boolean => {
    if (typeof window.gtag !== 'function') return false;
    window.gtag('event', 'page_view', {
      page_path: pagePath,
      page_title: title,
    });
    return true;
  };
  if (run()) return;
  window.setTimeout(() => void run(), 0);
}
