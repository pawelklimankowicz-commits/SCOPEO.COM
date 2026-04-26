import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import PricingTable from '@/components/marketing/PricingTable';

export const metadata: Metadata = {
  title: 'Cennik — Scopeo',
  description:
    'Plany Mikro, Starter, Growth, Scale i Enterprise. Rozliczenie miesięcznie lub rocznie (−10%). Bez limitu faktur — limity wg połączeń KSeF i użytkowników. 7-dniowy trial.',
};

export default function CennikPage() {
  return (
    <>
      <div className="mkt-page-head mkt-page-head--dark">
        <div className="mkt-inner">
          <p className="mkt-kicker mkt-kicker--on-dark">Cennik</p>
          <h1>Proste plany — bez limitu faktur</h1>
          <p>
            Płacisz za liczbę połączeń KSeF i użytkowników w organizacji, a nie za wolumen faktur.
            Przy jednorazowej opłacie za 12 miesięcy otrzymujesz rabat 10%. Każdy plan obejmuje
            7-dniowy bezpłatny trial.
          </p>
        </div>
      </div>

      <section className="mkt-section mkt-section--dark">
        <div className="mkt-inner">
          <div className="mkt-dark-shot mkt-pricing-hero-shot">
            <Image
              src="/marketing/section-pricing-dark.png"
              alt="Scopeo — wybór planu i cennik"
              width={1200}
              height={560}
              sizes="(max-width: 960px) 100vw, min(1120px, 100vw)"
            />
          </div>
          <PricingTable />
        </div>
      </section>

      <section className="mkt-section mkt-section--surface">
        <div className="mkt-inner">
          <h2 className="mkt-section-title">FAQ cenowe</h2>
          <div>
            {[
              {
                q: 'Czy jest limit faktur?',
                a: 'Nie — liczba faktur z KSeF nie wpływa na cenę. Limity dotyczą wyłącznie połączeń KSeF i liczby aktywnych użytkowników w planie.',
              },
              {
                q: 'Jak działa trial?',
                a: 'Po rejestracji masz 7 dni bezpłatnego dostępu do funkcji wybranego planu.',
              },
              {
                q: 'Czy cena obejmuje wdrożenie?',
                a: 'Standardowo płacisz za subskrypcję SaaS. Szkolenie zespołu lub wdrożenie pod dużą skalę (np. grupa spółek) możemy wycenić osobno — napisz na kontakt.',
              },
              {
                q: 'Waluta i VAT',
                a: 'Ceny na stronie są podane netto w PLN. Dokument sprzedaży i status VAT zależą od Twojej sytuacji podatkowej i rozliczenia ze Stripe — szczegóły w regulaminie.',
              },
            ].map((x) => (
              <div key={x.q} className="mkt-faq-item">
                <p className="mkt-faq-q">{x.q}</p>
                <p className="mkt-faq-a">{x.a}</p>
              </div>
            ))}
          </div>
          <p style={{ marginTop: 24, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link href="/register" className="mkt-btn mkt-btn--primary">
              Zacznij bezpłatny trial
            </Link>
            <Link href="/kontakt#demo" className="mkt-btn mkt-btn--secondary">
              Umów demo
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}
