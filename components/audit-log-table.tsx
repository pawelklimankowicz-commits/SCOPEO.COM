'use client';

import { useMemo, useState } from 'react';
import { EVENT_LABELS } from '@/lib/audit-log';

type AuditRow = {
  id: string;
  createdAt: string;
  eventType: string;
  subjectRef: string | null;
  legalBasis: string | null;
  payload: unknown;
};

function shortSubject(value: string | null) {
  if (!value) return '-';
  if (value.length <= 30) return value;
  return `${value.slice(0, 27)}...`;
}

export default function AuditLogTable({
  rows,
  nextCursor,
  filters,
}: {
  rows: AuditRow[];
  nextCursor: string | null;
  filters: { from?: string; to?: string; eventType?: string; search?: string };
}) {
  const [selected, setSelected] = useState<AuditRow | null>(null);
  const baseParams = useMemo(() => {
    const params = new URLSearchParams();
    if (filters.from) params.set('from', filters.from);
    if (filters.to) params.set('to', filters.to);
    if (filters.eventType) params.set('eventType', filters.eventType);
    if (filters.search) params.set('search', filters.search);
    return params;
  }, [filters.eventType, filters.from, filters.search, filters.to]);

  return (
    <div className="card section">
      <table>
        <thead>
          <tr>
            <th>Data i godzina</th>
            <th>Zdarzenie</th>
            <th>Podmiot</th>
            <th>Podstawa prawna</th>
            <th>Szczegoly</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td>{new Date(row.createdAt).toLocaleString('pl-PL')}</td>
              <td>{EVENT_LABELS[row.eventType] ?? row.eventType}</td>
              <td title={row.subjectRef ?? ''}>{shortSubject(row.subjectRef)}</td>
              <td>{row.legalBasis ?? '-'}</td>
              <td>
                <button className="btn btn-secondary" onClick={() => setSelected(row)}>
                  Pokaz
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
        <a className="btn btn-secondary" href={`/api/audit-log?${baseParams.toString()}&format=csv`}>
          Eksportuj CSV
        </a>
        {nextCursor ? (
          <a className="btn btn-secondary" href={`/dashboard/audit?${baseParams.toString()}&cursor=${nextCursor}`}>
            Nastepna strona
          </a>
        ) : null}
      </div>

      {selected ? (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.55)',
            display: 'grid',
            placeItems: 'center',
            zIndex: 70,
          }}
          onClick={() => setSelected(null)}
        >
          <div
            className="card section"
            style={{ width: 'min(920px, 92vw)', maxHeight: '85vh', overflowY: 'auto' }}
            onClick={(event) => event.stopPropagation()}
          >
            <h3 style={{ marginTop: 0 }}>{EVENT_LABELS[selected.eventType] ?? selected.eventType}</h3>
            <pre className="code">{JSON.stringify(selected.payload ?? {}, null, 2)}</pre>
            <button className="btn btn-secondary" onClick={() => setSelected(null)}>
              Zamknij
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
