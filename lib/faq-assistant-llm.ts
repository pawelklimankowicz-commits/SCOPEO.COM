import { buildFaqSystemPrompt, normalizeFaqText } from '@/lib/faq-assistant';

export const DEFAULT_FAQ_LLM_TIMEOUT_MS = 14_000;

const JSON_INSTRUCTION =
  'Zwróć WYŁĄCZNIE jeden obiekt JSON (bez otoczenia markdown), pól: "answer" (string, odpowiedź po polsku, max 4 zdania) i "decline" (boolean). ' +
  'Ustaw decline=true tylko gdy pytanie jest całkowicie spoza produktu Scopeo (KSeF, emisje, cennik, dane w aplikacji). ' +
  'Gdy w treści usera jest [Oficjalna odpowiedź z FAQ], decline=false, a w answer musi być wierna treść — możesz tylko skrócić lub przeformułować.';

export function getFaqLlmTimeoutMs(): number {
  const raw = process.env.FAQ_ASSISTANT_LLM_TIMEOUT_MS?.trim();
  if (!raw) return DEFAULT_FAQ_LLM_TIMEOUT_MS;
  const n = parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 3000 || n > 120_000) return DEFAULT_FAQ_LLM_TIMEOUT_MS;
  return n;
}

/** Unikalna kolejność: główny model, opcjonalny fallback (np. gdy wycięto starszą nazwę). */
export function getFaqModelChain(): string[] {
  const primary = (process.env.FAQ_ASSISTANT_MODEL || 'gpt-4o-mini').trim();
  const fallback = process.env.FAQ_ASSISTANT_MODEL_FALLBACK?.trim() ?? '';
  const out: string[] = [];
  for (const m of [primary, fallback]) {
    if (m && !out.includes(m)) out.push(m);
  }
  return out;
}

/** Katalog API (OpenAI, Azure OpenAI, proxy, AI Gateway) — bez końcowego slasha. */
export function getOpenAIV1BaseUrl(): string {
  const raw = process.env.OPENAI_BASE_URL?.trim();
  if (!raw) return 'https://api.openai.com/v1';
  return raw.replace(/\/+$/, '');
}

function modelPrefersMaxCompletionTokens(model: string): boolean {
  const m = model.toLowerCase();
  if (m.startsWith('o1') || m.startsWith('o2') || m.startsWith('o3') || m.startsWith('o4')) return true;
  if (m.startsWith('gpt-5') || m.includes('gpt-4.1') || m.includes('gpt-4.5') || m.includes('computer-use'))
    return true;
  if (m.includes('search-api')) return true;
  return false;
}

function modelOmitTemperature(model: string): boolean {
  const m = model.toLowerCase();
  return m.startsWith('o1') || m.startsWith('o2') || m.startsWith('o3') || m.startsWith('o4') || m.startsWith('gpt-5');
}

let warnedInvalidJson = false;
export function getFaqJsonObjectMode(): boolean {
  const v = process.env.FAQ_ASSISTANT_JSON_MODE?.trim();
  if (v === '0' || v === 'false') return false;
  if (v === '1' || v === 'true' || v === '') return true;
  if (!warnedInvalidJson) {
    console.warn(
      '[faq-assistant] Invalid FAQ_ASSISTANT_JSON_MODE; expected 0, 1, true, or false. Defaulting to JSON mode.'
    );
    warnedInvalidJson = true;
  }
  return true;
}

type TokenizeResult = { words: string[]; years: string[]; digitRuns: string[] };

function tokenizeForConsistency(text: string): TokenizeResult {
  const n = normalizeFaqText(text);
  const words = n
    .split(/\s+/)
    .map((w) => w.replace(/[^a-z0-9]/g, ''))
    .filter((w) => w.length >= 3);
  const years = n.match(/\b(19|20)\d{2}\b/g) ?? [];
  const digitRuns = n.match(/\d{3,}/g) ?? [];
  return { words, years, digitRuns };
}

/**
 * Słaba heurystyka spójności z oficjalnym FAQ — w razie wątpliwości: false (bezpieczniej zwrócić katalog).
 */
export function isAnswerConsistentWithCatalog(llmAnswer: string, catalogHint: string): boolean {
  if (!llmAnswer.trim() || !catalogHint.trim()) return false;
  if (catalogHint.length > 80 && llmAnswer.length < 25) return false;

  const A = tokenizeForConsistency(llmAnswer);
  const H = tokenizeForConsistency(catalogHint);
  if (H.words.length > 0) {
    const setA = new Set(A.words);
    const matched = H.words.filter((w) => setA.has(w));
    const need = H.words.length >= 8 ? Math.max(2, Math.ceil(H.words.length * 0.18)) : Math.max(1, Math.ceil(H.words.length * 0.35));
    if (matched.length < need) return false;
  }
  for (const y of H.years) {
    if (!llmAnswer.includes(y)) return false;
  }
  for (const run of H.digitRuns) {
    const compact = run.replace(/\s/g, '');
    const ans = llmAnswer.replace(/\s/g, '');
    if (!ans.includes(compact)) return false;
  }
  return true;
}

export function parseFaqLlmJson(raw: string): { answer: string; decline: boolean } | null {
  const t = raw.trim();
  if (!t) return null;
  let jsonStr = t;
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) jsonStr = fence[1]!.trim();
  try {
    const o = JSON.parse(jsonStr) as { answer?: unknown; decline?: unknown };
    if (o.decline === true) {
      return { answer: '', decline: true };
    }
    if (typeof o.answer !== 'string' || !o.answer.trim()) return null;
    return { answer: o.answer.trim().slice(0, 4000), decline: false };
  } catch {
    return null;
  }
}

