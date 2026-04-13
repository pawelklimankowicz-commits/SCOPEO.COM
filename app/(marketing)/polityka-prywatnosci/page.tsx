import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Polityka prywatności — Scopeo',
  robots: { index: true, follow: true },
};

export default function PolitykaPage() {
  return (
    <>
      <div className="mkt-page-head">
        <div className="mkt-inner">
          <h1>Polityka prywatności</h1>
          <p>Ostatnia aktualizacja: {new Date().getFullYear()}-04-13</p>
        </div>
      </div>
      <section className="mkt-section">
        <div className="mkt-inner mkt-prose">
          <h2>Administrator danych</h2>
          <p>
            Administratorem danych osobowych przetwarzanych w związku z kontaktem handlowym i obsługą
            usługi Scopeo jest podmiot wskazany w umowie lub regulaminie świadczenia usług (dane rejestrowe
            zostaną uzupełnione przy publikacji produkcyjnej).
          </p>
          <h2>Zakres i cele</h2>
          <p>
            Przetwarzamy dane kontaktowe (np. imię, nazwisko, e-mail, firma, treść wiadomości) w celu
            obsługi zapytań, umawiania demonstracji, zawarcia i wykonania umowy oraz dokumentowania
            komunikacji biznesowej — w zakresie niezbędnym do tych celów.
          </p>
          <h2>Podstawy prawne</h2>
          <p>
            Realizacja umowy lub podjęcie działań przed zawarciem umowy (art. 6 ust. 1 lit. b RODO), lub
            prawnie uzasadniony interes administratora w postaci komunikacji marketingowej B2B (art. 6 ust. 1
            lit. f RODO) — w granicach obowiązujących przepisów.
          </p>
          <h2>Okres przechowywania</h2>
          <p>
            Dane przechowujemy przez czas potrzebny do realizacji celu, a następnie przez okres wymagany
            przepisami prawa lub przedawnienia roszczeń — nie dłużej niż to konieczne.
          </p>
          <h2>Prawa osób, których dane dotyczą</h2>
          <p>
            Przysługuje Pani/u prawo dostępu do danych, sprostowania, usunięcia lub ograniczenia
            przetwarzania, wniesienia sprzeciwu wobec przetwarzania oraz przenoszenia danych — w zakresie
            przewidzianym przez RODO. W przypadku pytań dotyczących przetwarzania danych można skontaktować
            się z administratorem na adres wskazany w stopce serwisu lub w umowie.
          </p>
          <h2>Hosting i logi</h2>
          <p>
            Serwis może zbierać podstawowe dane techniczne (np. adres IP, typ przeglądarki, czas żądania)
            w logach serwera w celach bezpieczeństwa i diagnostyki — zgodnie z konfiguracją hostingu
            produkcyjnego.
          </p>
        </div>
      </section>
    </>
  );
}
