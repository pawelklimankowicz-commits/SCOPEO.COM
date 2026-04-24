import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalPackageIntro } from '@/components/legal/LegalSections';

export const metadata: Metadata = {
  title: 'Dokumenty prawne — Scopeo',
  description:
    'Regulamin, polityka prywatności, cookies, DPA i kontakt prawny — transparentna dokumentacja SaaS Scopeo.',
  robots: { index: true, follow: true },
};

const pages = [
  {
    href: '/regulamin',
    title: 'Regulamin świadczenia usług drogą elektroniczną',
    desc: 'Zasady korzystania z platformy, rejestracji, licencji, płatności i reklamacji.',
  },
  {
    href: '/polityka-prywatnosci',
    title: 'Polityka prywatności',
    desc: 'Administrator, cele, podstawy prawne, odbiorcy, retencja i prawa osób, których dane dotyczą.',
  },
  {
    href: '/cookies',
    title: 'Polityka cookies',
    desc: 'Pliki cookies i technologie podobne, podział na kategorie i zarządzanie zgodą.',
  },
  {
    href: '/dpa',
    title: 'DPA — umowa powierzenia przetwarzania danych',
    desc: 'Zasady współpracy administrator–procesor (art. 28 RODO), w tym wykaz subprocesorów, dla klientów biznesowych.',
  },
  {
    href: '/klauzule-formularzy',
    title: 'Klauzule formularzy',
    desc: 'Wzorce informacji i zgód dla demo, rejestracji, kontaktu i materiałów marketingowych.',
  },
  {
    href: '/kontakt-prawny',
    title: 'Kontakt prawny i reklamacje',
    desc: 'Kanały kontaktu: sprzedaż, support, prywatność, reklamacje.',
  },
];

export default function PrawneHubPage() {
  return (
    <>
      <div className="mkt-page-head mkt-page-head--dark">
        <div className="mkt-inner">
          <p className="mkt-kicker mkt-kicker--on-dark">Legal hub</p>
          <h1>Scopeo działa transparentnie</h1>
          <p>
            Poniżej zebraliśmy dokumenty prawne związane z usługą Scopeo w modelu SaaS B2B: regulamin usług
            elektronicznych, politykę prywatności, cookies, umowę powierzenia (DPA) oraz kanały kontaktu
            prawnego. Dokumenty ułatwiają zapoznanie się z zasadami przed rejestracją i zawarciem umowy.
          </p>
        </div>
      </div>

      <section className="mkt-section mkt-section--dark">
        <div className="mkt-inner" style={{ maxWidth: 720 }}>
          <LegalPackageIntro />
          <div className="mkt-legal-hub-grid">
            {pages.map((p) => (
              <Link key={p.href} href={p.href}>
                <strong>{p.title}</strong>
                <span>{p.desc}</span>
              </Link>
            ))}
          </div>
          <p style={{ marginTop: 28, fontSize: '0.875rem', color: '#94a3b8' }}>
            Wróć do{' '}
            <Link href="/" className="mkt-link">
              strony głównej
            </Link>{' '}
            lub{' '}
            <Link href="/kontakt" className="mkt-link">
              kontaktu handlowego
            </Link>
            .
          </p>
        </div>
      </section>
    </>
  );
}
