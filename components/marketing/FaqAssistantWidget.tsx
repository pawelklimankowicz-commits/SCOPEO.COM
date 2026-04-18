'use client';

import { useMemo, useState } from 'react';
import { FAQ_ASSISTANT_CATALOG } from '@/lib/faq-assistant-catalog';
import { findFaqIntent, normalizeFaqText } from '@/lib/faq-assistant';

const FIRST = FAQ_ASSISTANT_CATALOG[0];

export default function FaqAssistantWidget() {
  const [expanded, setExpanded] = useState(true);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [activeItemId, setActiveItemId] = useState<string>(FIRST?.id ?? '');
  const [answer, setAnswer] = useState<string>(
    FIRST?.answer ??
      'Zapytaj o onboarding, KSeF, emisje Scope 1–3, cennik lub bezpieczeństwo danych — wybierz pytanie z listy lub wpisz własne.'
  );
  const [loading, setLoading] = useState(false);

  const activeItem = useMemo(
    () => FAQ_ASSISTANT_CATALOG.find((item) => item.id === activeItemId) ?? null,
    [activeItemId]
  );

  const filteredItems = useMemo(() => {
    const s = normalizeFaqText(search);
    if (!s) return FAQ_ASSISTANT_CATALOG;
    return FAQ_ASSISTANT_CATALOG.filter((item) => {
      const hay = `${normalizeFaqText(item.question)} ${item.keywords.map(normalizeFaqText).join(' ')}`;
      return hay.includes(s);
    });
  }, [search]);

  /** Natychmiastowa odpowiedź z katalogu (bez czekania na sieć). */
  function applyCatalogItem(id: string) {
    const item = FAQ_ASSISTANT_CATALOG.find((i) => i.id === id);
    if (!item) return;
    setActiveItemId(id);
    setAnswer(item.answer);
  }

  async function fetchAssistantAnswer(question: string, preferLocalId?: string | null) {
    setLoading(true);
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12_000);
      let response: Response;
      try {
        response = await fetch('/api/faq-assistant', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question,
            sessionId: 'marketing-faq-widget-v1',
          }),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeout);
      }
      const payload = (await response.json()) as { ok?: boolean; answer?: string; matchedIntent?: string | null };
      if (response.ok && payload?.ok && payload.answer) {
        setAnswer(payload.answer);
        if (payload.matchedIntent) {
          const hit = FAQ_ASSISTANT_CATALOG.find((x) => x.id === payload.matchedIntent);
          if (hit) setActiveItemId(hit.id);
        } else if (preferLocalId) {
          setActiveItemId(preferLocalId);
        }
      } else if (!preferLocalId) {
        setAnswer(
          'Nie mogę teraz pobrać odpowiedzi automatycznej. Spróbuj ponownie za chwilę lub napisz do nas przez formularz kontaktowy.'
        );
      }
    } catch {
      if (!preferLocalId) {
        setAnswer(
          'Nie mogę teraz pobrać odpowiedzi automatycznej. Spróbuj ponownie za chwilę lub napisz do nas przez formularz kontaktowy.'
        );
      }
    } finally {
      setLoading(false);
    }
  }

  /** Gotowe pytanie — wyłącznie katalog (natychmiast, bez migotania „ładowania”). */
  function handleChipClick(id: string) {
    applyCatalogItem(id);
  }

  /** Własne pytanie: najpierw lokalne dopasowanie, potem API. */
  async function handleAsk() {
    const question = query.trim();
    if (question.length < 3) return;

    const local = findFaqIntent(question);
    if (local) {
      setActiveItemId(local.id);
      setAnswer(local.answer);
    } else {
      setAnswer('Analizuję pytanie…');
    }

    await fetchAssistantAnswer(question, local?.id ?? null);
  }

  return (
    <div className="mkt-faq-agent" aria-live="polite">
      <div className="mkt-faq-agent-shell">
        <button
          type="button"
          className="mkt-faq-agent-toggle"
          onClick={() => setExpanded((prev) => !prev)}
          aria-expanded={expanded}
          aria-label={expanded ? 'Zwiń asystenta FAQ' : 'Rozwiń asystenta FAQ'}
        >
          <span>Asystent FAQ Scopeo</span>
          <span aria-hidden>{expanded ? '−' : '+'}</span>
        </button>

        {expanded ? (
          <div className="mkt-faq-agent-body">
            <p className="mkt-faq-agent-count">{FAQ_ASSISTANT_CATALOG.length} pytań w katalogu — wpisz fragment, aby zawęzić listę.</p>
            <input
              type="search"
              className="mkt-faq-agent-search"
              placeholder="Szukaj w pytaniach…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-label="Szukaj w katalogu pytań"
            />
            <div className="mkt-faq-agent-chips" role="list">
              {filteredItems.length === 0 ? (
                <p className="mkt-faq-agent-empty">Brak wyników — zmień frazę wyszukiwania.</p>
              ) : (
                filteredItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    role="listitem"
                    className={`mkt-faq-agent-chip${item.id === activeItemId ? ' mkt-faq-agent-chip--active' : ''}`}
                    onClick={() => handleChipClick(item.id)}
                  >
                    {item.question}
                  </button>
                ))
              )}
            </div>

            <div className="mkt-faq-agent-answer">
              {activeItem ? <p className="mkt-faq-agent-answer-q">{activeItem.question}</p> : null}
              <p className="mkt-faq-agent-answer-a">{answer}</p>
              {loading ? <p className="mkt-faq-agent-answer-wait">Łączę z asystentem…</p> : null}
            </div>

            <div className="mkt-faq-agent-input-row">
              <input
                type="text"
                className="mkt-faq-agent-input"
                placeholder="Zadaj pytanie o Scopeo (min. 3 znaki)"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    void handleAsk();
                  }
                }}
              />
              <button
                type="button"
                className="mkt-faq-agent-send"
                onClick={() => void handleAsk()}
                disabled={loading || query.trim().length < 3}
                aria-label="Wyślij pytanie"
              >
                ↑
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
