import type { Metadata } from 'next';
import Link from 'next/link';
import { LEGAL_COMPANY } from '@/lib/legal';

export const metadata: Metadata = {
  title: 'Polityka prywatności — Scopeo',
  robots: { index: true, follow: true },
};

export default function PolitykaPage() {
  return (
    <>
      <div className="mkt-page-head mkt-page-head--dark">
        <div className="mkt-inner">
          <p className="mkt-kicker mkt-kicker--on-dark">Polityka prywatności</p>
          <h1>Polityka prywatności</h1>
          <p>
            Treść poniżej odpowiada kompletowi dokumentów prawnych Scopeo / {LEGAL_COMPANY.name}. Dane
            identyfikacyjne administratora są publikowane centralnie i utrzymywane spójnie we wszystkich
            dokumentach prawnych.
          </p>
          <p style={{ marginTop: 12, fontSize: '0.8125rem', color: '#64748b' }}>
            Ostatnia aktualizacja: {new Date().getFullYear()}-04-24
          </p>
        </div>
      </div>

      <section className="mkt-section mkt-section--dark">
        <div className="mkt-inner mkt-prose" style={{ maxWidth: 800 }}>
          <h2>1. Administrator danych</h2>
          <p>
            Administratorem danych osobowych jest {LEGAL_COMPANY.name} z siedziba w {LEGAL_COMPANY.seat},
            KRS 0001208042, NIP 9462761086, REGON 54335415700000, adres: ul. Kowalska 5, 20-115 Lublin, Polska.
          </p>

          <h2>2. Cele przetwarzania</h2>
          <ul>
            <li>rejestracja i utrzymanie konta uzytkownika oraz organizacji,</li>
            <li>realizacja subskrypcji i rozliczen billingowych,</li>
            <li>import i przetwarzanie danych z KSeF w ramach uslug Scopeo,</li>
            <li>bezpieczenstwo, monitoring dzialania i zapobieganie naduzyciom,</li>
            <li>obsluga zadan RODO, reklamacji i wsparcia technicznego.</li>
            <li>
              analityka produktu w pierwszej osobie: zapis prostych zdarzeń w aplikacji (np. ukończenie kroku
              onboardingu, otwarcie panelu) w naszej bazie, bez narzędzi reklamowych stron trzecich; do zliczania
              kliknięć na stronach publicznych używamy wyłącznie po wyrażeniu zgody w banerze (tej samej, co
              wykorzystanie plików analitycznych opisanych w Polityce cookies).
            </li>
          </ul>

          <h2>3. Podmioty trzecie i transfery danych</h2>
          <p>W zwiazku ze swiadczeniem uslug korzystamy z nastepujacych podmiotow przetwarzajacych:</p>
          <ul>
            <li>
              <strong>Stripe</strong> (platnosci, billing) — mozliwy transfer do USA na podstawie Standard Contractual Clauses.
            </li>
            <li>
              <strong>Resend</strong> (wysylka wiadomosci email transakcyjnych).
            </li>
            <li>
              <strong>Sentry</strong> (monitoring bledow i stabilnosci aplikacji).
            </li>
            <li>
              <strong>Upstash</strong> (mechanizmy rate limiting i cache operacyjny).
            </li>
          </ul>

          <h2>4. Prawa osob, ktorych dane dotycza (RODO)</h2>
          <p>
            Przysluguje Ci prawo dostepu do danych, sprostowania, usuniecia, ograniczenia, przeniesienia oraz
            wniesienia sprzeciwu. W aplikacji Scopeo mozesz realizowac zadania RODO przez panel:
            {' '}
            <Link href="/settings/gdpr" className="mkt-link">
              /settings/gdpr
            </Link>
            {' '}
            oraz workflow zadan GDPR.
          </p>
          <p>
            Wnioski mozesz skladac rowniez na adres privacy wskazany w kontakcie prawnym. Przysluguje Ci prawo
            wniesienia skargi do Prezesa UODO.
          </p>

          <h2>5. Polityka cookies</h2>
          <p>
            Szczegolowe zasady stosowania cookies oraz zarzadzania zgodami opisuje
            {' '}
            <Link href="/cookies" className="mkt-link">
              Polityka cookies
            </Link>
            . W panelu i na stronie marketingowej udostepniamy narzedzie do zmiany preferencji cookies.
          </p>

          <h2>6. Retencja i bezpieczenstwo</h2>
          <p>
            Dane przechowujemy przez okres niezbedny do realizacji celow przetwarzania i obowiazkow prawnych.
            Stosujemy srodki organizacyjne i techniczne adekwatne do ryzyka, w tym kontrole dostepu, logowanie
            zdarzen oraz mechanizmy szyfrowania dla danych wrazliwych operacyjnie (np. tokeny KSeF).
          </p>

          <h3 id="dostawca-bazy">6.1. Polityki dostawcy bazy danych</h3>
          <p>
            Baza danych aplikacji hostowana jest u operatora wybranego w konfiguracji produkcyjnej (typowo usluga
            PostgreSQL w chmurze). W zakresie szyfrowania w spoczynku, kontroli dostepu, kopii zapasowych i
            lokalizacji geograficznej obowiazuja{' '}
            <strong>regulamin, dokumentacja i certyfikacje tego operatora</strong>
            (udostepniane przez dostawce). Zalecane jest wskazanie regionu w{' '}
            <strong>Europejskim Obszarze Gospodarczym</strong>, o ile wymaga tego polityka organizacji.
            Scisle warunki SLA i audytow od strony hosta wynikaja z umowy miedzy nami a operatorem.
          </p>

          <h3 id="rotacja-kluczy">6.2. Rotacja kluczy szyfrujacych</h3>
          <p>
            Klucze kryptograficzne uzywane w aplikacji (m.in. do szyfrowania wrazliwych danych operacyjnych) sa
            przechowywane wylacznie w <strong>zmiennych srodowiskowych</strong> u dostawcy hostingu, poza
            repozytorium kodu. <strong>Rotacja</strong> (wymiana klucza zgodnie z polityka bezpieczenstwa lub
            skutkiem incydentu) polega na wprowadzeniu nowej wartosci w srodowisku i, w razie potrzeby, na
            oprogramowaniu wykonanym w oknie serwisowym: odszyfrowaniu danych starym kluczem i ponownym
            zaszyfrowaniu nowym, tak aby dane w bazie pozostawaly spojne. Terminy i zakres rotacji wewnetrznie
            definiujemy w procedurach operacyjnych; na zadanie klienta z umowa Enterprise moga byc one
            uzgodnione indywidualnie.
          </p>

          <h3 id="testy-bezpieczenstwa">6.3. Testy i utrzymanie bezpieczenstwa</h3>
          <p>
            W cyklu rozwoju utrzymujemy m.in. <strong>recenzje kodu</strong>, <strong>statyczna analize</strong>{' '}
            (lint) oraz <strong>automatyczne testy</strong> (w tym integracyjne) obejmujace krytyczne sciezki
            produktu. W produkcji stosujemy m.in. monitoring bledow i polityke naglowkow bezpieczenstwa (m.in. CSP)
            w warstwie uruchomieniowej. <strong>Testy penetracyjne lub zewnetrzny audyt bezpieczenstwa</strong> nie
            sa gwarantowane w ramach kazdej oferty abonamentowej; moga byc ujete w indywidualnych ustaleniach
            (np. Enterprise) albo wykonane na zlecenie — prosimy o kontakt po stronie prawnej.
          </p>

          <p style={{ marginTop: 32 }}>
            <Link href="/prawne" className="mkt-link">
              Dokumenty prawne — spis
            </Link>
            {' · '}
            <Link href="/cookies" className="mkt-link">
              Polityka cookies
            </Link>
            {' · '}
            <Link href="/dpa" className="mkt-link">
              DPA
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}
