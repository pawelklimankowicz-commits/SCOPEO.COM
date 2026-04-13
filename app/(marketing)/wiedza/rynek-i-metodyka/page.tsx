import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Rynek i metodyka — ślad węglowy, Scope 1–3, szkolenia vs system',
  description:
    'Czym jest ślad węglowy w ujęciu GHG Protocol, jak działa rynek (doradztwo, szkolenia, Excel, kalkulatory) i gdzie w tym jest oprogramowanie typu Scopeo.',
};

export default function WiedzaRynekPage() {
  return (
    <>
      <div className="mkt-page-head">
        <div className="mkt-inner">
          <p className="mkt-kicker">Wiedza</p>
          <h1>Rynek i metodyka — od definicji do narzędzi</h1>
          <p>
            Poniżej zestawiamy to, co w praktyce powtarzają dobre źródła merytoryczne i oferty rynkowe:
            od definicji śladu węglowego i zakresów Scope 1–3, po typowe formy wsparcia (szkolenia,
            arkusze, kalkulatory) oraz miejsce na{' '}
            <strong>operacyjny system</strong> oparty o dane z KSeF — jak Scopeo.
          </p>
        </div>
      </div>

      <section className="mkt-section">
        <div className="mkt-inner mkt-prose">
          <h2>Czym jest ślad węglowy organizacji</h2>
          <p>
            W uproszczeniu przyjętym w raportowaniu korporacyjnym: jest to <strong>łączna emisja gazów
            cieplarnianych</strong> związana z działalnością organizacji, wyrażona najczęściej jako{' '}
            <strong>ekwiwalent CO₂ (CO₂e)</strong> — tak, by porównywać wpływ różnych gazów według wspólnej
            miary. Metodyka liczenia opiera się na standardach typu{' '}
            <strong>Greenhouse Gas Protocol (GHG Protocol)</strong> oraz normach ISO (np. z rodziny ISO
            14064), które firmy doradcze i weryfikatorzy stosują przy projektach i audytach.
          </p>

          <h2>Scope 1, 2 i 3 — trzy poziomy emisji organizacji</h2>
          <p>
            Podział na zakresy pozwala rozdzielić emisje <strong>bezpośrednie</strong>, związane z{' '}
            <strong>energią zakupioną</strong> oraz <strong>łańcuchem wartości</strong> — to samo
            porządkuje materiały szkoleniowe, przewodniki i kalkulatory edukacyjne na rynku polskim.
          </p>
          <ul>
            <li>
              <strong>Scope 1</strong> — emisje <strong>bezpośrednie</strong>: m.in. spalanie paliw w
              instalacjach i pojazdach pod kontrolą organizacji, emisje z procesów technologicznych.
            </li>
            <li>
              <strong>Scope 2</strong> — emisje <strong>pośrednie z energii</strong> (np. zakupiona energia
              elektryczna, ciepło, para), liczone zwykle metodą lokalizacji lub rynkową — zgodnie z wytycznymi
              GHG Protocol.
            </li>
            <li>
              <strong>Scope 3</strong> — pozostałe emisje <strong>w łańcuchu wartości</strong> (dostawcy,
              transport, podróże, odpady, użytkowanie produktów itd.) — najszerszy i najtrudniejszy do
              domknięcia bez dobrego procesu danych.
            </li>
          </ul>
          <p>
            Wiele firm zaczyna od <strong>Scope 1 i 2</strong>, a Scope 3 rozwija etapami — tak wynika też
            z praktyki projektowej i materiałów edukacyjnych fundacji oraz konsultacji specjalizujących się w
            carbon footprint.
          </p>

          <h2>Jak wygląda typowa oferta rynku (skrót)</h2>
          <p>
            Na polskim rynku widać kilka powtarzalnych modeli — każdy ma sens w innym momencie dojrzałości
            organizacji:
          </p>
          <ul>
            <li>
              <strong>Doradztwo i projekty „na zamówienie”</strong> — obliczenia, dokumentacja, często
              weryfikacja lub przygotowanie pod raporty (CSRD/ESG, łańcuch dostaw). Wysoka jakość
              merytoryczna, ale <strong>ciężar utrzymania danych</strong> zostaje po stronie klienta i
              narzędzi, które wybierze.
            </li>
            <li>
              <strong>Szkolenia i otwarte warsztaty</strong> — budują kompetencje zespołu (GHG, metodyki,
              dobre praktyki). Nie zastępują jednak{' '}
              <strong>codziennego systemu</strong> z rolami, historią zmian i importem z KSeF.
            </li>
            <li>
              <strong>Arkusze Excel i proste kalkulatory</strong> — dobry start dla MŚP lub pilotażu; przy
              większej skali pojawiają się <strong>wersjonowanie, błędy kopiowania</strong> i brak jednej
              historii decyzji — co potwierdzają zarówno środowiska doradcze, jak i materiały podkreślające
              <strong> unikalność każdej organizacji</strong> (każdy projekt wymaga innego zestawu danych).
            </li>
            <li>
              <strong>Fundacje i inicjatywy edukacyjne</strong> — podnoszą świadomość, publikują przewodniki,
              angażują NGO i biznes w dialog o klimacie. To warstwa <strong>edukacji i misji</strong>, nie
              zamiennik dla narzędzia operacyjnego u przedsiębiorcy.
            </li>
          </ul>

          <h2>Gdzie jest Scopeo</h2>
          <p>
            Scopeo nie konkuruje narracją „zastąpimy cały rynek doradczy”. Konkurujemy w warstwie{' '}
            <strong>oprogramowania</strong>: powtarzalny import danych z <strong>KSeF</strong>, mapowanie do
            Scope 1–3, <strong>workflow review</strong>, override z kontrolą i <strong>audit trail</strong> —
            czyli to, czego nie załatwi sama tablica szkoleniowa ani pojedynczy plik XLSX przy setkach
            faktur miesięcznie.
          </p>
          <p>
            <Link href="/jak-dziala" className="mkt-link">
              Jak działa produkt →
            </Link>
            {' · '}
            <Link href="/kontakt#demo" className="mkt-link">
              Umów demo →
            </Link>
          </p>
        </div>
      </section>

      <section className="mkt-section mkt-section--surface">
        <div className="mkt-inner">
          <p style={{ margin: 0, fontSize: '0.8125rem', color: '#94a3b8', lineHeight: 1.6 }}>
            Uwaga redakcyjna: powyższy opis ma charakter informacyjny i nie stanowi porady prawnej ani
            audytowej. Nazwy podmiotów z rynku polskiego (fundacje, konsulting, przewodniki) pełnią funkcję
            edukacyjną w ekosystemie — Scopeo nie jest ich oficjalnym partnerem, o ile nie oznaczono inaczej
            w przyszłej komunikacji prawnej.
          </p>
        </div>
      </section>
    </>
  );
}
