import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { BrandLogoLockup } from '@/components/BrandLogo';
import { DashboardEmissionsMock } from '@/components/marketing/ProductMockups';

export const metadata: Metadata = {
  title: 'Ślad węglowy firmy — pomiar, proces, raport | Scopeo',
  description:
    'Automatyczny pomiar emisji GHG z faktur KSeF: Scope 1–3, workflow akceptacji, raport PDF i eksport pod CSRD. Hosting w UE.',
};

function IconMeasure() {
  return (
    <svg className="mkt-cf-icon-svg" viewBox="0 0 48 48" fill="none" aria-hidden>
      <rect x="6" y="28" width="8" height="14" rx="2" fill="currentColor" opacity="0.35" />
      <rect x="18" y="18" width="8" height="24" rx="2" fill="currentColor" opacity="0.55" />
      <rect x="30" y="8" width="8" height="34" rx="2" fill="currentColor" />
      <path d="M6 26h36" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
    </svg>
  );
}

function IconFlow() {
  return (
    <svg className="mkt-cf-icon-svg" viewBox="0 0 48 48" fill="none" aria-hidden>
      <circle cx="14" cy="24" r="6" stroke="currentColor" strokeWidth="2" />
      <circle cx="34" cy="14" r="5" stroke="currentColor" strokeWidth="2" />
      <circle cx="34" cy="34" r="5" stroke="currentColor" strokeWidth="2" />
      <path d="M20 22l8-6M20 26l8 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function IconReport() {
  return (
    <svg className="mkt-cf-icon-svg" viewBox="0 0 48 48" fill="none" aria-hidden>
      <path
        d="M14 8h14l8 8v26a3 3 0 0 1-3 3H14a3 3 0 0 1-3-3V11a3 3 0 0 1 3-3z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M28 8v8h8M18 22h14M18 28h14M18 34h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function IconShield() {
  return (
    <svg className="mkt-cf-icon-svg" viewBox="0 0 48 48" fill="none" aria-hidden>
      <path
        d="M24 6l14 6v12c0 9.5-6 17.5-14 20-8-2.5-14-10.5-14-20V12l14-6z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M17 24l5 5 10-12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconKsef() {
  return (
    <svg className="mkt-cf-icon-svg" viewBox="0 0 48 48" fill="none" aria-hidden>
      <rect x="8" y="10" width="32" height="28" rx="3" stroke="currentColor" strokeWidth="2" />
      <path d="M8 18h32M16 26h16M16 32h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="34" cy="14" r="3" fill="currentColor" />
    </svg>
  );
}

function IconTeam() {
  return (
    <svg className="mkt-cf-icon-svg" viewBox="0 0 48 48" fill="none" aria-hidden>
      <circle cx="18" cy="16" r="5" stroke="currentColor" strokeWidth="2" />
      <path d="M10 36c0-5 3.5-8 8-8s8 3 8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="32" cy="17" r="4" stroke="currentColor" strokeWidth="2" />
      <path d="M26 36c0-3.5 2.5-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

const pillars = [
  {
    title: 'Pomiar z dokumentów źródłowych',
    body:
      'Zamiast szacunków w arkuszu — linie faktur z KSeF mapowane do kategorii Scope 1, 2 i 3. Współczynniki emisji (np. KOBiZE) stosowane spójnie; wyjątki trafiają do kolejki akceptacji z uzasadnieniem.',
    icon: <IconMeasure />,
  },
  {
    title: 'Proces zespołowy, nie „cichy Excel”',
    body:
      'Role (Owner, Analyst, Reviewer…), statusy recenzji i pełny audit trail. Finanse, ESG i księgowość widzą tę samą wersję danych — bez rozjeżdżających się plików.',
    icon: <IconFlow />,
  },
  {
    title: 'Raport i materiał pod zgodność',
    body:
      'Raport GHG w PDF, eksporty CSV/XML/JSON pod dalszą obróbkę i CSRD/ESRS (wg planu). Gotowe pod pracę z audytorem wewnętrznym lub zewnętrznym.',
    icon: <IconReport />,
  },
];

const capabilities = [
  {
    title: 'Integracja z KSeF',
    body: 'Automatyczny import faktur — jednorazowa konfiguracja tokenu, potem bieżąca synchronizacja.',
    icon: <IconKsef />,
  },
  {
    title: 'Kontrola jakości danych',
    body: 'Widzisz status importu, błędy parsowania i pozycje oczekujące na decyzję — zanim trafią do raportu.',
    icon: <IconShield />,
  },
  {
    title: 'Zespół na jednej platformie',
    body: 'Zaproszenia e‑mail, granularne uprawnienia i historia zmian per użytkownik.',
    icon: <IconTeam />,
  },
  {
    title: 'Dashboard Scope 1–3',
    body: 'Agregaty, udział kategorii i przejście do szczegółu — od liczb do faktury jednym kliknięciem.',
    icon: <IconMeasure />,
  },
  {
    title: 'Workflow akceptacji',
    body: 'Kolejka recenzji, nadpisania z komentarzem i ślad audytowy dla każdej zmiany kategorii.',
    icon: <IconFlow />,
  },
  {
    title: 'Eksport i archiwizacja',
    body: 'Pakiet pod raport roczny, odpowiedź kontrahenta lub przygotowanie pakietu dla doradcy.',
    icon: <IconReport />,
  },
];

export default function SladWeglowyPage() {
  return (
    <>
      <section className="mkt-cf-hero">
        <div className="mkt-inner mkt-cf-hero-grid">
          <div>
            <p className="mkt-kicker mkt-kicker--on-dark">Produkt</p>
            <h1 className="mkt-cf-hero-title">Ślad węglowy organizacji — od faktury do raportu</h1>
            <p className="mkt-cf-hero-lead">
              Scopeo łączy KSeF z metodyką GHG: automatycznie klasyfikuje zużycie i zakupy, wspiera akceptację
              przez zespół i generuje materiał raportowy z pełnym źródłem danych.
            </p>
            <div className="mkt-cf-hero-cta">
              <Link href="/register" className="mkt-btn mkt-btn--lime">
                Bezpłatny trial — 7 dni
              </Link>
              <Link href="/kontakt#demo" className="mkt-btn mkt-btn--secondary mkt-cf-hero-cta-secondary">
                Umów demo
              </Link>
            </div>
            <p className="mkt-cf-hero-note">Hosting w UE · dane szyfrowane w spoczynku</p>
          </div>
          <div className="mkt-cf-hero-card" aria-hidden>
            <div className="mkt-cf-hero-card-inner">
              <BrandLogoLockup size={22} withWordmark wordmarkSurface="dark" taglineColor="#94a3b8" />
              <ul className="mkt-cf-hero-checklist">
                <li>Import KSeF (wielokrotne połączenia w wyższych planach)</li>
                <li>Scope 1, 2 i 3 z mapowania faktur</li>
                <li>Raport PDF + eksporty pod CSRD (wg planu)</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="mkt-section mkt-cf-stats-wrap">
        <div className="mkt-inner">
          <div className="mkt-cf-stats" role="list">
            <div className="mkt-cf-stat" role="listitem">
              <strong>GHG Protocol</strong>
              <span>Ramy corporate standard — raport zgodny z podejściem organizacyjnym</span>
            </div>
            <div className="mkt-cf-stat" role="listitem">
              <strong>Scope 1–3</strong>
              <span>Jeden model danych od paliw i energii po zakupy i usługi</span>
            </div>
            <div className="mkt-cf-stat" role="listitem">
              <strong>KSeF</strong>
              <span>Źródło prawdy z faktur — mniej ręcznej pracy i przepisywania</span>
            </div>
          </div>
        </div>
      </section>

      <section className="mkt-section mkt-section--surface">
        <div className="mkt-inner">
          <p className="mkt-kicker">Trzy filary</p>
          <h2 className="mkt-section-title">Pomiar, proces, raport — w jednym produkcie</h2>
          <p className="mkt-section-lead">
            Struktura podobna do klasycznego „measure – collaborate – report”, ale osadzona w polskim KSeF
            i w codziennej pracy finansów oraz ESG.
          </p>
          <div className="mkt-cf-pillars">
            {pillars.map((p) => (
              <article key={p.title} className="mkt-cf-pillar">
                <div className="mkt-cf-pillar-icon">{p.icon}</div>
                <h3>{p.title}</h3>
                <p>{p.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mkt-section">
        <div className="mkt-inner">
          <p className="mkt-kicker">Możliwości</p>
          <h2 className="mkt-section-title">Co dokładnie dostajesz w Scopeo</h2>
          <p className="mkt-section-lead">
            Siatka poniżej to skrót modułów — szczegóły techniczne i porównanie planów znajdziesz na stronie Produkt.
          </p>
          <div className="mkt-cf-grid">
            {capabilities.map((c) => (
              <div key={c.title} className="mkt-cf-cap">
                <div className="mkt-cf-cap-icon">{c.icon}</div>
                <h3>{c.title}</h3>
                <p>{c.body}</p>
              </div>
            ))}
          </div>
          <p style={{ marginTop: 24, textAlign: 'center' }}>
            <Link href="/produkt" className="mkt-link">
              Pełny opis modułów →
            </Link>
          </p>
        </div>
      </section>

      <section className="mkt-section mkt-section--dark">
        <div className="mkt-inner">
          <p className="mkt-kicker mkt-kicker--on-dark">Podgląd</p>
          <h2 className="mkt-section-title">Widok dashboardu — emisje z podziałem na zakresy</h2>
          <p className="mkt-section-lead">
            Interaktywna makietka UI: agregaty, trendy i kontekst kategorii — bez dostępu do Twojej bazy.
          </p>
          <div className="mkt-cf-mock-wrap">
            <DashboardEmissionsMock />
          </div>
        </div>
      </section>

      <section className="mkt-section mkt-section--surface">
        <div className="mkt-inner mkt-cf-bento">
          <div className="mkt-cf-bento-main mkt-card">
            <h2 className="mkt-section-title" style={{ fontSize: '1.35rem', marginBottom: 12 }}>
              Dlaczego faktury, a nie tylko ankietowe oszacowania?
            </h2>
            <p style={{ margin: 0, color: 'var(--mkt-muted)', lineHeight: 1.65 }}>
              Ślad węglowy oparty na transakcjach lepiej znosi weryfikację: do każdej kwoty można dołączyć numer faktury,
              datę, dostawcę i ścieżkę akceptacji. To szczególnie ważne przy Scope 3, gdzie tradycyjne kalkulatory
              bywają trudne do obrony przed audytorem.
            </p>
            <p style={{ margin: '16px 0 0', color: 'var(--mkt-muted)', lineHeight: 1.65 }}>
              Scopeo nie zastępuje polityki klimatycznej ani celów redukcyjnych — dostarcza spójny, audytowalny
              fundament liczb, na którym zespół i doradcy mogą dalej pracować.
            </p>
          </div>
          <div className="mkt-cf-bento-side">
            <div className="mkt-card mkt-cf-bento-tile">
              <h3>CSRD i raportowanie</h3>
              <p>Przygotowanie danych emisyjnych pod raport niefinansowy — zgodnie z funkcjami w Twoim planie.</p>
              <Link href="/wiedza/rynek-i-metodyka" className="mkt-link">
                Rynek i metodyka →
              </Link>
            </div>
            <div className="mkt-card mkt-cf-bento-tile mkt-cf-bento-tile--visual">
              <Image
                src="/marketing/section-product-dark.png"
                alt="Scopeo — panel emisji na ciemnym tle"
                width={560}
                height={300}
                sizes="(max-width: 720px) 100vw, 400px"
                className="mkt-cf-bento-img"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="mkt-section">
        <div className="mkt-inner mkt-cta-band">
          <h2>Zmierz ślad węglowy na danych, które już masz w KSeF</h2>
          <p>Trial 7 dni, pełna funkcja importu i raportu w ramach planu — zacznij od rejestracji lub zapisz się na demo.</p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Link href="/register" className="mkt-btn mkt-btn--primary">
              Zarejestruj się
            </Link>
            <Link href="/cennik" className="mkt-btn mkt-btn--secondary">
              Zobacz cennik
            </Link>
            <Link href="/faq" className="mkt-btn mkt-btn--secondary">
              FAQ
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
