import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'FAQ — Scopeo',
  description:
    'Pytania o KSeF, Scope 1–3, CSRD, bezpieczeństwo, cennik (bez limitu faktur), 7-dniowy trial, workflow akceptacji i GHG. Dla finansów, ESG i zarządu.',
};

const items: { q: string; a: ReactNode }[] = [
  // PRODUKT
  {
    q: 'Do czego służy Scopeo?',
    a: 'Scopeo to narzędzie, które pomaga firmom zmierzyć i udokumentować swój ślad węglowy na podstawie faktur z KSeF. Wszystko dzieje się automatycznie — bez ręcznego przepisywania danych, bez arkuszy Excel i bez ryzyka pomyłki.',
  },
  {
    q: 'Co to jest ślad węglowy i dlaczego moja firma powinna go mierzyć?',
    a: 'Ślad węglowy to suma emisji gazów cieplarnianych, które Twoja firma wytwarza bezpośrednio i pośrednio — przez zużycie energii, transport, zakupy usług i towarów. Coraz więcej firm jest zobowiązanych do jego raportowania przez prawo UE (dyrektywa CSRD). Pomiar pozwala też świadomie zarządzać kosztami i odpowiadać na pytania kontrahentów oraz inwestorów.',
  },
  {
    q: 'Czym różni się Scopeo od arkusza Excel?',
    a: 'Excel wymaga ręcznego przepisywania faktur, nie ma historii zmian i łatwo o błąd. Scopeo pobiera faktury automatycznie z KSeF, przypisuje kategorie i przelicza emisje — człowiek wchodzi do procesu tam, gdzie potrzebna jest weryfikacja lub akceptacja. Każda decyzja zostaje z datą i użytkownikiem (ślad audytowy). Kiedy przychodzi audytor, masz uporządkowaną dokumentację zamiast stosu plików.',
  },
  {
    q: 'Czy Scopeo zastępuje doradcę ESG lub audytora?',
    a: 'Nie. Scopeo to narzędzie do zbierania i porządkowania danych emisyjnych. Strategię redukcji emisji, pełny raport CSRD z częścią opisową ani weryfikację przez akredytowanego audytora Scopeo nie zastąpi. Daje jednak doradcy i audytorowi porządne, udokumentowane dane — zamiast arkusza z ręcznie wpisanymi liczbami.',
  },
  {
    q: 'Czy Scopeo obsługuje Scope 1, 2 i 3?',
    a: (
      <>
        Tak — wszystkie trzy zakresy. <strong>Scope 1</strong> to emisje bezpośrednie (spalanie paliw,
        własna flota). <strong>Scope 2</strong> to zakupiona energia elektryczna i ciepło.{' '}
        <strong>Scope 3</strong> obejmuje cały łańcuch dostaw — zakupione usługi, transport, podróże
        służbowe, odpady. Scope 3 dostępny jest od planu Starter.
      </>
    ),
  },
  {
    q: 'Skąd Scopeo wie, ile CO₂ emituje dana faktura?',
    a: (
      <>
        Scopeo korzysta z oficjalnych baz współczynników emisji — domyślnie{' '}
        <a href="https://www.kobize.gov.pl/" className="mkt-link" target="_blank" rel="noopener noreferrer">
          KOBiZE
        </a>{' '}
        (polskie standardy), a dla firm z międzynarodowym łańcuchem dostaw również z baz UK i EPA.
        Na podstawie opisu i kategorii każdej pozycji faktury system dobiera odpowiedni współczynnik
        i automatycznie przelicza emisję na tony CO₂ ekwiwalentu.
      </>
    ),
  },
  {
    q: 'Czy Scopeo generuje raport CSRD / ESRS?',
    a: 'Scopeo przygotowuje dane emisyjne i eksportuje je w formatach wymaganych przez CSRD/ESRS, a także generuje raport GHG Protocol w PDF. Część opisowa raportu CSRD — strategia, narracja, inne wskaźniki ESG — pozostaje po stronie Twojego zespołu lub doradcy.',
  },
  // KSEF I DANE
  {
    q: 'Jak Scopeo łączy się z KSeF?',
    a: 'W ustawieniach podajesz token autoryzacyjny KSeF swojej firmy — to jednorazowa czynność, która zajmuje kilka minut. Po weryfikacji Scopeo samodzielnie pobiera faktury i na bieżąco przetwarza nowe. Nie potrzebujesz działu IT ani żadnych dodatkowych instalacji.',
  },
  {
    q: 'Czy dane z moich faktur są bezpieczne?',
    a: 'Tak. Twoje dane są przechowywane na serwerach w Unii Europejskiej i są całkowicie odizolowane od danych innych firm korzystających z Scopeo. Dostęp do nich mają wyłącznie osoby, którym nadałeś uprawnienia w swoim koncie. W polityce prywatności opisujemy też: na czym opieramy się u dostawcy bazy danych, jak traktujemy rotację kluczy szyfrujących oraz jakie testy i praktyki utrzymania bezpieczeństwa stosujemy — zobacz sekcję 6 (punkty 6.1–6.3).',
  },
  {
    q: 'Czy mogę obsługiwać kilka firm lub spółek w jednym koncie?',
    a: 'Tak — wyższe plany pozwalają podłączyć kilka kont KSeF jednocześnie. Plan Growth obsługuje 3 połączenia, Scale 10, Enterprise bez limitu. Każde połączenie ma osobną konfigurację, ale wszystkie widoczne są w jednym panelu.',
  },
  {
    q: 'Co z dokumentami, których nie ma w KSeF (paragony, faktury zagraniczne)?',
    a: 'Faktury spoza KSeF można wprowadzić ręcznie. Trafiają do tego samego procesu weryfikacji i są widoczne w raporcie razem z fakturami z KSeF. KSeF pozostaje głównym źródłem danych, bo zapewnia najwyższą standaryzację i kompletność.',
  },
  // CSRD I REGULACJE
  {
    q: 'Kogo dotyczy CSRD i od kiedy?',
    a: (
      <>
        CSRD rozszerza raportowanie niefinansowe na wiele podmiotów w UE — w tym dane o emisjach.
        Konkretny harmonogram, progi wielkości i obowiązki łańcucha dostaw zależą od przepisów
        krajowych, kategorii podmiotu oraz bieżących aktów wykonawczych; mogą się zmieniać w czasie.
        Zanim podejmiesz decyzje compliance, zweryfikuj stan prawny z doradcą. Oficjalne materiały
        i przegląd ramy znajdziesz na{' '}
        <a
          href="https://finance.ec.europa.eu/capital-markets-company-reporting/reporting-related/company-reporting-sustainability_en"
          className="mkt-link"
          target="_blank"
          rel="noopener noreferrer"
        >
          stronach Komisji Europejskiej
        </a>
        .
      </>
    ),
  },
  {
    q: 'Czy Scopeo gwarantuje zgodność z CSRD?',
    a: 'Scopeo dostarcza rzetelne dane o emisjach — to fundament każdego raportu CSRD. Sama zgodność z dyrektywą to jednak szerszy temat: obejmuje też część opisową, inne wskaźniki ESG i weryfikację zewnętrzną. W tych kwestiach potrzebny jest doradca lub audytor. Scopeo daje mu solidną bazę danych do pracy.',
  },
  // BILLING I TRIAL
  {
    q: 'Jak wygląda trial?',
    a: 'Po rejestracji masz 7 dni na przetestowanie produktu na swoich danych — bez karty kredytowej. Po zakończeniu okresu próbnego wybierasz plan albo rezygnujesz bez opłat.',
  },
  {
    q: 'Od czego zależy cena?',
    a: 'Cena zależy od liczby połączeń KSeF i liczby użytkowników — nie ma limitu faktur. Plany: Mikro 149 zł/mc (1 KSeF, 1 użytkownik), Starter 279 zł/mc (1 KSeF, do 5 użytkowników), Growth 499 zł/mc (3 KSeF, do 15 użytkowników), Scale 849 zł/mc (10 KSeF, bez limitu użytkowników). Jednorazowa płatność za 12 miesięcy z góry daje 10% rabatu.',
  },
  {
    q: 'Czy mogę zmienić plan w trakcie subskrypcji?',
    a: 'Tak — plan możesz zmienić w dowolnym momencie z poziomu swojego konta. Przy zmianie na wyższy plan dostęp do nowych funkcji pojawia się natychmiast. Zmiana na niższy plan wchodzi w życie od następnego okresu rozliczeniowego. W przypadku płatności za 12 miesięcy z góry, zmiana planu wiąże się z nową płatnością.',
  },
  {
    q: 'Czy mogę anulować subskrypcję w dowolnym momencie?',
    a: 'Tak. Anulowanie zatrzymuje automatyczne odnawianie — dostęp masz do końca opłaconego okresu. Od pierwszej płatności po trialu obowiązuje 14-dniowa polityka zwrotu.',
  },
  {
    q: 'Jak wygląda dokument potwierdzający płatność?',
    a: 'Płatności obsługuje Stripe — po każdej transakcji otrzymujesz potwierdzenie na email. Jeśli Twoja firma potrzebuje faktury VAT do odliczenia podatku, skonsultuj to z księgowym — paragon Stripe ma inny status prawny niż faktura VAT.',
  },
  // TEAM I WDROŻENIE
  {
    q: 'Ile czasu zajmuje uruchomienie?',
    a: 'Rejestracja i pierwsze połączenie z KSeF zajmuje około 15 minut. Pierwsze faktury pojawiają się w systemie w ciągu kilku minut od połączenia. Nie potrzebujesz działu IT ani wcześniejszego przygotowania.',
  },
  {
    q: 'Czy potrzebuję specjalisty ESG, żeby korzystać z Scopeo?',
    a: 'Nie. Codzienną obsługę — import faktur, przeglądanie wyników — z powodzeniem prowadzi dział finansowy lub księgowy. Specjalista ESG wchodzi do procesu tam, gdzie potrzebna jest wiedza merytoryczna, np. przy akceptacji trudnych przypisań kategorii w workflow akceptacji.',
  },
  {
    q: 'Ile osób z mojego zespołu może korzystać z systemu?',
    a: 'Plan Mikro: 1 osoba. Starter: do 5 osób. Growth: do 15 osób. Scale: bez limitu. Każda osoba ma przypisaną rolę z odpowiednimi uprawnieniami — możesz dokładnie kontrolować, kto widzi dane, a kto może je zatwierdzać.',
  },
  {
    q: 'Jak Scopeo chroni moje dane osobowe?',
    a: (
      <>
        Scopeo przetwarza dane zgodnie z RODO. Dane przechowywane są na serwerach w UE.
        Szczegółowe zasady opisuje nasza{' '}
        <Link href="/polityka-prywatnosci" className="mkt-link">
          Polityka prywatności
        </Link>
        , w tym w sekcji 6: polityki dostawcy bazy, rotację kluczy, testy i utrzymanie bezpieczeństwa (
        <Link href="/polityka-prywatnosci#testy-bezpieczenstwa" className="mkt-link">
          m.in. testy
        </Link>
        ). W sprawach RODO piszesz na privacy@scopeo.pl.
      </>
    ),
  },
];

