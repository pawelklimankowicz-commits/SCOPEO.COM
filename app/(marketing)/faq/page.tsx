import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'FAQ — Scopeo',
  description:
    'Odpowiedzi na pytania o KSeF, Scope 1–3, OCR, billing, limity, trial, MŚP, grupy spółek, wdrożenie i bezpieczeństwo.',
};

const items = [
  {
    q: 'Czy Scopeo liczy wszystko wyłącznie z KSeF?',
    a: 'KSeF jest głównym źródłem faktur. Dokumenty spoza KSeF można uwzględnić przez OCR i ręczne przypisanie — w zakresie uzgodnionym przy wdrożeniu.',
  },
  {
    q: 'Czy obejmuje Scope 1, 2 i 3?',
    a: 'Tak — mapowanie linii do kategorii Scope 1–3 jest rdzeniem produktu.',
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

export default function FaqPage() {
  return (
    <>
      <div className="mkt-page-head">
        <div className="mkt-inner">
          <p className="mkt-kicker">FAQ</p>
          <h1>Pytania i odpowiedzi</h1>
          <p>Krótko i konkretnie — przed rozmową z zespołem sprzedażowym.</p>
        </div>
      </div>

      <section className="mkt-section">
        <div className="mkt-inner">
          {items.map((x) => (
            <div key={x.q} className="mkt-faq-item">
              <p className="mkt-faq-q">{x.q}</p>
              <p className="mkt-faq-a">{x.a}</p>
            </div>
          ))}
          <p style={{ marginTop: 32 }}>
            <Link href="/kontakt#demo" className="mkt-btn mkt-btn--primary">
              Umów demo
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}
