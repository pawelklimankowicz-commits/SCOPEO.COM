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
      role="dialog"
      aria-live="polite"
      aria-label="Informacja o przetwarzaniu plików cookies"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'rgba(15, 23, 42, 0.35)',
        padding: 16,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 980,
          background: '#ffffff',
          border: '1px solid #86efac',
          borderRadius: 14,
          boxShadow: '0 28px 60px rgba(2, 6, 23, 0.22)',
          padding: 28,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ fontSize: 54, lineHeight: 1, fontWeight: 800, letterSpacing: -1.5, color: '#0f172a' }}>
              scopeo
            </div>
            <div
              aria-hidden
              style={{
                width: 11,
                height: 11,
                borderRadius: '50%',
                background: '#22c55e',
                marginTop: 12,
              }}
            />
          </div>
          <button
            type="button"
            onClick={() => void persist('rejected')}
            style={{
              border: 0,
              background: 'transparent',
              color: '#0f172a',
              textDecoration: 'underline',
              fontSize: 33 / 2,
              cursor: 'pointer',
              padding: 0,
            }}
          >
            Kontynuuj bez akceptacji →
          </button>
        </div>

        <div style={{ marginTop: 18, color: '#0f172a', fontSize: 37 / 2, lineHeight: 1.55 }}>
          <p style={{ margin: 0 }}>
            Za Twoją zgodą używamy plików cookies i podobnych technologii do prawidłowego działania serwisu,
            analityki ruchu oraz ulepszania jakości usług Scopeo.
          </p>
          <p style={{ margin: '10px 0 0 0' }}>
            Dane mogą obejmować identyfikatory cookie i informacje o korzystaniu ze strony. W każdej chwili możesz
            zmienić decyzję w ustawieniach prywatności. Szczegóły znajdziesz w{' '}
            <a href="/cookies" style={{ color: '#16a34a', textDecoration: 'underline' }}>
              polityce cookies
            </a>{' '}
            oraz{' '}
            <a href="/polityka-prywatnosci" style={{ color: '#16a34a', textDecoration: 'underline' }}>
              polityce prywatności
            </a>
            .
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12, marginTop: 22, flexWrap: 'wrap' }}>
          <a
            href="/cookies"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 10,
              border: '1px solid #cbd5e1',
              background: '#f8fafc',
              color: '#0f172a',
              padding: '12px 22px',
              fontSize: 29 / 2,
              fontWeight: 700,
              textDecoration: 'none',
            }}
          >
            Dowiedz się więcej
          </a>
          <button
            type="button"
            onClick={() => void persist('accepted')}
            style={{
              borderRadius: 10,
              border: 0,
              background: '#22c55e',
              color: '#fff',
              padding: '12px 28px',
              fontSize: 29 / 2,
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            Akceptuj i zamknij
          </button>
        </div>
      </div>
    </div>
  );
}
