'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

const PLANS = [
  {
    id: 'micro',
    name: 'Micro',
    invoices: 'do 50 faktur / mc',
    monthly: 149,
  },
  {
    id: 'starter',
    name: 'Starter',
    invoices: 'do 100 faktur / mc',
    monthly: 229,
  },
  {
    id: 'growth',
    name: 'Growth',
    invoices: 'do 200 faktur / mc',
    monthly: 349,
    featured: true,
  },
  {
    id: 'scale',
    name: 'Scale',
    invoices: 'do 500 faktur / mc',
    monthly: 549,
  },
  {
    id: 'plus',
    name: 'Plus',
    invoices: 'do 1000 faktur / mc',
    monthly: 899,
  },
];

function formatMoney(n: number) {
  return new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 0 }).format(n);
}

export default function PricingTable() {
  const [annual, setAnnual] = useState(false);

  const rows = useMemo(() => {
    return PLANS.map((p) => {
      const perMonth = annual ? Math.round(p.monthly * 0.9) : p.monthly;
      const yearlyTotal = annual ? Math.round(p.monthly * 12 * 0.9) : null;
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
            Rocznie (−10%)
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
            <p className="mkt-price-desc">{p.invoices}</p>
            <div className="mkt-price-amount">
              {formatMoney(p.perMonth)} zł{' '}
              <small>/ mc {annual ? 'przy płatności rocznej' : 'netto'}</small>
            </div>
            {annual && p.yearlyTotal ? (
              <p style={{ margin: '12px 0 0', fontSize: '0.75rem', color: '#64748b' }}>
                Łącznie {formatMoney(p.yearlyTotal)} zł / rok netto
              </p>
            ) : (
              <p style={{ margin: '12px 0 0', fontSize: '0.75rem', color: '#94a3b8' }}>&nbsp;</p>
            )}
            <div style={{ marginTop: 16 }}>
              <Link href="/kontakt#demo" className="mkt-btn mkt-btn--primary" style={{ width: '100%' }}>
                Umów demo
              </Link>
            </div>
          </div>
        ))}

        <div className="mkt-price-card">
          <div className="mkt-price-name">Enterprise</div>
          <p className="mkt-price-desc">Powyżej 1000 faktur / mc · dedykowane SLA</p>
          <div className="mkt-price-amount" style={{ fontSize: '1.25rem' }}>
            Wycena indywidualna
          </div>
          <p style={{ margin: '12px 0 0', fontSize: '0.75rem', color: '#64748b' }}>
            Integracje, SSO, dedykowane środowisko
          </p>
          <div style={{ marginTop: 16 }}>
            <Link href="/kontakt#demo" className="mkt-btn mkt-btn--secondary" style={{ width: '100%' }}>
              Porozmawiaj o wdrożeniu
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
