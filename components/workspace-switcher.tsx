'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

type OrganizationOption = {
  id: string;
  name: string;
  slug: string;
  role: string;
};

export default function WorkspaceSwitcher() {
  const router = useRouter();
  const { data: session, update } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const organizations = useMemo(
    () => (((session as any)?.organizations || (session?.user as any)?.organizations || []) as OrganizationOption[]),
    [session]
  );
  const activeOrganizationId =
    ((session as any)?.activeOrganizationId as string | undefined) ||
    ((session as any)?.organizationId as string | undefined) ||
    ((session?.user as any)?.organizationId as string | undefined) ||
    '';

  const active = organizations.find((org) => org.id === activeOrganizationId) || organizations[0];

  if (!organizations.length) return null;

  if (organizations.length === 1) {
    return (
      <span
        style={{
          color: '#94a3b8',
          fontSize: 12,
          border: '1px solid #334155',
          borderRadius: 999,
          padding: '4px 10px',
        }}
      >
        {active?.name}
      </span>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <select
        value={activeOrganizationId}
        disabled={loading}
        onChange={async (event) => {
          const nextOrganizationId = event.target.value;
          if (!nextOrganizationId || nextOrganizationId === activeOrganizationId) return;
          setLoading(true);
          setError('');
          try {
            const res = await fetch('/api/auth/switch-organization', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ organizationId: nextOrganizationId }),
            });
            const data = await res.json().catch(() => null);
            if (!res.ok || !data?.ok) {
              throw new Error(data?.error || 'Nie udalo sie przelaczyc organizacji');
            }
            await update({ activeOrganizationId: nextOrganizationId });
            router.refresh();
          } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Nieznany blad');
          } finally {
            setLoading(false);
          }
        }}
        style={{
          background: '#0f172a',
          color: '#e2e8f0',
          border: '1px solid #334155',
          borderRadius: 8,
          padding: '6px 8px',
          fontSize: 12,
          minWidth: 220,
        }}
      >
        {organizations.map((org) => (
          <option key={org.id} value={org.id}>
            {org.name} ({org.role})
          </option>
        ))}
      </select>
      {error ? <span style={{ color: '#fda4af', fontSize: 11 }}>{error}</span> : null}
    </div>
  );
}
