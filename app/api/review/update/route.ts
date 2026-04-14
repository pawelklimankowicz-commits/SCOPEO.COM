import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { reviewUpdateSchema } from '@/lib/schema';
import { ensureAllowedTransition, reviewActionFromStatus, buildDiff } from '@/lib/review-workflow';
import { checkRateLimit, getClientIp } from '@/lib/security';
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  const organizationId = (session.user as any).organizationId as string;
  const ip = getClientIp(req.headers);
  const limit = checkRateLimit(`review-update:${organizationId}:${ip}`, { windowMs: 60_000, max: 60 });
  if (!limit.ok) {
    return NextResponse.json(
      { ok: false, error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSec) } }
    );
  }
  try {
    const body = await req.json();
    const parsed = reviewUpdateSchema.parse(body);
    const line = await prisma.invoiceLine.findUnique({ where: { id: parsed.lineId }, include: { mappingDecision: true } });
    if (!line?.mappingDecisionId || !line.mappingDecision) return NextResponse.json({ ok: false, error: 'No mapping decision' }, { status: 404 });
    const actorRole = ((session.user as any).role || 'VIEWER') as any;
    const before = { status: line.mappingDecision.status, categoryCode: line.overrideCategoryCode ?? line.categoryCode, factorId: line.overrideFactorId ?? line.emissionFactorId, comment: line.mappingDecision.reviewerComment, assigneeUserId: line.mappingDecision.currentAssigneeId };
    const after = { status: parsed.status, categoryCode: parsed.overrideCategoryCode ?? before.categoryCode, factorId: parsed.overrideFactorId ?? before.factorId, comment: parsed.comment ?? before.comment, assigneeUserId: parsed.assigneeUserId ?? before.assigneeUserId };
    ensureAllowedTransition({ currentStatus: before.status as any, nextStatus: after.status as any, actorRole, hasOverride: before.categoryCode !== after.categoryCode || before.factorId !== after.factorId });
    const updatedDecision = await prisma.mappingDecision.update({ where: { id: line.mappingDecisionId }, data: { status: parsed.status, reviewerComment: parsed.comment ?? null, currentAssigneeId: parsed.assigneeUserId ?? null } });
    const updatedLine = await prisma.invoiceLine.update({ where: { id: parsed.lineId }, data: { overrideCategoryCode: parsed.overrideCategoryCode ?? line.overrideCategoryCode ?? null, overrideFactorId: parsed.overrideFactorId ?? line.overrideFactorId ?? null }, include: { emissionFactor: true, mappingDecision: true } });
    const diff = buildDiff(before, after);
    await prisma.reviewEvent.create({ data: { organizationId: line.mappingDecision.organizationId, mappingDecisionId: line.mappingDecisionId, actorUserId: session.user.id as string, actorRole, action: reviewActionFromStatus(parsed.status as any) as any, fromStatus: before.status as any, toStatus: after.status as any, fromCategoryCode: before.categoryCode, toCategoryCode: after.categoryCode, fromFactorId: before.factorId, toFactorId: after.factorId, diffJson: JSON.stringify(diff), comment: parsed.comment ?? null } });
    return NextResponse.json({ ok: true, line: updatedLine, decision: updatedDecision, diff });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 400 });
  }
}