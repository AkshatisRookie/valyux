import React, { useEffect } from 'react';
import { getGaMeasurementId } from '../utils/gtag';

let gtagBootstrapStarted = false;

/**
 * Loads GA4 (gtag.js) when `GA_MEASUREMENT_ID` is set at build time.
 * Uses `send_page_view: false` so `AppContent` can emit consistent virtual paths per section.
 */
const GoogleAnalytics: React.FC = () => {
  useEffect(() => {
    const id = getGaMeasurementId();
    if (!id || gtagBootstrapStarted) return;
    gtagBootstrapStarted = true;

    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag(...args: unknown[]) {
      window.dataLayer!.push(args);
    };
    window.gtag('js', new Date());
    window.gtag('config', id, { send_page_view: false });

    const existing = document.querySelector(`script[src*="googletagmanager.com/gtag/js"]`);
    if (existing) return;

    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
    document.head.appendChild(script);
  }, []);

  return null;
};

export default GoogleAnalytics;
