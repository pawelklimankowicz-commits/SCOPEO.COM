'use client';

import { useEffect, useState } from 'react';
import {
  COOKIE_CONSENT_STORAGE_KEY,
  COOKIE_CONSENT_VERSION,
} from '@/lib/cookie-consent';

type Props = {
  isLoggedIn: boolean;
  /** Zgoda z DB dla bieżącej wersji polityki; null = brak rekordu lub stara wersja */
  serverAnalyticsCookies: boolean | null;
};

export function CookieConsent({ isLoggedIn, serverAnalyticsCookies }: Props) {
  const [visible, setVisible] = useState<boolean | null>(null);

  useEffect(() => {
    const run = async () => {
      if (serverAnalyticsCookies !== null) {
        localStorage.setItem(
          COOKIE_CONSENT_STORAGE_KEY,
          serverAnalyticsCookies ? 'accepted' : 'rejected'
        );
        if (!serverAnalyticsCookies && typeof window !== 'undefined' && (window as any).Sentry) {
          (window as any).Sentry.close();
        }
        setVisible(false);
        return;
      }

      if (isLoggedIn) {
        const local = localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
        if (local === 'accepted' || local === 'rejected') {
          try {
            const res = await fetch('/api/user/cookie-consent', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                choice: local === 'accepted' ? 'accepted' : 'rejected',
                consentVersion: COOKIE_CONSENT_VERSION,
              }),
            });
            if (!res.ok) throw new Error('save failed');
          } catch {
            /* localStorage nadal obowiązuje po stronie klienta */
          }
          if (local === 'rejected' && (window as any).Sentry) {
            (window as any).Sentry.close();
          }
          setVisible(false);
          return;
        }
        setVisible(true);
        return;
      }

      const local = localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
      setVisible(!local);
    };

    void run();
  }, [isLoggedIn, serverAnalyticsCookies]);

  const persist = async (choice: 'accepted' | 'rejected') => {
    localStorage.setItem(
      COOKIE_CONSENT_STORAGE_KEY,
      choice === 'accepted' ? 'accepted' : 'rejected'
    );
    if (isLoggedIn) {
      try {
        await fetch('/api/user/cookie-consent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ choice, consentVersion: COOKIE_CONSENT_VERSION }),
        });
      } catch {
        /* zgoda zapisana lokalnie */
      }
    }
    setVisible(false);
    if (choice === 'rejected' && typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.close();
    }
  };

  if (visible === null || !visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 50,
        borderTop: '1px solid #e2e8f0',
        background: '#ffffff',
        padding: 16,
        boxShadow: '0 -6px 16px rgba(0, 0, 0, 0.08)',
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          display: 'flex',
          gap: 12,
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ fontSize: 14, color: '#334155' }}>
          <p style={{ margin: '0 0 4px 0', fontWeight: 700 }}>Używamy plików cookie</p>
          <p>
            Stosujemy niezbędne pliki cookie do działania aplikacji oraz opcjonalne do monitorowania błędów
            (Sentry). Szczegóły w{' '}
            <a href="/polityka-prywatnosci" style={{ color: '#2563eb', textDecoration: 'underline' }}>
              polityce prywatności
            </a>
            .
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <button
            type="button"
            onClick={() => void persist('rejected')}
            style={{
              borderRadius: 8,
              border: '1px solid #cbd5e1',
              background: '#fff',
              color: '#0f172a',
              padding: '8px 14px',
              fontSize: 13,
            }}
          >
            Tylko niezbędne
          </button>
          <button
            type="button"
            onClick={() => void persist('accepted')}
            style={{
              borderRadius: 8,
              border: 0,
              background: '#16a34a',
              color: '#fff',
              padding: '8px 14px',
              fontSize: 13,
            }}
          >
            Akceptuję wszystkie
          </button>
        </div>
      </div>
    </div>
  );
}
