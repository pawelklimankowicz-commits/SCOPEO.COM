'use client';

import { useEffect, useMemo, useState } from 'react';

const CONSENT_KEY = 'scopeo_cookie_consent_v1';
const CONSENT_COOKIE = 'scopeo_cookie_consent';
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;
const OPEN_SETTINGS_EVENT = 'scopeo:open-cookie-settings';
const CONSENT_CHANGED_EVENT = 'scopeo:cookie-consent-changed';

type ConsentStatus = 'accepted' | 'rejected';

type StoredConsent = {
  status: ConsentStatus;
  updatedAt: string;
  categories: {
    necessary: true;
    analytics: boolean;
    marketing: boolean;
  };
};

function writeConsent(status: ConsentStatus) {
  const value: StoredConsent = {
    status,
    updatedAt: new Date().toISOString(),
    categories: {
      necessary: true,
      analytics: status === 'accepted',
      marketing: status === 'accepted',
    },
  };
  localStorage.setItem(CONSENT_KEY, JSON.stringify(value));
  document.cookie = `${CONSENT_COOKIE}=${status}; Path=/; Max-Age=${ONE_YEAR_SECONDS}; SameSite=Lax`;
  window.dispatchEvent(new CustomEvent(CONSENT_CHANGED_EVENT, { detail: value }));
}

export default function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const current = localStorage.getItem(CONSENT_KEY);
    setVisible(!current);

    const onOpenSettings = () => setVisible(true);
    window.addEventListener(OPEN_SETTINGS_EVENT, onOpenSettings);
    return () => window.removeEventListener(OPEN_SETTINGS_EVENT, onOpenSettings);
  }, []);

  const content = useMemo(() => {
    if (!visible) return null;
    return (
      <div
        role="dialog"
        aria-live="polite"
        aria-label="Ustawienia plików cookies"
        style={{
          position: 'fixed',
          left: 16,
          right: 16,
          bottom: 16,
          zIndex: 9999,
          maxWidth: 980,
          margin: '0 auto',
          background: '#0f172a',
          color: '#e2e8f0',
          border: '1px solid #334155',
          borderRadius: 12,
          boxShadow: '0 16px 30px rgba(0,0,0,0.35)',
          padding: 16,
        }}
      >
        <p style={{ margin: 0, lineHeight: 1.5 }}>
          Używamy plików cookies niezbędnych do działania serwisu. Cookies analityczne i marketingowe uruchamiamy
          dopiero po Twojej zgodzie.
        </p>
        <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => {
              writeConsent('accepted');
              setVisible(false);
            }}
            style={{ background: '#22c55e', color: '#052e16', border: 0, borderRadius: 8, padding: '8px 12px' }}
          >
            Akceptuję wszystkie
          </button>
          <button
            type="button"
            onClick={() => {
              writeConsent('rejected');
              setVisible(false);
            }}
            style={{ background: '#e2e8f0', color: '#0f172a', border: 0, borderRadius: 8, padding: '8px 12px' }}
          >
            Odrzucam opcjonalne
          </button>
          <a href="/cookies" style={{ color: '#93c5fd', textDecoration: 'underline', alignSelf: 'center' }}>
            Polityka cookies
          </a>
        </div>
      </div>
    );
  }, [visible]);

  return content;
}
