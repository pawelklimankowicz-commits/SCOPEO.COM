import type { Metadata } from 'next';
import Link from 'next/link';
import LegalSections from '@/components/legal/LegalSections';
import { LEGAL_COMPANY } from '@/lib/legal';

export const metadata: Metadata = {
  title: 'DPA — powierzenie przetwarzania danych — Scopeo',
  robots: { index: true, follow: true },
};

export default function DpaPage() {
  return (
    <>
      <div className="mkt-page-head mkt-page-head--dark">
        <div className="mkt-inner">
          <p className="mkt-kicker mkt-kicker--on-dark">DPA</p>
          <h1>Umowa powierzenia przetwarzania danych osobowych (DPA)</h1>
          <p>
            Poniższy dokument realizuje wymogi art. 28 RODO dla relacji administrator (Klient) — procesor
            ({LEGAL_COMPANY.name}) przy korzystaniu z platformy Scopeo.
          </p>
          <p style={{ marginTop: 12, fontSize: '0.8125rem', color: '#64748b' }}>
            Ostatnia aktualizacja: {new Date().getFullYear()}-04-13
          </p>
        </div>
      </div>

      <section className="mkt-section mkt-section--dark">
        <div className="mkt-inner mkt-prose" style={{ maxWidth: 800 }}>
          <LegalSections variant="dpa" />
          <div className="mkt-legal-notice" style={{ marginTop: 28 }}>
            Scopeo automatyzuje dane, ale nie zaciera odpowiedzialności. Każdy klient wie, gdzie kończy się
            rola administratora, a gdzie zaczyna się rola procesora.
          </div>
          <p style={{ marginTop: 24 }}>
            <Link href="/polityka-prywatnosci" className="mkt-link">
              Polityka prywatności
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
