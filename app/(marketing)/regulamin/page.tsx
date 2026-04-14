import type { Metadata } from 'next';
import Link from 'next/link';
import { LEGAL_COMPANY } from '@/lib/legal';

export const metadata: Metadata = {
  title: 'Regulamin — Scopeo',
  robots: { index: true, follow: true },
};

const REGULATIONS_LAST_UPDATED = '2026-04-14';

export default function RegulaminPage() {
  const registryDetails = LEGAL_COMPANY.registryDetails.trim();
  const registryLine = registryDetails.length > 0 ? ` ${registryDetails}` : '';

  return (
    <>
      <div className="mkt-page-head mkt-page-head--dark">
        <div className="mkt-inner">
          <p className="mkt-kicker mkt-kicker--on-dark">Regulamin</p>
          <h1>Jasne zasady korzystania z Scopeo</h1>
          <p>
            Poniżej znajdują się warunki korzystania z platformy Scopeo, w tym zasady rejestracji, licencji,
            płatności, odpowiedzialności, reklamacji i bezpieczeństwa danych. Regulamin jest udostępniany przed
            zawarciem umowy i określa zasady świadczenia usług drogą elektroniczną zgodnie z ustawą o
            świadczeniu usług drogą elektroniczną.
          </p>
          <p style={{ marginTop: 12, fontSize: '0.8125rem', color: '#64748b' }}>
            Ostatnia aktualizacja: {REGULATIONS_LAST_UPDATED}
          </p>
        </div>
      </div>

      <section className="mkt-section mkt-section--dark">
        <div className="mkt-inner mkt-prose">
          <p style={{ margin: '0 0 24px', fontSize: '0.9375rem', color: '#94a3b8', lineHeight: 1.65 }}>
            Wprowadzenie i założenia całego pakietu dokumentów (w tym odniesienia do UŚUDE) są zebrane na
            stronie{' '}
            <Link href="/prawne" className="mkt-link">
              Dokumenty prawne
            </Link>
            . Poniżej — regulamin usług elektronicznych Scopeo.
          </p>
          <div className="mkt-legal-grid">
            <div className="mkt-legal-card">
              <h3>Po co ten dokument</h3>
              <p>
                Regulamin powinien być dostępny przed zawarciem umowy i opisywać m.in. rodzaj usług, warunki
                techniczne, zasady zawierania i rozwiązywania umów oraz zakaz dostarczania treści bezprawnych —
                zgodnie z art. 8 ustawy o świadczeniu usług drogą elektroniczną.
              </p>
            </div>
            <div className="mkt-legal-card">
              <h3>Usługodawca</h3>
              <p>
                Usługodawcą platformy Scopeo jest {LEGAL_COMPANY.name} z siedzibą w {LEGAL_COMPANY.seat}.{' '}
                {registryLine}
              </p>
            </div>
          </div>

          <h2>§1 Postanowienia ogólne</h2>
          <p>
            Niniejszy regulamin określa zasady korzystania z usługi SaaS „Scopeo” — oprogramowania wspierającego
            pracę nad danymi emisyjnymi i raportowaniem śladu węglowego w oparciu o dane z KSeF i powiązane
            dokumenty (dalej: „Usługa”). Szczegółowy zakres funkcjonalny, SLA, ceny i warunki handlowe mogą
            wynikać z odrębnej umowy lub zamówienia.
          </p>

          <h2>§2 Definicje</h2>
          <ul>
            <li>
              <strong>Klient</strong> — podmiot korzystający z Usługi, z którym zawarta jest umowa lub który
              zaakceptował regulamin przy rejestracji.
            </li>
            <li>
              <strong>Użytkownik</strong> — osoba fizyczna uprawniona do korzystania z konta w ramach
              organizacji Klienta.
            </li>
            <li>
              <strong>Dostawca</strong> — {LEGAL_COMPANY.name}.
            </li>
          </ul>

          <h2>§3 Opis Usługi</h2>
          <p>
            Scopeo to platforma SaaS służąca m.in. do importu i przetwarzania danych z KSeF (OCR tam, gdzie
            przewidziano), mapowania do kategorii emisji (w tym Scope 1, 2 i 3), workflow review, nadpisań z
            kontrolą oraz rejestrowania historii zmian (audit trail). Zakres konkretnych modułów zależy od
            planu i konfiguracji wdrożenia.
          </p>

          <h2>§4 Rejestracja, logowanie i konta</h2>
          <p>
            Dostęp do Usługi jest przyznawany po rejestracji lub zaproszeniu w ramach organizacji. Użytkownik
            zobowiązuje się podawać prawdziwe dane oraz chronić poufność danych logowania. Klient odpowiada za
            działania osób, którym nadał dostęp.
          </p>

          <h2>§5 Licencja i dozwolone użycie</h2>
          <p>
            Dostawca udziela Klientowi niewyłącznej, czasowej licencji na korzystanie z oprogramowania w zakresie
            wynikającym z umowy. Zabronione jest m.in. dekompilowanie, obchodzenie zabezpieczeń, wykorzystywanie
            Usługi w sposób powodujący nadmierne obciążenie infrastruktury lub naruszający prawo.
          </p>

          <h2>§6 Dane i odpowiedzialność Klienta</h2>
          <p>
            Klient odpowiada za legalność przekazywania danych do Usługi oraz za prawdziwość informacji
            konfiguracyjnych. Dostawca przetwarza dane osobowe zgodnie z{' '}
            <Link href="/polityka-prywatnosci" className="mkt-link">
              polityką prywatności
            </Link>{' '}
            oraz — w zakresie powiernionym — zgodnie z{' '}
            <Link href="/dpa" className="mkt-link">
              umową powierzenia (DPA)
            </Link>
            .
          </p>

          <h2>§7 Płatności i subskrypcja</h2>
          <p>
            Wynagrodzenie wynika z wybranego planu i okresu rozliczeniowego (miesięcznie lub rocznie), o ile
            umowa nie stanowi inaczej. Nieuregulowanie należności może skutkować ograniczeniem dostępu po
            uprzednim wezwaniu — zgodnie z umową.
          </p>

          <h2>§8 Dostępność Usługi</h2>
          <p>
            Dostawca dokłada staranności, aby Usługa działała zgodnie z opisem, jednak nie gwarantuje
            nieprzerwanego działania bez przerw serwisowych i prac konserwacyjnych — z wyłączeniem gwarancji
            wynikających z odrębnej umowy SLA.
          </p>

          <h2>§9 Reklamacje</h2>
          <p>
            Reklamacje dotyczące działania Usługi można kierować na adres wskazany w{' '}
            <Link href="/kontakt-prawny" className="mkt-link">
              kontakcie prawnym
            </Link>
            . Rozpatrzenie następuje w terminie wskazanym w umowie lub — w braku takiego zapisu — w terminie 14
            dni roboczych od otrzymania kompletnego zgłoszenia.
          </p>

          <h2>§10 Postanowienia końcowe</h2>
          <p>
            Prawem właściwym dla umów z przedsiębiorcami jest prawo polskie. Spory rozstrzygane będą przez sąd
            właściwy dla siedziby Dostawcy, o ile umowa nie stanowi inaczej. Dostawca może zmienić regulamin z
            zachowaniem trybu określonego w umowie lub powiadomieniem na stronie Usługi, jeżeli przepisy na to
            pozwalają.
          </p>

          <div className="mkt-legal-notice">
            Scopeo porządkuje dane i obowiązki. Ty skupiasz się na raporcie — my pokazujemy zasady współpracy
            wprost, bez ukrytych klauzul i bez prawniczego chaosu.
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
