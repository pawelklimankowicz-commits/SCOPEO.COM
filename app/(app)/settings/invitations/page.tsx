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

  const statusColor: Record<string, string> = {
    PENDING: 'text-yellow-600',
    ACCEPTED: 'text-green-600',
    EXPIRED: 'text-gray-500',
    CANCELLED: 'text-red-500',
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Zaproszenia</h1>

      <form onSubmit={sendInvite} className="mb-8 space-y-4 rounded-lg border bg-white p-5">
        <h2 className="text-lg font-semibold">Zapros uzytkownika</h2>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {success && <p className="text-sm text-green-600">{success}</p>}
        <div className="flex gap-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="adres@email.com"
            required
            className="flex-1 rounded-md border px-3 py-2 text-sm"
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as (typeof ROLES)[number])}
            className="rounded-md border px-3 py-2 text-sm"
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
            className="rounded-md bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Wysylam...' : 'Wyslij zaproszenie'}
          </button>
        </div>
      </form>

      <div className="overflow-hidden rounded-lg border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Email</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Rola</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Wygasa</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {invites.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-400">
                  Brak zaproszen
                </td>
              </tr>
            )}
            {invites.map((inv) => (
              <tr key={inv.id}>
                <td className="px-4 py-3">{inv.email}</td>
                <td className="px-4 py-3">{inv.role}</td>
                <td className={`px-4 py-3 font-medium ${statusColor[inv.status] ?? ''}`}>{inv.status}</td>
                <td className="px-4 py-3 text-gray-500">
                  {new Date(inv.expiresAt).toLocaleDateString('pl-PL')}
                </td>
                <td className="flex justify-end gap-2 px-4 py-3">
                  {inv.status === 'PENDING' && (
                    <>
                      <button
                        onClick={() => handleAction(inv.id, 'resend')}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Wyslij ponownie
                      </button>
                      <button
                        onClick={() => handleAction(inv.id, 'cancel')}
                        className="text-xs text-red-500 hover:underline"
                      >
                        Anuluj
                      </button>
                    </>
                  )}
                  {inv.status === 'EXPIRED' && (
                    <button
                      onClick={() => handleAction(inv.id, 'resend')}
                      className="text-xs text-blue-600 hover:underline"
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
