import type { Metadata } from 'next';
import Link from 'next/link';
import LeadForm from '@/components/marketing/LeadForm';
import { LEGAL_EMAIL } from '@/lib/legal';

export const metadata: Metadata = {
  title: 'Kontakt — Scopeo',
  description:
    'Kontakt z zespołem Scopeo: demo, pytania o produkt, Enterprise. Trial 7 dni. Adresy e-mail: ogólny, wsparcie, RODO.',
};

export default function KontaktPage() {
  return (
    <>
      <div className="mkt-page-head">
        <div className="mkt-inner">
          <p className="mkt-kicker">Kontakt</p>
          <h1>Porozmawiajmy</h1>
          <p>
            Masz pytania o produkt, chcesz zobaczyć demo lub rozmawiasz o wdrożeniu Enterprise?
            Zostaw dane w formularzu — odezwiemy się w ciągu 1 dnia roboczego. Możesz też od razu
            uruchomić{' '}
            <Link href="/register" className="mkt-link">
              7-dniowy trial
            </Link>
            .
          </p>
        </div>
      </div>

      <section className="mkt-section">
        <div className="mkt-inner">
          <div className="mkt-contact-grid">
            <div id="demo">
              <h2 style={{ margin: '0 0 16px', fontSize: '1.125rem' }}>Formularz kontaktowy</h2>
              <p style={{ margin: '0 0 16px', fontSize: '0.875rem', color: '#64748b', lineHeight: 1.6 }}>
                Wyślij zapytanie — umówimy demo, odpowiemy na pytania handlowe albo wskażemy kolejne
                kroki. Cena Scopeo nie zależy od liczby faktur; pole wolumenu w formularzu jest tylko
                orientacyjne.
              </p>
              <LeadForm idPrefix="contact" />
            </div>
            <div>
              <h2 style={{ margin: '0 0 20px', fontSize: '1.125rem' }}>Inne kanały</h2>

              <div style={{ marginBottom: 24 }}>
                <p style={{ margin: '0 0 4px', fontWeight: 600, fontSize: '0.9375rem', color: '#0f172a' }}>
                  Wolisz samodzielnie sprawdzić produkt?
                </p>
                <p style={{ margin: '0 0 12px', fontSize: '0.875rem', color: '#64748b', lineHeight: 1.6 }}>
                  Trial trwa 7 dni. Rejestracja i pierwsze połączenie KSeF to
                  zwykle około 15 minut.
                </p>
                <Link href="/register" className="mkt-btn mkt-btn--primary mkt-btn--sm">
                  Zacznij bezpłatny trial
                </Link>
              </div>

              <div style={{ marginBottom: 24 }}>
                <p style={{ margin: '0 0 4px', fontWeight: 600, fontSize: '0.9375rem', color: '#0f172a' }}>
                  Email ogólny
                </p>
                <a href={`mailto:${LEGAL_EMAIL.general}`} className="mkt-link" style={{ fontSize: '0.875rem' }}>
                  {LEGAL_EMAIL.general}
                </a>
              </div>

              <div style={{ marginBottom: 24 }}>
                <p style={{ margin: '0 0 4px', fontWeight: 600, fontSize: '0.9375rem', color: '#0f172a' }}>
                  Wsparcie techniczne
                </p>
                <a href={`mailto:${LEGAL_EMAIL.support}`} className="mkt-link" style={{ fontSize: '0.875rem' }}>
                  {LEGAL_EMAIL.support}
                </a>
              </div>

              <div>
                <p style={{ margin: '0 0 8px', fontSize: '0.875rem', color: '#64748b', lineHeight: 1.6 }}>
                  Na demo pokazujemy import z KSeF, mapowanie do Scope 1–3, workflow akceptacji
                  i eksport raportu — na przykładzie zbliżonym do Twojej organizacji.
                  Spotkanie trwa 30–45 minut, online.
                </p>
                <p style={{ margin: 0, fontSize: '0.875rem', color: '#94a3b8' }}>
                  Pytania prawne i RODO:{' '}
                  <a href={`mailto:${LEGAL_EMAIL.privacy}`} className="mkt-link">
                    {LEGAL_EMAIL.privacy}
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
