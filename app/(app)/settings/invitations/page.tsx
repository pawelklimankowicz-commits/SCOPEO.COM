'use client';

import { useEffect, useState } from 'react';

type Invite = {
  id: string;
  email: string;
  role: string;
  status: string;
  expiresAt: string;
  createdAt: string;
};

const ROLES = ['ADMIN', 'ANALYST', 'REVIEWER', 'APPROVER', 'VIEWER'] as const;

export default function InvitationsPage() {
  const [invites, setInvites] = useState<Invite[]>([]);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<(typeof ROLES)[number]>('ANALYST');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchInvites();
  }, []);

  async function fetchInvites() {
    const res = await fetch('/api/invites');
    if (res.ok) {
      const data = await res.json();
      setInvites(data.invites ?? []);
    }
  }

  async function sendInvite(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    const res = await fetch('/api/invites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, role }),
    });
    const data = await res.json();
    if (data.ok) {
      setSuccess(`Zaproszenie wyslane na ${email}`);
      setEmail('');
      fetchInvites();
    } else {
      setError(data.error ?? 'Blad wysylki zaproszenia');
    }
    setLoading(false);
  }

  async function handleAction(inviteId: string, action: 'cancel' | 'resend') {
    const res = await fetch('/api/invites', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inviteId, action }),
    });
    if (res.ok) fetchInvites();
  }

  return (
    <div style={{ maxWidth: 980, margin: '0 auto', padding: '24px 16px' }}>
      <h1 style={{ marginBottom: 20, fontSize: 30, fontWeight: 800 }}>Zaproszenia</h1>

      <form
        onSubmit={sendInvite}
        style={{ marginBottom: 24, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20 }}
      >
        <h2 style={{ marginTop: 0, fontSize: 18, fontWeight: 700 }}>Zapros uzytkownika</h2>
        {error && <p style={{ fontSize: 13, color: '#dc2626' }}>{error}</p>}
        {success && <p style={{ fontSize: 13, color: '#16a34a' }}>{success}</p>}
        <div style={{ display: 'flex', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="adres@email.com"
            required
            style={{ flex: 1, minWidth: 240, borderRadius: 8, border: '1px solid #cbd5e1', padding: '10px 12px' }}
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as (typeof ROLES)[number])}
            style={{ borderRadius: 8, border: '1px solid #cbd5e1', padding: '10px 12px', minWidth: 160 }}
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={loading}
            style={{
              borderRadius: 8,
              border: 0,
              background: '#16a34a',
              color: '#fff',
              padding: '10px 14px',
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? 'Wysylam...' : 'Wyslij zaproszenie'}
          </button>
        </div>
      </form>

      <div style={{ overflow: 'hidden', borderRadius: 12, border: '1px solid #e2e8f0', background: '#fff' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead style={{ background: '#f8fafc' }}>
            <tr>
              <th style={{ textAlign: 'left', padding: '10px 14px', color: '#475569' }}>Email</th>
              <th style={{ textAlign: 'left', padding: '10px 14px', color: '#475569' }}>Rola</th>
              <th style={{ textAlign: 'left', padding: '10px 14px', color: '#475569' }}>Status</th>
              <th style={{ textAlign: 'left', padding: '10px 14px', color: '#475569' }}>Wygasa</th>
              <th style={{ padding: '10px 14px' }} />
            </tr>
          </thead>
          <tbody>
            {invites.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', color: '#94a3b8', padding: 20 }}>
                  Brak zaproszen
                </td>
              </tr>
            )}
            {invites.map((inv) => (
              <tr key={inv.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                <td style={{ padding: '10px 14px' }}>{inv.email}</td>
                <td style={{ padding: '10px 14px' }}>{inv.role}</td>
                <td style={{ padding: '10px 14px', fontWeight: 700 }}>{inv.status}</td>
                <td style={{ padding: '10px 14px', color: '#64748b' }}>
                  {new Date(inv.expiresAt).toLocaleDateString('pl-PL')}
                </td>
                <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                  {inv.status === 'PENDING' && (
                    <>
                      <button
                        onClick={() => handleAction(inv.id, 'resend')}
                        style={{ border: 0, background: 'transparent', color: '#2563eb', fontSize: 12 }}
                      >
                        Wyslij ponownie
                      </button>
                      <button
                        onClick={() => handleAction(inv.id, 'cancel')}
                        style={{ border: 0, background: 'transparent', color: '#ef4444', fontSize: 12, marginLeft: 10 }}
                      >
                        Anuluj
                      </button>
                    </>
                  )}
                  {inv.status === 'EXPIRED' && (
                    <button
                      onClick={() => handleAction(inv.id, 'resend')}
                      style={{ border: 0, background: 'transparent', color: '#2563eb', fontSize: 12 }}
                    >
                      Odnow
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
