'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

type ProfileInitial = {
  companyName: string;
  taxId: string | null;
  reportingYear: number;
  baseYear: number;
  boundaryApproach: string;
  industry: string;
  ksefTokenMasked: string;
};

type WizardStepProps = {
  step: number;
  organizationName: string;
  initial: ProfileInitial | null;
};

const INDUSTRIES = [
  'Przetworstwo przemyslowe',
  'Handel',
  'Budownictwo',
  'Transport i logistyka',
  'IT i uslugi cyfrowe',
  'Energetyka',
  'Nieruchomosci',
  'Produkcja zywnosci',
  'Finanse i ubezpieczenia',
  'Edukacja',
  'Medycyna i farmacja',
  'Telekomunikacja',
  'Administracja publiczna',
  'Rolnictwo',
  'Inne',
];

const REPORTING_YEARS = [2023, 2024, 2025, 2026];

type InviteDraft = { email: string; role: 'ANALYST' | 'REVIEWER' | 'APPROVER' | 'ADMIN' };

async function parseJson(res: Response) {
  const data = (await res.json().catch(() => null)) as
    | { ok?: boolean; error?: string; redirectTo?: string; requiresSessionRefresh?: boolean }
    | null;
  if (!res.ok || !data?.ok) {
    throw new Error(data?.error || 'Wystapil blad zapisu');
  }
  return data;
}

