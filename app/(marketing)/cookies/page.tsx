import type { Metadata } from 'next';
import Link from 'next/link';
import { LEGAL_COMPANY, LEGAL_EMAIL } from '@/lib/legal';

export const metadata: Metadata = {
  title: 'Polityka cookies — Scopeo',
  robots: { index: true, follow: true },
};

export default function CookiesPage() {
  return (
    <>
      <div className="mkt-page-head mkt-page-head--dark">
        <div className="mkt-inner">
          <p className="mkt-kicker mkt-kicker--on-dark">Cookies</p>
          <h1>Cookies pod kontrolą</h1>
          <p>
            Poniżej opisujemy, które pliki cookies i podobne technologie mogą być stosowane w serwisie Scopeo,
            w jakim celu oraz jak można zarządzać preferencjami — w tym cofnąć zgodę tam, gdzie jest wymagana.
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
              <h3>Po co osobna strona</h3>
              <p>
                Oddzielna polityka cookies ułatwia zrozumienie, jakie technologie są stosowane, w jakim celu
                oraz które są niezbędne do działania serwisu, a które mogą wymagać zgody.
              </p>
            </div>
            <div className="mkt-legal-card">
              <h3>Administrator</h3>
              <p>
                Administratorem w rozumieniu przepisów o cookies jest {LEGAL_COMPANY.name}. Pytania:{' '}
                <a href={`mailto:${LEGAL_EMAIL.privacy}`} className="mkt-link">
                  {LEGAL_EMAIL.privacy}
                </a>
                .
              </p>
            </div>
          </div>

          <h2>Czym są pliki cookies</h2>
          <p>
            Pliki cookies to małe informacje zapisywane na urządzeniu użytkownika przez przeglądarkę. Mogą być
            stosowane także technologie podobne (np. local storage) — poniżej używamy zbiorczego słowa „cookies”.
          </p>

          <h2>Rodzaje cookies</h2>
          <ul>
            <li>
              <strong>Niezbędne</strong> — umożliwiają podstawowe działanie serwisu (np. sesja, bezpieczeństwo,
              ustawienia zgód).
            </li>
            <li>
              <strong>Funkcjonalne</strong> — zapamiętują wybory użytkownika (np. język), o ile są wdrożone.
            </li>
            <li>
              <strong>Analityczne</strong> — pomagają zrozumieć ruch w serwisie; mogą wymagać zgody, jeśli nie
              są ściśle niezbędne.
            </li>
            <li>
              <strong>Marketingowe</strong> — mogą być używane tylko przy zgodzie i zgodnie z ustawieniami
              banera (jeśli jest stosowany).
            </li>
          </ul>

          <h2>Dostawcy i czas przechowywania</h2>
          <p>
            Konkretna lista cookies, dostawców (np. hosting, analityka) oraz czasy przechowywania powinny być
            utrzymywane w aktualnej tabeli technicznej — uzupełnij ją przy wdrożeniu produkcyjnym i narzędziach
            analitycznych.
          </p>

          <h2>Baner zgód i cofnięcie zgody</h2>
          <p>
            Jeśli stosujemy baner cookies, użytkownik może zaakceptować lub odrzucić kategorie opcjonalne.
            Preferencje można zmienić w ustawieniach cookies w serwisie lub przez ustawienia przeglądarki —
            zgodnie z implementacją produkcyjną.
          </p>

          <div className="mkt-legal-notice">
            Transparentność zaczyna się od pierwszego kliknięcia. Scopeo nie ukrywa narzędzi analitycznych ani
            zasad działania banera zgód.
          </div>

          <p>
            Więcej o danych osobowych:{' '}
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
