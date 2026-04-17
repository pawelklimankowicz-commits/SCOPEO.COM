'use client';

import { useMemo, useState } from 'react';

type PlanCode = 'MIKRO' | 'STARTER' | 'GROWTH' | 'SCALE' | 'ENTERPRISE';
type Interval = 'MONTHLY' | 'ANNUAL';

type BillingSnapshot = {
  plan: PlanCode;
  status: 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'TRIALING';
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  usedUsers: number;
  userLimit: number;
  usedKsefConnections: number;
  ksefLimit: number;
};

const PLANS: Array<{
  code: PlanCode;
  name: string;
  ksef: string;
  users: string;
  monthly: number | null;
  annualMonthly: number | null;
  features: Array<[string, boolean]>;
  recommended?: boolean;
}> = [
  {
    code: 'MIKRO',
    name: 'Mikro',
    ksef: '1',
    users: '1',
    monthly: 149,
    annualMonthly: 134,
    features: [
      ['KSeF import (bez limitu faktur)', true],
      ['Scope 1 + 2', true],
      ['Scope 3', false],
      ['PDF raport GHG', true],
      ['CSRD / ESRS export', false],
      ['Review workflow', false],
      ['Public API', false],
      ['White-label raporty', false],
      ['SSO / SAML', false],
    ],
  },
  {
    code: 'STARTER',
    name: 'Starter',
    ksef: '1',
    users: '5',
    monthly: 279,
    annualMonthly: 251,
    features: [
      ['KSeF import (bez limitu faktur)', true],
      ['Scope 1 + 2', true],
      ['Scope 3', true],
      ['PDF raport GHG', true],
      ['CSRD / ESRS export', true],
      ['Review workflow', false],
      ['Public API', false],
      ['White-label raporty', false],
      ['SSO / SAML', false],
    ],
  },
  {
    code: 'GROWTH',
    name: 'Growth',
    ksef: '3',
    users: '15',
    monthly: 499,
    annualMonthly: 449,
    recommended: true,
    features: [
      ['KSeF import (bez limitu faktur)', true],
      ['Scope 1 + 2', true],
      ['Scope 3', true],
      ['PDF raport GHG', true],
      ['CSRD / ESRS export', true],
      ['Review workflow', true],
      ['Public API', true],
      ['White-label raporty', false],
      ['SSO / SAML', false],
    ],
  },
  {
    code: 'SCALE',
    name: 'Scale',
    ksef: '10',
    users: 'bez limitu',
    monthly: 849,
    annualMonthly: 764,
    features: [
      ['KSeF import (bez limitu faktur)', true],
      ['Scope 1 + 2', true],
      ['Scope 3', true],
      ['PDF raport GHG', true],
      ['CSRD / ESRS export', true],
      ['Review workflow', true],
      ['Public API', true],
      ['White-label raporty', true],
      ['SSO / SAML', false],
    ],
  },
  {
    code: 'ENTERPRISE',
    name: 'Enterprise',
    ksef: 'bez limitu',
    users: 'bez limitu',
    monthly: null,
    annualMonthly: null,
    features: [
      ['KSeF import (bez limitu faktur)', true],
      ['Scope 1 + 2', true],
      ['Scope 3', true],
      ['PDF raport GHG', true],
      ['CSRD / ESRS export', true],
      ['Review workflow', true],
      ['Public API', true],
      ['White-label raporty', true],
      ['SSO / SAML', true],
    ],
  },
];

