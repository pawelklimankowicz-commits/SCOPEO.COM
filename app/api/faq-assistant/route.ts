import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/** LLM + kilka modeli/ponowień — domyślny limit Vercel (10–15s) tnie odpowiedź w połowie. */
export const maxDuration = 60;
import { checkRateLimit, getClientIp } from '@/lib/security';
import { findFaqIntent, normalizeFaqText } from '@/lib/faq-assistant';
import { callFaqLlm, isAnswerConsistentWithCatalog } from '@/lib/faq-assistant-llm';
import { FAQ_ASSISTANT_GENERIC, resolveFaqFromCatalog } from '@/lib/faq-assistant-resolve';
import { createHash } from 'node:crypto';

function hashIp(ip: string) {
  return createHash('sha256').update(ip).digest('hex');
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
    let source: 'llm' | 'catalog' | 'catalog_relaxed' | 'generic' | 'fallback' | 'llm_guard' = 'generic';

    try {
      const apiKey = process.env.OPENAI_API_KEY?.trim();
      if (apiKey) {
        const llm = await callFaqLlm({ question, catalogHint }, apiKey);
        if (llm.kind === 'decline') {
          if (catalogResolved) {
            answer = catalogResolved.answer;
            source = catalogResolved.tier === 'relaxed' ? 'catalog_relaxed' : 'catalog';
          } else {
            answer = FAQ_ASSISTANT_GENERIC;
            source = 'generic';
          }
        } else if (llm.kind === 'answer') {
          const needGuard = Boolean(catalogHint && catalogHint.length > 0);
          if (needGuard && !isAnswerConsistentWithCatalog(llm.text, catalogHint!) && catalogResolved) {
            answer = catalogResolved.answer;
            source = 'llm_guard';
          } else {
            answer = llm.text;
            source = 'llm';
          }
        } else if (catalogResolved) {
          answer = catalogResolved.answer;
          source = catalogResolved.tier === 'relaxed' ? 'catalog_relaxed' : 'catalog';
        } else {
          answer = FAQ_ASSISTANT_GENERIC;
          source = 'generic';
        }
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
