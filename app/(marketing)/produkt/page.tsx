import type { Metadata } from 'next';
import Link from 'next/link';
import {
  AuditTrailMock,
  DashboardEmissionsMock,
  DiffMock,
  ImportOverviewMock,
  ReviewQueueMock,
} from '@/components/marketing/ProductMockups';

export const metadata: Metadata = {
  title: 'Produkt — Scopeo',
  description:
    'Moduły Scopeo: dashboard emisji, workflow review, audit trail, import KSeF i OCR, role i statusy.',
};

export default function ProduktPage() {
  return (
    <>
      <div className="mkt-page-head">
        <div className="mkt-inner">
          <p className="mkt-kicker">Produkt</p>
          <h1>System operacyjny do pracy nad emisjami</h1>
          <p>
            Scopeo łączy dane z KSeF z procesem księgowym i ESG: import, mapowanie do Scope 1–3,
            review, override z kontrolą i pełnym audit trail.
          </p>
        </div>
      </div>

      <section className="mkt-section">
        <div className="mkt-inner mkt-prose">
          <h2>Moduły</h2>
          <p>
            <strong>Dashboard emisji</strong> — agregacja Scope 1, 2 i 3, trendy, podział na kategorie,
            status importów. <strong>Workflow review</strong> — kolejka pozycji do akceptacji, role,
            statusy (m.in. approved, in review, overridden). <strong>Audit trail</strong> — kto, kiedy,
            co zmienił. <strong>Import KSeF i OCR</strong> — synchronizacja z API, przetwarzanie
            dokumentów, obsługa wyjątków.
          </p>
        </div>
      </section>

      <section className="mkt-section mkt-section--surface">
        <div className="mkt-inner">
          <h2 className="mkt-section-title">Dashboard i analityka</h2>
          <p className="mkt-section-lead">
            Zestawienie emisji z rozłożeniem na Scope i kategorie — pod decyzje zarządcze, nie tylko
            pod „wiersz w raporcie”.
          </p>
          <DashboardEmissionsMock />
        </div>
      </section>

      <section className="mkt-section">
        <div className="mkt-inner mkt-showcase-grid">
          <div>
            <h2 className="mkt-section-title" style={{ fontSize: '1.25rem' }}>
              Review i role
            </h2>
            <p className="mkt-section-lead" style={{ marginBottom: 20 }}>
              Przypisanie odpowiedzialności: kto wprowadza dane, kto akceptuje kategorie i override.
            </p>
            <ReviewQueueMock />
          </div>
          <div>
            <h2 className="mkt-section-title" style={{ fontSize: '1.25rem' }}>
              Audit trail
            </h2>
            <p className="mkt-section-lead" style={{ marginBottom: 20 }}>
              Zmiany są zapisywane chronologicznie — potrzebne przy audycie wewnętrznym i zewnętrznym.
            </p>
            <AuditTrailMock />
          </div>
        </div>
      </section>

      <section className="mkt-section mkt-section--surface">
        <div className="mkt-inner mkt-showcase-grid">
          <div>
            <h2 className="mkt-section-title" style={{ fontSize: '1.25rem' }}>
              Porównanie before / after
            </h2>
            <p className="mkt-section-lead" style={{ marginBottom: 20 }}>
              Widoczna zmiana kategorii, factorów i statusu po przejściu przez review.
            </p>
            <DiffMock />
          </div>
          <div>
            <h2 className="mkt-section-title" style={{ fontSize: '1.25rem' }}>
              Import KSeF i OCR
            </h2>
            <p className="mkt-section-lead" style={{ marginBottom: 20 }}>
              Stan synchronizacji, liczniki i wyjątki wymagające uwagi.
            </p>
            <ImportOverviewMock />
          </div>
        </div>
      </section>

      <section className="mkt-section">
        <div className="mkt-inner mkt-cta-band">
          <h2>Zobacz produkt na żywo</h2>
          <p>30–45 minut, dopasowane do Twojego wolumenu faktur i struktury zespołu.</p>
          <Link href="/kontakt#demo" className="mkt-btn mkt-btn--primary">
            Umów demo
          </Link>
        </div>
      </section>
    </>
  );
}
