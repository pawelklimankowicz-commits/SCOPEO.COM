import type { Metadata } from 'next';
import Link from 'next/link';
import LegalSections from '@/components/legal/LegalSections';
import { LEGAL_COMPANY } from '@/lib/legal';

export const metadata: Metadata = {
  title: 'Polityka prywatności — Scopeo',
  robots: { index: true, follow: true },
};

export default function PolitykaPage() {
  return (
    <>
      <div className="mkt-page-head mkt-page-head--dark">
        <div className="mkt-inner">
          <p className="mkt-kicker mkt-kicker--on-dark">Polityka prywatności</p>
          <h1>Polityka prywatności</h1>
          <p>
            Treść poniżej odpowiada kompletowi dokumentów prawnych Scopeo / {LEGAL_COMPANY.name}. Dane
            identyfikacyjne administratora są publikowane centralnie i utrzymywane spójnie we wszystkich
            dokumentach prawnych.
          </p>
          <p style={{ marginTop: 12, fontSize: '0.8125rem', color: '#64748b' }}>
            Ostatnia aktualizacja: {new Date().getFullYear()}-04-13
          </p>
        </div>
      </div>

      <section className="mkt-section mkt-section--dark">
        <div className="mkt-inner mkt-prose" style={{ maxWidth: 800 }}>
          <LegalSections variant="privacy" />
          <p style={{ marginTop: 32 }}>
            <Link href="/prawne" className="mkt-link">
              Dokumenty prawne — spis
            </Link>
            {' · '}
            <Link href="/cookies" className="mkt-link">
              Polityka cookies
            </Link>
            {' · '}
            <Link href="/dpa" className="mkt-link">
              DPA
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}
