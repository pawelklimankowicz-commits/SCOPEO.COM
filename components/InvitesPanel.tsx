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

export default function InvitesPanel({ canManage }: { canManage: boolean }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('VIEWER');
  const [invites, setInvites] = useState<Invite[]>([]);
  const [result, setResult] = useState('');

  async function loadInvites() {
    if (!canManage) return;
    const res = await fetch('/api/invites');
    const data = await res.json();
    if (data.ok) setInvites(data.invites);
  }

  useEffect(() => {
    loadInvites();
  }, [canManage]);

  async function createInvite() {
    const res = await fetch('/api/invites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, role }),
    });
    const data = await res.json();
    setResult(JSON.stringify(data, null, 2));
    if (data.ok) {
      setEmail('');
      await loadInvites();
    }
  }

  async function updateInvite(inviteId: string, action: 'cancel' | 'resend') {
    const res = await fetch('/api/invites', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inviteId, action }),
    });
    const data = await res.json();
    setResult(JSON.stringify(data, null, 2));
    if (data.ok) await loadInvites();
  }

  function expiryLabel(invite: Invite) {
    const expiresAt = new Date(invite.expiresAt).getTime();
    const now = Date.now();
    if (invite.status === 'ACCEPTED') return 'Przyjęte';
    if (invite.status === 'CANCELLED') return 'Unieważnione';
    if (expiresAt <= now) return 'Wygasło';
    const hours = Math.ceil((expiresAt - now) / (1000 * 60 * 60));
    if (hours < 24) return `Wygasa za ${hours}h`;
    const days = Math.ceil(hours / 24);
    return `Wygasa za ${days}d`;
  }

  if (!canManage) return null;

  return (
    <div className="card section" style={{ marginTop: 24 }}>
      <h2>Zaproszenia użytkowników</h2>
      <div className="grid grid-2">
        <div>
          <label>Email użytkownika</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
        </div>
        <div>
          <label>Rola</label>
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="ADMIN">ADMIN</option>
            <option value="ANALYST">ANALYST</option>
            <option value="REVIEWER">REVIEWER</option>
            <option value="APPROVER">APPROVER</option>
            <option value="VIEWER">VIEWER</option>
          </select>
        </div>
      </div>
      <button
        className="btn btn-primary"
        type="button"
        onClick={createInvite}
        style={{ marginTop: 14 }}
        disabled={!email}
      >
        Wyślij zaproszenie
      </button>

      {result ? <pre className="code" style={{ marginTop: 14 }}>{result}</pre> : null}

      <table style={{ marginTop: 14 }}>
        <thead>
          <tr>
            <th>Email</th>
            <th>Rola</th>
            <th>Status</th>
            <th>Wygasa</th>
            <th>Akcje</th>
          </tr>
        </thead>
        <tbody>
          {invites.map((invite) => (
            <tr key={invite.id}>
              <td>{invite.email}</td>
              <td>{invite.role}</td>
              <td>{invite.status}</td>
              <td>
                {expiryLabel(invite)}
                <div className="small">{new Date(invite.expiresAt).toLocaleString()}</div>
              </td>
              <td style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => updateInvite(invite.id, 'resend')}
                  disabled={invite.status === 'ACCEPTED' || invite.status === 'CANCELLED'}
                >
                  Re-send
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => updateInvite(invite.id, 'cancel')}
                  disabled={invite.status === 'ACCEPTED' || invite.status === 'CANCELLED'}
                >
                  Unieważnij
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
