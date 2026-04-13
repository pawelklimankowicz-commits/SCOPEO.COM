import type { Metadata } from 'next';
import Link from 'next/link';
import { LEGAL_COMPANY, LEGAL_EMAIL } from '@/lib/legal';

export const metadata: Metadata = {
  title: 'Kontakt prawny i reklamacje — Scopeo',
  robots: { index: true, follow: true },
};

export default function KontaktPrawnyPage() {
  return (
    <>
      <div className="mkt-page-head mkt-page-head--dark">
        <div className="mkt-inner">
          <p className="mkt-kicker mkt-kicker--on-dark">Kontakt</p>
          <h1>Pytanie prawne, reklamacja albo wniosek RODO</h1>
          <p>
            Poniżej znajdziesz wydzielone kanały kontaktu. Sprawy handlowe i techniczne kieruj odpowiednio — dzięki
            temu szybciej trafią do właściwego zespołu.
          </p>
          <p style={{ marginTop: 12, fontSize: '0.8125rem', color: '#64748b' }}>
            Ostatnia aktualizacja: {new Date().getFullYear()}-04-13
          </p>
        </div>
      </div>

      <section className="mkt-section mkt-section--dark">
        <div className="mkt-inner mkt-prose">
          <div className="mkt-legal-grid">
            <div className="mkt-legal-card">
              <h3>Dlaczego osobna strona</h3>
              <p>
                Dane kontaktowe znajdują się także w regulaminie i polityce prywatności; osobna strona ułatwia
                odnalezienie kanałów do reklamacji, prywatności i naruszeń.
              </p>
            </div>
            <div className="mkt-legal-card">
              <h3>Podmiot</h3>
              <p>
                {LEGAL_COMPANY.name}, siedziba: {LEGAL_COMPANY.seat}. {LEGAL_COMPANY.registryNote}
              </p>
            </div>
          </div>

          <h2>Kanały kontaktu</h2>
          <ul>
            <li>
              <strong>Kontakt ogólny / handlowy:</strong>{' '}
              <a href={`mailto:${LEGAL_EMAIL.general}`} className="mkt-link">
                {LEGAL_EMAIL.general}
              </a>
            </li>
            <li>
              <strong>Support techniczny:</strong>{' '}
              <a href={`mailto:${LEGAL_EMAIL.support}`} className="mkt-link">
                {LEGAL_EMAIL.support}
              </a>
            </li>
            <li>
              <strong>Prywatność i RODO:</strong>{' '}
              <a href={`mailto:${LEGAL_EMAIL.privacy}`} className="mkt-link">
                {LEGAL_EMAIL.privacy}
              </a>
            </li>
            <li>
              <strong>Reklamacje:</strong>{' '}
              <a href={`mailto:${LEGAL_EMAIL.complaints}`} className="mkt-link">
                {LEGAL_EMAIL.complaints}
              </a>
            </li>
          </ul>

          <p>
            Adres korespondencyjny oraz dane rejestrowe należy uzupełnić w wersji produkcyjnej i pokazać spójnie we
            wszystkich dokumentach prawnych.
          </p>

          <p>
            <Link href="/kontakt" className="mkt-link">
              Formularz kontaktowy (demo)
            </Link>{' '}
            ·{' '}
            <Link href="/prawne" className="mkt-link">
              Dokumenty prawne
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}
