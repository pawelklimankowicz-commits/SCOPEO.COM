import Link from 'next/link';
import HeroMockup from '@/components/landing/HeroMockup';
import DemoContactForm from '@/components/landing/DemoContactForm';

export default function HomePage() {
  return (
    <main className="landing">
      <header className="landing-header">
        <div className="landing-container landing-header-inner">
          <Link href="/" className="landing-brand">
            <span className="landing-brand-icon" aria-hidden />
            <span className="landing-brand-text">Scopeo</span>
            <span className="landing-version-pill" title="Zgodnie z pakietem KSeF GHG v10.2">
              v10.2
            </span>
          </Link>
          <div className="landing-search" role="search">
            <span className="landing-search-icon" aria-hidden />
            <input type="search" placeholder="Szukaj w dokumentacji…" readOnly />
            <span className="landing-search-caret" aria-hidden />
          </div>
          <div className="landing-header-actions">
            <Link href="/login" className="landing-link-muted">
              Logowanie
            </Link>
            <Link href="/dashboard" className="landing-link-muted">
              Dashboard
            </Link>
            <a href="#contact" className="landing-btn landing-btn-teal">
              Umów demo
            </a>
          </div>
        </div>
      </header>

      <section className="landing-hero">
        <div className="landing-container landing-hero-grid">
          <div className="landing-hero-copy">
            <p className="landing-eyebrow">
              KSeF GHG v10.2 — final production release package
            </p>
            <h1 className="landing-h1">KSeF + GHG Protocol starter v10.2</h1>
            <p className="landing-lead">
              Ta wersja dodaje workflow review/approval, panel ręcznych korekt i import faktorów z
              zewnętrznych XLSX oraz resolver regionalny dla Polski.
            </p>
            <p className="landing-lead-secondary">
              v10.2 = final production release package. Zawiera go-live checklist, rollback/restore
              checklist, deployment acceptance checklist i final release manifest.
            </p>
            <div className="landing-hero-ctas">
              <a href="#contact" className="landing-btn landing-btn-teal">
                Umów demo
              </a>
              <a href="#jak-dziala" className="landing-btn landing-btn-outline">
                Jak działa
              </a>
              <Link href="/login" className="landing-btn landing-btn-outline">
                Start — logowanie
              </Link>
            </div>
            <ul className="landing-trust">
              <li>
                <span className="landing-trust-dot" /> Review &amp; approval
              </li>
              <li>
                <span className="landing-trust-dot" /> Import faktorów (XLSX)
              </li>
              <li>
                <span className="landing-trust-dot" /> Resolver regionalny PL
              </li>
              <li>
                <span className="landing-trust-dot" /> Audit trail
              </li>
            </ul>
          </div>
          <HeroMockup />
        </div>
      </section>

      <section className="landing-cards5" aria-label="Korzyści i zakres v10.2">
        <div className="landing-container landing-cards5-grid">
          <article className="landing-card-light">
            <h3>Problem z Excelem</h3>
            <p>
              Arkusze są kosztowne w utrzymaniu, podatne na błędy i nie zapewniają spójnego audytu
              przy raportach ESG — v10.2 przenosi to do przepływu review i importów.
            </p>
          </article>
          <article className="landing-card-light" id="jak-dziala">
            <h3>3-krokowy workflow</h3>
            <ol className="landing-ol">
              <li>Import danych z KSeF (XML FA)</li>
              <li>Mapowanie i Scope 1, 2, 3 + review</li>
              <li>Raportowanie z historią decyzji (manifest release)</li>
            </ol>
          </article>
          <article className="landing-card-light">
            <h3>Co jest w starterze v10.2</h3>
            <div className="landing-mini-ui">
              <span className="landing-pill">v10.2</span>
              <ul className="landing-checks">
                <li>Workflow review / approval</li>
                <li>Panel korekt i override</li>
                <li>Import faktorów z XLSX (UK / EPA + overlay)</li>
              </ul>
            </div>
          </article>
          <article className="landing-card-light">
            <h3>Operacje i jakość</h3>
            <div className="landing-pricing-preview">
              <p className="landing-price-note" style={{ marginTop: 0 }}>
                Quality gates: tests, coverage, PR comments, release build, security audit.
                Operational gates: secrets, logging, monitoring, rollback, backup validation (jak w{' '}
                <code>docs/release-manifest.md</code>).
              </p>
            </div>
          </article>
          <article className="landing-card-light landing-card-cta">
            <h3>Wejdź do aplikacji</h3>
            <p>Logowanie lub krótki kontakt z zespołem.</p>
            <div className="landing-card-cta-btns">
              <Link href="/login" className="landing-btn landing-btn-outline-sm">
                Logowanie
              </Link>
              <Link href="/dashboard" className="landing-btn landing-btn-outline-sm">
                Dashboard
              </Link>
              <a href="#contact" className="landing-btn landing-btn-teal-sm">
                Umów demo
              </a>
            </div>
          </article>
        </div>
      </section>

      <section className="landing-dark-band" aria-label="Produkt i pakiet v10.2">
        <div className="landing-container">
          <div className="landing-dark-grid-top">
            <div className="landing-dark-card">
              <h3 className="landing-dark-h">Widok produktu (v10.2)</h3>
              <div className="landing-tabs">
                <span>Dashboard emisji</span>
                <span className="active">Workflow review</span>
                <span>Audit trail</span>
                <span>Import KSeF + XLSX</span>
              </div>
              <p className="landing-dark-p">
                Zgodnie z pakietem v10.2: statusy review/approval, override kategorii i faktorów,
                historia before/after w jednym miejscu.
              </p>
            </div>
            <div className="landing-dark-card">
              <h3 className="landing-dark-h">How it works</h3>
              <div className="landing-steps">
                <div className="landing-step">
                  <span className="landing-step-icon">1</span>
                  <p>Połącz dane z KSeF</p>
                </div>
                <span className="landing-step-arrow">→</span>
                <div className="landing-step">
                  <span className="landing-step-icon">2</span>
                  <p>Scope 1–3 + resolver PL</p>
                </div>
                <span className="landing-step-arrow">→</span>
                <div className="landing-step">
                  <span className="landing-step-icon">3</span>
                  <p>Review, raport, manifest</p>
                </div>
              </div>
            </div>
          </div>

          <h3 className="landing-dark-section-title">Pricing</h3>
          <div className="landing-pricing-row">
            <div className="landing-plan landing-plan-dark">Micro</div>
            <div className="landing-plan landing-plan-featured">Starter · Growth</div>
            <div className="landing-plan landing-plan-dark">Scale</div>
            <div className="landing-plan landing-plan-dark">Enterprise</div>
          </div>
          <p className="landing-pricing-hint">Miesięcznie / rocznie — do uzgodnienia przy demo.</p>

          <div className="landing-dark-grid-bottom">
            <div className="landing-dark-card">
              <h4 className="landing-dark-h">Dokumentacja v10.2</h4>
              <ul className="landing-faq">
                <li>go-live-checklist.md</li>
                <li>rollback-restore.md</li>
                <li>release-manifest.md</li>
                <li>deployment acceptance checklist (w README pakietu)</li>
              </ul>
              <p className="landing-dark-p" style={{ marginBottom: 0, marginTop: 12 }}>
                Final status: production-ready candidate, subject to environment configuration and infra
                acceptance.
              </p>
            </div>
            <div className="landing-dark-card">
              <h4 className="landing-dark-h">FAQ</h4>
              <ul className="landing-faq">
                <li>Czym jest starter v10.2?</li>
                <li>Jak działa import faktorów XLSX?</li>
                <li>Resolver regionalny dla Polski?</li>
              </ul>
            </div>
            <div className="landing-dark-card landing-dark-card-form" id="contact">
              <h4 className="landing-dark-h">Contact · Book demo</h4>
              <DemoContactForm />
            </div>
          </div>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="landing-container landing-footer-inner">
          <span>© {new Date().getFullYear()} Scopeo · KSeF GHG v10.2</span>
          <Link href="/login">Panel klienta</Link>
        </div>
      </footer>
    </main>
  );
}
