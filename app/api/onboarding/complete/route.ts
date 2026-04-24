import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { runWithTenantRls } from '@/lib/tenant-rls-context';

function isPrivilegedRole(role?: string | null) {
  return role === 'OWNER' || role === 'ADMIN';
}

export async function POST(_req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }
  const role = (session.user as any).role as string | undefined;
  if (!isPrivilegedRole(role)) {
    return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
  }
  const organizationId = (session.user as any).organizationId as string;
  const userId = session.user.id as string;

  await runWithTenantRls({ userId, organizationId }, async () => {
    await prisma.organization.update({
      where: { id: organizationId },
      data: {
        onboardingStep: 4,
        onboardingCompletedAt: new Date(),
      },
    });
    await prisma.journeyEvent.create({
      data: {
        source: 'APP',
        name: 'app.onboarding_completed',
        userId,
        organizationId,
        path: '/onboarding/complete',
        properties: { step: 4 as const },
      },
    });
  });

  return NextResponse.json({ ok: true, redirectTo: '/dashboard', requiresSessionRefresh: true });
}
