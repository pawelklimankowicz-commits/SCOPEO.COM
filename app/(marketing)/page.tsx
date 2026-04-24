import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { BrandLogoLockup } from '@/components/BrandLogo';
import { TrackedLink } from '@/components/TrackedLink';
import LandingVideo from '@/components/marketing/LandingVideo';
import LeadForm from '@/components/marketing/LeadForm';
import { IconClock, IconLeaf, IconTarget, IconTeam, IconTrend } from '@/components/marketing/LpHomeIcons';
import {
  AuditTrailMock,
  DashboardEmissionsMock,
  DiffMock,
  ImportOverviewMock,
  ReviewQueueMock,
} from '@/components/marketing/ProductMockups';

export const metadata: Metadata = {
  title: 'Scopeo — ślad węglowy z faktur KSeF. Jasno, szybko, pod audyt.',
  description:
    'Import faktur z KSeF, Scope 1–3, workflow akceptacji i raport GHG / CSRD. Trial 7 dni. Dla finansów, ESG i zarządu.',
};

const PILLARS = [
  {
    icon: <IconClock />,
    title: 'Mniej czasu na liczenie',
    text: 'Faktury z KSeF same trafiają do systemu. Nie przepisujesz ich do Excela — oszczędzasz godziny tygodniowo.',
  },
  {
    icon: <IconTarget />,
    title: 'Precyzja z dokumentów',
    text: 'Każda kwota ma źródło w fakturze i czynnik (m.in. KOBiZE). Mniej szacunków „z kolumny H”.',
  },
  {
    icon: <IconTrend />,
    title: 'Gotowość na regulacje',
    text: 'Dane pod raport emisji, CSRD/ESRS i rozmowy z kontrahentami — w jednym spójnym procesie.',
  },
  {
    icon: <IconTeam />,
    title: 'Zespół bez chaosu plików',
    text: 'Role, kolejka akceptacji i audit trail: finanse, ESG i zarząd widzą to samo.',
  },
];

const JOURNEY = [
  {
    n: '1',
    t: 'Zbierz dane',
    d: 'Połącz KSeF — faktury importują się automatycznie (także wstecz).',
  },
  { n: '2', t: 'Oceń emisje', d: 'Scope 1, 2 i 3 z mapowania linii do kategorii GHG.' },
  { n: '3', t: 'Ustal priorytety', d: 'Widzisz, które kategorie i dostawcy dominują w wyniku.' },
  { n: '4', t: 'Wdrażaj poprawki', d: 'Workflow review: korekty z historią — kto, kiedy, dlaczego.' },
  { n: '5', t: 'Raportuj', d: 'PDF, CSV, XML — ślad audytowy do każdej decyzji.' },
];

const WHY = [
  {
    h: 'Regulacje',
    p: 'CSRD i inne wymogi dot. emisji — lepiej mieć dane zgodne z metodyką niż doganiać termin.',
  },
  { h: 'Przetargi i klienci', p: 'Coraz częściej pytają o GHG i łańcuch dostaw — odpowiadasz konkretami, nie ogólnikami.' },
  { h: 'Wiarygodność', p: 'Źródło każdej liczby w fakturze ułatwia rozmowę z audytorem i inwestorem.' },
  { h: 'Klimat', p: 'Nie da się sensownie redukować emisji, których się nie zmierzyło systematycznie.' },
];

