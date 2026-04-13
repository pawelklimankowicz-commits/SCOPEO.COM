import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Jak działa — Scopeo',
  description:
    'Od połączenia z KSeF przez import, OCR, normalizację, mapowanie do emisji i review do gotowego wyniku.',
};

const steps = [
  {
    title: 'Połączenie i token KSeF',
    body:
      'Konfiguracja dostępu do źródła faktur zgodnie z polityką bezpieczeństwa organizacji (zakres wdrożenia ustalany przy starcie).',
  },
  {
    title: 'Import danych',
    body:
      'Pobieranie faktur z KSeF, kolejka przetwarzania, obsługa błędów i ponowień. Dokumenty poza KSeF — wg konfiguracji OCR i ręcznego uzupełnienia.',
  },
  {
    title: 'OCR i normalizacja',
    body:
      'Ekstrakcja pól z załączników tam, gdzie to potrzebne, i doprowadzenie danych do wspólnego modelu.',
  },
  {
    title: 'Mapowanie do emisji',
    body:
      'Przypisanie linii do kategorii Scope 1, 2 lub 3, dobór współczynników i reguł — z możliwością override w kontrolowanym procesie.',
  },
  {
    title: 'Review',
    body:
      'Kolejka, role, statusy i komentarze — tak, by dało się prześledzić decyzję od faktury do agregatu.',
  },
  {
    title: 'Wynik i raportowanie',
    body:
      'Agregaty emisji, historia zmian i gotowość do dalszego raportowania w procesie organizacji (eksporty zależą od wdrożenia).',
  },
];

export default function JakDzialaPage() {
  return (
    <>
      <div className="mkt-page-head">
        <div className="mkt-inner">
          <p className="mkt-kicker">Proces</p>
          <h1>Jak to działa</h1>
          <p>
            Krótki, przejrzysty łańcuch: dane z KSeF → porządek w systemie → review → wynik z audytowalną
            historią.
          </p>
        </div>
      </div>

      <section className="mkt-section">
        <div className="mkt-inner">
          <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 20 }}>
            {steps.map((s, i) => (
              <li key={s.title} className="mkt-card" style={{ display: 'grid', gridTemplateColumns: '48px 1fr', gap: 20 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: '#0f172a',
                    color: '#fff',
                    display: 'grid',
                    placeItems: 'center',
                    fontWeight: 700,
                    fontSize: '0.875rem',
                  }}
                >
                  {i + 1}
                </div>
                <div>
                  <h2 style={{ margin: '0 0 8px', fontSize: '1.125rem' }}>{s.title}</h2>
                  <p style={{ margin: 0, color: '#64748b', lineHeight: 1.6, fontSize: '0.9375rem' }}>{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mkt-section mkt-section--surface">
        <div className="mkt-inner mkt-cta-band">
          <h2>Zobacz proces na demo</h2>
          <p>Pokażemy import, review i audit trail na przykładzie zbliżonym do Twojej organizacji.</p>
          <Link href="/kontakt#demo" className="mkt-btn mkt-btn--primary">
            Umów demo
          </Link>
        </div>
      </section>
    </>
  );
}
