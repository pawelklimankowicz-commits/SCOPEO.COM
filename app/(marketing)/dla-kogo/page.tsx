import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Dla kogo — Scopeo',
  description:
    'MŚP, ESG, finanse, księgowość, doradcy i grupy spółek — Scopeo dla zespołów pracujących na danych z KSeF.',
};

const segments = [
  {
    title: 'Małe i średnie firmy',
    problem: 'Rosnące wymagania raportowe przy ograniczonym zespole i rozproszonych arkuszach.',
    value:
      'Jedna baza danych z faktur, przejrzysty workflow i mniej ręcznego przepisywania między działami.',
  },
  {
    title: 'Zespoły ESG i sustainability',
    problem: 'Potrzeba liczb zgodnych z księgowością i możliwości obrony metodologii przy pytaniach zarządu.',
    value:
      'Powiązanie linii z KSeF z kategoriami emisji, statusy review i historia zmian pod audyt.',
  },
  {
    title: 'Finanse i księgowość',
    problem: 'Duplikacja pracy: te same faktury przetwarzane osobno „pod podatek” i „pod ESG”.',
    value:
      'Wspólne źródło prawdy z KSeF, mniej konfliktów wersji i jaśniejsze odpowiedzialności.',
  },
  {
    title: 'Partnerzy doradczy',
    problem: 'Wdrożenia u klientów wymagają powtarzalnego procesu i narzędzia, które da się utrzymać.',
    value:
      'Produkt do wielu organizacji z kontrolą dostępu i procesu — mniej custom Excela u klienta.',
  },
  {
    title: 'Grupy spółek',
    problem: 'Spójność danych między jednostkami i konsolidacja bez chaosu plików.',
    value:
      'Struktura organizacji i powtarzalny proces importu oraz review na poziomie grupy (zakres Enterprise).',
  },
];

export default function DlaKogoPage() {
  return (
    <>
      <div className="mkt-page-head">
        <div className="mkt-inner">
          <p className="mkt-kicker">Segmenty</p>
          <h1>Dla kogo jest Scopeo</h1>
          <p>
            Produkt jest adresowany do organizacji, które muszą połączyć rzeczywiste dane faktur z KSeF z
            procesem raportowania emisji — bez przenoszenia całej firmy do narracji „klimatycznej”.
          </p>
        </div>
      </div>

      <section className="mkt-section">
        <div className="mkt-inner">
          <div style={{ display: 'grid', gap: 20 }}>
            {segments.map((s) => (
              <div key={s.title} className="mkt-card">
                <h2 style={{ margin: '0 0 8px', fontSize: '1.125rem' }}>{s.title}</h2>
                <p style={{ margin: '0 0 10px', fontSize: '0.875rem', color: '#64748b' }}>
                  <strong style={{ color: '#0f172a' }}>Problem: </strong>
                  {s.problem}
                </p>
                <p style={{ margin: 0, fontSize: '0.9375rem', color: '#475569', lineHeight: 1.55 }}>
                  <strong style={{ color: '#0f766e' }}>Wartość Scopeo: </strong>
                  {s.value}
                </p>
                <div style={{ marginTop: 16 }}>
                  <Link href="/kontakt#demo" className="mkt-btn mkt-btn--primary mkt-btn--sm">
                    Umów demo
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
