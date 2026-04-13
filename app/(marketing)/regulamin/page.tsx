import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Regulamin — Scopeo',
  robots: { index: true, follow: true },
};

export default function RegulaminPage() {
  return (
    <>
      <div className="mkt-page-head">
        <div className="mkt-inner">
          <h1>Regulamin świadczenia usług (Terms)</h1>
          <p>Ostatnia aktualizacja: {new Date().getFullYear()}-04-13</p>
        </div>
      </div>
      <section className="mkt-section">
        <div className="mkt-inner mkt-prose">
          <h2>Postanowienia ogólne</h2>
          <p>
            Niniejszy regulamin określa zasady korzystania z usługi SaaS Scopeo w zakresie oprogramowania do
            wsparcia procesu pracy nad danymi emisyjnymi powiązanymi z danymi z KSeF (dalej: „Usługa”).
            Szczegółowy zakres, SLA i ceny wynikają z umowy lub zamówienia.
          </p>
          <h2>Konto i dostęp</h2>
          <p>
            Dostęp do Usługi jest przyznawany uprawnionemu użytkownikowi po rejestracji lub zaproszeniu w
            ramach organizacji. Użytkownik zobowiązuje się do zachowania poufności danych logowania i
            nieudostępniania ich osobom trzecim.
          </p>
          <h2>Dane i odpowiedzialność</h2>
          <p>
            Klient odpowiada za legalność przekazywania danych do Usługi oraz za prawdziwość informacji
            konfiguracyjnych. Dostawca dokłada staranności, aby Usługa działała zgodnie z opisem, jednak nie
            gwarantuje nieprzerwanego działania bez przerw serwisowych — z wyłączeniem gwarancji
            wynikających z umowy.
          </p>
          <h2>Płatności</h2>
          <p>
            Wynagrodzenie za Usługę według wybranego planu i okresu rozliczeniowego. Nieopłacenie należności
            może skutkować ograniczeniem dostępu po uprzednim wezwaniu — zgodnie z umową.
          </p>
          <h2>Reklamacje</h2>
          <p>
            Reklamacje dotyczące działania Usługi można zgłaszać na adres kontaktowy podany przez Dostawcę.
            Rozpatrzenie następuje w terminie wskazanym w umowie lub w ciągu 14 dni roboczych od otrzymania
            kompletnego zgłoszenia.
          </p>
          <h2>Postanowienia końcowe</h2>
          <p>
            Prawem właściwym dla umów z przedsiębiorcami jest prawo polskie. Spory rozstrzygane będą przez
            sąd właściwy dla siedziby Dostawcy, o ile umowa nie stanowi inaczej.
          </p>
        </div>
      </section>
    </>
  );
}
