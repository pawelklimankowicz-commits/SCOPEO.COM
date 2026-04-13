import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Dlaczego Scopeo',
  description:
    'Filozofia produktu: operacyjny workflow emisji z KSeF, audytowalność i porządek zamiast chaosu Excela.',
};

export default function ONasPage() {
  return (
    <>
      <div className="mkt-page-head">
        <div className="mkt-inner">
          <p className="mkt-kicker">Pozycjonowanie</p>
          <h1>Dlaczego Scopeo</h1>
          <p>
            Nie budujemy narracji „ratujemy planetę jednym kliknięciem”. Budujemy narzędzie dla operacji
            firmy: dane z KSeF, Scope 1–3, review i audit trail — tak, by dało się to utrzymać i obronić
            przed zarządem oraz audytorem.
          </p>
        </div>
      </div>

      <section className="mkt-section">
        <div className="mkt-inner mkt-prose">
          <h2>Źródło prawdy: KSeF</h2>
          <p>
            Krajowy System e-Faktur daje powtarzalny strumień dokumentów finansowych. To naturalne wejście do
            liczenia emisji z rzeczywistej aktywności gospodarczej — zamiast od zgadywania w arkuszu.
          </p>
          <h2>Carbon workflow ma być operacyjny</h2>
          <p>
            Raportowanie emisji nie jest jednorazowym slajdem na boardzie. To proces: import, wyjątki,
            decyzje, korekty. Scopeo jest projektowany jako system operacyjny do tej pracy — ze statusami,
            rolami i historią.
          </p>
          <h2>Audytowalność, nie „magia”</h2>
          <p>
            Każda zmiana kategorii, współczynnika czy statusu powinna da się prześledzić. To warunek
            wiarygodności wobec księgowości i ESG — i warunek sensownego wdrożenia w większej organizacji.
          </p>
          <h2>Dla kogo to nie jest</h2>
          <p>
            Scopeo nie jest zabawką edukacyjną ani zbiorem ogólnych porad ESG. To oprogramowanie B2B dla firm,
            które mają faktury i muszą z nich zrobić uporządkowany wynik emisyjny.
          </p>
          <div style={{ marginTop: 8 }}>
            <Link href="/kontakt#demo" className="mkt-btn mkt-btn--primary">
              Umów demo
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
