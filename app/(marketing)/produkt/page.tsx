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
  title: 'Produkt Scopeo — moduły i funkcje',
  description:
    'Dashboard emisji Scope 1–3, workflow akceptacji z rolami, audit trail, import z KSeF, eksport CSRD/ESRS i raport GHG Protocol PDF.',
};

const modules = [
  {
    title: 'Dashboard emisji',
    body: 'Agregaty Scope 1, 2 i 3 z podziałem na kategorie, trendy, status importów i wskaźniki per NIP. Widok dla CFO i ESG managera — bez grzebania w surowych danych.',
  },
  {
    title: 'Workflow akceptacji',
    body: 'Kolejka pozycji wymagających weryfikacji, przypisanie do recenzentów, statusy w aplikacji (m.in. oczekuje, w recenzji, zatwierdzono, odrzucono, nadpisano). Każda decyzja z datą i użytkownikiem.',
  },
  {
    title: 'Audit trail',
    body: 'Chronologiczny log każdej zmiany: kategoria, współczynnik, status, autor. Log można filtrować i eksportować po zakresie dat i użytkowniku. Niezbędny przy weryfikacji zewnętrznej.',
  },
  {
    title: 'Import z KSeF',
    body: 'Automatyczny pobór faktur, parser XML, kolejka przetwarzania i obsługa wyjątków. Status importu widoczny w czasie rzeczywistym. Obsługa wielu połączeń KSeF równolegle.',
  },
  {
    title: 'Eksport i raportowanie',
    body: 'Raport GHG Protocol w PDF, eksport CSRD/ESRS (XML, JSON, CSV), eksport surowych danych do dalszej analizy. Każdy eksport ze znacznikiem czasu i zakresem danych.',
  },
  {
    title: 'Role i uprawnienia',
    body: 'Owner, Admin, Analyst, Reviewer, Approver, Viewer — granularne uprawnienia per rola. Każdy widzi i robi tylko to, do czego jest uprawniony. Zaproszenie nowych członków przez email.',
  },
];

