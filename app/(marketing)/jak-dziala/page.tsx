import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Jak działa Scopeo — od KSeF do raportu emisji',
  description:
    'Połącz konto KSeF, Scopeo automatycznie importuje faktury i mapuje je do Scope 1–3. Workflow akceptacji, audit trail i eksport CSRD — krok po kroku.',
};

const steps = [
  {
    title: 'Połączenie z KSeF',
    body:
      'Jednorazowa konfiguracja: wpisujesz token autoryzacyjny KSeF swojej firmy, Scopeo weryfikuje połączenie i zaczyna pobierać faktury. Cała historia dostępna od razu — nie tylko bieżące dokumenty. Każde połączenie KSeF jest przypisane do organizacji i szyfrowane.',
  },
  {
    title: 'Automatyczny import faktur',
    body:
      'Scopeo pobiera faktury z kolejki KSeF bez Twojego udziału. Każda faktura jest parsowana, pozycje rozbijane na linie, status importu widoczny w dashboardzie. Błędy i wyjątki trafiają do osobnej kolejki — nie blokują reszty.',
  },
  {
    title: 'Mapowanie do Scope 1, 2 i 3',
    body:
      'System automatycznie przypisuje każdą linię faktury do kategorii emisji (Scope 1 — paliwa, Scope 2 — energia, Scope 3 — zakupione usługi, transport, odpady itd.) na podstawie współczynników KOBiZE. Poziom pewności przypisania jest widoczny w aplikacji — pozycje wątpliwe trafiają do kolejki weryfikacji.',
  },
  {
    title: 'Workflow akceptacji',
    body:
      'Linie przypisane automatycznie z niską pewnością lub wymagające weryfikacji trafiają do kolejki akceptacji. Analityk sprawdza przypisanie, może je zmienić i dodać uzasadnienie. Każda decyzja jest zapisywana z datą i użytkownikiem.',
  },
  {
    title: 'Override i korekty z kontrolą',
    body:
      'Zmiana kategorii emisji lub współczynnika jest zawsze rejestrowana jako świadoma decyzja — z polem na komentarz i statusem nadpisania (override). Audytor widzi, co zmieniono, przez kogo i dlaczego. Nie ma cichych poprawek.',
  },
  {
    title: 'Raport i eksport',
    body:
      'Dashboard pokazuje agregaty Scope 1–3 z podziałem na kategorie i trendy. Z jednego miejsca generujesz raport PDF (GHG Protocol), eksport CSV lub plik XML zgodny z CSRD/ESRS. Każdy eksport ma znacznik czasu i informację o zakresie danych.',
  },
];

export default function JakDzialaPage() {
  return (
    <>
      <div className="mkt-page-head">
        <div className="mkt-inner">
          <p className="mkt-kicker">Proces</p>
          <h1>Jak działa Scopeo</h1>
          <p>
            Od jednorazowego połączenia z KSeF po raport gotowy na audyt — sześć kroków,
            które zamieniają surowe faktury w uporządkowane dane emisyjne.
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
                    flexShrink: 0,
                  }}
                >
                  {i + 1}
                </div>
                <div>
                  <h2 style={{ margin: '0 0 8px', fontSize: '1.125rem' }}>{s.title}</h2>
                  <p style={{ margin: 0, color: '#64748b', lineHeight: 1.65, fontSize: '0.9375rem' }}>{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mkt-section mkt-section--surface">
        <div className="mkt-inner">
          <h2 className="mkt-section-title">Często zadawane pytania o proces</h2>
          <div>
            {[
              {
                q: 'Jak długo trwa pierwsze uruchomienie?',
                a: 'Rejestracja i pierwsze połączenie KSeF zajmuje około 15 minut. Pierwsze faktury są importowane w ciągu kilku minut od połączenia. Nie potrzeba wdrożenia IT ani konfiguracji serwerów.',
              },
              {
                q: 'Co się dzieje z fakturami, których nie da się automatycznie przypisać?',
                a: 'Trafiają do kolejki akceptacji z oznaczeniem niskiej pewności. Analityk może ręcznie przypisać kategorię, dodać uzasadnienie i oznaczyć pozycję jako zweryfikowaną. Wszystko jest zapisywane w audit trail.',
              },
              {
                q: 'Czy mogę zmienić przypisanie kategorii po akceptacji?',
                a: 'Tak — każda zmiana jest rejestrowana jako override ze statusem i komentarzem. Historia zmian jest zawsze dostępna i eksportowalna. Nie ma możliwości cichej edycji bez śladu.',
              },
              {
                q: 'Czy Scopeo obsługuje dokumenty spoza KSeF?',
                a: 'Tak, w ograniczonym zakresie — dokumenty można dodać ręcznie lub przez OCR. KSeF pozostaje głównym i zalecanym źródłem danych ze względu na standaryzację i kompletność.',
              },
            ].map((x) => (
              <div key={x.q} className="mkt-faq-item">
                <p className="mkt-faq-q">{x.q}</p>
                <p className="mkt-faq-a">{x.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mkt-section">
        <div className="mkt-inner mkt-cta-band">
          <h2>Przekonaj się sam — 7 dni bezpłatnie</h2>
          <p>
            Zarejestruj się, połącz KSeF i przejdź przez cały proces na swoich danych.
            Bez karty kredytowej.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Link href="/register" className="mkt-btn mkt-btn--primary">
              Zacznij bezpłatny trial
            </Link>
            <Link href="/kontakt" className="mkt-btn mkt-btn--secondary">
              Wolę demo z zespołem
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
