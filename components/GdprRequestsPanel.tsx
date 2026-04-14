'use client';

import { useEffect, useState } from 'react';

type GdprRequest = {
  id: string;
  subjectEmail: string;
  type: 'ACCESS' | 'ERASURE';
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED';
  notes?: string | null;
  createdAt: string;
  processedAt?: string | null;
};

export default function GdprRequestsPanel({ canManage }: { canManage: boolean }) {
  const [requests, setRequests] = useState<GdprRequest[]>([]);
  const [subjectEmail, setSubjectEmail] = useState('');
  const [type, setType] = useState<'ACCESS' | 'ERASURE'>('ERASURE');
  const [notes, setNotes] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  async function loadRequests() {
    if (!canManage) return;
    const res = await fetch('/api/gdpr/requests', { cache: 'no-store' });
    const data = await res.json();
    if (data.ok) setRequests(data.requests);
  }

  useEffect(() => {
    loadRequests();
  }, [canManage]);

  async function createRequest() {
    setLoading(true);
    const res = await fetch('/api/gdpr/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subjectEmail,
        type,
        notes: notes || undefined,
      }),
    });
    const data = await res.json();
    setResult(JSON.stringify(data, null, 2));
    if (data.ok) {
      setSubjectEmail('');
      setNotes('');
      await loadRequests();
    }
    setLoading(false);
  }

  async function executeRequest(requestId: string) {
    setLoading(true);
    const res = await fetch(`/api/gdpr/requests/${requestId}/execute`, {
      method: 'POST',
    });
    const data = await res.json();
    setResult(JSON.stringify(data, null, 2));
    await loadRequests();
    setLoading(false);
  }

  if (!canManage) return null;

  return (
    <div className="card section" style={{ marginTop: 24 }}>
      <h2>RODO - żądania i wykonanie</h2>
      <p className="app-muted" style={{ marginTop: 0, marginBottom: 12, fontSize: 14 }}>
        Utwórz żądanie ACCESS/ERASURE i wykonaj je jednym kliknięciem bez ręcznych wywołań API.
      </p>

      <div className="grid grid-2">
        <div>
          <label>Email osoby, której dotyczy żądanie</label>
          <input
            type="email"
            value={subjectEmail}
            onChange={(e) => setSubjectEmail(e.target.value)}
            placeholder="np. user@firma.pl"
          />
        </div>
        <div>
          <label>Typ żądania</label>
          <select value={type} onChange={(e) => setType(e.target.value as 'ACCESS' | 'ERASURE')}>
            <option value="ACCESS">ACCESS</option>
            <option value="ERASURE">ERASURE</option>
          </select>
        </div>
      </div>
      <div style={{ marginTop: 12 }}>
        <label>Notatka (opcjonalnie)</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
      </div>
      <button
        type="button"
        className="btn btn-primary"
        style={{ marginTop: 12 }}
        onClick={createRequest}
        disabled={!subjectEmail || loading}
      >
        Dodaj żądanie RODO
      </button>

      {result ? (
        <pre className="code" style={{ marginTop: 14 }}>
          {result}
        </pre>
      ) : null}

      <table style={{ marginTop: 14 }}>
        <thead>
          <tr>
            <th>Email</th>
            <th>Typ</th>
            <th>Status</th>
            <th>Utworzono</th>
            <th>Akcje</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((request) => (
            <tr key={request.id}>
              <td>{request.subjectEmail}</td>
              <td>{request.type}</td>
              <td>{request.status}</td>
              <td>{new Date(request.createdAt).toLocaleString()}</td>
              <td>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => executeRequest(request.id)}
                  disabled={loading || request.status === 'COMPLETED'}
                >
                  Wykonaj
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
