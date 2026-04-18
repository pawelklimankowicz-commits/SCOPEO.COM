'use client';

import { useMemo, useState } from 'react';
import { FAQ_ASSISTANT_CATALOG } from '@/lib/faq-assistant-catalog';
import { findFaqIntent, normalizeFaqText } from '@/lib/faq-assistant';

const INTRO = FAQ_ASSISTANT_CATALOG.find((x) => x.id === 'faq-intro-product');
const FIRST = INTRO ?? FAQ_ASSISTANT_CATALOG[0];

export default function FaqAssistantWidget() {
  const [panelOpen, setPanelOpen] = useState(false);
  const [showQuestionList, setShowQuestionList] = useState(false);
  const [query, setQuery] = useState('');
  const [activeItemId, setActiveItemId] = useState<string>(FIRST?.id ?? '');
  const [answer, setAnswer] = useState<string>(
    FIRST?.answer ??
      'Zapytaj o onboarding, KSeF, emisje Scope 1–3, cennik lub bezpieczeństwo danych — wpisz pytanie lub rozwiń listę gotowych pytań.'
  );
  const [loading, setLoading] = useState(false);

  const activeItem = useMemo(
    () => FAQ_ASSISTANT_CATALOG.find((item) => item.id === activeItemId) ?? null,
    [activeItemId]
  );

  const filteredItems = useMemo(() => {
    const s = normalizeFaqText(query);
    if (!s) return FAQ_ASSISTANT_CATALOG;
    return FAQ_ASSISTANT_CATALOG.filter((item) => {
      const hay = `${normalizeFaqText(item.question)} ${item.keywords.map(normalizeFaqText).join(' ')}`;
      return hay.includes(s);
    });
  }, [query]);

  function applyCatalogItem(id: string) {
    const item = FAQ_ASSISTANT_CATALOG.find((i) => i.id === id);
    if (!item) return;
    setActiveItemId(id);
    setAnswer(item.answer);
    setPanelOpen(true);
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

  function handleChipClick(id: string) {
    applyCatalogItem(id);
  }

  async function handleAsk() {
    const question = query.trim();
    if (question.length < 3) return;

    const local = findFaqIntent(question);
    if (local) {
      setActiveItemId(local.id);
      setAnswer(local.answer);
      setPanelOpen(true);
    } else {
      setAnswer('Szukam odpowiedzi…');
      setPanelOpen(true);
    }

    await fetchAssistantAnswer(question, local?.id ?? null);
  }

  return (
    <div className={`mkt-faq-agent${panelOpen || showQuestionList ? ' mkt-faq-agent--expanded' : ''}`} aria-live="polite">
      <div className="mkt-faq-agent-shell">
        <div className="mkt-faq-agent-bar">
          <button
            type="button"
            className="mkt-faq-agent-label"
            onClick={() => setPanelOpen((p) => !p)}
            aria-expanded={panelOpen}
            aria-label={panelOpen ? 'Zwiń panel odpowiedzi' : 'Rozwiń panel odpowiedzi'}
          >
            Asystent FAQ
          </button>
          <div className="mkt-faq-agent-input-row">
            <input
              type="text"
              className="mkt-faq-agent-input"
              placeholder="Zapytaj o Scopeo lub wpisz fragment z katalogu…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  void handleAsk();
                }
              }}
              aria-label="Pytanie do asystenta FAQ"
              autoComplete="off"
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
          <button
            type="button"
            className="mkt-faq-agent-list-toggle"
            onClick={() => setShowQuestionList((v) => !v)}
            aria-expanded={showQuestionList}
          >
            {showQuestionList ? 'Ukryj' : 'Pokaż'} listę pytań ({FAQ_ASSISTANT_CATALOG.length})
          </button>
        </div>

        {showQuestionList ? (
          <div className="mkt-faq-agent-list-wrap">
            {filteredItems.length === 0 ? (
              <p className="mkt-faq-agent-empty">Brak wyników — zmień tekst w polu powyżej.</p>
            ) : (
              <ul className="mkt-faq-agent-chips">
                {filteredItems.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      className={`mkt-faq-agent-chip${item.id === activeItemId ? ' mkt-faq-agent-chip--active' : ''}`}
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        handleChipClick(item.id);
                      }}
                    >
                      {item.question}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : null}

        {panelOpen ? (
          <div className="mkt-faq-agent-panel">
            <div className="mkt-faq-agent-answer">
              {activeItem ? <p className="mkt-faq-agent-answer-q">{activeItem.question}</p> : null}
              <p className="mkt-faq-agent-answer-a">{answer}</p>
              {loading ? <p className="mkt-faq-agent-answer-wait">Łączę z asystentem…</p> : null}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
