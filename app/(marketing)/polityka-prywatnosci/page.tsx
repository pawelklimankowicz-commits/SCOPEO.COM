import type { Metadata } from 'next';
import Link from 'next/link';
import { LEGAL_COMPANY, LEGAL_EMAIL } from '@/lib/legal';

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
          <h1>Prywatność w Scopeo nie jest dodatkiem</h1>
          <p>
            Wyjaśniamy, jakie dane przetwarzamy, po co to robimy, komu je powierzamy i jakie prawa przysługują
            użytkownikom oraz przedstawicielom klientów biznesowych — zgodnie z RODO.
          </p>
          <p style={{ marginTop: 12, fontSize: '0.8125rem', color: '#64748b' }}>
            Ostatnia aktualizacja: {new Date().getFullYear()}-04-13
          </p>
        </div>
      </div>

      <section className="mkt-section mkt-section--dark">
        <div className="mkt-inner mkt-prose">
          <div className="mkt-legal-grid">
            <div className="mkt-legal-card">
              <h3>Rola dokumentu</h3>
              <p>
                Polityka realizuje obowiązki informacyjne wobec osób, których dane dotyczą — m.in. wskazanie
                administratora, cele, podstawy prawne, kategorie odbiorców, okresy przechowywania, prawa
                osoby oraz informacje o transferach i profilowaniu, jeśli ma miejsce.
              </p>
            </div>
            <div className="mkt-legal-card">
              <h3>Administrator</h3>
              <p>
                Administratorem danych przetwarzanych w związku z Usługą Scopeo jest {LEGAL_COMPANY.name} z
                siedzibą w {LEGAL_COMPANY.seat}. {LEGAL_COMPANY.registryNote} Kontakt w sprawach ochrony danych:{' '}
                <a href={`mailto:${LEGAL_EMAIL.privacy}`} className="mkt-link">
                  {LEGAL_EMAIL.privacy}
                </a>
                .
              </p>
            </div>
          </div>

          <h2>Zakres danych</h2>
          <p>Przetwarzamy m.in.:</p>
          <ul>
            <li>
              dane kontaktowe i identyfikacyjne osób zgłaszających zapytania (leadów) oraz użytkowników konta
              (np. imię, nazwisko, e-mail, stanowisko, firma);
            </li>
            <li>dane przedstawicieli klientów biznesowych niezbędne do zawarcia i wykonania umowy;</li>
            <li>
              dane techniczne i logi (np. adres IP, typ przeglądarki, czas żądania) w zakresie niezbędnym do
              bezpieczeństwa i obsługi serwisu;
            </li>
            <li>dane rozliczeniowe i fakturowe w zakresie wymaganym do świadczenia Usługi płatnej.</li>
          </ul>

          <h2>Cele i podstawy prawne</h2>
          <p>
            Dane przetwarzamy w szczególności w celu: obsługi zapytań i komunikacji handlowej B2B, zawarcia i
            wykonania umowy o świadczenie Usługi (art. 6 ust. 1 lit. b RODO), rozliczeń (art. 6 ust. 1 lit. c),
            dochodzenia roszczeń i obrony przed roszczeniami (art. 6 ust. 1 lit. f), a także — o ile to
            dozwolone — w celach analitycznych lub marketingowych na podstawie prawnie uzasadnionego interesu
            lub zgody (art. 6 ust. 1 lit. a lub f RODO), w granicach obowiązujących przepisów.
          </p>

          <h2>Odbiorcy danych</h2>
          <p>
            Dane mogą być przekazywane podmiotom przetwarzającym dane w naszym imieniu (hosting, dostawcy
            infrastruktury, narzędzia wsparcia), wyłącznie w zakresie niezbędnym do realizacji celów i na
            podstawie umów powierzenia, o ile wymaga tego prawo.
          </p>

          <h2>Transfery poza EOG</h2>
          <p>
            Jeżeli korzystamy z dostawców z siedzibą poza Europejskim Obszarem Gospodarczym, stosujemy mechanizmy
            zgodne z RODO (np. standardowe klauzule umowne), o ile są wymagane.
          </p>

          <h2>Okres przechowywania</h2>
          <p>
            Dane przechowujemy przez czas potrzebny do realizacji celu, a następnie przez okres wymagany
            przepisami prawa lub przedawnienia roszczeń — nie dłużej niż to konieczne.
          </p>

          <h2>Prawa osób, których dane dotyczą</h2>
          <p>
            Przysługuje Pani/u m.in. prawo dostępu do danych, sprostowania, usunięcia lub ograniczenia
            przetwarzania, wniesienia sprzeciwu oraz przenoszenia danych — w zakresie przewidzianym przez RODO.
            W sprawach dotyczących ochrony danych można skontaktować się pod adresem{' '}
            <a href={`mailto:${LEGAL_EMAIL.privacy}`} className="mkt-link">
              {LEGAL_EMAIL.privacy}
            </a>
            . Przysługuje Pani/u także wniesienie skargi do Prezesa Urzędu Ochrony Danych Osobowych.
          </p>

          <h2>Cookies</h2>
          <p>
            Zasady stosowania plików cookies i podobnych technologii opisujemy w{' '}
            <Link href="/cookies" className="mkt-link">
              polityce cookies
            </Link>
            .
          </p>

          <div className="mkt-legal-notice">
            Twoje dane nie trafiają do czarnej skrzynki. W Scopeo każda rola, integracja i proces przetwarzania
            mają swoje uzasadnienie, podstawę i opis.
          </div>

          <p>
            <Link href="/prawne" className="mkt-link">
              Wszystkie dokumenty prawne →
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}
