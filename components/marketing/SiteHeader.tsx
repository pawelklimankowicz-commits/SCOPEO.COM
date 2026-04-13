'use client';

import Link from 'next/link';
import { useState } from 'react';

const links = [
  { href: '/produkt', label: 'Produkt' },
  { href: '/jak-dziala', label: 'Jak działa' },
  { href: '/cennik', label: 'Cennik' },
  { href: '/faq', label: 'FAQ' },
  { href: '/kontakt', label: 'Kontakt' },
];

export default function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="mkt-header">
      <div className="mkt-inner mkt-header-inner">
        <Link href="/" className="mkt-logo" onClick={() => setOpen(false)}>
          <span className="mkt-logo-mark" aria-hidden />
          Scopeo
        </Link>

        <button
          type="button"
          className="mkt-nav-toggle"
          aria-expanded={open}
          aria-controls="mkt-nav"
          onClick={() => setOpen((v) => !v)}
        >
          <span className="sr-only">Menu</span>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M4 6h16M4 12h16M4 18h16"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>

        <nav
          id="mkt-nav"
          className={`mkt-nav mkt-nav-desktop ${open ? 'mkt-nav-open' : ''}`}
          aria-label="Główna nawigacja"
        >
          {links.map((l) => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)}>
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="mkt-header-cta">
          <Link href="/login" className="mkt-btn mkt-btn--secondary mkt-btn--sm">
            Logowanie
          </Link>
          <Link href="/kontakt#demo" className="mkt-btn mkt-btn--primary mkt-btn--sm">
            Umów demo
          </Link>
        </div>
      </div>
    </header>
  );
}