export default function MarketingHomePage() {
  return (
    <>
      {/* HERO — jeden główny przekaz, krótko */}
      <section className="mkt-hero mkt-lp-hero">
        <div className="mkt-inner mkt-hero-grid">
          <div>
            <div className="mkt-hero-brand">
              <BrandLogoLockup
                size={17}
                withWordmark
                wordmarkColor="var(--mkt-headline)"
                taglineColor="#475569"
              />
            </div>
            <p className="mkt-lp-eyebrow">Ślad węglowy organizacji · KSeF · GHG Protocol</p>
            <h1 className="mkt-hero-title mkt-lp-hero-title">
              Dane emisyjne z faktur —<br />jasno, szybko, pod audyt
            </h1>
            <p className="mkt-hero-sub mkt-lp-hero-lead">
              Scopeo pobiera faktury z KSeF, przypisuje je do Scope 1–3 i prowadzi akceptację zmian z pełnym śladem
              audytowym. <strong>Bez ręcznego Excela</strong> — dla zespołów finansów, ESG i zarządu.
            </p>
            <ul className="mkt-lp-ticks" aria-label="Krótko, co zyskujesz">
              <li>Automatyczny import z KSeF</li>
              <li>Scope 1–3 z metodyką i dowodami</li>
              <li>Raport i eksporty pod raportowanie</li>
            </ul>
            <div className="mkt-lp-cta-row">
              <TrackedLink
                href="/register"
                eventName="mkt.cta.hero_trial"
                className="mkt-btn mkt-btn--primary"
              >
                Trial 7 dni — za darmo
              </TrackedLink>
              <TrackedLink
                href="/jak-dziala"
                eventName="mkt.cta.hero_how_it_works"
                className="mkt-btn mkt-btn--secondary"
              >
                Jak to działa
              </TrackedLink>
            </div>
            <div className="mkt-trust mkt-lp-trust" aria-label="Zaufanie">
              <span>
                <i /> Dane w UE
              </span>
              <span>
                <i /> Szyfrowanie tokenów KSeF
              </span>
              <span>
                <i /> Role i uprawnienia
              </span>
              <span>
                <i /> Audit trail
              </span>
            </div>
            <p className="mkt-lp-hero-link">
              <Link href="/slad-weglowy" className="mkt-link">
                Pełny opis produktu: ślad węglowy →
              </Link>
            </p>
          </div>
          <div className="mkt-hero-visual mkt-lp-hero-visual">
            <Image
              src="/marketing/hero-scopeo-mint.png"
              alt="Panel Scopeo: emisje, import KSeF, kolejka akceptacji"
              width={1200}
              height={720}
              priority
              sizes="(max-width: 960px) 100vw, 50vw"
            />
          </div>
        </div>
      </section>

      {/* 4 filary — czytelnie dla każdego klienta */}
      <section className="mkt-section mkt-lp-pillars">
        <div className="mkt-inner">
          <h2 className="mkt-lp-section-title">Dlaczego firmy wybierają Scopeo</h2>
          <p className="mkt-lp-section-lead">
            Prościej niż z arkuszami, dokładniej niż z samych szacunków — w czterech obszarach, które
            widać w codziennej pracy.
          </p>
          <div className="mkt-lp-pillar-grid">
            {PILLARS.map((x) => (
              <div key={x.title} className="mkt-lp-pillar">
                <div className="mkt-lp-pillar-icon">{x.icon}</div>
                <h3>{x.title}</h3>
                <p>{x.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <LandingVideo />

      {/* Widok produktu */}
      <section className="mkt-section mkt-section--dark">
        <div className="mkt-inner">
          <p className="mkt-kicker mkt-kicker--on-dark">Jeden system</p>
          <h2 className="mkt-section-title">Zamiast czterech plików Excel</h2>
          <p className="mkt-section-lead mkt-lp-tight">
            Emisje, akceptacje, import i historia zmian — w jednej aplikacji, żeby finanse i ESG mówiły
            tym samym językiem liczb.
          </p>
          <div className="mkt-dark-shot" style={{ marginTop: 8 }}>
            <Image
              src="/marketing/section-product-dark.png"
              alt="Scopeo — pulpit emisji i proces akceptacji"
              width={1200}
              height={640}
              sizes="(max-width: 960px) 100vw, min(1120px, 100vw)"
            />
          </div>
        </div>
      </section>

      {/* Ścieżka: od danych do odpowiedzialności (jak “Your Path to Impact”) */}
      <section className="mkt-section mkt-lp-surface">
        <div className="mkt-inner">
          <h2 className="mkt-lp-section-title">Od faktur do odpowiedzialnego raportu</h2>
          <p className="mkt-lp-section-lead">
            Pięć etapów — zrozumiałych nie tylko dla specjalisty od klimatu. Szczegóły techniczne
            opisaliśmy na stronie <Link href="/jak-dziala">Jak działa</Link>.
          </p>
          <ol className="mkt-lp-journey" aria-label="Etapy pracy w Scopeo">
            {JOURNEY.map((step) => (
              <li key={step.n} className="mkt-lp-journey-step">
                <span className="mkt-lp-journey-num" aria-hidden>
                  {step.n}
                </span>
                <h3>{step.t}</h3>
                <p>{step.d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Po co liczyć emisje? */}
      <section className="mkt-section">
        <div className="mkt-inner">
          <h2 className="mkt-lp-section-title">Po co w ogóle liczyć emisje?</h2>
          <p className="mkt-lp-section-lead">Cztery powody, które słyszymy najczęściej od firm w Polsce i UE.</p>
          <div className="mkt-lp-why-grid">
            {WHY.map((w) => (
              <div key={w.h} className="mkt-lp-why-card">
                <div className="mkt-lp-why-ic" aria-hidden>
                  <IconLeaf />
                </div>
                <h3>{w.h}</h3>
                <p>{w.p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Standardy */}
      <section className="mkt-lp-standards" aria-label="Zgodność z metodykami">
        <div className="mkt-inner mkt-lp-standards-inner">
          <span className="mkt-lp-standards-label">Praca z danymi zgodna z uznanymi ramami</span>
          <ul className="mkt-lp-standards-chips">
            <li>GHG Protocol (Scope 1–3)</li>
            <li>Przygotowanie danych pod CSRD / ESRS</li>
            <li>Współczynniki m.in. KOBiZE</li>
            <li>Ślad audytowy (audit trail)</li>
          </ul>
        </div>
      </section>

      {/* Przed / po — krótko */}
      <section className="mkt-section mkt-lp-surface">
        <div className="mkt-inner">
          <h2 className="mkt-lp-section-title">Excel to nie system emisyjny</h2>
          <p className="mkt-lp-section-lead">
            Ręczne kopiowanie faktur między plikami to ryzyko błędów i brak historii decyzji. Scopeo
            to zmienia — bez wdrożenia na wiele miesięcy.
          </p>
          <div className="mkt-split mkt-lp-gap">
            <div className="mkt-card">
              <span className="mkt-pill-bad">Bez Scopeo</span>
              <p className="mkt-lp-card-p">
                Wiele wersji plików, brak jasnego „kto to zmienił”, trudne odtworzenie przed audytem.
              </p>
            </div>
            <div className="mkt-card">
              <span className="mkt-pill-good">Ze Scopeo</span>
              <p className="mkt-lp-card-p">
                Jedno źródło, automatyczny import KSeF, pełna historia korekt i powiązań do faktur.
              </p>
            </div>
          </div>
          <p className="mkt-lp-footlink">
            <Link href="/wiedza/rynek-i-metodyka" className="mkt-link">
              Rynek i metodyka — dla kogo jest Scopeo →
            </Link>
          </p>
        </div>
      </section>

      {/* 3 kroki + mocki */}
      <section className="mkt-section">
        <div className="mkt-inner">
          <p className="mkt-kicker">Start w jeden dzień</p>
          <h2 className="mkt-section-title">Trzy proste kroki</h2>
          <p className="mkt-section-lead mkt-lp-tight">
            Większość zespołów ma pierwsze wyniki jeszcze w dniu uruchomienia — bez osobnego projektu IT.
          </p>
          <div className="mkt-showcase-grid">
            <ImportOverviewMock />
            <ReviewQueueMock />
          </div>
          <div className="mkt-steps" style={{ marginTop: 32 }}>
            <div className="mkt-card">
              <div className="mkt-step-num">1</div>
              <h3>Połącz KSeF</h3>
              <p>
                Token autoryzacyjny — raz. Faktury historyczne i bieżące trafiają do systemu
                automatycznie.
              </p>
            </div>
            <div className="mkt-card">
              <div className="mkt-step-num">2</div>
              <h3>Mapowanie do Scope 1–3</h3>
              <p>
                System przypisuje linie do kategorii; wyjątki w kolejce z uzasadnieniem. Scope 3 od planu
                Starter.
              </p>
            </div>
            <div className="mkt-card">
              <div className="mkt-step-num">3</div>
              <h3>Raport i ślad</h3>
              <p>Dashboard, PDF, CSV, XML. Każda zmiana: kto, kiedy, dlaczego — pod kontrolą audytu.</p>
            </div>
          </div>
          <p className="mkt-lp-footlink" style={{ textAlign: 'center' }}>
            <Link href="/jak-dziala" className="mkt-link">
              Szczegółowy przepływ →
            </Link>
          </p>
        </div>
      </section>

      <section className="mkt-section mkt-lp-surface">
        <div className="mkt-inner">
          <p className="mkt-kicker">W produkcie</p>
          <h2 className="mkt-section-title">Widoki dla CFO, ESG i osoby zatwierdzającej dane</h2>
          <p className="mkt-section-lead mkt-lp-tight">Te same dane — różne perspektywy, bez wysyłania plików e-mailem.</p>
          <div className="mkt-showcase-grid">
            <DashboardEmissionsMock />
            <DiffMock />
          </div>
          <div className="mkt-showcase-grid" style={{ marginTop: 20 }}>
            <AuditTrailMock />
            <ReviewQueueMock />
          </div>
          <p className="mkt-lp-footlink" style={{ textAlign: 'center' }}>
            <Link href="/produkt" className="mkt-link">
              Moduły produktu →
            </Link>
          </p>
        </div>
      </section>

      {/* Dla kogo */}
      <section className="mkt-section">
        <div className="mkt-inner">
          <h2 className="mkt-lp-section-title">Dla kogo jest Scopeo?</h2>
          <p className="mkt-lp-section-lead">Krótka lista — jeśli coś do Ciebie pasuje, trial zweryfikuje to na Twoich fakturach.</p>
          <div className="mkt-grid-2 mkt-lp-gap">
            {[
              'Dział finansów i księgowości — jedno źródło prawdy',
              'Zespół ESG / sustainability',
              'MŚP startujące z raportowaniem emisji',
              'Grupy wielu spółek — wiele KSeF, jeden proces',
              'Biura rachunkowe — wielu klientów, kontrolowany dostęp',
            ].map((t) => (
              <div key={t} className="mkt-card mkt-lp-who">
                <p>{t}</p>
              </div>
            ))}
          </div>
          <p className="mkt-lp-footlink">
            <Link href="/dla-kogo" className="mkt-link">
              Segmenty i scenariusze →
            </Link>
          </p>
        </div>
      </section>

      {/* Cennik — porównanie */}
      <section className="mkt-section mkt-lp-surface">
        <div className="mkt-inner">
          <h2 className="mkt-lp-section-title">Cennik — płatność za KSeF i użytkowników, nie za faktury</h2>
          <p className="mkt-lp-section-lead">
            Trial 7 dni, bez karty. Rabat 10% przy płatności za 12 miesięcy z góry. Pełna tabela:{' '}
            <Link href="/cennik" className="mkt-link">
              cennik
            </Link>
            .
          </p>
          <div
            className="mkt-grid-3 mkt-lp-pricing"
            style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}
          >
            {[
              { n: 'Mikro', p: '149 zł / mc', d: '1 KSeF · 1 użytkownik' },
              { n: 'Starter', p: '279 zł / mc', d: '1 KSeF · do 5 użytkowników' },
              { n: 'Growth', p: '499 zł / mc', d: '3 KSeF · do 15 użytkowników', f: true },
              { n: 'Scale', p: '849 zł / mc', d: '10 KSeF · bez limitu użytkowników' },
            ].map((x) => (
              <div
                key={x.n}
                className={`mkt-card${x.f ? ' mkt-price-card--featured' : ''}`}
                style={{ position: 'relative' }}
              >
                {x.f ? <span className="mkt-badge">Często wybierany</span> : null}
                <div className="mkt-price-name">{x.n}</div>
                <p className="mkt-price-desc">{x.d}</p>
                <div className="mkt-price-amount" style={{ fontSize: '1.25rem' }}>
                  {x.p}
                </div>
                <div style={{ marginTop: 16 }}>
                  <Link href="/cennik" className="mkt-btn mkt-btn--secondary" style={{ width: '100%' }}>
                    Zobacz plany
                  </Link>
                </div>
              </div>
            ))}
          </div>
          <p className="mkt-lp-pricing-note">Enterprise — gdy potrzebujesz SSO, wielu jednostek lub dedykowanego wsparcia.</p>
        </div>
      </section>

      {/* FAQ */}
      <section className="mkt-section">
        <div className="mkt-inner mkt-lp-faq">
          <h2 className="mkt-lp-section-title">Pytania, na które odpowiadamy najczęściej</h2>
          <p className="mkt-lp-section-lead" style={{ marginBottom: 24 }}>
            Szukasz krótszej odpowiedzi? <Link href="/faq">Zobacz pełne FAQ</Link> lub napisz przez{' '}
            <Link href="/kontakt">kontakt</Link>.
          </p>
          <div className="mkt-faq-list">
            {[
              {
                q: 'Czy muszę przepisywać faktury ręcznie?',
                a: 'Nie. Po jednorazowym połączeniu z KSeF faktury trafiają do Scopeo same — Ty koncentrujesz się na weryfikacji i ewentualnych korektach w kolejce.',
              },
              {
                q: 'Czy to jest tylko pod CSRD?',
                a: 'Nie. Dane emisyjne są potrzebne także przy przetargach, wymaganiach kontrahentów i własnej strategii klimatycznej. CSRD to jeden z motywów — nie jedyny.',
              },
              {
                q: 'Czy obejmujecie Scope 1, 2 i 3?',
                a: 'Tak. Mapowanie linii faktur do kategorii Scope 1–3 to rdzeń produktu. Scope 3 w pełniejszym zakresie od planu Starter.',
              },
              {
                q: 'Czy ktoś spoza ESG da radę to obsłużyć?',
                a: 'Tak. Interface jest zaprojektowany tak, aby księgowość i finanse mogły prowadzić import i pierwsze przeglądy; ESG wchodzi w akceptację tam, gdzie trzeba.',
              },
            ].map((x) => (
              <div key={x.q} className="mkt-faq-item">
                <p className="mkt-faq-q">{x.q}</p>
                <p className="mkt-faq-a">{x.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA końcowe */}
      <section className="mkt-section" id="demo">
        <div className="mkt-inner">
          <div className="mkt-cta-band mkt-lp-cta-final">
            <h2>7 dni trialu — za darmo, bez karty</h2>
            <p>
              Zarejestruj konto, podłącz KSeF i zobacz pierwsze agregacje emisji na własnych
              fakturach. Bez karty, bez długiej umowy.
            </p>
            <div className="mkt-lp-cta-row" style={{ justifyContent: 'center' }}>
              <Link href="/register" className="mkt-btn mkt-btn--primary">
                Otwórz trial
              </Link>
              <Link href="/kontakt" className="mkt-btn mkt-btn--secondary">
                Porozmawiaj z nami
              </Link>
            </div>
            <p className="mkt-lp-cta-hint">Wolisz demo? Zostaw dane — oddzwonimy w 1 dzień roboczy.</p>
            <div className="mkt-lp-leadform">
              <LeadForm idPrefix="home" />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
