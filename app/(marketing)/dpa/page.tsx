import type { Metadata } from 'next';
import Link from 'next/link';
import { LEGAL_COMPANY, LEGAL_EMAIL } from '@/lib/legal';

export const metadata: Metadata = {
  title: 'DPA — powierzenie przetwarzania danych — Scopeo',
  robots: { index: true, follow: true },
};

export default function DpaPage() {
  return (
    <>
      <div className="mkt-page-head mkt-page-head--dark">
        <div className="mkt-inner">
          <p className="mkt-kicker mkt-kicker--on-dark">DPA</p>
          <h1>Dane Twojej organizacji na jasnych zasadach</h1>
          <p>
            Jeżeli korzystasz ze Scopeo jako klient biznesowy i powierzasz nam przetwarzanie danych osobowych w
            Twoim imieniu, poniższe postanowienia stanowią ramę umowy powierzenia zgodnej z art. 28 RODO —
            szczegóły mogą być doprecyzowane w osobnej umowie lub załączniku.
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
              <h3>Kiedy DPA jest potrzebna</h3>
              <p>
                W modelu SaaS, w którym dostawca przetwarza dane klientów w ich imieniu, standardem jest zawarcie
                umowy powierzenia określającej przedmiot, czas trwania, charakter i cel przetwarzania, rodzaje
                danych oraz obowiązki procesora — zgodnie z art. 28 RODO.
              </p>
            </div>
            <div className="mkt-legal-card">
              <h3>Strony</h3>
              <p>
                <strong>Administrator</strong> — Klient (Twoja organizacja).{' '}
                <strong>Procesor</strong> — {LEGAL_COMPANY.name}. Kontakt procesora:{' '}
                <a href={`mailto:${LEGAL_EMAIL.privacy}`} className="mkt-link">
                  {LEGAL_EMAIL.privacy}
                </a>
                .
              </p>
            </div>
          </div>

          <h2>Przedmiot i zakres przetwarzania</h2>
          <p>
            Procesor przetwarza dane osobowe wyłącznie w zakresie i celu określonym pisemnymi instrukcjami
            Administratora, niezbędnym do świadczenia Usługi Scopeo (np. obsługa kont użytkowników, przetwarzanie
            danych z dokumentów przekazanych w ramach konfiguracji produktu), chyba że prawo UE lub państwa
            członkowskiego nakazuje inaczej.
          </p>

          <h2>Obowiązki procesora</h2>
          <ul>
            <li>zapewnienie poufności oraz wsparcie przy realizacji praw osób, których dane dotyczą;</li>
            <li>stosowanie środków bezpieczeństwa odpowiednich do ryzyka;</li>
            <li>pomoc przy ocenie skutków przetwarzenia i konsultacjach z organem nadzorczym — w zakresie umowy;</li>
            <li>usuwanie lub zwracanie danych po zakończeniu świadczenia usługi, o ile nie wymaga tego prawo;</li>
            <li>udostępnianie informacji niezbędnych do wykazania spełnienia obowiązków oraz umożliwienie audytów.</li>
          </ul>

          <h2>Subprocesorzy</h2>
          <p>
            Administrator upoważnia Procesora do powierzania przetwarzania dalszym podmiotom (np. hosting,
            infrastruktura chmurowa) pod warunkiem zachowania co najmniej takiego samego poziomu ochrony. Lista
            subprocesorów może być prowadzona jako załącznik i aktualizowana zgodnie z umową.
          </p>

          <h2>Transfery poza EOG</h2>
          <p>
            Transfery danych poza EOG odbywają się przy zastosowaniu mechanizmów zgodnych z RODO (np. decyzje
            Komisji, standardowe klauzule umowne), o ile mają zastosowanie.
          </p>

          <h2>Naruszenia ochrony danych</h2>
          <p>
            Procesor poinformuje Administratora o stwierdzonym naruszeniu ochrony danych osobowych bez zbędnej
            zwłoki, zgodnie z art. 33 i 34 RODO oraz postanowieniami umowy.
          </p>

          <div className="mkt-legal-notice">
            Scopeo automatyzuje dane, ale nie zaciera odpowiedzialności. Każdy klient wie, gdzie kończy się rola
            administratora, a gdzie zaczyna się rola procesora.
          </div>

          <p>
            <Link href="/polityka-prywatnosci" className="mkt-link">
              Polityka prywatności
            </Link>{' '}
            ·{' '}
            <Link href="/prawne" className="mkt-link">
              Dokumenty prawne
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}
