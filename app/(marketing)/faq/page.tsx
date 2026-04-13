import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'FAQ — Scopeo',
  description:
    'Pytania o KSeF, Scope 1–3, GHG Protocol, OCR, billing, trial, MŚP, CSRD, weryfikację oraz źródła merytoryczne (fundacje, instytuty, standardy).',
};

const items: { q: string; a: ReactNode }[] = [
  {
    q: 'Czym jest ślad węglowy i CO₂e w sensie GHG Protocol?',
    a: (
      <>
        W raportowaniu korporacyjnym chodzi o łączną emisję gazów cieplarnianych z działalności organizacji,
        najczęściej w <strong>ekwiwalencie CO₂ (CO₂e)</strong>, by porównywać różne gazy według wspólnej miary.
        Definicje zakresów (Scope) i dobrych praktyk publikuje m.in.{' '}
        <a href="https://ghgprotocol.org/" className="mkt-link" target="_blank" rel="noopener noreferrer">
          GHG Protocol
        </a>{' '}
        (WRI / WBCSD). Scopeo nie zastępuje standardu — implementuje workflow na danych operacyjnych (np. z
        KSeF).
      </>
    ),
  },
  {
    q: 'Na czym polega podział na Scope 1, 2 i 3?',
    a: (
      <>
        <strong>Scope 1</strong> — emisje bezpośrednie (np. paliwa, flota, procesy pod kontrolą firmy).{' '}
        <strong>Scope 2</strong> — emisje pośrednie z zakupionej energii (np. prąd, ciepło), zwykle metodą
        lokalizacji lub rynkową. <strong>Scope 3</strong> — emisje w łańcuchu wartości (dostawcy, transport,
        podróże, odpady itd.), najszerszy zakres. Wiele organizacji domyka najpierw 1 i 2, a 3 rozwija
        etapami — tak bywa też w materiałach edukacyjnych fundacji i doradców. Szerszy kontekst:{' '}
        <Link href="/wiedza/rynek-i-metodyka" className="mkt-link">
          Rynek i metodyka
        </Link>
        .
      </>
    ),
  },
  {
    q: 'Czy Scopeo liczy wszystko wyłącznie z KSeF?',
    a: 'KSeF jest głównym źródłem faktur. Dokumenty spoza KSeF można uwzględnić przez OCR i ręczne przypisanie — w zakresie uzgodnionym przy wdrożeniu.',
  },
  {
    q: 'Czy obejmuje Scope 1, 2 i 3?',
    a: 'Tak — mapowanie linii do kategorii Scope 1–3 jest rdzeniem produktu.',
  },
  {
    q: 'Jak współczynniki emisji z Scopeo mają się do KOBIZE i innych baz?',
    a: (
      <>
        W praktyce raportowej w Polsce często odwołuje się do{' '}
        <a href="https://www.kobize.gov.pl/" className="mkt-link" target="_blank" rel="noopener noreferrer">
          Krajowego ośrodka bilansowania i zarządzania emisjami (KOBIZE)
        </a>{' '}
        oraz do standardów takich jak GHG Protocol / normy ISO przy projektach i audytach. Scopeo jest
        warstwą operacyjną: import i mapowanie danych, review i historia zmian — a wybór i wersja bazy
        współczynników zależą od umowy i polityki organizacji (także importy EPA/UK w produkcie, jeśli
        wdrożono).
      </>
    ),
  },
  {
    q: 'Czy Scopeo „robi” CSRD ani raport ESG za nas?',
    a: (
      <>
        Nie — CSRD i raporty zrównoważonego rozwoju to obszar regulacyjny i procesów zarządczych, wykraczający
        poza samo narzędzie. Scopeo pomaga zebrać i uporządkować dane emisyjne z faktur i dokumentów oraz
        utrzymać ślad decyzji; pełną zgodność z CSRD ustalasz z księgowością, ESG i doradcą. Warto śledzić też
        komunikaty unijne i polskie interpretacje — m.in. środowiska typu{' '}
        <a
          href="https://odpowiedzialnybiznes.pl/"
          className="mkt-link"
          target="_blank"
          rel="noopener noreferrer"
        >
          Forum Odpowiedzialnego Biznesu
        </a>
        .
      </>
    ),
  },
  {
    q: 'Po co czytać przewodniki fundacji i NGO, skoro mam system?',
    a: (
      <>
        Fundacje i instytuty (np. działania edukacyjne, dialog klimatyczny, analizy polityk) budują{' '}
        <strong>rozumienie kontekstu</strong> i dobrych praktyk — to nie zastępuje importu z KSeF ani audit
        trail w Scopeo. Oba poziomy się uzupełniają: merytoryka z rynku + narzędzie operacyjne. Zob. też:{' '}
        <Link href="/wiedza/rynek-i-metodyka" className="mkt-link">
          Rynek i metodyka
        </Link>
        .
      </>
    ),
  },
  {
    q: 'Czy Scopeo zastępuje zewnętrzną weryfikację lub audyt emisji?',
    a: 'Nie. Weryfikacja przez akredytowanego weryfikatora to odrębna usługa i zakres umowy. Scopeo wspiera przygotowanie spójnych danych i historii zmian wewnątrz organizacji.',
  },
  {
    q: 'Jak działa OCR?',
    a: 'Dla dokumentów załączonych lub przekazanych poza standardowym importem — ekstrakcja pól wspierana modelem OCR; wyjątki trafiają do kolejki review.',
  },
  {
    q: 'Jak działa billing?',
    a: 'Opłata według planu i wolumenu faktur miesięcznie lub rocznie (rabat 10% przy płatności rocznej). Szczegóły w umowie.',
  },
  {
    q: 'Co przy przekroczeniu limitu faktur?',
    a: 'Informujemy o przekroczeniu i proponujemy wyższy plan lub Enterprise.',
  },
  {
    q: 'Czy jest trial?',
    a: 'Zwykle: demo i ewentualnie pilotaż — ze względu na charakter danych KSeF nie oferujemy anonimowego publicznego trial bez kontaktu.',
  },
  {
    q: 'Czy nadaje się dla MŚP?',
    a: 'Tak — niższe plany są liczone pod mniejszy wolumen faktur.',
  },
  {
    q: 'Czy dla grup spółek?',
    a: 'Tak — przy większej złożoności typowo plan Enterprise z dedykowanym wdrożeniem.',
  },
  {
    q: 'Jak wygląda wdrożenie?',
    a: 'Konfiguracja organizacji, import, szkolenie użytkowników, reguły review — czas zależy od skali, zwykle od kilku dni do kilku tygodni.',
  },
  {
    q: 'Jak wygląda bezpieczeństwo danych?',
    a: 'Dostęp po uwierzytelnieniu, segmentacja danych per organizacja, szyfrowanie transmisji (HTTPS), polityki backupów zależne od środowiska hostingu — do potwierdzenia w umowie DPA przy wdrożeniu.',
  },
  {
    q: 'Mamy przeszkolenie zespołu z GHG / Scope 1–3 — czy Scopeo to zastępuje?',
    a: 'Nie. Szkolenia budują kompetencje metodyczne; Scopeo jest warstwą operacyjną: import danych z KSeF, mapowanie, review i historia zmian. Oba elementy się uzupełniają.',
  },
  {
    q: 'Używamy Excela lub prostego kalkulatora — po co nam system?',
    a: 'Arkusze sprawdzają się w pilotażu lub małej skali. Przy większym wolumenie faktur i wymogu audytowalności rośnie koszt błędów, kopiowania i braku jednej historii decyzji — tam Scopeo zastępuje rozproszone pliki jednym workflow.',
  },
];

