import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import LeadForm from '@/components/marketing/LeadForm';
import {
  AuditTrailMock,
  DashboardEmissionsMock,
  DiffMock,
  ImportOverviewMock,
  ReviewQueueMock,
} from '@/components/marketing/ProductMockups';

export const metadata: Metadata = {
  title: 'Scopeo — ślad węglowy z danych KSeF',
  description:
    'Policz i uporządkuj emisje Scope 1–3 z KSeF. Workflow review, audit trail i mniej ręcznej pracy niż w Excelu.',
};

export default function MarketingHomePage() {
  return (
    <>
      <section className="mkt-hero">
        <div className="mkt-inner mkt-hero-grid">
          <div>
            <p className="mkt-hero-badge">KSeF + GHG Protocol · starter</p>
            <p className="mkt-kicker">Ślad węglowy operacyjny</p>
            <h1 className="mkt-hero-title">Policz ślad węglowy firmy z danych z KSeF</h1>
            <p className="mkt-hero-sub">
              Automatyczny import danych z KSeF, OCR dokumentów, mapowanie do Scope 1, 2 i 3, workflow
              review i audit trail — w jednym systemie zamiast rozproszonego Excela.
            </p>
            <ul className="mkt-bullets">
              <li>Dane wejściowe z faktur i dokumentów, nie z „szacunków w kolumnie H”.</li>
              <li>Statusy, override i pełna historia zmian pod audyt.</li>
              <li>Gotowość do pracy zespołu: ESG, finanse, księgowość.</li>
            </ul>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 8 }}>
              <Link href="/kontakt#demo" className="mkt-btn mkt-btn--primary">
                Umów demo
              </Link>
              <Link href="/jak-dziala" className="mkt-btn mkt-btn--secondary">
                Zobacz jak działa
              </Link>
            </div>
            <div className="mkt-trust">
              <span>
                <i /> Import KSeF + OCR
              </span>
              <span>
                <i /> Scope 1–3
              </span>
              <span>
                <i /> Review &amp; audit trail
              </span>
              <span>
                <i /> Hosting w UE (dostępność zależna od wdrożenia)
              </span>
            </div>
          </div>
          <div className="mkt-hero-visual">
            <Image
              src="/marketing/hero-scopeo-mint.png"
              alt="Scopeo — dashboard emisji, workflow i import z KSeF"
              width={1200}
              height={720}
              priority
              sizes="(max-width: 960px) 100vw, 50vw"
            />
          </div>
        </div>
      </section>

      <section className="mkt-section mkt-section--dark">
        <div className="mkt-inner">
          <p className="mkt-kicker mkt-kicker--on-dark">Widok produktu</p>
          <h2 className="mkt-section-title">Workflow, dashboard i import — jedna aplikacja</h2>
          <p className="mkt-section-lead">
            Przełączaj się między dashboardem emisji, kolejką review oraz importem z KSeF (i plików
            pomocniczych), z pełnym audit trail.
          </p>
          <div className="mkt-dark-shot" style={{ marginTop: 8 }}>
            <Image
              src="/marketing/section-product-dark.png"
              alt="Scopeo — widoki produktu: workflow review, dashboard emisji, audit trail"
              width={1200}
              height={640}
              sizes="(max-width: 960px) 100vw, min(1120px, 100vw)"
            />
          </div>
        </div>
      </section>

      <section className="mkt-section mkt-section--surface">
        <div className="mkt-inner">
          <p className="mkt-kicker">Problem</p>
          <h2 className="mkt-section-title">Excel nie skaluje się do pracy nad emisjami</h2>
          <p className="mkt-section-lead">
            Arkusze rozproszone po zespołach, ręczne mapowanie linii do kategorii, brak jednej historii
            zmian i trudny przegląd między księgowością a ESG. To kosztuje czas i podnosi ryzyko błędu
            przy raportowaniu.
          </p>
          <div className="mkt-split">
            <div className="mkt-card">
              <span className="mkt-pill-bad">Stan obecny</span>
              <p style={{ margin: 0, fontSize: '0.9375rem', color: '#64748b', lineHeight: 1.55 }}>
                Wiele plików, kopiowanie współczynników, niejasne „kto zatwierdził liczbę”, brak
                spójnego audit trailu. Trudno odtworzyć decyzje sprzed kwartału.
              </p>
            </div>
            <div className="mkt-card">
              <span className="mkt-pill-good">Z Scopeo</span>
              <p style={{ margin: 0, fontSize: '0.9375rem', color: '#64748b', lineHeight: 1.55 }}>
                Jedna baza danych z KSeF (i dokumentów), mapowanie do Scope 1–3, kolejka review,
                statusy i zapis zmian — tak, by dało się to uzasadnić wobec zarządu i audytora.
              </p>
            </div>
          </div>
          <p style={{ marginTop: 28, marginBottom: 0, fontSize: '0.9375rem', color: '#64748b', lineHeight: 1.6 }}>
            Na rynku popularne są też szkolenia, przewodniki i proste kalkulatory — dobry start merytoryczny.
            Scopeo jest następnym krokiem:{' '}
            <strong>operacyjny system</strong> z KSeF i audytowalnym procesem, gdy Excel przestaje wystarczać.{' '}
            <Link href="/wiedza/rynek-i-metodyka" className="mkt-link">
              Rynek i metodyka →
            </Link>
          </p>
        </div>
      </section>

      <section className="mkt-section">
        <div className="mkt-inner">
          <p className="mkt-kicker">Transformacja</p>
          <h2 className="mkt-section-title">Od faktur w KSeF do uporządkowanych danych emisyjnych</h2>
          <p className="mkt-section-lead">
            Scopeo wiąże dane źródłowe z procesem: import, normalizacja, przypisanie do emisji,
            przejście przez review i zamknięcie okresu z czytelnym śladem.
          </p>
          <div className="mkt-showcase-grid">
            <ImportOverviewMock />
            <ReviewQueueMock />
          </div>
        </div>
      </section>

      <section className="mkt-section mkt-section--surface">
        <div className="mkt-inner">
          <p className="mkt-kicker">Proces</p>
          <h2 className="mkt-section-title">Jak to działa — trzy kroki</h2>
          <div className="mkt-steps">
            <div className="mkt-card">
              <div className="mkt-step-num">1</div>
              <h3 style={{ margin: '0 0 8px', fontSize: '1rem' }}>Połącz dane z KSeF</h3>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b', lineHeight: 1.55 }}>
                Import faktur i dokumentów, OCR tam, gdzie potrzeba, synchronizacja i statusy
                przetwarzania.
              </p>
            </div>
            <div className="mkt-card">
              <div className="mkt-step-num">2</div>
              <h3 style={{ margin: '0 0 8px', fontSize: '1rem' }}>Mapuj do Scope 1, 2 i 3</h3>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b', lineHeight: 1.55 }}>
                Przypisanie linii do kategorii emisji, współczynniki i reguły — z kontrolą jakości
                danych.
              </p>
            </div>
            <div className="mkt-card">
              <div className="mkt-step-num">3</div>
              <h3 style={{ margin: '0 0 8px', fontSize: '1rem' }}>Review i wynik</h3>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b', lineHeight: 1.55 }}>
                Akceptacje, override z uzasadnieniem, audit trail — gotowość do dalszego raportowania.
              </p>
            </div>
          </div>
          <p style={{ marginTop: 24, textAlign: 'center' }}>
            <Link href="/jak-dziala" className="mkt-link">
              Pełny opis procesu →
            </Link>
          </p>
        </div>
      </section>

      <section className="mkt-section">
        <div className="mkt-inner">
          <p className="mkt-kicker">Produkt</p>
          <h2 className="mkt-section-title">Widoki, które zobaczą CFO, ESG i księgowość</h2>
          <p className="mkt-section-lead">
            Poniżej przykładowe ekrany systemowe — uproszczone wizualnie, ale odzwierciedlające logikę
            produktu: dashboard, kolejka review, audit trail i porównanie zmian.
          </p>
          <div className="mkt-showcase-grid">
            <DashboardEmissionsMock />
            <DiffMock />
          </div>
          <div className="mkt-showcase-grid" style={{ marginTop: 20 }}>
            <AuditTrailMock />
            <ReviewQueueMock />
          </div>
          <p style={{ marginTop: 24, textAlign: 'center' }}>
            <Link href="/produkt" className="mkt-link">
              Moduły produktu →
            </Link>
          </p>
        </div>
      </section>

      <section className="mkt-section mkt-section--surface">
        <div className="mkt-inner">
          <h2 className="mkt-section-title">Efekty biznesowe</h2>
          <p className="mkt-section-lead">
            Mniej ręcznej pracy, szybsza analiza, większa kontrola i spójność danych między działami.
          </p>
          <div className="mkt-grid-3">
            {[
              {
                t: 'Mniej pracy ręcznej',
                d: 'Mniej kopiowania między arkuszami — więcej reguł i przepływu w systemie.',
              },
              {
                t: 'Większa kontrola',
                d: 'Statusy, role i historia zmian w jednym miejscu.',
              },
              {
                t: 'Szybszy proces',
                d: 'Kolejka review i priorytety zamiast mailowania plików XLSX.',
              },
            ].map((x) => (
              <div key={x.t} className="mkt-card">
                <h3>{x.t}</h3>
                <p>{x.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mkt-section">
        <div className="mkt-inner">
          <p className="mkt-kicker">Dla kogo</p>
          <h2 className="mkt-section-title">Od MŚP po grupy kapitałowe</h2>
          <p className="mkt-section-lead">
            Scopeo adresuje zespoły, które muszą połączyć dane finansowe z KSeF z raportowaniem
            emisji — bez przenoszenia całej organizacji do „klimatycznego marketingu”.
          </p>
          <div className="mkt-grid-2">
            {[
              'Małe i średnie firmy przygotowujące się do raportowania',
              'Zespoły ESG i sustainability',
              'Finanse i księgowość',
              'Partnerzy doradczy i wdrożeniowi',
              'Grupy spółek wymagające spójnego procesu',
            ].map((t) => (
              <div key={t} className="mkt-card">
                <p style={{ margin: 0, fontWeight: 600 }}>{t}</p>
              </div>
            ))}
          </div>
          <p style={{ marginTop: 20 }}>
            <Link href="/dla-kogo" className="mkt-link">
              Segmenty →
            </Link>
          </p>
        </div>
      </section>

      <section className="mkt-section mkt-section--surface">
        <div className="mkt-inner">
          <h2 className="mkt-section-title">Cennik — skrót</h2>
          <p className="mkt-section-lead">
            Progresja według wolumenu faktur. Pełna tabela, przełącznik miesięcznie / rocznie i FAQ
            cenowe na stronie{' '}
            <Link href="/cennik" className="mkt-link">
              Cennik
            </Link>
            .
          </p>
          <div className="mkt-grid-3">
            {[
              { n: 'Micro', p: '149 zł / mc', d: 'do 50 faktur' },
              { n: 'Growth', p: '349 zł / mc', d: 'do 200 faktur · polecany', f: true },
              { n: 'Enterprise', p: 'Wycena', d: 'powyżej 1000 faktur' },
            ].map((x) => (
              <div
                key={x.n}
                className={`mkt-card${x.f ? ' mkt-price-card--featured' : ''}`}
                style={{ position: 'relative' }}
              >
                {x.f ? <span className="mkt-badge">Polecany</span> : null}
                <div className="mkt-price-name">{x.n}</div>
                <p className="mkt-price-desc">{x.d}</p>
                <div className="mkt-price-amount" style={{ fontSize: '1.25rem' }}>
                  {x.p}
                </div>
                <div style={{ marginTop: 16 }}>
                  <Link href="/cennik" className="mkt-btn mkt-btn--secondary" style={{ width: '100%' }}>
                    Pełny cennik
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mkt-section">
        <div className="mkt-inner">
          <h2 className="mkt-section-title">Najczęstsze pytania</h2>
          <div>
            {[
              {
                q: 'Czy Scopeo liczy wyłącznie z danych z KSeF?',
                a: 'KSeF jest głównym źródłem faktur. Dokumenty spoza KSeF można włączyć przez OCR i ręczne przypisanie — w ramach konfiguracji wdrożenia.',
              },
              {
                q: 'Czy obejmuje Scope 1, 2 i 3?',
                a: 'Tak — mapowanie linii do kategorii Scope 1–3 jest rdzeniem workflow.',
              },
              {
                q: 'Jak wygląda wdrożenie?',
                a: 'Start od konfiguracji organizacji, importu i szkolenia zespołu — czas zależy od skali; typowo od kilku dni do kilku tygodni.',
              },
              {
                q: 'Czy nadaje się dla MŚP?',
                a: 'Tak — niższe plany są liczone pod mniejszy wolumen faktur.',
              },
            ].map((x) => (
              <div key={x.q} className="mkt-faq-item">
                <p className="mkt-faq-q">{x.q}</p>
                <p className="mkt-faq-a">{x.a}</p>
              </div>
            ))}
          </div>
          <p style={{ marginTop: 16 }}>
            <Link href="/faq" className="mkt-link">
              Wszystkie odpowiedzi →
            </Link>
          </p>
        </div>
      </section>

      <section className="mkt-section mkt-section--surface" id="demo">
        <div className="mkt-inner">
          <div className="mkt-cta-band">
            <h2>Umów demo</h2>
            <p>
              Krótka rozmowa o wolumenie faktur, integracji z KSeF i oczekiwanym procesie review.
              Odezwiemy się w ciągu 1 dnia roboczego.
            </p>
            <div style={{ maxWidth: 440, margin: '0 auto', textAlign: 'left' }}>
              <LeadForm idPrefix="home" />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
