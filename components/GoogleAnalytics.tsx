import React, { useEffect } from 'react';
import { getGaMeasurementId } from '../utils/gtag';

let gtagBootstrapStarted = false;

/**
 * Loads GA4 (gtag.js) when `GA_MEASUREMENT_ID` is set at build time.
 * Default `send_page_view` stays on so the first hit reaches GA once gtag.js loads (helps Realtime).
 * Section changes still send extra `page_view` events from `gaTrackPageView`.
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
    window.gtag('config', id);

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
