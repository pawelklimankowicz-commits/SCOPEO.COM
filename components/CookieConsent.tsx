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
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white p-4 shadow-lg">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="text-sm text-gray-700">
          <p className="mb-1 font-semibold">Uzywamy plikow cookie</p>
          <p>
            Stosujemy niezbedne pliki cookie do dzialania aplikacji oraz opcjonalne do monitorowania bledow
            (Sentry). Szczegoly w{' '}
            <a href="/polityka-prywatnosci" className="text-blue-600 underline">
              polityce prywatnosci
            </a>
            .
          </p>
        </div>
        <div className="shrink-0 flex gap-2">
          <button
            onClick={reject}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
          >
            Tylko niezbedne
          </button>
          <button
            onClick={accept}
            className="rounded-md bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700"
          >
            Akceptuje wszystkie
          </button>
        </div>
      </div>
    </div>
  );
}