const externalResources: { href: string; label: string; note: string }[] = [
  {
    href: 'https://ghgprotocol.org/',
    label: 'GHG Protocol (WRI / WBCSD)',
    note: 'Standardowe definicje Scope 1–3 i wytyczne metodyczne — punkt odniesienia dla raportowania korporacyjnego.',
  },
  {
    href: 'https://www.kobize.gov.pl/',
    label: 'KOBiZE',
    note: 'Krajowy Ośrodek Bilansowania i Zarządzania Emisjami — polskie bazy współczynników emisji.',
  },
  {
    href: 'https://finance.ec.europa.eu/capital-markets-company-reporting/reporting-related/company-reporting-sustainability_en',
    label: 'Komisja Europejska — CSRD',
    note: 'Oficjalne regulacje i harmonogram wdrożenia dyrektywy CSRD w UE.',
  },
  {
    href: 'https://odpowiedzialnybiznes.pl/',
    label: 'Forum Odpowiedzialnego Biznesu',
    note: 'Środowisko firm i ESG w Polsce — dobre praktyki i raporty z rynku.',
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
            Odpowiedzi na pytania o produkt, KSeF, CSRD, bezpieczeństwo danych, cennik (bez limitu
            faktur), trial i metodykę GHG. Nie znalazłeś odpowiedzi?{' '}
            <Link href="/kontakt" className="mkt-link">
              Napisz do nas.
            </Link>
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

          <h2 style={{ marginTop: 48, marginBottom: 16, fontSize: '1.125rem' }}>Źródła i standardy</h2>
          <p style={{ marginBottom: 16, fontSize: '0.9375rem', color: '#64748b' }}>
            Linki do dokumentów źródłowych i instytucji, na których Scopeo opiera metodykę.
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

          <div style={{ marginTop: 40, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link href="/register" className="mkt-btn mkt-btn--primary">
              Zacznij bezpłatny trial — 7 dni
            </Link>
            <Link href="/kontakt#demo" className="mkt-btn mkt-btn--secondary">
              Umów demo
            </Link>
          </div>
        </div>
      </section>

      <section className="mkt-section mkt-section--surface">
        <div className="mkt-inner">
          <p style={{ margin: 0, fontSize: '0.8125rem', color: '#94a3b8', lineHeight: 1.6 }}>
            Odpowiedzi FAQ mają charakter informacyjny i nie stanowią porady prawnej ani audytowej.
            W kwestiach regulacyjnych (CSRD, weryfikacja emisji) skonsultuj się z doradcą specjalistycznym.
          </p>
        </div>
      </section>
    </>
  );
}