export default function ProduktPage() {
  return (
    <>
      <div className="mkt-page-head">
        <div className="mkt-inner">
          <p className="mkt-kicker">Produkt</p>
          <h1>Wszystko, czego potrzebuje Twój zespół do raportu emisji</h1>
          <p>
            Scopeo to pełny system operacyjny do pracy z danymi emisyjnymi — od importu faktur
            po eksport raportu gotowego na audyt zewnętrzny.
          </p>
        </div>
      </div>

      <section className="mkt-section">
        <div className="mkt-inner">
          <div className="mkt-grid-3">
            {modules.map((m) => (
              <div key={m.title} className="mkt-card">
                <h3 style={{ margin: '0 0 10px', fontSize: '1rem' }}>{m.title}</h3>
                <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b', lineHeight: 1.6 }}>{m.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mkt-section mkt-section--surface">
        <div className="mkt-inner">
          <h2 className="mkt-section-title">Dashboard i analityka emisji</h2>
          <p className="mkt-section-lead">
            Jeden widok dla zarządu, ESG i finansów — agregaty Scope 1–3 z rozbiciem na kategorie
            i trendy kwartalne. Dane z ostatniego importu, nie z poprzedniego raportu.
          </p>
          <DashboardEmissionsMock />
        </div>
      </section>

      <section className="mkt-section">
        <div className="mkt-inner mkt-showcase-grid">
          <div>
            <h2 className="mkt-section-title" style={{ fontSize: '1.25rem' }}>
              Kolejka akceptacji i role
            </h2>
            <p className="mkt-section-lead" style={{ marginBottom: 20 }}>
              Pozycje wymagające decyzji trafiają do odpowiedniej osoby. Recenzent widzi kontekst,
              może zmienić kategorię i dodać uzasadnienie. Cała historia w jednym miejscu.
            </p>
            <ReviewQueueMock />
          </div>
          <div>
            <h2 className="mkt-section-title" style={{ fontSize: '1.25rem' }}>
              Audit trail
            </h2>
            <p className="mkt-section-lead" style={{ marginBottom: 20 }}>
              Każda zmiana kategorii, współczynnika i statusu zapisana chronologicznie —
              kto, kiedy, co zmienił i dlaczego. Eksportowalny przy audycie zewnętrznym.
            </p>
            <AuditTrailMock />
          </div>
        </div>
      </section>

      <section className="mkt-section mkt-section--surface">
        <div className="mkt-inner mkt-showcase-grid">
          <div>
            <h2 className="mkt-section-title" style={{ fontSize: '1.25rem' }}>
              Widok zmiany — przed i po
            </h2>
            <p className="mkt-section-lead" style={{ marginBottom: 20 }}>
              Kiedy recenzent zmienia kategorię lub współczynnik, system pokazuje dokładnie co
              się zmieniło. Nadpisanie (override) z uzasadnieniem — bez ukrytych poprawek.
            </p>
            <DiffMock />
          </div>
          <div>
            <h2 className="mkt-section-title" style={{ fontSize: '1.25rem' }}>
              Import z KSeF
            </h2>
            <p className="mkt-section-lead" style={{ marginBottom: 20 }}>
              Status importu w czasie rzeczywistym. Liczniki przetworzonych faktur, błędów
              i pozycji oczekujących w kolejce akceptacji. Pełna przejrzystość bez konieczności
              sprawdzania logów.
            </p>
            <ImportOverviewMock />
          </div>
        </div>
      </section>

      <section className="mkt-section">
        <div className="mkt-inner">
          <h2 className="mkt-section-title" style={{ textAlign: 'center', marginBottom: 32 }}>
            Dostępność funkcji per plan
          </h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ textAlign: 'left', padding: '10px 16px', color: '#0f172a', fontWeight: 600 }}>Funkcja</th>
                  {['Mikro', 'Starter', 'Growth', 'Scale'].map((p) => (
                    <th key={p} style={{ textAlign: 'center', padding: '10px 16px', color: '#0f172a', fontWeight: 600 }}>{p}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ['Import z KSeF (bez limitu faktur)', true, true, true, true],
                  ['Scope 1 i 2', true, true, true, true],
                  ['Scope 3', false, true, true, true],
                  ['Raport PDF GHG Protocol', true, true, true, true],
                  ['Eksport CSRD / ESRS', false, true, true, true],
                  ['Workflow akceptacji', false, false, true, true],
                  ['Public API', false, false, true, true],
                  ['Raporty white-label', false, false, false, true],
                  ['Wiele połączeń KSeF', false, false, true, true],
                  ['SSO / SAML', false, false, false, false],
                ].map(([name, ...vals]) => (
                  <tr key={String(name)} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px 16px', color: '#475569' }}>{name}</td>
                    {vals.map((v, i) => (
                      <td key={i} style={{ textAlign: 'center', padding: '10px 16px' }}>
                        {v ? (
                          <span style={{ color: '#10b981', fontWeight: 700 }}>✓</span>
                        ) : (
                          <span style={{ color: '#cbd5e1' }}>—</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
                <tr style={{ borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
                  <td style={{ padding: '10px 16px', color: '#475569' }}>Połączeń KSeF</td>
                  {['1', '1', '3', '10'].map((v, i) => (
                    <td key={i} style={{ textAlign: 'center', padding: '10px 16px', fontWeight: 600, color: '#0f172a' }}>{v}</td>
                  ))}
                </tr>
                <tr>
                  <td style={{ padding: '10px 16px', color: '#475569' }}>Użytkowników</td>
                  {['1', '5', '15', 'bez limitu'].map((v, i) => (
                    <td key={i} style={{ textAlign: 'center', padding: '10px 16px', fontWeight: 600, color: '#0f172a' }}>{v}</td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
          <p style={{ marginTop: 16, fontSize: '0.8125rem', color: '#94a3b8', textAlign: 'center' }}>
            SSO / SAML dostępne w planie Enterprise. Pełny cennik na stronie{' '}
            <Link href="/cennik" className="mkt-link">Cennik</Link>.
          </p>
        </div>
      </section>

      <section className="mkt-section mkt-section--surface">
        <div className="mkt-inner mkt-cta-band">
          <h2>Wypróbuj wszystkie funkcje przez 7 dni bezpłatnie</h2>
          <p>Bez karty kredytowej. Połącz KSeF i miej pierwsze dane emisyjne jeszcze dziś.</p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Link href="/register" className="mkt-btn mkt-btn--primary">
              Zacznij bezpłatny trial
            </Link>
            <Link href="/kontakt" className="mkt-btn mkt-btn--secondary">
              Wolę demo z zespołem
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
