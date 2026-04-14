'use client';

import { useEffect, useState } from 'react';

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) setVisible(true);
  }, []);

  const accept = () => {
    localStorage.setItem('cookie-consent', 'accepted');
    setVisible(false);
  };

  const reject = () => {
    localStorage.setItem('cookie-consent', 'rejected');
    setVisible(false);
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.close();
    }
  };

  if (!visible) return null;

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
          <p style={{ margin: '0 0 4px 0', fontWeight: 700 }}>Uzywamy plikow cookie</p>
          <p>
            Stosujemy niezbedne pliki cookie do dzialania aplikacji oraz opcjonalne do monitorowania bledow
            (Sentry). Szczegoly w{' '}
            <a href="/polityka-prywatnosci" style={{ color: '#2563eb', textDecoration: 'underline' }}>
              polityce prywatnosci
            </a>
            .
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <button
            onClick={reject}
            style={{
              borderRadius: 8,
              border: '1px solid #cbd5e1',
              background: '#fff',
              color: '#0f172a',
              padding: '8px 14px',
              fontSize: 13,
            }}
          >
            Tylko niezbedne
          </button>
          <button
            onClick={accept}
            style={{
              borderRadius: 8,
              border: 0,
              background: '#16a34a',
              color: '#fff',
              padding: '8px 14px',
              fontSize: 13,
            }}
          >
            Akceptuje wszystkie
          </button>
        </div>
      </div>
    </div>
  );
}
