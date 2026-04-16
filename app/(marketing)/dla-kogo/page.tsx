import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Dla kogo jest Scopeo — segmenty i przypadki użycia',
  description:
    'Scopeo dla działów finansów, ESG managerów, MŚP przygotowujących się do CSRD, grup spółek i biur rachunkowych. Sprawdź czy to narzędzie dla Ciebie.',
};

const segments = [
  {
    title: 'Działy finansów i księgowości',
    problem:
      'Te same faktury przetwarzane dwukrotnie — raz „pod podatek", raz „pod ESG". Osobny Excel dla emisji, który rozjeżdża się z danymi z systemu FK.',
    value:
      'Scopeo korzysta z KSeF — tego samego źródła co Twój system finansowy. Jedno źródło prawdy eliminuje konflikty wersji między działami. Dział finansów konfiguruje raz, ESG korzysta z tych samych danych.',
    badge: 'Finanse',
  },
  {
    title: 'Zespoły ESG i sustainability',
    problem:
      'Dane emisyjne oparte na szacunkach lub kopiowane z poprzedniego raportu. Zarząd pyta o metodologię — trudno obronić liczby bez historii decyzji.',
    value:
      'Scopeo daje Ci dane transakcyjne z KSeF — nie szacunki. Każda kategoria emisji ma źródło w konkretnej fakturze. Workflow akceptacji z historią zmian sprawia, że każda liczba w raporcie jest obronialna.',
    badge: 'ESG',
  },
  {
    title: 'Małe i średnie firmy przygotowujące się do CSRD',
    problem:
      'CSRD zbliża się, ale nie masz jeszcze ani budżetu na zewnętrzne doradztwo ESG, ani czasu na wielomiesięczne wdrożenie.',
    value:
      'Plan Mikro startuje od 149 zł miesięcznie. Połączenie KSeF i pierwsze dane emisyjne w ciągu godziny. Nie potrzebujesz specjalisty ESG do uruchomienia — system jest zaprojektowany dla działu finansowego.',
    badge: 'MŚP',
  },
  {
    title: 'Grupy spółek i holdingi',
    problem:
      'Kilkanaście jednostek, każda z osobnym KSeF i Excelem. Konsolidacja danych na poziomie grupy zajmuje tygodnie i kończy się ręcznym scalaniem plików.',
    value:
      'Plany Growth i Scale pozwalają na wiele połączeń KSeF w jednej organizacji. Jeden panel dla całej grupy — spójny proces, identyczne reguły mapowania, jeden audit trail. Konsolidacja w kilka kliknięć zamiast scalania plików.',
    badge: 'Grupy spółek',
  },
  {
    title: 'Biura rachunkowe i doradcy ESG',
    problem:
      'Obsługa kilku klientów jednocześnie, każdy z innym arkuszem i inną metodologią. Trudno utrzymać powtarzalność i jakość przy rosnącej liczbie zleceń.',
    value:
      'Jedna platforma do obsługi wielu klientów — każdy z izolowaną przestrzenią danych. Powtarzalny proces importu i akceptacji, mniej czasu na konfigurację, więcej na analizę. Możliwość eksportu raportów z brandingiem klienta (plan Scale).',
    badge: 'Doradcy',
  },
];

export default function DlaKogoPage() {
  return (
    <>
      <div className="mkt-page-head">
        <div className="mkt-inner">
          <p className="mkt-kicker">Dla kogo</p>
          <h1>Scopeo dla Twojego zespołu</h1>
          <p>
            Scopeo adresuje firmy, które mają faktury w KSeF i muszą z nich zrobić
            rzetelny raport emisji — bez wielomiesięcznego projektu wdrożeniowego.
          </p>
        </div>
      </div>

      <section className="mkt-section">
        <div className="mkt-inner">
          <div style={{ display: 'grid', gap: 24 }}>
            {segments.map((s) => (
              <div key={s.title} className="mkt-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <h2 style={{ margin: 0, fontSize: '1.125rem' }}>{s.title}</h2>
                  <span
                    style={{
                      fontSize: '0.6875rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      background: '#f1f5f9',
                      color: '#475569',
                      borderRadius: 999,
                      padding: '3px 10px',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {s.badge}
                  </span>
                </div>
                <p style={{ margin: '0 0 10px', fontSize: '0.875rem', color: '#64748b', lineHeight: 1.6 }}>
                  <strong style={{ color: '#0f172a' }}>Typowy problem: </strong>
                  {s.problem}
                </p>
                <p style={{ margin: '0 0 16px', fontSize: '0.9375rem', color: '#475569', lineHeight: 1.6 }}>
                  <strong style={{ color: '#0f766e' }}>Co zmienia Scopeo: </strong>
                  {s.value}
                </p>
                <Link href="/register" className="mkt-btn mkt-btn--primary mkt-btn--sm">
                  Zacznij bezpłatny trial
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mkt-section mkt-section--surface">
        <div className="mkt-inner mkt-cta-band">
          <h2>Nie jesteś pewny czy Scopeo pasuje do Twojej organizacji?</h2>
          <p>
            Zostaw dane — skontaktujemy się i odpowiemy na pytania dotyczące Twojego przypadku.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Link href="/kontakt" className="mkt-btn mkt-btn--primary">
              Porozmawiaj z nami
            </Link>
            <Link href="/register" className="mkt-btn mkt-btn--secondary">
              Lub zacznij trial samodzielnie
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
