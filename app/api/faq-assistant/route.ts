import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { checkRateLimit, getClientIp } from '@/lib/security';
import { buildFaqSystemPrompt, findFaqIntent, normalizeFaqText } from '@/lib/faq-assistant';
import { FAQ_ASSISTANT_GENERIC, resolveFaqFromCatalog } from '@/lib/faq-assistant-resolve';
import { createHash } from 'node:crypto';

function hashIp(ip: string) {
  return createHash('sha256').update(ip).digest('hex');
}

async function generateLlmAnswer(question: string, catalogHint: string | null) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const userContent =
    catalogHint && catalogHint.length > 0
      ? `${question}\n\n[Oficjalna odpowiedź z FAQ produktu — zachowaj zgodność faktów; możesz skrócić lub przeformułować po polsku, max 4 zdania:]\n${catalogHint}`
      : question;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 14_000);
  let response: Response;
  try {
    response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.FAQ_ASSISTANT_MODEL || 'gpt-4o-mini',
        temperature: 0.25,
        max_tokens: 400,
        messages: [
          {
            role: 'system',
            content: `${buildFaqSystemPrompt()}\n\nPriorytet: odpowiadaj jak asystent AI produktu. Gdy dostaniesz blok [Oficjalna odpowiedź z FAQ], musi on być zgodny z faktami — nie przeczyń treści FAQ.`,
          },
          { role: 'user', content: userContent },
        ],
      }),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) return null;
  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = payload.choices?.[0]?.message?.content?.trim();
  return content || null;
}

export async function POST(req: NextRequest) {
  const startMs = Date.now();
  try {
    const ip = getClientIp(req.headers);
    const session = await auth();
    const organizationId = (session?.user as { organizationId?: string } | undefined)?.organizationId ?? null;
    const limit = await checkRateLimit(`faq-assistant:${organizationId ?? 'anon'}:${ip}`, {
      windowMs: 60_000,
      maxRequests: 24,
    });
    if (!limit.ok) {
      return NextResponse.json(
        { ok: false, error: 'Too many requests' },
        { status: 429, headers: { 'Retry-After': String(limit.retryAfterSec) } }
      );
    }

    const body = await req.json().catch(() => ({}));
    const question = String(body?.question ?? '').trim();
    const sessionIdRaw = String(body?.sessionId ?? '').trim();
    const sessionId = sessionIdRaw ? sessionIdRaw.slice(0, 120) : null;

    if (question.length < 3) {
      return NextResponse.json({ ok: false, error: 'Question is too short' }, { status: 400 });
    }

    const normalizedQuestion = normalizeFaqText(question);
    const catalogResolved = resolveFaqFromCatalog(question);
    const catalogHint = catalogResolved?.answer ?? null;
    /** Dopasowanie do logów — preferuj strict intent, inaczej relaxed. */
    const matchedIntent = findFaqIntent(question)?.id ?? catalogResolved?.matchedIntent ?? null;

    let answer: string;
    let source: 'llm' | 'catalog' | 'catalog_relaxed' | 'generic' | 'fallback' = 'generic';

    try {
      const llmAnswer = await generateLlmAnswer(question, catalogHint);
      if (llmAnswer) {
        answer = llmAnswer;
        source = 'llm';
      } else if (catalogResolved) {
        answer = catalogResolved.answer;
        source = catalogResolved.tier === 'relaxed' ? 'catalog_relaxed' : 'catalog';
      } else {
        answer = FAQ_ASSISTANT_GENERIC;
        source = 'generic';
      }
    } catch {
      if (catalogResolved) {
        answer = catalogResolved.answer;
        source = catalogResolved.tier === 'relaxed' ? 'catalog_relaxed' : 'catalog';
      } else {
        answer = FAQ_ASSISTANT_GENERIC;
        source = 'fallback';
      }
    }

    const responseMs = Date.now() - startMs;

    try {
      await prisma.faqAssistantQuery.create({
        data: {
          organizationId,
          sessionId,
          question,
          normalizedQuestion,
          answerPreview: answer.slice(0, 500),
          source,
          matchedIntent,
          responseMs,
          ipHash: hashIp(ip),
        },
      });
    } catch {
      // analytics must not block response
    }

    return NextResponse.json({
      ok: true,
      answer,
      source,
      matchedIntent,
      responseMs,
    });
  } catch (err) {
    console.error('[faq-assistant] POST', err);
    return NextResponse.json({
      ok: true,
      answer: FAQ_ASSISTANT_GENERIC,
      source: 'fallback' as const,
      matchedIntent: null,
      responseMs: Date.now() - startMs,
    });
  }
}

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }
  const role = (session.user as { role?: string }).role;
  if (role !== 'OWNER' && role !== 'ADMIN') {
    return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
  }
  const organizationId = (session.user as { organizationId?: string }).organizationId as string;

  const topQuestions = await prisma.faqAssistantQuery.groupBy({
    by: ['normalizedQuestion'],
    where: { organizationId },
    _count: { normalizedQuestion: true },
    orderBy: { _count: { normalizedQuestion: 'desc' } },
    take: 15,
  });

  return NextResponse.json({
    ok: true,
    topQuestions: topQuestions.map((item) => ({
      normalizedQuestion: item.normalizedQuestion,
      count: item._count.normalizedQuestion,
    })),
  });
}
