/**
 * Analityka first-party w przeglądarce. Nie wywołuj przed `typeof window` (tylko klient).
 * Marketing: tylko gdy użytkownik zaakceptował pliki w banerze (localStorage).
 */
import { COOKIE_CONSENT_STORAGE_KEY } from '@/lib/cookie-consent';

function hasMarketingAnalyticsConsent(): boolean {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY) === 'accepted';
}

function trimPath(path: string) {
  return path.slice(0, 500);
}

export type AnalyticsProperties = Record<string, string | number | boolean | null | undefined>;

export async function trackAppEvent(
  name: string,
  properties?: AnalyticsProperties
): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    const path = trimPath(`${window.location.pathname}${window.location.search || ''}`);
    void fetch('/api/analytics/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source: 'APP',
        name: name.slice(0, 120),
        path,
        properties: properties ?? undefined,
      }),
    });
  } catch {
    /* ignore */
  }
}

export async function trackMarketingEvent(
  name: string,
  properties?: AnalyticsProperties
): Promise<void> {
  if (typeof window === 'undefined' || !hasMarketingAnalyticsConsent()) return;
  try {
    const path = trimPath(`${window.location.pathname}${window.location.search || ''}`);
    void fetch('/api/analytics/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source: 'MARKETING',
        name: name.slice(0, 120),
        path,
        properties: properties ?? undefined,
        marketingConsent: true,
      }),
    });
  } catch {
    /* ignore */
  }
}
