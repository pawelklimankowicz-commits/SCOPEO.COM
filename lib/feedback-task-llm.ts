import { logger } from '@/lib/logger';

const DEFAULT_MODEL = 'gpt-4o-mini';
const TIMEOUT_MS = 25_000;

export type TechnicalTaskDraft = {
  taskTitle: string;
  taskBody: string;
  labels: string[];
};

function getModel(): string {
  return (process.env.FEEDBACK_LLM_MODEL || process.env.FAQ_ASSISTANT_MODEL || DEFAULT_MODEL).trim();
}

/**
 * Tłumaczy opis użytkownika na propozycję zadania technicznego dla backlogu.
 * Zwraca null przy braku klucza API lub błędzie modelu.
 */
export async function draftTechnicalTaskFromFeedback(input: {
  category: string;
  userTitle: string;
  userDescription: string;
  pageContext: string | null;
}): Promise<{ draft: TechnicalTaskDraft } | { error: string }> {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) {
    return { error: 'Brak OPENAI_API_KEY' };
  }

  const system =
    'Jesteś doświadczonym inżynierem oprogramowania w produkcie Scopeo (Next.js, Prisma, PostgreSQL, KSeF, raporty GHG). ' +
    'Odpowiadasz wyłącznie poprawnym JSON bez znaczników markdown.';

  const user = [
    'Przeanalizuj zgłoszenie użytkownika i zaproponuj zadanie techniczne do backlogu (tytuł, opis, etykiety).',
    `Kategoria: ${input.category}`,
    `Tytuł od użytkownika: ${input.userTitle}`,
    `Opis: ${input.userDescription}`,
    `Kontekst ekranu/ścieżka: ${input.pageContext || '—'}`,
    '',
    'Zwróć JSON: {"taskTitle": string (PL, max 120 znaków), "taskBody": string (PL, markdown, max ~2000 znaków: problem, proponowane kroki, AC, ewentualnie obszar modułów), "labels": string[] (2–5 tagów, lowercase, np. "api", "ksef", "ui", "prisma", "pdf")}.',
  ].join('\n');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: getModel(),
        temperature: 0.2,
        max_tokens: 2_000,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const t = await res.text().catch(() => '');
      return { error: `OpenAI HTTP ${res.status}: ${t.slice(0, 200)}` };
    }

    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const raw = data.choices?.[0]?.message?.content?.trim();
    if (!raw) {
      return { error: 'Pusta odpowiedź modelu' };
    }

    const parsed = JSON.parse(raw) as {
      taskTitle?: string;
      taskBody?: string;
      labels?: unknown;
    };

    const taskTitle = String(parsed.taskTitle || '').trim().slice(0, 200);
    const taskBody = String(parsed.taskBody || '').trim().slice(0, 8_000);
    const labels = Array.isArray(parsed.labels)
      ? parsed.labels
          .map((x) => String(x).toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))
          .filter(Boolean)
          .slice(0, 5)
      : [];

    if (!taskTitle || !taskBody) {
      return { error: 'Niepełna struktura JSON z modelu' };
    }

    return { draft: { taskTitle, taskBody, labels } };
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown';
    logger.warn({ context: 'feedback_task_llm', message: 'LLM failed', error: msg });
    return { error: msg };
  } finally {
    clearTimeout(timer);
  }
}
