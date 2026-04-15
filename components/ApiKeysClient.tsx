'use client';

import { useState } from 'react';

type ApiKeyItem = {
  id: string;
  name: string;
  keyPrefix: string;
  scopes: string[];
  lastUsedAt: Date | null;
  expiresAt: Date | null;
  createdAt: Date;
};

const AVAILABLE_SCOPES = ['emissions:read', 'suppliers:read', 'factors:read'] as const;

export default function ApiKeysClient({ initialKeys }: { initialKeys: ApiKeyItem[] }) {
  const [keys, setKeys] = useState(initialKeys);
  const [name, setName] = useState('');
  const [selectedScopes, setSelectedScopes] = useState<string[]>(['emissions:read']);
  const [expiresAt, setExpiresAt] = useState('');
  const [rawKey, setRawKey] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function refresh() {
    const res = await fetch('/api/api-keys');
    const data = await res.json();
    if (res.ok && data?.ok) setKeys(data.keys);
  }

  return (
    <div className="card section">
      <h2>Aktywne klucze</h2>
      {keys.length === 0 ? <p className="empty-hint">Brak aktywnych kluczy.</p> : null}
      {keys.map((key) => (
        <div key={key.id} style={{ border: '1px solid #334155', borderRadius: 8, padding: 10, marginBottom: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
            <div>
              <strong>{key.name}</strong> · <code>{key.keyPrefix}...</code>
              <div className="app-muted" style={{ fontSize: 12 }}>
                scopes: {key.scopes.join(', ')} · last used:{' '}
                {key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleString('pl-PL') : 'nigdy'}
                {key.expiresAt ? ` · wygasa: ${new Date(key.expiresAt).toLocaleDateString('pl-PL')}` : ''}
              </div>
            </div>
            <button
              className="btn btn-secondary"
              onClick={async () => {
                if (!confirm('Na pewno odwołać klucz?')) return;
                await fetch(`/api/api-keys/${key.id}`, { method: 'DELETE' });
                await refresh();
              }}
            >
              Odwołaj
            </button>
          </div>
        </div>
      ))}

      <h3 style={{ marginTop: 20 }}>Utwórz klucz API</h3>
      <label>
        Nazwa
        <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Power BI integration" />
      </label>
      <div style={{ marginTop: 8 }}>
        {AVAILABLE_SCOPES.map((scope) => (
          <label key={scope} style={{ display: 'block' }}>
            <input
              type="checkbox"
              checked={selectedScopes.includes(scope)}
              onChange={(event) => {
                setSelectedScopes((prev) =>
                  event.target.checked ? [...prev, scope] : prev.filter((item) => item !== scope)
                );
              }}
            />{' '}
            {scope}
          </label>
        ))}
      </div>
      <label style={{ marginTop: 8 }}>
        Wygasa (opcjonalnie)
        <input type="datetime-local" value={expiresAt} onChange={(event) => setExpiresAt(event.target.value)} />
      </label>
      <button
        className="btn btn-primary"
        disabled={busy}
        style={{ marginTop: 12 }}
        onClick={async () => {
          setBusy(true);
          setMessage('');
          setRawKey('');
          const payload = {
            name,
            scopes: selectedScopes,
            ...(expiresAt ? { expiresAt: new Date(expiresAt).toISOString() } : {}),
          };
          const res = await fetch('/api/api-keys', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          const data = await res.json().catch(() => null);
          setBusy(false);
          if (!res.ok || !data?.ok) {
            setMessage(data?.error || 'Nie udało się utworzyć klucza');
            return;
          }
          setMessage('Klucz utworzony. Skopiuj go teraz, pozniej nie bedzie widoczny.');
          setRawKey(data.rawKey || '');
          setName('');
          setExpiresAt('');
          await refresh();
        }}
      >
        {busy ? 'Tworzenie...' : 'Utwórz klucz API'}
      </button>

      {rawKey ? (
        <div className="card section" style={{ marginTop: 14, borderColor: '#facc15' }}>
          <p style={{ marginTop: 0, color: '#fde68a' }}>
            Ten klucz widzisz tylko raz. Skopiuj i zapisz w bezpiecznym miejscu.
          </p>
          <pre className="code">{rawKey}</pre>
        </div>
      ) : null}
      {message ? <p className="app-muted">{message}</p> : null}
    </div>
  );
}
