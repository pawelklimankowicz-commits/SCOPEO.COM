import { FAQ_ASSISTANT_CATALOG, type FaqCatalogEntry } from '@/lib/faq-assistant-catalog';
import { findFaqIntent, normalizeFaqText, scoreEntryAgainstQuestion } from '@/lib/faq-assistant';

export type FaqResolveTier = 'intent' | 'relaxed' | 'llm' | 'generic';

export type FaqResolveResult = {
  answer: string;
  matchedIntent: string | null;
  tier: FaqResolveTier;
};

/** Gdy katalog i LLM nic nie dają — zawsze sensowna odpowiedź zamiast „pustki”. */
export const FAQ_ASSISTANT_GENERIC =
  'Nie mam jeszcze gotowej odpowiedzi na to brzmienie pytania. Mogę natomiast pomóc m.in. przy: rejestracji i onboardingu, profilu organizacji i NIP, połączeniu KSeF, emisjach Scope 1–3 i raporcie, cenniku, bezpieczeństwie danych i kontakcie z zespołem. Spróbuj doprecyzować lub napisz przez formularz /kontakt — tam odpowiadamy na indywidualne przypadki.';

/**
 * Lżejsze dopasowanie niż `findFaqIntent` (próg score ≥ 1 + rozstrzyganie remisów).
 * Wołaj tylko gdy `findFaqIntent` zwrócił null.
 */
export function findFaqRelaxedMatch(question: string): FaqCatalogEntry | null {
  if (findFaqIntent(question)) return null;
  const normalized = normalizeFaqText(question);
  if (!normalized) return null;

  let best: { entry: FaqCatalogEntry; score: number; kwBonus: number } | null = null;
  for (const entry of FAQ_ASSISTANT_CATALOG) {
    const { score, kwBonus } = scoreEntryAgainstQuestion(normalized, entry);
    if (score < 1) continue;
    if (
      !best ||
      score > best.score ||
      (score === best.score && kwBonus > best.kwBonus) ||
      (score === best.score && kwBonus === best.kwBonus && entry.question.length < best.entry.question.length)
    ) {
      best = { entry, score, kwBonus };
    }
  }
  return best?.entry ?? null;
}

/** Pełny backup katalogowy: twardy intent → relaxed. */
export function resolveFaqFromCatalog(question: string): FaqResolveResult | null {
  const strict = findFaqIntent(question);
  if (strict) {
    return { answer: strict.answer, matchedIntent: strict.id, tier: 'intent' };
  }
  const relaxed = findFaqRelaxedMatch(question);
  if (relaxed) {
    return { answer: relaxed.answer, matchedIntent: relaxed.id, tier: 'relaxed' };
  }
  return null;
}
