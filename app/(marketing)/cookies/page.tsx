import type { Metadata } from 'next';
import Link from 'next/link';
import LegalSections from '@/components/legal/LegalSections';

export const metadata: Metadata = {
  title: 'Polityka cookies — Scopeo',
  robots: { index: true, follow: true },
};

export default function CookiesPage() {
  return (
    <>
      <div className="mkt-page-head mkt-page-head--dark">
        <div className="mkt-inner">
          <p className="mkt-kicker mkt-kicker--on-dark">Cookies</p>
          <h1>Polityka cookies</h1>
          <p>
            Zasady plików cookies i technologii podobnych dla strony i platformy Scopeo — zgodnie z kompletem
            dokumentów Black Gold Sp. z o.o.
          </p>
          <p style={{ marginTop: 12, fontSize: '0.8125rem', color: '#64748b' }}>
            Ostatnia aktualizacja: {new Date().getFullYear()}-04-13
          </p>
        </div>
      </div>

      <section className="mkt-section mkt-section--dark">
        <div className="mkt-inner mkt-prose" style={{ maxWidth: 800 }}>
          <LegalSections variant="cookies" />
          <div className="mkt-legal-notice" style={{ marginTop: 28 }}>
            Transparentność zaczyna się od pierwszego kliknięcia. Scopeo nie ukrywa narzędzi analitycznych ani
            zasad działania banera zgód.
          </div>
          <p style={{ marginTop: 24 }}>
            <Link href="/polityka-prywatnosci" className="mkt-link">
              Polityka prywatności
            </Link>
            {' · '}
            <Link href="/klauzule-formularzy" className="mkt-link">
              Klauzule formularzy
            </Link>
            {' · '}
            <Link href="/prawne" className="mkt-link">
              Dokumenty prawne
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}
