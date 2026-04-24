'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { FAQ_ASSISTANT_CATALOG } from '@/lib/faq-assistant-catalog';
import { normalizeFaqText } from '@/lib/faq-assistant';
import {
  resolveFaqFromCatalog,
  toFaqResolveResult,
  type FaqResolveResult,
} from '@/lib/faq-assistant-resolve';
import type { FaqCatalogEntry } from '@/lib/faq-assistant-catalog';

function SparkleIcon() {
  return (
    <svg className="mkt-faq-ai-sparkle-svg" width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 2l1.2 4.2L17 8l-3.8 1.4L12 14l-1.2-4.6L7 8l4.8-1.8L12 2z"
        fill="currentColor"
        opacity="0.9"
      />
      <path d="M5 14l.7 2.3L8 17l-2.3.8L5 20l-.7-2.2L2 17l2.3-.8L5 14z" fill="currentColor" opacity="0.55" />
      <path d="M17 15l.6 2.1L20 18l-2.4.8L17 21l-.6-2.1L14 18l2.4-.9L17 15z" fill="currentColor" opacity="0.55" />
    </svg>
  );
}

type SourceLabel = 'llm' | 'llm_guard' | 'catalog' | 'catalog_relaxed' | 'generic' | 'fallback' | string;

export default function FaqAssistantWidget() {
  const [query, setQuery] = useState('');
  const [showExamples, setShowExamples] = useState(false);
  const [bubbleOpen, setBubbleOpen] = useState(false);
  const [lastQuestion, setLastQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [source, setSource] = useState<SourceLabel | ''>('');
  const [loading, setLoading] = useState(false);

  const filteredItems = useMemo(() => {
    const s = normalizeFaqText(query);
    if (!s || s.length < 2) return FAQ_ASSISTANT_CATALOG;
    return FAQ_ASSISTANT_CATALOG.filter((item) => {
      const hay = `${normalizeFaqText(item.question)} ${item.keywords.map(normalizeFaqText).join(' ')}`;
      return hay.includes(s);
    });
  }, [query]);

  function applySourceFromPre(pre: FaqResolveResult) {
    setSource(pre.tier === 'relaxed' ? 'catalog_relaxed' : 'catalog');
  }

  async function fetchAiAnswer(question: string, preResolved: FaqResolveResult | null) {
    setLastQuestion(question);
    setBubbleOpen(true);
    if (preResolved) {
      setAnswer(preResolved.answer);
      applySourceFromPre(preResolved);
    } else {
      setAnswer('');
      setSource('');
    }
    setLoading(!preResolved);
    try {
      const controller = new AbortController();
      /** Musi być > serwerowy LLM (max ~14s na próbę × modele) + maxDuration API 60s. */
      const timeout = setTimeout(() => controller.abort(), 55_000);
      let response: Response;
      try {
        const base = typeof window !== 'undefined' ? window.location.origin : '';
        response = await fetch(`${base}/api/faq-assistant`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            question,
            sessionId: 'marketing-faq-widget-v2',
          }),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeout);
      }
      const raw = await response.text();
      let payload: {
        ok?: boolean;
        answer?: string;
        source?: string;
        matchedIntent?: string | null;
        error?: string;
      };
      try {
        payload = JSON.parse(raw) as typeof payload;
      } catch {
        payload = {};
      }
      const text =
        typeof payload.answer === 'string' && payload.answer.trim() ? payload.answer.trim() : '';
      if (response.ok && payload?.ok && text) {
        setAnswer(text);
        setSource((payload.source as SourceLabel) || 'fallback');
      } else if (response.ok && payload?.ok && !text && preResolved) {
        setAnswer(preResolved.answer);
        applySourceFromPre(preResolved);
      } else {
        const rateLimited = response.status === 429 || payload?.error === 'Too many requests';
        if (preResolved && !rateLimited) {
          setAnswer(preResolved.answer);
          applySourceFromPre(preResolved);
        } else {
          setAnswer(
            rateLimited
              ? 'Zbyt wiele pytań w krótkim czasie — odczekaj minutę i spróbuj ponownie.'
              : 'Chwilowo nie mogę połączyć się z asystentem. Spróbuj ponownie za chwilę lub napisz na stronie /kontakt.'
          );
          setSource('generic');
        }
      }
    } catch {
      if (preResolved) {
        setAnswer(preResolved.answer);
        applySourceFromPre(preResolved);
      } else {
        setAnswer(
          'Brak połączenia z serwerem. Sprawdź sieć i spróbuj ponownie — pełna baza pytań jest też na stronie /faq.'
        );
        setSource('generic');
      }
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit() {
    const q = query.trim();
    if (q.length < 3) return;
    void fetchAiAnswer(q, resolveFaqFromCatalog(q));
  }

  function handleChipQuestion(item: FaqCatalogEntry) {
    setQuery(item.question);
    void fetchAiAnswer(item.question, toFaqResolveResult(item));
  }

  const sourceHint =
    source === 'llm'
      ? 'Odpowiedź z modelu AI (OpenAI), zgodnie z polityką produktu Scopeo.'
      : source === 'llm_guard'
        ? 'Treść zweryfikowana względem oficjalnego FAQ (model mógł nie zachować pełnej zgodności).'
        : source === 'catalog' || source === 'catalog_relaxed'
          ? 'Użyto dopasowania do oficjalnego FAQ — treść jak w katalogu lub uzupełniona przez AI.'
          : source === 'generic' || source === 'fallback'
            ? 'Odpowiedź pomocnicza — doprecyzuj pytanie lub skontaktuj się z nami.'
            : '';

  return (
    <div className="mkt-faq-ai" aria-live="polite">
      {bubbleOpen ? (
        <div className="mkt-faq-ai-bubble" id="mkt-faq-ai-bubble" role="log">
          <div className="mkt-faq-ai-bubble-head">
            <span className="mkt-faq-ai-bubble-title">Asystent Scopeo</span>
            <button
              type="button"
              className="mkt-faq-ai-bubble-close"
              onClick={() => setBubbleOpen(false)}
              aria-label="Zamknij panel odpowiedzi"
            >
              ×
            </button>
          </div>
          {lastQuestion ? <p className="mkt-faq-ai-bubble-q">{lastQuestion}</p> : null}
          {loading && !answer ? (
            <p className="mkt-faq-ai-bubble-loading">Generuję odpowiedź…</p>
          ) : (
            <p className="mkt-faq-ai-bubble-a">{answer}</p>
          )}
          {!loading && source && sourceHint ? <p className="mkt-faq-ai-bubble-meta">{sourceHint}</p> : null}
        </div>
      ) : null}

      <div className="mkt-faq-ai-pill-wrap">
        <div className="mkt-faq-ai-pill">
          <span className="mkt-faq-ai-pill-icon" aria-hidden>
            <SparkleIcon />
          </span>
          <input
            type="text"
            className="mkt-faq-ai-input"
            placeholder="W czym jeszcze mogę Ci pomóc?"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSubmit();
              }
              if (e.key === 'Escape') {
                setBubbleOpen(false);
                setShowExamples(false);
              }
            }}
            aria-label="Pytanie do asystenta AI"
            autoComplete="off"
          />
          <button
            type="button"
            className="mkt-faq-ai-send"
            onClick={handleSubmit}
            disabled={loading || query.trim().length < 3}
            aria-label="Wyślij pytanie"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M12 5.5L18 12h-4.5V18.5h-3V12H6L12 5.5z" />
            </svg>
          </button>
        </div>
        <p className="mkt-faq-ai-powered">
          <span>Odpowiedzi generowane przez AI</span>
          <span className="mkt-faq-ai-dot" aria-hidden>
            ·
          </span>
          <span className="mkt-faq-ai-powered-brand">
            <Image src="/brand/scopeo-mark.svg" alt="" width={16} height={16} unoptimized className="mkt-faq-ai-powered-logo" />
            Powered by <strong>Scopeo</strong>
          </span>
        </p>
        <button type="button" className="mkt-faq-ai-examples-toggle" onClick={() => setShowExamples((v) => !v)}>
          {showExamples ? 'Ukryj przykładowe pytania' : 'Przykładowe pytania z katalogu'}
        </button>
      </div>

      {showExamples ? (
        <div className="mkt-faq-ai-examples" role="region" aria-label="Przykładowe pytania">
          <ul className="mkt-faq-ai-examples-list">
            {filteredItems.slice(0, 40).map((item) => (
              <li key={item.id}>
                <button type="button" className="mkt-faq-ai-example-chip" onClick={() => handleChipQuestion(item)}>
                  {item.question}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
