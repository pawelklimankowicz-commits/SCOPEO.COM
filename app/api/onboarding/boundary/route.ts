import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { onboardingBoundarySchema } from '@/lib/schema';

function isPrivilegedRole(role?: string | null) {
  return role === 'OWNER' || role === 'ADMIN';
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }
  const role = (session.user as any).role as string | undefined;
  if (!isPrivilegedRole(role)) {
    return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
  }
  const organizationId = (session.user as any).organizationId as string;

  try {
    const body = await req.json();
    const parsed = onboardingBoundarySchema.parse(body);

    const profile = await prisma.carbonProfile.upsert({
      where: { organizationId },
      update: {
        industry: parsed.industry,
        boundaryApproach: parsed.boundaryApproach,
        businessTravelIncluded: parsed.includeScope3,
        employeeCommutingIncluded: parsed.includeScope3,
      },
      create: {
        organizationId,
        companyName: 'Organization',
        reportingYear: new Date().getFullYear(),
        baseYear: new Date().getFullYear(),
        boundaryApproach: parsed.boundaryApproach,
        industry: parsed.industry,
        ksefTokenMasked: '',
        businessTravelIncluded: parsed.includeScope3,
        employeeCommutingIncluded: parsed.includeScope3,
      },
    });

    await prisma.organization.update({
      where: { id: organizationId },
      data: { onboardingStep: 2 },
    });

    return NextResponse.json({ ok: true, profile });
  } catch (error: unknown) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 400 }
    );
  }
}
