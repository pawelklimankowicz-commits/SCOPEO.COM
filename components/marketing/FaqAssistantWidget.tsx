'use client';

import { useMemo, useState } from 'react';

type FaqItem = {
  id: string;
  question: string;
};

const FAQ_ITEMS: FaqItem[] = [
  {
    id: 'ksef-connect',
    question: 'Jak podłączyć Scopeo do KSeF?',
  },
  {
    id: 'first-setup-time',
    question: 'Ile trwa uruchomienie Scopeo?',
  },
  {
    id: 'scopes',
    question: 'Czy Scopeo liczy Scope 1, 2 i 3?',
  },
  {
    id: 'security',
    question: 'Czy dane firmy są bezpieczne?',
  },
  {
    id: 'pricing',
    question: 'Od czego zależy cena?',
  },
];

export default function FaqAssistantWidget() {
  const [expanded, setExpanded] = useState(true);
  const [query, setQuery] = useState('');
  const [activeItemId, setActiveItemId] = useState<string>(FAQ_ITEMS[0]?.id ?? '');
  const [answer, setAnswer] = useState<string>(
    'Zapytaj o onboarding, KSeF, emisje Scope 1-3, cennik lub bezpieczeństwo danych.'
  );
  const [loading, setLoading] = useState(false);

  const activeItem = useMemo(
    () => FAQ_ITEMS.find((item) => item.id === activeItemId) ?? null,
    [activeItemId]
  );

  const handleAsk = async (customQuestion?: string, itemId?: string) => {
    const question = (customQuestion ?? query).trim();
    if (question.length < 3) return;
    if (itemId) setActiveItemId(itemId);

    setLoading(true);
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6500);
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
      const payload = (await response.json()) as { ok?: boolean; answer?: string };
      if (!response.ok || !payload?.ok || !payload.answer) {
        throw new Error('faq_assistant_failed');
      }
      setAnswer(payload.answer);
    } catch {
      setAnswer(
        'Nie mogę teraz pobrać odpowiedzi automatycznej. Spróbuj ponownie za chwilę lub napisz do nas przez formularz kontaktowy.'
      );
    } finally {
      setLoading(false);
    }
  };

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
            <div className="mkt-faq-agent-chips">
              {FAQ_ITEMS.slice(0, 3).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="mkt-faq-agent-chip"
                  onClick={() => void handleAsk(item.question, item.id)}
                >
                  {item.question}
                </button>
              ))}
            </div>

            <div className="mkt-faq-agent-answer">
              {activeItem ? (
                <>
                  <p className="mkt-faq-agent-answer-q">{activeItem.question}</p>
                </>
              ) : null}
              <p className="mkt-faq-agent-answer-a">
                {loading ? 'Analizuję pytanie...' : answer}
              </p>
            </div>

            <div className="mkt-faq-agent-input-row">
              <input
                type="text"
                className="mkt-faq-agent-input"
                placeholder="Zadaj pytanie o Scopeo"
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
                disabled={loading}
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
