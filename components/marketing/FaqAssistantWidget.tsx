'use client';

import { useMemo, useState } from 'react';

type FaqItem = {
  id: string;
  question: string;
  answer: string;
  keywords: string[];
};

const FAQ_ITEMS: FaqItem[] = [
  {
    id: 'ksef-connect',
    question: 'Jak podłączyć Scopeo do KSeF?',
    answer:
      'Wejdź w Ustawienia i dodaj token autoryzacyjny KSeF. Po weryfikacji Scopeo automatycznie pobiera faktury i przelicza emisje. Pierwsza konfiguracja zwykle trwa kilka minut.',
    keywords: ['ksef', 'token', 'polaczyc', 'podlaczyc', 'podłączyć', 'integracja'],
  },
  {
    id: 'first-setup-time',
    question: 'Ile trwa uruchomienie Scopeo?',
    answer:
      'Rejestracja i pierwsze połączenie z KSeF zwykle zajmuje ok. 15 minut. Pierwsze dane pojawiają się po krótkim czasie od poprawnego podłączenia.',
    keywords: ['ile', 'czas', 'uruchomienie', 'wdrozenie', 'wdrożenie', 'start'],
  },
  {
    id: 'scopes',
    question: 'Czy Scopeo liczy Scope 1, 2 i 3?',
    answer:
      'Tak. Scopeo obsługuje Scope 1, Scope 2 i Scope 3. Dane są liczone na bazie faktur i przypisanych faktorów emisji zgodnie z metodyką GHG.',
    keywords: ['scope', 'scope1', 'scope2', 'scope3', 'ghg', 'emisj'],
  },
  {
    id: 'security',
    question: 'Czy dane firmy są bezpieczne?',
    answer:
      'Tak. Dane są izolowane per organizacja i przechowywane w infrastrukturze UE. Dostęp zależy od uprawnień nadanych użytkownikom w Twoim koncie.',
    keywords: ['bezpieczenstwo', 'bezpieczeństwo', 'rodo', 'dane', 'ue'],
  },
  {
    id: 'pricing',
    question: 'Od czego zależy cena?',
    answer:
      'Cena zależy od planu, liczby połączeń KSeF i liczby użytkowników. Limit faktur nie jest podstawą rozliczenia. Szczegóły znajdziesz w cenniku.',
    keywords: ['cena', 'cennik', 'plan', 'koszt', 'abonament'],
  },
];

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function findBestAnswer(input: string) {
  const normalized = normalizeText(input);
  if (!normalized.trim()) return null;

  let best: { item: FaqItem; score: number } | null = null;

  for (const item of FAQ_ITEMS) {
    const score = item.keywords.reduce((acc, keyword) => {
      return normalized.includes(normalizeText(keyword)) ? acc + 1 : acc;
    }, 0);
    if (!best || score > best.score) best = { item, score };
  }

  if (!best || best.score === 0) return null;
  return best.item;
}

export default function FaqAssistantWidget() {
  const [expanded, setExpanded] = useState(true);
  const [query, setQuery] = useState('');
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [customAnswer, setCustomAnswer] = useState<string | null>(null);

  const activeItem = useMemo(
    () => FAQ_ITEMS.find((item) => item.id === activeItemId) ?? null,
    [activeItemId]
  );

  const handleAsk = () => {
    const found = findBestAnswer(query);
    if (found) {
      setActiveItemId(found.id);
      setCustomAnswer(null);
      return;
    }
    setActiveItemId(null);
    setCustomAnswer(
      'Nie znalazłem idealnej odpowiedzi. Napisz do nas przez formularz kontaktowy, a pomożemy dobrać konfigurację pod Twoją firmę.'
    );
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
                  onClick={() => {
                    setActiveItemId(item.id);
                    setCustomAnswer(null);
                  }}
                >
                  {item.question}
                </button>
              ))}
            </div>

            <div className="mkt-faq-agent-answer">
              {activeItem ? (
                <>
                  <p className="mkt-faq-agent-answer-q">{activeItem.question}</p>
                  <p className="mkt-faq-agent-answer-a">{activeItem.answer}</p>
                </>
              ) : customAnswer ? (
                <p className="mkt-faq-agent-answer-a">{customAnswer}</p>
              ) : (
                <p className="mkt-faq-agent-answer-a">
                  Zapytaj o onboarding, KSeF, emisje Scope 1-3, cennik lub bezpieczeństwo danych.
                </p>
              )}
            </div>

            <div className="mkt-faq-agent-input-row">
              <input
                type="text"
                className="mkt-faq-agent-input"
                placeholder="Zadaj pytanie o Scopeo"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') handleAsk();
                }}
              />
              <button type="button" className="mkt-faq-agent-send" onClick={handleAsk}>
                ↑
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
