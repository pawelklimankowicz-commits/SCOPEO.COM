'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

const PLANS = [
  {
    id: 'mikro',
    name: 'Mikro',
    ksefLimit: '1',
    userLimit: '1',
    monthly: 149,
    annual: 134,
    features: ['1 połączenie KSeF', '1 użytkownik', 'Scope 1 i 2', 'Raport PDF GHG'],
  },
  {
    id: 'starter',
    name: 'Starter',
    ksefLimit: '1',
    userLimit: '5',
    monthly: 279,
    annual: 251,
    features: [
      '1 połączenie KSeF',
      'do 5 użytkowników',
      'Scope 1, 2 i 3',
      'Eksport CSRD/ESRS',
      'Raport PDF GHG',
    ],
  },
  {
    id: 'growth',
    name: 'Growth',
    ksefLimit: '3',
    userLimit: '15',
    monthly: 499,
    annual: 449,
    featured: true,
    features: [
      '3 połączenia KSeF',
      'do 15 użytkowników',
      'Scope 1, 2 i 3',
      'Eksport CSRD/ESRS',
      'Workflow akceptacji',
      'Public API',
    ],
  },
  {
    id: 'scale',
    name: 'Scale',
    ksefLimit: '10',
    userLimit: 'bez limitu',
    monthly: 849,
    annual: 764,
    features: [
      '10 połączeń KSeF',
      'bez limitu użytkowników',
      'Scope 1, 2 i 3',
      'Eksport CSRD/ESRS',
      'Workflow akceptacji',
      'Public API',
      'Raporty white-label',
    ],
  },
];

function formatMoney(n: number) {
  return new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 0 }).format(n);
}

export default function PricingTable() {
  const [annual, setAnnual] = useState(false);

  const rows = useMemo(() => {
    return PLANS.map((p) => {
      const perMonth = annual ? p.annual : p.monthly;
      const yearlyTotal = annual ? p.annual * 12 : null;
      return { ...p, perMonth, yearlyTotal };
    });
  }, [annual]);

  return (
    <div>
      <div className="mkt-pricing-toggle">
        <span style={{ fontSize: '0.875rem', color: '#64748b' }}>Rozliczenie:</span>
        <div className="mkt-toggle" role="group" aria-label="Okres rozliczenia">
          <button
            type="button"
            className={!annual ? 'mkt-toggle--on' : ''}
            onClick={() => setAnnual(false)}
          >
            Miesięcznie
          </button>
          <button
            type="button"
            className={annual ? 'mkt-toggle--on' : ''}
            onClick={() => setAnnual(true)}
          >
            Za rok z góry (−10%)
          </button>
        </div>
      </div>

      <div className="mkt-pricing-grid">
        {rows.map((p) => (
          <div
            key={p.id}
            className={`mkt-price-card${p.featured ? ' mkt-price-card--featured' : ''}`}
          >
            {p.featured ? <span className="mkt-badge">Polecany</span> : null}
            <div className="mkt-price-name">{p.name}</div>
            <p className="mkt-price-desc">Połączenia KSeF: {p.ksefLimit} · Użytkownicy: {p.userLimit}</p>
            <p style={{ marginTop: 8 }}>
              <span
                style={{
                  display: 'inline-block',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: '#14532d',
                  background: '#bbf7d0',
                  borderRadius: 999,
                  padding: '4px 10px',
                }}
              >
                Faktury: bez limitu
              </span>
            </p>
            <div className="mkt-price-amount">
              {formatMoney(p.perMonth)} zł{' '}
              <small>/ mc {annual ? 'przy jednorazowej płatności za 12 mies.' : 'netto'}</small>
            </div>
            <ul style={{ margin: '12px 0 0', paddingLeft: 18, color: '#334155', fontSize: '0.875rem' }}>
              {p.features.map((feature) => (
                <li key={feature}>✓ {feature}</li>
              ))}
            </ul>
            {annual && p.yearlyTotal ? (
              <p style={{ margin: '12px 0 0', fontSize: '0.75rem', color: '#64748b' }}>
                Łącznie {formatMoney(p.yearlyTotal)} zł / rok netto
              </p>
            ) : (
              <p style={{ margin: '12px 0 0', fontSize: '0.75rem', color: '#94a3b8' }}>&nbsp;</p>
            )}
            <div style={{ marginTop: 16 }}>
              <Link href="/register" className="mkt-btn mkt-btn--primary" style={{ width: '100%' }}>
                Zacznij bezpłatny trial
              </Link>
              <p style={{ margin: '8px 0 0', fontSize: '0.75rem', color: '#64748b' }}>7 dni bez karty kredytowej</p>
            </div>
          </div>
        ))}

        <div className="mkt-price-card">
          <div className="mkt-price-name">Enterprise</div>
          <p className="mkt-price-desc">Bez limitu połączeń KSeF i użytkowników</p>
          <div className="mkt-price-amount" style={{ fontSize: '1.25rem' }}>
            Wycena indywidualna
          </div>
          <ul style={{ margin: '12px 0 0', paddingLeft: 18, color: '#334155', fontSize: '0.875rem' }}>
            <li>✓ SSO / SAML</li>
            <li>✓ Dedykowane środowisko</li>
            <li>✓ Dedykowane SLA</li>
            <li>✓ Dedykowany account manager</li>
          </ul>
          <div style={{ marginTop: 16 }}>
            <Link href="/kontakt" className="mkt-btn mkt-btn--secondary" style={{ width: '100%' }}>
              Porozmawiaj o wdrożeniu
            </Link>
          </div>
        </div>
      </div>
      <p style={{ marginTop: 16, color: '#64748b', fontSize: '0.875rem' }}>
        Wszystkie plany zawierają: import z KSeF, automatyczne obliczanie emisji GHG, panel zarządzania,
        wskaźniki KOBiZE / UK DESNZ / EPA oraz 7-dniowy bezpłatny trial. Rabat 10% przy jednorazowej płatności za 12 miesięcy.
      </p>
    </div>
  );
}
