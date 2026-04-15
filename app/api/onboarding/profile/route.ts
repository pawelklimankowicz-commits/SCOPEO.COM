import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { onboardingProfileSchema } from '@/lib/schema';

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
    const parsed = onboardingProfileSchema.parse(body);
    const taxId = parsed.taxId ? parsed.taxId.trim() : '';
    const profile = await prisma.carbonProfile.upsert({
      where: { organizationId },
      update: {
        companyName: parsed.companyName,
        taxId: taxId || null,
        reportingYear: parsed.reportingYear,
        baseYear: parsed.reportingYear,
        notes: JSON.stringify({
          address: {
            street: parsed.addressStreet,
            postalCode: parsed.addressPostalCode,
            city: parsed.addressCity,
          },
        }),
      },
      create: {
        organizationId,
        companyName: parsed.companyName,
        taxId: taxId || null,
        reportingYear: parsed.reportingYear,
        baseYear: parsed.reportingYear,
        boundaryApproach: 'operational_control',
        industry: 'Unspecified',
        ksefTokenMasked: '',
        notes: JSON.stringify({
          address: {
            street: parsed.addressStreet,
            postalCode: parsed.addressPostalCode,
            city: parsed.addressCity,
          },
        }),
      },
    });

    await prisma.organization.update({
      where: { id: organizationId },
      data: { name: parsed.companyName, onboardingStep: 1 },
    });

    return NextResponse.json({ ok: true, profile });
  } catch (error: unknown) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 400 }
    );
  }
}
