import Link from 'next/link';

export default function SiteFooter() {
  const y = new Date().getFullYear();
  return (
    <footer className="mkt-footer">
      <div className="mkt-inner mkt-footer-grid">
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: 12,
              fontWeight: 700,
              fontSize: '1.125rem',
            }}
          >
            <span className="mkt-logo-mark" aria-hidden />
            Scopeo
          </div>
          <p className="mkt-footer-note">
            Ślad węglowy z danych KSeF — import, Scope 1–3, review i audit trail w jednym
            workflow.
          </p>
        </div>
        <div>
          <h4>Produkt</h4>
          <ul>
            <li>
              <Link href="/produkt">Funkcje</Link>
            </li>
            <li>
              <Link href="/jak-dziala">Jak działa</Link>
            </li>
            <li>
              <Link href="/cennik">Cennik</Link>
            </li>
            <li>
              <Link href="/dla-kogo">Dla kogo</Link>
            </li>
          </ul>
        </div>
        <div>
          <h4>Firma</h4>
          <ul>
            <li>
              <Link href="/o-nas">Dlaczego Scopeo</Link>
            </li>
            <li>
              <Link href="/faq">FAQ</Link>
            </li>
            <li>
              <Link href="/wiedza/rynek-i-metodyka">Rynek i metodyka</Link>
            </li>
            <li>
              <Link href="/kontakt">Kontakt</Link>
            </li>
          </ul>
        </div>
        <div>
          <h4>Prawne</h4>
          <ul>
            <li>
              <Link href="/prawne">Dokumenty prawne</Link>
            </li>
            <li>
              <Link href="/regulamin">Regulamin</Link>
            </li>
            <li>
              <Link href="/polityka-prywatnosci">Polityka prywatności</Link>
            </li>
            <li>
              <Link href="/cookies">Polityka cookies</Link>
            </li>
            <li>
              <Link href="/dpa">DPA (powierzenie)</Link>
            </li>
            <li>
              <Link href="/klauzule-formularzy">Klauzule formularzy</Link>
            </li>
            <li>
              <Link href="/kontakt-prawny">Kontakt prawny</Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="mkt-inner" style={{ marginTop: 32, paddingTop: 24, borderTop: '1px solid #e2e8f0' }}>
        <p className="mkt-footer-copy" style={{ margin: 0 }}>
          © {y} Scopeo · KSeF · GHG · workflow — wszystkie prawa zastrzeżone.
        </p>
      </div>
    </footer>
  );
}
