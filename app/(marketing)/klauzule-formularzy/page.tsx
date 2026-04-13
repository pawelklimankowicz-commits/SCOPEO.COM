import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalFormClauses } from '@/components/legal/LegalSections';

export const metadata: Metadata = {
  title: 'Klauzule formularzy — Scopeo',
  description:
    'Wzorcowe klauzule informacyjne i checkboxy dla formularza demo, rejestracji, kontaktu i lead magnet — Scopeo / Black Gold Sp. z o.o.',
  robots: { index: true, follow: true },
};

export default function KlauzuleFormularzyPage() {
  return (
    <>
      <div className="mkt-page-head mkt-page-head--dark">
        <div className="mkt-inner">
          <p className="mkt-kicker mkt-kicker--on-dark">Formularze</p>
          <h1>Klauzule i checkboxy do formularzy</h1>
          <p>
            Poniżej wzorce z kompletu dokumentów prawnych: demo, rejestracja, kontakt, materiały do pobrania
            oraz rekomendacje wdrożeniowe. Treści należy zsynchronizować z realnym CRM, newsletterem i
            procesami zgód.
          </p>
          <p style={{ marginTop: 12, fontSize: '0.8125rem', color: '#64748b' }}>
            Źródło: komplet dokumentów Scopeo / Black Gold Sp. z o.o.
          </p>
        </div>
      </div>

      <section className="mkt-section mkt-section--dark">
        <div className="mkt-inner mkt-prose" style={{ maxWidth: 800 }}>
          <LegalFormClauses />
          <p style={{ marginTop: 32 }}>
            <Link href="/polityka-prywatnosci" className="mkt-link">
              Polityka prywatności
            </Link>
            {' · '}
            <Link href="/cookies" className="mkt-link">
              Polityka cookies
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
