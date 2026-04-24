'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';

type Category = 'BUG' | 'FEATURE' | 'UX' | 'DATA' | 'INTEGRATION' | 'OTHER';

type Item = {
  id: string;
  category: Category;
  userTitle: string;
  userDescription: string;
  pageContext: string | null;
  status: string;
  technicalTaskTitle: string | null;
  technicalTaskBody: string | null;
  technicalLabels: string[];
  llmError: string | null;
  submitterName: string | null;
  submitterEmail: string;
  createdAt: string;
};

const CATEGORY_LABEL: Record<Category, string> = {
  BUG: 'Błąd / coś nie działa',
  FEATURE: 'Nowa funkcja',
  UX: 'Ergonomia / treść / flow',
  DATA: 'Dane / faktory / kategorie',
  INTEGRATION: 'Integracje (KSeF, API, Eksport)',
  OTHER: 'Inne',
};

export default function ProductFeedbackClient() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [pageContext, setPageContext] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/feedback', { cache: 'no-store' });
      const data = await res.json();
      if (data.ok) setItems(data.items);
    } catch {
      setMessage('Nie udało się wczytać listy. Sprawdź połączenie.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setPageContext(`${window.location.pathname}${window.location.search || ''}`.slice(0, 500));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    const fd = new FormData(e.currentTarget);
    const category = String(fd.get('category') || 'OTHER') as Category;
    const userTitle = String(fd.get('userTitle') || '').trim();
    const userDescription = String(fd.get('userDescription') || '').trim();
    const ctx = String(fd.get('pageContext') || '').trim() || pageContext;
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          userTitle,
          userDescription,
          pageContext: ctx || null,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setMessage(data.error || 'Nie udało się wysłać zgłoszenia.');
        return;
      }
      e.currentTarget.reset();
      if (typeof window !== 'undefined') {
        setPageContext(`${window.location.pathname}${window.location.search || ''}`.slice(0, 500));
      }
      setMessage('Dziękujemy. Zgłoszenie zostało zapisane; zespół otrzyma skrót zadania (jeśli włączony jest e-mail).');
      if (data.item) {
        setItems((prev) => [data.item as Item, ...prev]);
      } else {
        await load();
      }
    } catch {
      setMessage('Brak połączenia. Spróbuj ponownie.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="container app-page">
      <h1 className="title">Uwagi do produktu</h1>
      <p className="subtitle app-muted" style={{ maxWidth: 640 }}>
        Opisz problem lub pomysł. System wygeneruje propozycję zadania technicznego (tytuł, kroki, kryteria) — zespół
        Scopeo może dostać to także na skrzynkę e-mail, jeśli jest skonfigurowana.
      </p>

      <div className="card section" style={{ maxWidth: 640 }}>
        <h2>Nowe zgłoszenie</h2>
        <form onSubmit={onSubmit} className="grid" style={{ gap: 12 }}>
          <input type="hidden" name="pageContext" value={pageContext} />
          <label>
            Kategoria
            <select name="category" required style={{ width: '100%', padding: '8px 10px', borderRadius: 6 }}>
              {(Object.keys(CATEGORY_LABEL) as Category[]).map((k) => (
                <option key={k} value={k}>
                  {CATEGORY_LABEL[k]}
                </option>
              ))}
            </select>
          </label>
          <label>
            Tytuł
            <input name="userTitle" required minLength={3} maxLength={200} placeholder="np. Błąd importu z KSeF" />
          </label>
          <label>
            Opis
            <textarea
              name="userDescription"
              required
              minLength={10}
              maxLength={8000}
              rows={6}
              placeholder="Co się stało, czego oczekujesz, kroki odtworzenia…"
            />
          </label>
          <p className="app-muted" style={{ fontSize: 13, margin: 0 }}>
            Kontekst ekranu (wysyłany automatycznie): <code style={{ fontSize: 12 }}>{pageContext || '—'}</code>
          </p>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Wysyłanie...' : 'Wyślij zgłoszenie'}
          </button>
        </form>
        {message ? (
          <p style={{ marginTop: 12, color: message.startsWith('Dziękujemy') ? '#86efac' : '#fda4af' }} role="status">
            {message}
          </p>
        ) : null}
      </div>

      <div className="card section" style={{ marginTop: 24 }}>
        <h2>Zgłoszenia w tej organizacji</h2>
        {loading ? <p className="app-muted">Wczytywanie…</p> : null}
        {!loading && items.length === 0 ? <p className="empty-hint">Jeszcze brak zgłoszeń.</p> : null}
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {items.map((it) => (
            <li
              key={it.id}
              style={{
                border: '1px solid #334155',
                borderRadius: 8,
                padding: 14,
                marginBottom: 12,
              }}
            >
              <div style={{ fontSize: 12, color: '#94a3b8' }}>
                {new Date(it.createdAt).toLocaleString('pl-PL')} · {CATEGORY_LABEL[it.category]}{' '}
                {it.submitterName ? `· ${it.submitterName}` : ''} · {it.submitterEmail}
              </div>
              <h3 style={{ margin: '8px 0 4px', fontSize: '1.05rem' }}>{it.userTitle}</h3>
              <p style={{ whiteSpace: 'pre-wrap', marginBottom: 8 }}>{it.userDescription}</p>
              {it.pageContext ? (
                <p className="app-muted" style={{ fontSize: 12 }}>
                  Ścieżka: {it.pageContext}
                </p>
              ) : null}
              {it.technicalTaskTitle ? (
                <div style={{ marginTop: 12, padding: 10, background: '#0f172a', borderRadius: 6 }}>
                  <div style={{ fontSize: 12, color: '#a5b4fc', marginBottom: 6 }}>Propozycja zadania (AI)</div>
                  <strong>{it.technicalTaskTitle}</strong>
                  {it.technicalLabels.length > 0 ? (
                    <div style={{ marginTop: 6, fontSize: 12 }}>
                      {it.technicalLabels.map((l) => (
                        <span
                          key={l}
                          style={{ marginRight: 6, padding: '2px 8px', background: '#1e293b', borderRadius: 4 }}
                        >
                          {l}
                        </span>
                      ))}
                    </div>
                  ) : null}
                  {it.technicalTaskBody ? (
                    <pre
                      style={{
                        marginTop: 8,
                        fontSize: 12,
                        whiteSpace: 'pre-wrap',
                        fontFamily: 'ui-monospace, monospace',
                      }}
                    >
                      {it.technicalTaskBody}
                    </pre>
                  ) : null}
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ marginTop: 8 }}
                    onClick={() => {
                      const blob = [it.technicalTaskTitle, '', it.technicalTaskBody || ''].join('\n');
                      void navigator.clipboard.writeText(blob);
                    }}
                  >
                    Kopiuj tytuł + opis do schowka
                  </button>
                </div>
              ) : it.llmError ? (
                <p className="app-muted" style={{ fontSize: 12 }}>
                  Szkic AI niedostępny: {it.llmError}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
