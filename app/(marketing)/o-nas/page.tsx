import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'O Scopeo — dlaczego powstało i co oferuje',
  description:
    'Polskie SaaS do emisji GHG z KSeF: import, Scope 1–3, workflow akceptacji, ślad audytowy, eksport CSRD/GHG. Dla firm, które wychodzą z chaosu Excela.',
};

export default function ONasPage() {
  return (
    <>
      <div className="mkt-page-head">
        <div className="mkt-inner">
          <p className="mkt-kicker">O produkcie</p>
          <h1>Dlaczego powstało Scopeo</h1>
          <p>
            Polskie firmy mają w KSeF jedne z najlepiej ustrukturyzowanych danych finansowych
            na świecie. A mimo to liczą ślad węglowy w Excelu. Scopeo to zmienia.
          </p>
        </div>
      </div>

      <section className="mkt-section">
        <div className="mkt-inner mkt-prose">

          <h2>KSeF to gotowe dane emisyjne. Trzeba je tylko poukładać.</h2>
          <p>
            Każda polska firma, która wystawia lub odbiera faktury elektroniczne w KSeF, ma już
            w rękach najlepsze możliwe dane do liczenia śladu węglowego — rzeczywiste dane
            transakcyjne, nie szacunki z ankiety. Brakuje tylko systemu, który zamieni te faktury
            w kategoryzowane emisje Scope 1–3.
          </p>
          <p>
            Scopeo robi dokładnie to: automatycznie pobiera faktury z KSeF, mapuje je do kategorii
            emisji na podstawie współczynników KOBiZE i prowadzi przez workflow akceptacji z pełnym
            śladem audytowym (audit trail). Wynik to raport gotowy dla CFO, zarządu i zewnętrznego
            audytora.
          </p>

          <h2>Raportowanie emisji to operacja, nie jednorazowy projekt</h2>
          <p>
            Wiele firm podchodzi do śladu węglowego jak do jednorazowego zlecenia — outsourcowanego
            do doradcy raz na rok. To może wystarczyć przy pierwszym raporcie. Ale przy CSRD raportowanie
            staje się regularnym obowiązkiem: dane kwartalne, workflow akceptacji, historia zmian
            i możliwość weryfikacji. Tego nie da się sensownie utrzymać w Excelu ani arkuszu Google.
          </p>
          <p>
            Scopeo jest zaprojektowany jako system operacyjny do tej pracy — z rolami, statusami,
            historią decyzji i eksportem pod audyt. Działa jak narzędzie finansowe, nie jak raport ESG.
          </p>

          <h2>Polskie narzędzie dla polskiego rynku</h2>
          <p>
            Scopeo powstało w Polsce, integruje się z polskim KSeF i używa polskich baz
            współczynników emisji (KOBiZE). Nie jest tłumaczeniem zachodniego narzędzia
            na polski rynek — jest zbudowane od początku z myślą o polskiej infrastrukturze
            podatkowej i specyfice lokalnych firm.
          </p>
          <p>
            Rozumiemy, że dział finansowy w polskiej firmie nie myśli w kategoriach "Scope 3
            Category 1 purchased goods" — myśli w kategoriach faktur, NIPów i rejestrów VAT.
            Dlatego interfejs Scopeo mówi językiem operacji finansowych, nie żargonem ESG.
          </p>

          <h2>Co Scopeo nie jest</h2>
          <p>
            Scopeo nie jest kalkulatorem edukacyjnym do nauki metodyki GHG. Nie jest platformą
            konsultingową. Nie obiecuje, że "uratujemy planetę razem" — to decyzje biznesowe
            i polityczne, nie software. Scopeo jest narzędziem B2B do konkretnej pracy:
            zebrać, poukładać, zatwierdzić i wyeksportować dane emisyjne. Dobrze i powtarzalnie.
          </p>

          <div style={{ marginTop: 32, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link href="/register" className="mkt-btn mkt-btn--primary">
              Zacznij bezpłatny trial — 7 dni
            </Link>
            <Link href="/kontakt#demo" className="mkt-btn mkt-btn--secondary">
              Umów demo
            </Link>
            <Link href="/jak-dziala" className="mkt-btn mkt-btn--secondary">
              Jak działa
            </Link>
          </div>
        </div>
      </section>

      <section className="mkt-section mkt-section--surface">
        <div className="mkt-inner">
          <p className="mkt-kicker">Transparentność</p>
          <h2 className="mkt-section-title">Co wiemy, a czego nie gwarantujemy</h2>
          <div className="mkt-grid-2">
            {[
              {
                t: 'Co Scopeo robi dobrze',
                items: [
                  'Automatyczny import faktur z KSeF',
                  'Mapowanie do Scope 1–3 z bazą KOBiZE',
                  'Workflow akceptacji z pełnym audit trail',
                  'Eksport do formatów CSRD/ESRS i GHG Protocol',
                  'Izolacja danych per organizacja, hosting w UE',
                ],
                accent: '#10b981',
              },
              {
                t: 'Czego Scopeo nie zastępuje',
                items: [
                  'Zewnętrznej weryfikacji emisji przez akredytowanego weryfikatora',
                  'Doradztwa prawnego w zakresie CSRD i ESG',
                  'Strategii redukcji emisji (to decyzja biznesowa)',
                  'Szkoleń GHG Protocol dla zespołu',
                  'Pełnego raportu CSRD z częścią narracyjną',
                ],
                accent: '#94a3b8',
              },
            ].map((col) => (
              <div key={col.t} className="mkt-card">
                <h3 style={{ color: col.accent, marginTop: 0 }}>{col.t}</h3>
                <ul style={{ paddingLeft: '1.2em', margin: 0 }}>
                  {col.items.map((item) => (
                    <li key={item} style={{ color: '#475569', fontSize: '0.9375rem', lineHeight: 1.65, marginBottom: 6 }}>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
