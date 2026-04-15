'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Props = {
  inviteToken: string;
  email: string;
  organizationName: string;
  role: string;
};

export default function JoinOrganizationClient({ inviteToken, email, organizationName, role }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  return (
    <div className="card section" style={{ maxWidth: 720 }}>
      <h1 style={{ marginTop: 0 }}>Dolacz do organizacji</h1>
      <p>
        Chcesz dolaczyc do <strong>{organizationName}</strong> jako <strong>{role}</strong>?
      </p>
      <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
        <button
          className="btn btn-primary"
          disabled={loading}
          onClick={async () => {
            setLoading(true);
            setError('');
            try {
              const res = await fetch('/api/invites/accept', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  inviteToken,
                  email,
                }),
              });
              const data = await res.json().catch(() => null);
              if (!res.ok || !data?.ok) {
                throw new Error(data?.error || 'Nie udalo sie zaakceptowac zaproszenia');
              }
              router.push('/dashboard');
              router.refresh();
            } catch (err: unknown) {
              setError(err instanceof Error ? err.message : 'Nieznany blad');
            } finally {
              setLoading(false);
            }
          }}
        >
          {loading ? 'Dolaczanie...' : 'Dolacz'}
        </button>
        <button className="btn btn-secondary" onClick={() => router.push('/dashboard')}>
          Anuluj
        </button>
      </div>
      {error ? <p style={{ color: '#fda4af' }}>{error}</p> : null}
    </div>
  );
}