const externalResources: { href: string; label: string; note: string }[] = [
  {
    href: 'https://ghgprotocol.org/',
    label: 'GHG Protocol (WRI / WBCSD)',
    note: 'Standardowe definicje Scope 1–3 i wytyczne metodyczne używane globalnie w raportowaniu.',
  },
  {
    href: 'https://www.kobize.gov.pl/',
    label: 'KOBIZE',
    note: 'Krajowy ośrodek bilansowania i zarządzania emisjami — kontekst krajowy, bazy i obowiązki bilansowe.',
  },
  {
    href: 'https://odpowiedzialnybiznes.pl/',
    label: 'Forum Odpowiedzialnego Biznesu',
    note: 'Środowisko firm, CSR i zrównoważony rozwój w Polsce — m.in. raportowanie i dobre praktyki.',
  },
  {
    href: 'https://iee.org.pl/',
    label: 'Instytut Ekonomii Środowiska (IEŚ)',
    note: 'NGO: polityka klimatyczna, efektywność energetyczna, analizy — warstwa ekspercka obok narzędzi B2B.',
  },
  {
    href: 'https://finance.ec.europa.eu/capital-markets-company-reporting/reporting-related/company-reporting-sustainability_en',
    label: 'Komisja Europejska — sprawozdawczość w zakresie zrównoważonego rozwoju',
    note: 'Oficjalny kontekst regulacyjny (w tym CSRD) — Scopeo nie jest substytutem doradztwa prawnego.',
  },
];

