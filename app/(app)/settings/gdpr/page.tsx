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
    <div className="mx-auto max-w-xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-bold">Prawa RODO</h1>
      <p className="mb-8 text-sm text-gray-600">
        Zgodnie z RODO przysluguje Ci prawo dostepu do danych oraz prawo do ich usuniecia. Wnioski sa
        rozpatrywane w ciagu 30 dni.
      </p>

      <form onSubmit={submit} className="space-y-5 rounded-lg border bg-white p-6">
        <div>
          <label className="mb-2 block text-sm font-medium">Rodzaj wniosku</label>
          <div className="space-y-2">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="radio"
                name="type"
                value="ACCESS"
                checked={type === 'ACCESS'}
                onChange={() => setType('ACCESS')}
                className="mt-0.5"
              />
              <div>
                <div className="text-sm font-medium">Dostep do danych (art. 15 RODO)</div>
                <div className="text-xs text-gray-500">
                  Otrzymasz kopie swoich danych osobowych przetwarzanych w Scopeo.
                </div>
              </div>
            </label>
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="radio"
                name="type"
                value="ERASURE"
                checked={type === 'ERASURE'}
                onChange={() => setType('ERASURE')}
                className="mt-0.5"
              />
              <div>
                <div className="text-sm font-medium text-red-700">Usuniecie danych (art. 17 RODO)</div>
                <div className="text-xs text-gray-500">
                  Twoje konto zostanie zanonimizowane. Operacja jest nieodwracalna.
                </div>
              </div>
            </label>
          </div>
        </div>

        {result && (
          <div className="rounded border border-green-200 bg-green-50 p-3 text-sm text-green-800">
            {result}
          </div>
        )}
        {error && (
          <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>
        )}

        <button
          type="submit"
          disabled={loading || !!result}
          className={`w-full rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-50 ${
            type === 'ERASURE' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {loading ? 'Wysylam...' : 'Zloz wniosek'}
        </button>
      </form>
    </div>
  );
}
