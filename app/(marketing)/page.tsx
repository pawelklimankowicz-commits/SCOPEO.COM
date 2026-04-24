import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { BrandLogoLockup } from '@/components/BrandLogo';
import { TrackedLink } from '@/components/TrackedLink';
import LandingVideo from '@/components/marketing/LandingVideo';
import LeadForm from '@/components/marketing/LeadForm';
import {
  AuditTrailMock,
  DashboardEmissionsMock,
  DiffMock,
  ImportOverviewMock,
  ReviewQueueMock,
} from '@/components/marketing/ProductMockups';

export const metadata: Metadata = {
  title: 'Scopeo — ślad węglowy Twojej firmy z faktur KSeF. Automatycznie.',
  description:
    'Import faktur z KSeF, automatyczne mapowanie do Scope 1–3, workflow akceptacji i raport gotowy na audyt. Zacznij bezpłatny trial — 7 dni.',
};

export default function MarketingHomePage() {
  return (
    <>
      {/* HERO */}
      <section className="mkt-hero">
        <div className="mkt-inner mkt-hero-grid">
          <div>
            <div className="mkt-hero-brand">
              <BrandLogoLockup
                size={24}
                withWordmark
                wordmarkColor="var(--mkt-headline)"
                taglineColor="#475569"
              />
            </div>
            <p className="mkt-hero-badge">KSeF · Scope 1–3 · CSRD 2026</p>
            <h1 className="mkt-hero-title">
              Od Twoich faktur w KSeF<br />do pełnego raportu śladu węglowego
            </h1>
            <p className="mkt-hero-sub">
              Scopeo automatycznie importuje faktury z Krajowego Systemu e-Faktur, przypisuje linie
              do kategorii emisji Scope 1, 2 i 3 oraz prowadzi workflow akceptacji z pełnym śladem
              audytowym (audit trail). Twoje dane są gotowe dla CFO, działu ESG i zewnętrznego
              audytora.
            </p>
            <ul className="mkt-bullets">
              <li>
                Bez ręcznego przepisywania faktur do Excela — import z KSeF działa automatycznie.
                Oszczędzasz czas i znacząco ograniczasz ryzyko kosztownej pomyłki.
              </li>
              <li>Każda decyzja o kategorii emisji zostaje zapisana, dzięki temu obrona przed audytorem trwa kilka sekund.</li>
              <li>Scope 3 z danych transakcyjnych, nie z szacunków z kolumny H Excel&apos;a.</li>
            </ul>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 24 }}>
              <TrackedLink
                href="/register"
                eventName="mkt.cta.hero_trial"
                className="mkt-btn mkt-btn--primary"
              >
                Zacznij bezpłatny trial — 7 dni
              </TrackedLink>
              <TrackedLink
                href="/jak-dziala"
                eventName="mkt.cta.hero_how_it_works"
                className="mkt-btn mkt-btn--secondary"
              >
                Zobacz jak działa
              </TrackedLink>
            </div>
            <div className="mkt-trust">
              <span><i /> Import z KSeF</span>
              <span><i /> Scope 1–3</span>
              <span><i /> Audit trail</span>
              <span><i /> Hosting w UE</span>
            </div>
            <p style={{ marginTop: 18, marginBottom: 0, fontSize: '0.875rem' }}>
              <Link
                href="/slad-weglowy"
                className="mkt-link"
                title="Adres strony w przeglądarce: /slad-weglowy (litery bez polskich znaków diakrytycznych)"
              >
                Ślad węglowy firmy — strona produktowa →
              </Link>
            </p>
          </div>
          <div className="mkt-hero-visual">
            <Image
              src="/marketing/hero-scopeo-mint.png"
              alt="Scopeo — dashboard emisji, workflow akceptacji i import z KSeF"
              width={1200}
              height={720}
              priority
              sizes="(max-width: 960px) 100vw, 50vw"
            />
          </div>
        </div>
      </section>

      <LandingVideo />

      {/* PRODUCT OVERVIEW */}
      <section className="mkt-section mkt-section--dark">
        <div className="mkt-inner">
          <p className="mkt-kicker mkt-kicker--on-dark">Widok produktu</p>
          <h2 className="mkt-section-title">Jeden system zamiast czterech arkuszy</h2>
          <p className="mkt-section-lead">
            Dashboard emisji, kolejka akceptacji, audit trail i import z KSeF — w jednym narzędziu
            dostępnym dla całego zespołu. ESG, finanse i księgowość pracują na tych samych danych.
          </p>
          <div className="mkt-dark-shot" style={{ marginTop: 8 }}>
            <Image
              src="/marketing/section-product-dark.png"
              alt="Scopeo — dashboard emisji, workflow akceptacji, audit trail"
              width={1200}
              height={640}
              sizes="(max-width: 960px) 100vw, min(1120px, 100vw)"
            />
          </div>
        </div>
      </section>

      {/* PROBLEM */}
      <section className="mkt-section mkt-section--surface">
        <div className="mkt-inner">
          <p className="mkt-kicker">Problem</p>
          <h2 className="mkt-section-title">Excel nie był projektowany do raportowania emisji</h2>
          <p className="mkt-section-lead">
            Większość firm próbuje liczyć ślad węglowy w arkuszach — przepisując faktury ręcznie,
            tworząc osobne pliki dla każdego działu i tracąc historię decyzji przy każdej aktualizacji.
            Kiedy pojawia się audytor lub zarząd pyta o metodologię, zaczyna się panika.
          </p>
          <div className="mkt-split">
            <div className="mkt-card">
              <span className="mkt-pill-bad">Teraz — bez Scopeo</span>
              <p style={{ margin: 0, fontSize: '0.9375rem', color: '#64748b', lineHeight: 1.6 }}>
                Faktury z KSeF pobierane ręcznie, dane kopiowane między plikami, różne wersje
                w ESG i księgowości, brak historii kto i kiedy zmienił kategorię. Przygotowanie
                raportu zajmuje tygodnie i kończy się kompromisem z audytorem.
              </p>
            </div>
            <div className="mkt-card">
              <span className="mkt-pill-good">Z Scopeo</span>
              <p style={{ margin: 0, fontSize: '0.9375rem', color: '#64748b', lineHeight: 1.6 }}>
                KSeF podłączony raz — faktury importują się automatycznie. Każda linia
                przypisana do kategorii Scope 1–3. Workflow akceptacji z rolami. Pełny audit trail.
                Raport generowany w minuty, nie tygodnie.
              </p>
            </div>
          </div>
          <p style={{ marginTop: 28, fontSize: '0.9375rem', color: '#64748b', lineHeight: 1.6 }}>
            Szkolenia ESG i proste kalkulatory to dobry punkt startowy do zrozumienia metodyki.
            Scopeo to kolejny krok — operacyjny system z audytowalnym procesem, kiedy Excel przestaje wystarczać.{' '}
            <Link href="/wiedza/rynek-i-metodyka" className="mkt-link">
              Rynek i metodyka →
            </Link>
          </p>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="mkt-section">
        <div className="mkt-inner">
          <p className="mkt-kicker">Proces</p>
          <h2 className="mkt-section-title">Trzy kroki od faktury do raportu</h2>
          <p className="mkt-section-lead">
            Scopeo nie wymaga wielomiesięcznego wdrożenia ani dedykowanego specjalisty ESG.
            Pierwsze dane emisyjne możesz mieć jeszcze tego samego dnia.
          </p>
          <div className="mkt-showcase-grid">
            <ImportOverviewMock />
            <ReviewQueueMock />
          </div>
          <div className="mkt-steps" style={{ marginTop: 32 }}>
            <div className="mkt-card">
              <div className="mkt-step-num">1</div>
              <h3 style={{ margin: '0 0 8px', fontSize: '1rem' }}>Połącz konto KSeF</h3>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b', lineHeight: 1.6 }}>
                Jednorazowa konfiguracja tokenu KSeF. Scopeo automatycznie pobiera faktury —
                historyczne i bieżące. Jedno połączenie na plan Mikro, do 10 na Scale.
              </p>
            </div>
            <div className="mkt-card">
              <div className="mkt-step-num">2</div>
              <h3 style={{ margin: '0 0 8px', fontSize: '1rem' }}>Mapowanie do Scope 1, 2 i 3</h3>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b', lineHeight: 1.6 }}>
                System automatycznie przypisuje linie faktur do kategorii emisji na podstawie
                współczynników KOBiZE. Wyjątki trafiają do kolejki akceptacji — z możliwością
                korekty i zapisanym uzasadnieniem.
              </p>
            </div>
            <div className="mkt-card">
              <div className="mkt-step-num">3</div>
              <h3 style={{ margin: '0 0 8px', fontSize: '1rem' }}>Raport gotowy na audyt</h3>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b', lineHeight: 1.6 }}>
                Dashboard z podziałem na Scope i kategorie. Eksport do PDF, CSV lub XML (CSRD/ESRS).
                Pełny audit trail — każda zmiana z datą, użytkownikiem i uzasadnieniem.
              </p>
            </div>
          </div>
          <p style={{ marginTop: 24, textAlign: 'center' }}>
            <Link href="/jak-dziala" className="mkt-link">
              Szczegółowy opis procesu →
            </Link>
          </p>
        </div>
      </section>

      {/* PRODUCT SCREENS */}
      <section className="mkt-section mkt-section--surface">
        <div className="mkt-inner">
          <p className="mkt-kicker">Produkt</p>
          <h2 className="mkt-section-title">Co widzą CFO, ESG manager i audytor</h2>
          <p className="mkt-section-lead">
            Każda rola ma widok dopasowany do swoich potrzeb — od dashboardu z agregatami po
            szczegółowy log zmian per linia faktury.
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
              Wszystkie moduły produktu →
            </Link>
          </p>
        </div>
      </section>

      {/* BUSINESS OUTCOMES */}
      <section className="mkt-section">
        <div className="mkt-inner">
          <h2 className="mkt-section-title">Wymierne efekty dla organizacji</h2>
          <p className="mkt-section-lead">
            Konkretne usprawnienie operacyjne — nie obietnica bez pokrycia.
          </p>
          <div className="mkt-grid-3">
            {[
              {
                t: 'Znacznie mniej błędów ludzkich',
                d: 'Automatyczny import i mapowanie eliminują ręczne przepisywanie. Im mniej kopiowania między plikami, tym mniejsze ryzyko pomyłki przy raporcie.',
              },
              {
                t: 'Mniej czasu na przygotowanie raportu',
                d: 'Import z KSeF eliminuje ręczne przepisywanie faktur. Raport, który zajmował tygodnie, generujesz w ciągu dnia.',
              },
              {
                t: 'Dane, które możesz obronić',
                d: 'Każda kategoria emisji ma źródło w konkretnej fakturze i historię decyzji. Audytor i zarząd widzą to samo co Ty.',
              },
              {
                t: 'Jeden proces dla całego zespołu',
                d: 'ESG, finanse i księgowość pracują na tych samych danych — bez konfliktów wersji i mailowania plików.',
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

      {/* FOR WHOM */}
      <section className="mkt-section mkt-section--surface">
        <div className="mkt-inner">
          <p className="mkt-kicker">Dla kogo</p>
          <h2 className="mkt-section-title">Dla firm, które mają KSeF i muszą raportować emisje</h2>
          <p className="mkt-section-lead">
            Od MŚP przygotowujących się do CSRD po grupy spółek wymagające spójnego procesu w wielu jednostkach.
          </p>
          <div className="mkt-grid-2">
            {[
              'Działy finansów i księgowości — jedno źródło danych dla podatków i ESG',
              'Zespoły ESG i sustainability — dane z faktur zamiast szacunków',
              'Małe i średnie firmy — start od planu Mikro bez specjalisty ESG',
              'Grupy spółek — wiele połączeń KSeF, jeden spójny proces',
              'Biura rachunkowe — obsługa kilku klientów z jednej platformy',
            ].map((t) => (
              <div key={t} className="mkt-card">
                <p style={{ margin: 0, fontWeight: 600 }}>{t}</p>
              </div>
            ))}
          </div>
          <p style={{ marginTop: 20 }}>
            <Link href="/dla-kogo" className="mkt-link">
              Szczegóły per segment →
            </Link>
          </p>
        </div>
      </section>

      {/* PRICING SUMMARY */}
      <section className="mkt-section">
        <div className="mkt-inner">
          <h2 className="mkt-section-title">Cennik — przejrzysty i bez limitów faktur</h2>
          <p className="mkt-section-lead">
            Płacisz za liczbę połączeń KSeF i użytkowników — nie za liczbę faktur.
            Każdy plan zawiera 7-dniowy bezpłatny trial. Rabat 10% przy jednorazowej płatności za 12 miesięcy.
          </p>
          <div className="mkt-grid-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
            {[
              { n: 'Mikro', p: '149 zł / mc', d: '1 połączenie KSeF · 1 użytkownik' },
              { n: 'Starter', p: '279 zł / mc', d: '1 połączenie KSeF · do 5 użytkowników' },
              { n: 'Growth', p: '499 zł / mc', d: '3 połączenia KSeF · do 15 użytkowników', f: true },
              { n: 'Scale', p: '849 zł / mc', d: '10 połączeń KSeF · bez limitu użytkowników' },
            ].map((x) => (
              <div
                key={x.n}
                className={`mkt-card${x.f ? ' mkt-price-card--featured' : ''}`}
                style={{ position: 'relative' }}
              >
                {x.f ? <span className="mkt-badge">Polecany</span> : null}
                <div className="mkt-price-name">{x.n}</div>
                <p className="mkt-price-desc">{x.d}</p>
                <div className="mkt-price-amount" style={{ fontSize: '1.25rem' }}>{x.p}</div>
                <div style={{ marginTop: 16 }}>
                  <Link href="/cennik" className="mkt-btn mkt-btn--secondary" style={{ width: '100%' }}>
                    Pełny cennik
                  </Link>
                </div>
              </div>
            ))}
          </div>
          <p style={{ marginTop: 16, fontSize: '0.875rem', color: '#64748b', textAlign: 'center' }}>
            Plan Enterprise z indywidualną wyceną — dla grup spółek, SSO i dedykowanego SLA.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="mkt-section mkt-section--surface">
        <div className="mkt-inner">
          <h2 className="mkt-section-title">Najczęstsze pytania</h2>
          <div>
            {[
              {
                q: 'Czy Scopeo działa z każdą firmą podłączoną do KSeF?',
                a: 'Tak — Scopeo łączy się z API KSeF przy użyciu tokenu autoryzacyjnego Twojej firmy. Wystarczy jednorazowa konfiguracja i faktury zaczynają się importować automatycznie.',
              },
              {
                q: 'Co to jest CSRD i czy moja firma musi raportować?',
                a: 'Dyrektywa CSRD rozszerza raportowanie niefinansowe, w tym emisje GHG, na wiele podmiotów w UE. Konkretny harmonogram zależy od wielkości, notowania na giełdzie i łańcucha dostaw — warto to zweryfikować z doradcą prawnym. Scopeo pomaga zebrać dane emisyjne z KSeF i przygotować je do raportu, gdy obowiązek już na Ciebie dotyczy.',
              },
              {
                q: 'Czy obejmuje Scope 1, 2 i 3?',
                a: 'Tak — wszystkie trzy zakresy. Mapowanie linii faktur do kategorii Scope 1–3 jest rdzeniem systemu. Scope 3 jest dostępny od planu Starter.',
              },
              {
                q: 'Jak wygląda trial?',
                a: 'Po rejestracji masz 7 dni na przetestowanie produktu na swoich danych — bez karty kredytowej. Po zakończeniu okresu próbnego wybierasz plan albo rezygnujesz bez zobowiązań.',
              },
              {
                q: 'Czy dane z KSeF są bezpieczne?',
                a: 'Tokeny KSeF są szyfrowane (AES-256) przed zapisaniem w bazie. Dane przetwarzane są na serwerach w UE. Każda organizacja ma izolowaną przestrzeń — inni klienci nie mają dostępu do Twoich faktur.',
              },
              {
                q: 'Czy potrzebuję specjalisty ESG do obsługi Scopeo?',
                a: 'Nie. System jest zaprojektowany do obsługi przez dział finansowy lub księgowy. Specjalista ESG weryfikuje wyniki w workflow akceptacji — nie musi uczestniczyć w codziennym imporcie.',
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
              Wszystkie pytania i odpowiedzi →
            </Link>
          </p>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="mkt-section" id="demo">
        <div className="mkt-inner">
          <div className="mkt-cta-band">
            <h2>Zacznij bezpłatny trial — 7 dni</h2>
            <p>
              Zarejestruj się, połącz KSeF i miej pierwsze dane emisyjne jeszcze dziś.
              Bez specjalisty ESG. Bez zobowiązań.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center', marginTop: 8 }}>
              <Link href="/register" className="mkt-btn mkt-btn--primary">
                Zacznij trial bezpłatnie
              </Link>
              <Link href="/kontakt" className="mkt-btn mkt-btn--secondary">
                Wolę porozmawiać z zespołem
              </Link>
            </div>
            <p style={{ marginTop: 20, fontSize: '0.875rem', color: '#64748b' }}>
              Wolisz najpierw zobaczyć demo? Zostaw dane poniżej — skontaktujemy się w ciągu 1 dnia roboczego.
            </p>
            <div style={{ maxWidth: 440, margin: '16px auto 0', textAlign: 'left' }}>
              <LeadForm idPrefix="home" />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
