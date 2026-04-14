'use client';

import { useState } from 'react';

export default function GdprPage() {
  const [type, setType] = useState<'ACCESS' | 'ERASURE'>('ACCESS');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setError(null);

    if (type === 'ERASURE') {
      const confirmed = window.confirm(
        'UWAGA: Usuniecie danych jest nieodwracalne. Twoje konto zostanie zanonimizowane i utracisz dostep do aplikacji. Czy na pewno chcesz kontynuowac?'
      );
      if (!confirmed) {
        setLoading(false);
        return;
      }
    }

    const res = await fetch('/api/gdpr/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type }),
    });
    const data = await res.json();

    if (data.ok) {
      setResult(
        type === 'ACCESS'
          ? 'Wniosek o dostep do danych zostal zlozony. Odpowiemy w ciagu 30 dni.'
          : 'Wniosek o usuniecie danych zostal zlozony. Dane zostana zanonimizowane. Potwierdzenie otrzymasz emailem.'
      );
    } else {
      setError(data.error ?? 'Blad skladania wniosku');
    }
    setLoading(false);
  }

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '24px 16px' }}>
      <h1 style={{ marginBottom: 6, fontSize: 30, fontWeight: 800 }}>Prawa RODO</h1>
      <p style={{ marginBottom: 24, fontSize: 14, color: '#64748b' }}>
        Zgodnie z RODO przysluguje Ci prawo dostepu do danych oraz prawo do ich usuniecia. Wnioski sa
        rozpatrywane w ciagu 30 dni.
      </p>

      <form
        onSubmit={submit}
        style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20 }}
      >
        <div>
          <label style={{ marginBottom: 10, display: 'block', fontSize: 14, fontWeight: 700 }}>
            Rodzaj wniosku
          </label>
          <div style={{ display: 'grid', gap: 10 }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
              <input
                type="radio"
                name="type"
                value="ACCESS"
                checked={type === 'ACCESS'}
                onChange={() => setType('ACCESS')}
                style={{ marginTop: 2 }}
              />
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>Dostep do danych (art. 15 RODO)</div>
                <div style={{ fontSize: 12, color: '#64748b' }}>
                  Otrzymasz kopie swoich danych osobowych przetwarzanych w Scopeo.
                </div>
              </div>
            </label>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
              <input
                type="radio"
                name="type"
                value="ERASURE"
                checked={type === 'ERASURE'}
                onChange={() => setType('ERASURE')}
                style={{ marginTop: 2 }}
              />
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#b91c1c' }}>
                  Usuniecie danych (art. 17 RODO)
                </div>
                <div style={{ fontSize: 12, color: '#64748b' }}>
                  Twoje konto zostanie zanonimizowane. Operacja jest nieodwracalna.
                </div>
              </div>
            </label>
          </div>
        </div>

        {result && (
          <div style={{ borderRadius: 8, border: '1px solid #bbf7d0', background: '#f0fdf4', color: '#166534', fontSize: 13, padding: 12, marginTop: 16 }}>{result}</div>
        )}
        {error && (
          <div style={{ borderRadius: 8, border: '1px solid #fecaca', background: '#fef2f2', color: '#991b1b', fontSize: 13, padding: 12, marginTop: 16 }}>{error}</div>
        )}

        <button
          type="submit"
          disabled={loading || !!result}
          style={{
            width: '100%',
            borderRadius: 8,
            border: 0,
            marginTop: 16,
            padding: '10px 12px',
            color: '#fff',
            fontWeight: 700,
            background: type === 'ERASURE' ? '#dc2626' : '#2563eb',
            opacity: loading || !!result ? 0.6 : 1,
          }}
        >
          {loading ? 'Wysylam...' : 'Zloz wniosek'}
        </button>
      </form>
    </div>
  );
}
