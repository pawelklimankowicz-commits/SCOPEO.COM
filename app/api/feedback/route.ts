import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { runWithRlsBypass, runWithTenantRls } from '@/lib/tenant-rls-context';
import { checkRateLimit, getClientIp } from '@/lib/security';
import { logger } from '@/lib/logger';
import { draftTechnicalTaskFromFeedback } from '@/lib/feedback-task-llm';

const postSchema = z.object({
  category: z.enum(['BUG', 'FEATURE', 'UX', 'DATA', 'INTEGRATION', 'OTHER']),
  userTitle: z.string().min(3).max(200),
  userDescription: z.string().min(10).max(8000),
  pageContext: z.string().max(500).optional().nullable(),
});

const selectPublic = {
  id: true,
  category: true,
  userTitle: true,
  userDescription: true,
  pageContext: true,
  status: true,
  technicalTaskTitle: true,
  technicalTaskBody: true,
  technicalLabels: true,
  llmError: true,
  submitterName: true,
  submitterEmail: true,
  createdAt: true,
} satisfies Prisma.ProductUserFeedbackSelect;

async function loadSessionTenant() {
  const session = await auth();
  if (!session?.user) return null;
  const organizationId =
    (session as { activeOrganizationId?: string }).activeOrganizationId ||
    (session as { organizationId?: string }).organizationId ||
    (session.user as { organizationId?: string }).organizationId;
  if (!organizationId) return null;
  const userId = session.user.id as string;
  const membership = await runWithRlsBypass(() =>
    prisma.membership.findFirst({
      where: { userId, organizationId, status: 'ACTIVE' },
      include: { organization: true },
    })
  );
  if (!membership) return null;
  return { session, membership, organizationId, userId };
}

export async function GET() {
  try {
    const t = await loadSessionTenant();
    if (!t) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }
    const items = await runWithTenantRls(
      { userId: t.userId, organizationId: t.organizationId },
      () =>
        prisma.productUserFeedback.findMany({
          where: { organizationId: t.organizationId },
          orderBy: { createdAt: 'desc' },
          take: 80,
          select: selectPublic,
        })
    );
    return NextResponse.json({ ok: true, items });
  } catch (error) {
    logger.error({
      context: 'feedback',
      message: 'GET failed',
      error: error instanceof Error ? error.message : 'Unknown',
    });
    return NextResponse.json({ ok: false, error: 'Nie udało się wczytać zgłoszeń.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);
  const t = await loadSessionTenant();
  if (!t) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const limit = await checkRateLimit(`product-feedback:${t.organizationId}:${t.userId}`, {
    windowMs: 3_600_000,
    maxRequests: 12,
  });
  if (!limit.ok) {
    return NextResponse.json(
      { ok: false, error: 'Zbyt wiele zgłoszeń. Spróbuj później.' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSec) } }
    );
  }

  let body: z.infer<typeof postSchema>;
  try {
    body = postSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ ok: false, error: 'Nieprawidłowa treść zgłoszenia.' }, { status: 400 });
  }

  const submitterName = (t.session.user.name as string | null | undefined) ?? null;
  const submitterEmail = t.session.user.email as string;

  const created = await runWithTenantRls(
    { userId: t.userId, organizationId: t.organizationId },
    () =>
      prisma.productUserFeedback.create({
        data: {
          organizationId: t.organizationId,
          userId: t.userId,
          submitterName,
          submitterEmail,
          category: body.category,
          userTitle: body.userTitle,
          userDescription: body.userDescription,
          pageContext: body.pageContext?.trim() || null,
        },
        select: { id: true },
      })
  );

  const llm = await draftTechnicalTaskFromFeedback({
    category: body.category,
    userTitle: body.userTitle,
    userDescription: body.userDescription,
    pageContext: body.pageContext?.trim() || null,
  });

  if ('draft' in llm) {
    await runWithTenantRls({ userId: t.userId, organizationId: t.organizationId }, () =>
      prisma.productUserFeedback.update({
        where: { id: created.id },
        data: {
          technicalTaskTitle: llm.draft.taskTitle,
          technicalTaskBody: llm.draft.taskBody,
          technicalLabels: llm.draft.labels,
          llmError: null,
        },
      })
    );
  } else {
    await runWithTenantRls({ userId: t.userId, organizationId: t.organizationId }, () =>
      prisma.productUserFeedback.update({
        where: { id: created.id },
        data: { llmError: llm.error },
      })
    );
  }

  const full = await runWithTenantRls({ userId: t.userId, organizationId: t.organizationId }, () =>
    prisma.productUserFeedback.findUnique({
      where: { id: created.id },
      select: selectPublic,
    })
  );

  const inbox = process.env.FEEDBACK_INBOX_EMAIL?.trim();
  const fromEmail = process.env.FEEDBACK_FROM_EMAIL?.trim() || process.env.LEADS_FROM_EMAIL?.trim();
  const resendKey = process.env.RESEND_API_KEY?.trim();
  if (inbox && fromEmail && resendKey) {
    const org = t.membership.organization;
    const lines = [
      `ID: ${created.id}`,
      `Organizacja: ${org.name} (${t.organizationId})`,
      `Zgłaszający: ${submitterName || '-'} <${submitterEmail}>`,
      `Kategoria: ${body.category}`,
      `Tytuł: ${body.userTitle}`,
      `IP: ${ip === 'unknown' ? '-' : ip}`,
      ``,
      `--- Treść użytkownika ---`,
      body.userDescription,
      ``,
      `Ścieżka UI: ${body.pageContext || '-'}`,
    ];
    if (full?.technicalTaskTitle) {
      lines.push(``, `--- Szkic zadania (LLM) ---`, full.technicalTaskTitle, ``, full.technicalTaskBody || '');
    }
    if (full?.llmError) {
      lines.push(``, `Błąd LLM: ${full.llmError}`);
    }

    const resend = new Resend(resendKey);
    void resend.emails
      .send({
        from: fromEmail,
        to: inbox,
        replyTo: submitterEmail,
        subject: `[Scopeo] ${body.category}: ${body.userTitle.slice(0, 80)}`,
        text: lines.join('\n'),
      })
      .then((r) => {
        if (r.error) {
          logger.error({
            context: 'feedback',
            message: 'Resend failed',
            error: r.error.message,
          });
        }
      })
      .catch((e) => {
        logger.error({
          context: 'feedback',
          message: 'Resend failed',
          error: e instanceof Error ? e.message : 'Unknown',
        });
      });
  }

  return NextResponse.json({ ok: true, item: full });
}
