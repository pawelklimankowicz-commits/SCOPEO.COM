'use client';

import { useEffect, useRef } from 'react';
import { trackAppEvent } from '@/lib/analytics-client';

const KEY = 'scopeo_session_dashboard_beacon_v1';

/**
 * Raz na sesję przeglądarki zapisuje otwarcie powłoki dashboardu (dla lejka od logowania).
 */
export function ProductAnalyticsBeacon() {
  const run = useRef(false);
  useEffect(() => {
    if (run.current) return;
    if (typeof window === 'undefined') return;
    if (window.sessionStorage.getItem(KEY)) return;
    run.current = true;
    window.sessionStorage.setItem(KEY, '1');
    void trackAppEvent('app.dashboard_session', {});
  }, []);
  return null;
}
