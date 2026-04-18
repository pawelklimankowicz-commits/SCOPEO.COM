import { FAQ_ASSISTANT_CATALOG, type FaqCatalogEntry } from '@/lib/faq-assistant-catalog';

/** Kompatybilność z API / Prisma (matchedIntent). */
export type FaqIntent = FaqCatalogEntry;

export function normalizeFaqText(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .replace(/[?!.,;:]+$/g, '')
    .trim();
}

/** Wynik dopasowania pytania do jednego wpisu katalogu (do intentu i trybu „relaxed”). */
export function scoreEntryAgainstQuestion(normalized: string, entry: FaqCatalogEntry): { score: number; kwBonus: number } {
  let score = 0;
  let kwBonus = 0;
  const nq = normalizeFaqText(entry.question);
  for (const kw of entry.keywords) {
    const nk = normalizeFaqText(kw);
    if (nk && normalized.includes(nk)) {
      score += 3;
      kwBonus += nk.length;
    }
  }
  const words = normalized.split(/\s+/).filter((w) => w.length > 2);
  for (const w of words) {
    if (nq.includes(w)) score += 1;
  }
  if (normalized.length >= 10 && nq.includes(normalized)) score += 6;
  if (normalized.length >= 10 && normalized.includes(nq)) score += 5;
  return { score, kwBonus };
}

/**
 * Dopasowanie pytania do wpisu katalogu (exact → słowa kluczowe → częściowe pokrycie treści pytania).
 */
export function findFaqIntent(question: string): FaqIntent | null {
  const normalized = normalizeFaqText(question);
  if (!normalized) return null;

  for (const entry of FAQ_ASSISTANT_CATALOG) {
    if (normalizeFaqText(entry.question) === normalized) return entry;
  }

  const intro = FAQ_ASSISTANT_CATALOG.find((x) => x.id === 'faq-intro-product');
  if (intro) {
    const productOverview =
      normalized.includes('scopeo') &&
      /(co to( jest)?|czym (jest|to)( jest)?|kim jest|opisz|wprowadz|what is|poznaj)/.test(normalized);
    if (productOverview) return intro;
    for (const kw of intro.keywords) {
      const nk = normalizeFaqText(kw);
      if (nk.length >= 8 && normalized.includes(nk)) return intro;
    }
  }

  let best: { intent: FaqIntent; score: number } | null = null;
  for (const entry of FAQ_ASSISTANT_CATALOG) {
    const { score } = scoreEntryAgainstQuestion(normalized, entry);
    if (!best || score > best.score) best = { intent: entry, score };
  }

  if (!best || best.score < 2) return null;
  return best.intent;
}

export function buildFaqSystemPrompt() {
  const intentsSummary = FAQ_ASSISTANT_CATALOG.slice(0, 22)
    .map((intent) => `- ${intent.id}: ${intent.question} => ${intent.answer}`)
    .join('\n');

  return [
    'Jesteś asystentem FAQ Scopeo.',
    'Odpowiadaj po polsku, konkretnie, maksymalnie 4 zdania.',
    'Skup się na onboardingu, danych firmy, podłączeniu KSeF, emisjach Scope 1-3, cenniku i bezpieczeństwie.',
    'Jeżeli pytanie wykracza poza zakres produktu, zaproponuj kontakt przez formularz /kontakt.',
    'Nie wymyślaj nieistniejących funkcji.',
    'Baza odpowiedzi referencyjnych (skrót):',
    intentsSummary,
    `… oraz ${Math.max(0, FAQ_ASSISTANT_CATALOG.length - 22)} innych pozycji katalogu produktu.`,
  ].join('\n');
}