function parseLlmResponseBody(content: string, jsonMode: boolean): { answer: string; decline: boolean } | null {
  if (jsonMode) {
    return parseFaqLlmJson(content);
  }
  if (!content.trim()) return null;
  return { answer: content.trim().slice(0, 4000), decline: false };
}

export type FaqLlmResult =
  | { kind: 'answer'; text: string }
  | { kind: 'decline' }
  | { kind: 'unavailable' };

/**
 * OpenAI: kilka modeli (fallback przy błędzie HTTP/timeout) + JSON lub tekst.
 * Budżet murowy — żeby zwrócić JSON (katalog/LLM) przed `maxDuration` w route, a nie 504.
 */
const FAQ_LLM_WALL_BUDGET_MS = 45_000;

export async function callFaqLlm(
  input: { question: string; catalogHint: string | null },
  apiKey: string
): Promise<FaqLlmResult> {
  const jsonMode = getFaqJsonObjectMode();
  const timeoutMs = getFaqLlmTimeoutMs();
  const userContent = buildFaqUserContent(input.question, input.catalogHint, jsonMode);
  const systemBase = buildFaqSystemPrompt();
  const system = jsonMode
    ? `${systemBase}\n\n${JSON_INSTRUCTION}\nJęzyk: polski. Format odpowiedzi: JSON.`
    : `${systemBase}\n\nPriorytet: odpowiadaj jak asystent AI produktu. Gdy dostaniesz blok [Oficjalna odpowiedź z FAQ], musi on być zgodny z faktami — nie przeczyń treści FAQ.`;

  const wallEnd = Date.now() + FAQ_LLM_WALL_BUDGET_MS;

  for (const model of getFaqModelChain()) {
    if (Date.now() > wallEnd) {
      return { kind: 'unavailable' };
    }
    const preferMct = modelPrefersMaxCompletionTokens(model);
    const allowTemp = !modelOmitTemperature(model);
    const rawAttempts: Array<{
      useMaxCompletionTokens: boolean;
      includeTemperature: boolean;
      useJsonObjectFormat: boolean;
    }> = [
      { useMaxCompletionTokens: preferMct, includeTemperature: allowTemp, useJsonObjectFormat: jsonMode },
      { useMaxCompletionTokens: true, includeTemperature: allowTemp, useJsonObjectFormat: jsonMode },
      { useMaxCompletionTokens: true, includeTemperature: false, useJsonObjectFormat: jsonMode },
      { useMaxCompletionTokens: true, includeTemperature: false, useJsonObjectFormat: false },
    ];
    const seen = new Set<string>();
    const attempts = rawAttempts.filter((a) => {
      const k = `${a.useMaxCompletionTokens}/${a.includeTemperature}/${a.useJsonObjectFormat}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });

    for (const a of attempts) {
      if (Date.now() > wallEnd) {
        return { kind: 'unavailable' };
      }
      const remaining = Math.max(1_000, wallEnd - Date.now());
      const perAttemptTimeout = Math.min(timeoutMs, remaining);

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), perAttemptTimeout);
      let response: Response;
      const requestBody: Record<string, unknown> = {
        model,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: userContent },
        ],
      };
      if (a.includeTemperature) {
        requestBody.temperature = 0.2;
      }
      if (a.useMaxCompletionTokens) {
        requestBody.max_completion_tokens = 500;
      } else {
        requestBody.max_tokens = 500;
      }
      if (a.useJsonObjectFormat) {
        requestBody.response_format = { type: 'json_object' };
      }

      try {
        response = await fetch(`${getOpenAIV1BaseUrl()}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal,
        });
      } catch {
        clearTimeout(timeout);
        continue;
      } finally {
        clearTimeout(timeout);
      }

      if (!response.ok) {
        const err = await response.text().catch(() => '');
        console.warn(
          `[faq-assistant] OpenAI error model=${model} status=${response.status} body=${err.slice(0, 220)}`
        );
        continue;
      }

      const payload = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
      const raw = payload.choices?.[0]?.message?.content?.trim() ?? '';
      const useJsonParser = a.useJsonObjectFormat;
      const parsed = parseLlmResponseBody(raw, useJsonParser);
      if (!parsed) {
        if (useJsonParser) {
          const relaxed = parseLlmResponseBody(raw, false);
          if (relaxed && !relaxed.decline && relaxed.answer.trim()) {
            return { kind: 'answer', text: relaxed.answer };
          }
          console.warn(`[faq-assistant] Unparseable JSON from model=${model} — trying next if any.`);
        }
        continue;
      }
      if (parsed.decline) {
        return { kind: 'decline' };
      }
      if (!parsed.answer.trim()) {
        continue;
      }
      return { kind: 'answer', text: parsed.answer };
    }
  }

  return { kind: 'unavailable' };
}

function buildFaqUserContent(question: string, catalogHint: string | null, jsonMode: boolean): string {
  const hintBlock =
    catalogHint && catalogHint.length > 0
      ? `\n\n[Oficjalna odpowiedź z FAQ produktu — zachowaj zgodność faktów; możesz skrócić lub przeformułować po polsku, max 4 zdania:]\n${catalogHint}`
      : '';
  const base = `${question}${hintBlock}`;
  return jsonMode ? `${base}\n\nOdpowiedz wyłącznie jednym obiektem JSON zgodnie z instrukcją systemową.` : base;
}