export default function OnboardingWizardStep({ step, organizationName, initial }: WizardStepProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [ksefStatus, setKsefStatus] = useState<'idle' | 'ok' | 'error' | 'loading'>('idle');
  const [invites, setInvites] = useState<InviteDraft[]>([{ email: '', role: 'ANALYST' }]);
  const currentYear = new Date().getFullYear();

  const defaultContextNip = useMemo(() => (initial?.taxId ?? '').replace(/\D/g, ''), [initial?.taxId]);

  async function submitStep(url: string, body: unknown, nextStep?: number) {
    setBusy(true);
    setMessage('');
    try {
      const data = await parseJson(
        await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      );
      if (nextStep) {
        router.push(`/onboarding/step/${nextStep}`);
        router.refresh();
      } else {
        router.push('/dashboard');
        router.refresh();
      }
    } catch (error: unknown) {
      setMessage(error instanceof Error ? error.message : 'Nieznany blad');
    } finally {
      setBusy(false);
    }
  }

  if (step === 1) {
    return (
      <form
        className="card section"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          void submitStep(
            '/api/onboarding/profile',
            {
              companyName: String(fd.get('companyName') || ''),
              taxId: String(fd.get('taxId') || ''),
              addressStreet: String(fd.get('addressStreet') || ''),
              addressPostalCode: String(fd.get('addressPostalCode') || ''),
              addressCity: String(fd.get('addressCity') || ''),
              reportingYear: Number(fd.get('reportingYear') || currentYear),
            },
            2
          );
        }}
      >
        <h2>Krok 1: Profil organizacji</h2>
        <div className="grid grid-2">
          <label>
            Nazwa firmy
            <input name="companyName" required defaultValue={initial?.companyName || organizationName} />
          </label>
          <label>
            NIP
            <input name="taxId" defaultValue={initial?.taxId || ''} placeholder="1234567890" />
          </label>
          <label>
            Ulica i numer
            <input name="addressStreet" required placeholder="ul. Przykladowa 12" />
          </label>
          <label>
            Kod pocztowy
            <input name="addressPostalCode" required placeholder="00-000" />
          </label>
          <label>
            Miasto
            <input name="addressCity" required />
          </label>
          <label>
            Rok sprawozdawczy
            <select name="reportingYear" defaultValue={String(initial?.reportingYear || 2025)}>
              {REPORTING_YEARS.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </label>
        </div>
        <button className="btn btn-primary" type="submit" disabled={busy} style={{ marginTop: 16 }}>
          {busy ? 'Zapisywanie...' : 'Zapisz i przejdz dalej'}
        </button>
        {message ? <p style={{ color: '#fda4af', marginTop: 10 }}>{message}</p> : null}
      </form>
    );
  }

  if (step === 2) {
    return (
      <form
        className="card section"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          void submitStep(
            '/api/onboarding/boundary',
            {
              industry: String(fd.get('industry') || ''),
              boundaryApproach: String(fd.get('boundaryApproach') || 'operational_control'),
              includeScope3: fd.get('includeScope3') === 'on',
            },
            3
          );
        }}
      >
        <h2>Krok 2: Branza i granice organizacyjne</h2>
        <label>
          Branża
          <select name="industry" defaultValue={initial?.industry || 'Inne'}>
            {INDUSTRIES.map((industry) => (
              <option key={industry} value={industry}>
                {industry}
              </option>
            ))}
          </select>
        </label>
        <label style={{ marginTop: 12 }}>
          Podejscie do granic
          <select name="boundaryApproach" defaultValue={initial?.boundaryApproach || 'operational_control'}>
            <option value="operational_control">Kontrola operacyjna</option>
            <option value="financial_control">Kontrola finansowa</option>
            <option value="equity_share">Udzial w kapitale</option>
          </select>
        </label>
        <div style={{ marginTop: 12 }}>
          <label style={{ display: 'flex', gap: 8 }}>
            <input type="checkbox" checked readOnly />
            Scope 1
          </label>
          <label style={{ display: 'flex', gap: 8 }}>
            <input type="checkbox" checked readOnly />
            Scope 2
          </label>
          <label style={{ display: 'flex', gap: 8 }}>
            <input type="checkbox" name="includeScope3" defaultChecked />
            Scope 3
          </label>
        </div>
        <button className="btn btn-primary" type="submit" disabled={busy} style={{ marginTop: 16 }}>
          {busy ? 'Zapisywanie...' : 'Zapisz i przejdz dalej'}
        </button>
        {message ? <p style={{ color: '#fda4af', marginTop: 10 }}>{message}</p> : null}
      </form>
    );
  }

  if (step === 3) {
    return (
      <form
        className="card section"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          void submitStep(
            '/api/onboarding/ksef',
            {
              ksefToken: String(fd.get('ksefToken') || ''),
              contextNip: String(fd.get('contextNip') || ''),
              skip: false,
            },
            4
          );
        }}
      >
        <h2>Krok 3: Polacz KSeF</h2>
        <p className="app-muted">Połączenie KSeF pozwala automatycznie pobierać faktury i liczyć emisje.</p>
        <label>
          Token KSeF
          <input name="ksefToken" type="password" minLength={10} required placeholder="Wklej token KSeF" />
        </label>
        <label style={{ marginTop: 12 }}>
          NIP kontekstu
          <input name="contextNip" required defaultValue={defaultContextNip} placeholder="1234567890" />
        </label>
        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <button
            className="btn btn-secondary"
            type="button"
            onClick={async () => {
              const form = document.querySelector('form');
              if (!form) return;
              const fd = new FormData(form);
              setKsefStatus('loading');
              try {
                await parseJson(
                  await fetch('/api/ksef/test', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      ksefToken: String(fd.get('ksefToken') || ''),
                      contextNip: String(fd.get('contextNip') || ''),
                    }),
                  })
                );
                setKsefStatus('ok');
              } catch {
                setKsefStatus('error');
              }
            }}
          >
            {ksefStatus === 'loading' ? 'Testowanie...' : 'Przetestuj polaczenie'}
          </button>
          <button className="btn btn-primary" type="submit" disabled={busy}>
            {busy ? 'Zapisywanie...' : 'Zapisz i przejdz dalej'}
          </button>
          <button
            className="btn btn-secondary"
            type="button"
            onClick={() => {
              void submitStep(
                '/api/onboarding/ksef',
                {
                  ksefToken: 'skip-token-value',
                  contextNip: defaultContextNip || '0000000000',
                  skip: true,
                },
                4
              );
            }}
          >
            Polacze pozniej
          </button>
        </div>
        {ksefStatus === 'ok' ? <p style={{ color: '#86efac', marginTop: 10 }}>Polaczenie potwierdzone.</p> : null}
        {ksefStatus === 'error' ? (
          <p style={{ color: '#fda4af', marginTop: 10 }}>Test nieudany. Sprawdz token i NIP.</p>
        ) : null}
        {message ? <p style={{ color: '#fda4af', marginTop: 10 }}>{message}</p> : null}
      </form>
    );
  }

  return (
    <div className="card section">
      <h2>Krok 4: Zapros team</h2>
      <p className="app-muted">Możesz dodać do 3 osób. Ten krok jest opcjonalny.</p>
      {invites.map((invite, index) => (
        <div className="grid grid-2" key={index} style={{ marginTop: index === 0 ? 0 : 10 }}>
          <label>
            Email
            <input
              value={invite.email}
              type="email"
              onChange={(e) => {
                setInvites((prev) => prev.map((v, i) => (i === index ? { ...v, email: e.target.value } : v)));
              }}
              placeholder="osoba@firma.pl"
            />
          </label>
          <label>
            Rola
            <select
              value={invite.role}
              onChange={(e) => {
                const role = e.target.value as InviteDraft['role'];
                setInvites((prev) => prev.map((v, i) => (i === index ? { ...v, role } : v)));
              }}
            >
              <option value="ANALYST">ANALYST</option>
              <option value="REVIEWER">REVIEWER</option>
              <option value="APPROVER">APPROVER</option>
              <option value="ADMIN">ADMIN</option>
            </select>
          </label>
        </div>
      ))}
      <div style={{ marginTop: 12, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button
          className="btn btn-secondary"
          type="button"
          disabled={invites.length >= 3}
          onClick={() => {
            if (invites.length >= 3) return;
            setInvites((prev) => [...prev, { email: '', role: 'ANALYST' }]);
          }}
        >
          + Dodaj osobe
        </button>
        <button
          className="btn btn-secondary"
          type="button"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            setMessage('');
            try {
              for (const invite of invites) {
                if (!invite.email.trim()) continue;
                await parseJson(
                  await fetch('/api/invites', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: invite.email.trim(), role: invite.role }),
                  })
                );
              }
              setMessage('Zaproszenia zostaly wyslane.');
            } catch (error: unknown) {
              setMessage(error instanceof Error ? error.message : 'Nie udalo sie wyslac zaproszen');
            } finally {
              setBusy(false);
            }
          }}
        >
          Wyslij zaproszenia
        </button>
        <button className="btn btn-primary" type="button" disabled={busy} onClick={() => void submitStep('/api/onboarding/complete', {})}>
          Zakoncz konfiguracje
        </button>
      </div>
      <p style={{ marginTop: 12, fontSize: 13 }}>
        <Link href="/dashboard">Zaprosze pozniej</Link>
      </p>
      {message ? <p style={{ color: message.includes('wyslane') ? '#86efac' : '#fda4af' }}>{message}</p> : null}
    </div>
  );
}
