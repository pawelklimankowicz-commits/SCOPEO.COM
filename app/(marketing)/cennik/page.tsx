import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import PricingTable from '@/components/marketing/PricingTable';

export const metadata: Metadata = {
  title: 'Cennik — Scopeo',
  description:
    'Plany Micro, Starter, Growth, Scale, Plus i Enterprise. Rozliczenie miesięczne lub roczne z 10% rabatem.',
};

export default function CennikPage() {
  return (
    <>
      <div className="mkt-page-head mkt-page-head--dark">
        <div className="mkt-inner">
          <p className="mkt-kicker mkt-kicker--on-dark">Cennik</p>
          <h1>Proste plany według wolumenu faktur</h1>
          <p>
            Opłata zależy od liczby faktur miesięcznie. Przełącz rozliczenie roczne, aby uzyskać 10%
            rabatu względem sumy miesięcznej.
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
                q: 'Co się dzieje po przekroczeniu limitu faktur?',
                a: 'Informujemy o przekroczeniu i proponujemy wyższy plan lub pakiet Enterprise — szczegóły w umowie.',
              },
              {
                q: 'Czy jest okres próbny?',
                a: 'Decyzja commercial — typowo demo i pilotaż zamiast „anonimowego trial” przy danych KSeF.',
              },
              {
                q: 'Czy cena obejmuje wdrożenie?',
                a: 'Wdrożenie i szkolenia mogą być wycenione osobno w zależności od skali.',
              },
              {
                q: 'Waluta i VAT',
                a: 'Ceny netto w PLN; faktura VAT zgodnie z prawem.',
              },
            ].map((x) => (
              <div key={x.q} className="mkt-faq-item">
                <p className="mkt-faq-q">{x.q}</p>
                <p className="mkt-faq-a">{x.a}</p>
              </div>
            ))}
          </div>
          <p style={{ marginTop: 24 }}>
            <Link href="/kontakt#demo" className="mkt-btn mkt-btn--primary">
              Umów demo
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}
