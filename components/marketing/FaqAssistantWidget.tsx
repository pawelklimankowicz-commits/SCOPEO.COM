'use client';

import { useMemo, useState } from 'react';
import { FAQ_ASSISTANT_CATALOG } from '@/lib/faq-assistant-catalog';
import { findFaqIntent, normalizeFaqText } from '@/lib/faq-assistant';

const WELCOME =
  'Wpisz pytanie (min. 3 znaki) i wyślij strzałką, albo kliknij „Pokaż listę pytań”, wybierz pozycję — odpowiedź zobaczysz po kliknięciu + (panel po prawej u góry).';

export default function FaqAssistantWidget() {
  const [panelOpen, setPanelOpen] = useState(false);
  const [showQuestionList, setShowQuestionList] = useState(false);
  const [query, setQuery] = useState('');
  const [activeItemId, setActiveItemId] = useState('');
  const [answer, setAnswer] = useState(WELCOME);
  const [loading, setLoading] = useState(false);

  const activeItem = useMemo(
    () => (activeItemId ? FAQ_ASSISTANT_CATALOG.find((item) => item.id === activeItemId) ?? null : null),
    [activeItemId]
  );

  /** Krótki fragment w polu (< 2 znaki po normalizacji) nie zawęża listy — unikamy „pustej” listy po otwarciu. */
  const filteredItems = useMemo(() => {
    const s = normalizeFaqText(query);
    if (!s || s.length < 2) return FAQ_ASSISTANT_CATALOG;
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

  /** Tylko gdy brak dopasowania w katalogu — unikamy nadpisywania pewnej odpowiedzi z katalogu przez LLM / błąd sieci. */
  async function fetchAssistantAnswer(question: string) {
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
      const payload = (await response.json()) as {
        ok?: boolean;
        answer?: string;
        matchedIntent?: string | null;
      };
      if (response.ok && payload?.ok && payload.answer) {
        setAnswer(payload.answer);
        if (payload.matchedIntent) {
          const hit = FAQ_ASSISTANT_CATALOG.find((x) => x.id === payload.matchedIntent);
          if (hit) setActiveItemId(hit.id);
        }
      } else {
        setAnswer(
          'Nie mogę teraz pobrać odpowiedzi automatycznej. Spróbuj ponownie za chwilę lub napisz do nas przez formularz kontaktowy.'
        );
      }
    } catch {
      setAnswer(
        'Nie mogę teraz pobrać odpowiedzi automatycznej. Spróbuj ponownie za chwilę lub napisz do nas przez formularz kontaktowy.'
      );
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
      return;
    }

    setActiveItemId('');
    setAnswer('Szukam odpowiedzi…');
    setPanelOpen(true);
    await fetchAssistantAnswer(question);
  }

  return (
    <div
      className={`mkt-faq-agent${panelOpen || showQuestionList ? ' mkt-faq-agent--expanded' : ''}`}
      aria-live="polite"
    >
      <div className="mkt-faq-agent-shell">
        <div className="mkt-faq-agent-bar">
          <div className="mkt-faq-agent-topline">
            <div className="mkt-faq-agent-title-block" id="mkt-faq-agent-heading">
              <span className="mkt-faq-agent-title">Twój Wirtualny Asystent FAQ</span>
              <span className="mkt-faq-agent-subtitle">W czym mogę Ci dziś pomóc?</span>
            </div>
            <button
              type="button"
              className="mkt-faq-agent-panel-toggle"
              onClick={() => setPanelOpen((p) => !p)}
              aria-expanded={panelOpen}
              aria-controls="mkt-faq-answer-panel"
              aria-label={panelOpen ? 'Ukryj panel odpowiedzi' : 'Pokaż panel odpowiedzi'}
            >
              {panelOpen ? '−' : '+'}
            </button>
          </div>

          <div className="mkt-faq-agent-input-row">
            <input
              type="text"
              className="mkt-faq-agent-input"
              placeholder="Np. Co to jest Scopeo?, KSeF, Scope 3, cennik…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  void handleAsk();
                }
                if (event.key === 'Escape') {
                  setShowQuestionList(false);
                  setPanelOpen(false);
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
            id="mkt-faq-list-toggle"
            onClick={() => setShowQuestionList((v) => !v)}
            aria-expanded={showQuestionList}
            aria-controls="mkt-faq-question-list"
          >
            {showQuestionList ? 'Ukryj listę pytań' : 'Pokaż listę pytań'}
          </button>
        </div>

        {showQuestionList ? (
          <div className="mkt-faq-agent-list-wrap" id="mkt-faq-question-list" role="region" aria-labelledby="mkt-faq-list-toggle">
            {filteredItems.length === 0 ? (
              <p className="mkt-faq-agent-empty">Brak wyników — zmień tekst w polu powyżej (min. 2 znaki do filtrowania).</p>
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
          <div className="mkt-faq-agent-panel" id="mkt-faq-answer-panel" role="region" aria-labelledby="mkt-faq-agent-heading">
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
