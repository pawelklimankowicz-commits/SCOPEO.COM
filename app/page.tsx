import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="container">
      <div className="nav">
        <div>
          <span className="badge">Scopeo · KSeF → GHG</span>
          <h1 className="title" style={{ marginBottom: 8 }}>
            Ślad węglowy z faktur KSeF
          </h1>
          <p className="subtitle">
            Multi-tenant SaaS: import XML, mapowanie do scope 1–3, kolejka review z diffami,
            import faktorów (UK Government, EPA, overlay PL) i kalkulacja kg CO₂e.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link className="btn btn-secondary" href="/login">
            Logowanie
          </Link>
          <Link className="btn btn-primary" href="/login">
            Start — rejestracja
          </Link>
        </div>
      </div>

      <div className="grid grid-3" style={{ marginTop: 32 }}>
        <div className="card section">
          <h2 style={{ marginTop: 0, fontSize: 18 }}>1. Tenant i KSeF</h2>
          <p className="small">
            Rejestracja zakłada organizację. Onboarding zbiera profil raportowania i token KSeF
            (maskowany w bazie).
          </p>
        </div>
        <div className="card section">
          <h2 style={{ marginTop: 0, fontSize: 18 }}>2. Import i mapowanie</h2>
          <p className="small">
            Wgranie XML uruchamia parser FA, klasyfikację NLP i przypisanie faktorów emisji
            z priorytetem regionalnym.
          </p>
        </div>
        <div className="card section">
          <h2 style={{ marginTop: 0, fontSize: 18 }}>3. Review i raport</h2>
          <p className="small">
            Zmiany statusów, override kategorii i faktorów zapisują zdarzenia z porównaniem
            before/after.
          </p>
        </div>
      </div>

      <div className="card section" style={{ marginTop: 24 }}>
        <h2 style={{ marginTop: 0, fontSize: 20 }}>Panel</h2>
        <p className="small" style={{ marginBottom: 16 }}>
          Po zalogowaniu przejdź do dashboardu, aby importować faktory, XML i liczyć emisje.
        </p>
        <Link className="btn btn-primary" href="/dashboard">
          Przejdź do dashboardu
        </Link>
      </div>
    </main>
  );
}