export default function BillingPlansClient({ snapshot }: { snapshot: BillingSnapshot }) {
  const [interval, setInterval] = useState<Interval>(snapshot.status === 'TRIALING' ? 'ANNUAL' : 'MONTHLY');
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  const trialDaysLeft = useMemo(() => {
    if (!snapshot.trialEndsAt) return 0;
    const diff = new Date(snapshot.trialEndsAt).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }, [snapshot.trialEndsAt]);

  async function startCheckout(plan: PlanCode) {
    setLoadingPlan(plan);
    setMessage('');
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, interval }),
      });
      const data = await res.json();
      if (data.redirect) {
        window.location.href = data.redirect;
        return;
      }
      if (!res.ok || !data.url) {
        throw new Error(data.error || 'Nie udało się rozpocząć checkout');
      }
      window.location.href = data.url;
    } catch (error: unknown) {
      setMessage(error instanceof Error ? error.message : 'Nieznany błąd');
    } finally {
      setLoadingPlan(null);
    }
  }

  async function openPortal() {
    setLoadingPlan('portal');
    setMessage('');
    try {
      const res = await fetch('/api/billing/portal', { method: 'POST' });
      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error || 'Nie udało się otworzyć portalu');
      }
      window.location.href = data.url;
    } catch (error: unknown) {
      setMessage(error instanceof Error ? error.message : 'Nieznany błąd');
    } finally {
      setLoadingPlan(null);
    }
  }

  return (
    <div>
      {snapshot.status === 'TRIALING' ? (
        <div className="card section" style={{ borderColor: '#facc15', background: '#1f2937', marginBottom: 18 }}>
          <strong style={{ color: '#fde68a' }}>
            Twój bezpłatny trial kończy się za {trialDaysLeft} dni. Dodaj kartę, aby zachować dostęp.
          </strong>
          <div style={{ marginTop: 12 }}>
            <button className="btn btn-primary" onClick={() => void startCheckout('GROWTH')} disabled={loadingPlan === 'GROWTH'}>
              Aktywuj subskrypcję
            </button>
          </div>
        </div>
      ) : null}

      <div className="card section" style={{ marginBottom: 18 }}>
        <h2>Status subskrypcji</h2>
        <p className="app-muted" style={{ marginTop: 0 }}>
          Plan: <strong>{snapshot.plan}</strong> · Status: <strong>{snapshot.status}</strong>
          {snapshot.currentPeriodEnd ? ` · Odnowienie: ${new Date(snapshot.currentPeriodEnd).toLocaleDateString('pl-PL')}` : ''}
        </p>
        <p className="app-muted" style={{ marginTop: 0 }}>
          Użytkownicy: {snapshot.usedUsers}/{snapshot.userLimit} · Połączenia KSeF: {snapshot.usedKsefConnections}/{snapshot.ksefLimit}
        </p>
        {snapshot.status !== 'TRIALING' ? (
          <button className="btn btn-secondary" onClick={() => void openPortal()} disabled={loadingPlan === 'portal'}>
            Zarządzaj subskrypcją
          </button>
        ) : null}
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button className={`btn ${interval === 'MONTHLY' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setInterval('MONTHLY')}>
          Miesięcznie
        </button>
        <button className={`btn ${interval === 'ANNUAL' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setInterval('ANNUAL')}>
          Za rok z góry (-10%)
        </button>
      </div>

      <div className="grid grid-2">
        {PLANS.map((plan) => {
          const isCurrent = snapshot.plan === plan.code && snapshot.status !== 'TRIALING';
          const isTrialGrowth = snapshot.status === 'TRIALING' && plan.code === 'GROWTH';
          return (
            <div
              key={plan.code}
              className="card section"
              style={{
                borderColor: isCurrent ? '#22c55e' : isTrialGrowth ? '#facc15' : '#334155',
                marginBottom: 12,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0 }}>{plan.name}</h3>
                {plan.recommended ? <span className="badge">Polecany</span> : null}
              </div>
              <p className="app-muted">KSeF: {plan.ksef} · Użytkownicy: {plan.users}</p>
              <p style={{ fontSize: 24, fontWeight: 700 }}>
                {plan.monthly === null
                  ? 'Wycena indywidualna'
                  : interval === 'MONTHLY'
                    ? `${plan.monthly} zł / mc`
                    : `${plan.annualMonthly} zł / mc (płatność za 12 mies.)`}
              </p>
              <ul style={{ paddingLeft: 18 }}>
                {plan.features.map(([name, enabled]) => (
                  <li key={name} style={{ color: enabled ? '#86efac' : '#94a3b8' }}>
                    {enabled ? '✓' : '—'} {name}
                  </li>
                ))}
              </ul>
              {plan.code === 'ENTERPRISE' ? (
                <a className="btn btn-secondary" href="/kontakt">
                  Porozmawiaj o wdrożeniu
                </a>
              ) : isCurrent ? (
                <button className="btn btn-secondary" disabled>
                  Twój plan
                </button>
              ) : (
                <button
                  className="btn btn-primary"
                  onClick={() => void startCheckout(plan.code)}
                  disabled={loadingPlan === plan.code}
                >
                  {loadingPlan === plan.code ? 'Ładowanie...' : 'Wybierz plan'}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {message ? <p style={{ color: '#fda4af' }}>{message}</p> : null}
    </div>
  );
}