export default function FaqPage() {
  return (
    <>
      <div className="mkt-page-head">
        <div className="mkt-inner">
          <p className="mkt-kicker">FAQ</p>
          <h1>Pytania i odpowiedzi</h1>
          <p>
            Krótko i konkretnie — produkt, metodyka (GHG / Scope) i miejsce na tle rynku. Szerszy opis
            definicji i modeli wsparcia (szkolenia, fundacje, Excel vs system) jest na stronie{' '}
            <Link href="/wiedza/rynek-i-metodyka" className="mkt-link">
              Rynek i metodyka
            </Link>
            .
          </p>
        </div>
      </div>

      <section className="mkt-section">
        <div className="mkt-inner">
          <div className="mkt-faq-list">
            {items.map((x) => (
              <div key={x.q} className="mkt-faq-item">
                <p className="mkt-faq-q">{x.q}</p>
                <div className="mkt-faq-a">{x.a}</div>
              </div>
            ))}
          </div>

          <h2 className="mkt-faq-resources-title">Merytoryka i źródła zewnętrzne</h2>
          <p className="mkt-faq-resources-lead">
            Poniższe linki mają charakter informacyjny — ułatwiają zestawienie standardów (GHG), kontekstu
            krajowego (KOBIZE) oraz środowiska NGO i biznesu odpowiedzialnego społecznie. Scopeo nie jest
            oficjalnym partnerem tych podmiotów, o ile nie uzgodniono inaczej w komunikacji prawnej.
          </p>
          <ul className="mkt-faq-resources-list">
            {externalResources.map((r) => (
              <li key={r.href}>
                <a href={r.href} className="mkt-link" target="_blank" rel="noopener noreferrer">
                  {r.label}
                </a>
                {' — '}
                {r.note}
              </li>
            ))}
          </ul>

          <p style={{ marginTop: 32 }}>
            <Link href="/kontakt#demo" className="mkt-btn mkt-btn--primary">
              Umów demo
            </Link>
          </p>
        </div>
      </section>

      <section className="mkt-section mkt-section--surface">
        <div className="mkt-inner">
          <p style={{ margin: 0, fontSize: '0.8125rem', color: '#94a3b8', lineHeight: 1.6 }}>
            Uwaga: odpowiedzi FAQ nie stanowią porady prawnej ani audytowej. W razie wątpliwości regulacyjnych
            lub weryfikacji zasięgnij doradztwa specjalistycznego.
          </p>
        </div>
      </section>
    </>
  );
}
