'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';

type Row = { name: string; count: number };
type EventRow = {
  id: string;
  name: string;
  path: string | null;
  userId: string | null;
  createdAt: string;
  properties: unknown;
};

export default function AnalyticsSettingsClient() {
  const [days, setDays] = useState(14);
  const [byName, setByName] = useState<Row[]>([]);
  const [recent, setRecent] = useState<EventRow[]>([]);
  const [note, setNote] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/analytics/insights?days=${days}`, { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error || 'Nie udało się wczytać');
        return;
      }
      setByName(data.byName || []);
      setRecent(data.recent || []);
      setNote(data.marketingInOrgNote || null);
    } catch {
      setError('Brak połączenia');
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div>
      <div className="card section" style={{ maxWidth: 900 }}>
        <h2>Lejek w produkcie (pierwszeństwowe, organizacja)</h2>
        <p className="app-muted" style={{ marginTop: 0, fontSize: 14 }}>
          Zdarzenia w aplikacji (onboarding, dashboard) są przypięte do tej organizacji. Nie używamy zewnętrznej
          platformy reklamowej — tylko zapis w naszej bazie, z{' '}
          <Link href="/polityka-prywatnosci" style={{ color: '#a5b4fc' }}>
            opisem w polityce prywatności
          </Link>
          .
        </p>
        <label style={{ display: 'block', marginTop: 12 }}>
          Ostatnie dni:{' '}
          <select value={days} onChange={(e) => setDays(Number(e.target.value))} style={{ marginLeft: 8 }}>
            <option value={7}>7</option>
            <option value={14}>14</option>
            <option value={30}>30</option>
          </select>
        </label>
        {error ? <p style={{ color: '#fda4af' }}>{error}</p> : null}
        {loading ? <p className="app-muted">Wczytywanie…</p> : null}
        {note ? (
          <p className="app-muted" style={{ fontSize: 13, marginTop: 10 }}>
            {note}
          </p>
        ) : null}
        {!loading && byName.length === 0 ? <p className="empty-hint">Brak zdarzeń w tym oknie.</p> : null}
        {!loading && byName.length > 0 ? (
          <div style={{ marginTop: 16 }}>
            <h3 style={{ fontSize: 15, marginBottom: 8 }}>Suma wystąpień (nazwa zdarzenia)</h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {byName.map((r) => (
                <li
                  key={r.name}
                  style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #1e293b' }}
                >
                  <code style={{ fontSize: 13 }}>{r.name}</code>
                  <span>{r.count}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {!loading && recent.length > 0 ? (
          <div style={{ marginTop: 20 }}>
            <h3 style={{ fontSize: 15, marginBottom: 8 }}>Ostatnie zdarzenia</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', fontSize: 13 }}>
                <thead>
                  <tr>
                    <th>Czas (UTC)</th>
                    <th>Nazwa</th>
                    <th>Ścieżka</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((e) => (
                    <tr key={e.id}>
                      <td>{e.createdAt.slice(0, 19).replace('T', ' ')}</td>
                      <td>
                        <code>{e.name}</code>
                      </td>
                      <td style={{ maxWidth: 280, wordBreak: 'break-all' }}>{e.path || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
