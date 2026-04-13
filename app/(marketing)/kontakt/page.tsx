import type { Metadata } from 'next';
import LeadForm from '@/components/marketing/LeadForm';

export const metadata: Metadata = {
  title: 'Kontakt i demo — Scopeo',
  description: 'Umów demo Scopeo: krótka rozmowa o KSeF, wolumenie faktur i procesie review.',
};

export default function KontaktPage() {
  return (
    <>
      <div className="mkt-page-head">
        <div className="mkt-inner">
          <p className="mkt-kicker">Kontakt</p>
          <h1>Umów demo</h1>
          <p>
            Zostaw dane — oddzwonimy lub napiszemy w ciągu 1 dnia roboczego. Na spotkaniu pokażemy import,
            review i audit trail na przykładzie zbliżonym do Twojej organizacji.
          </p>
        </div>
      </div>

      <section className="mkt-section">
        <div className="mkt-inner">
          <div className="mkt-contact-grid">
            <div id="demo">
              <h2 style={{ margin: '0 0 16px', fontSize: '1.125rem' }}>Formularz</h2>
              <LeadForm idPrefix="contact" />
            </div>
            <div>
              <h2 style={{ margin: '0 0 16px', fontSize: '1.125rem' }}>Czego oczekiwać</h2>
              <ul style={{ margin: 0, paddingLeft: '1.1em', color: '#64748b', lineHeight: 1.65, fontSize: '0.9375rem' }}>
                <li>30–45 minut online z osobą znającą produkt.</li>
                <li>Pytania o wolumen faktur, strukturę działów i oczekiwania wobec raportowania.</li>
                <li>Bez presji — jeśli trzeba, drugi krok to oferta lub pilotaż.</li>
              </ul>
              <p style={{ marginTop: 24, fontSize: '0.875rem', color: '#94a3b8' }}>
                Dane kontaktowe ogólne:{' '}
                <a href="mailto:kontakt@scopeo.com" className="mkt-link">
                  kontakt@scopeo.com
                </a>{' '}
                (adres przykładowy w treści marketingowej — podmień na produkcyjny).
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
