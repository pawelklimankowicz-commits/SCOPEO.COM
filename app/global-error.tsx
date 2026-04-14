'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        <main className="container app-page">
          <h1 className="title">Wystąpił błąd aplikacji</h1>
          <p className="subtitle app-intro">Błąd został zarejestrowany. Spróbuj ponownie.</p>
          <button className="btn btn-primary" onClick={reset}>
            Spróbuj ponownie
          </button>
        </main>
      </body>
    </html>
  );
}
