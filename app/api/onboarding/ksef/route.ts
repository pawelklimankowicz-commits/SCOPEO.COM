import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { encryptKsefToken } from '@/lib/ksef-token-crypto';
import { prisma } from '@/lib/prisma';
import { onboardingKsefSchema } from '@/lib/schema';
import { requireKsefCapacity } from '@/lib/billing-guard';

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
    const parsed = onboardingKsefSchema.parse(body);

    if (!parsed.skip) {
      const existingProfile = await prisma.carbonProfile.findUnique({
        where: { organizationId },
        select: { taxId: true },
      });
      const creatingNewConnection = !existingProfile?.taxId;
      if (creatingNewConnection) {
        await requireKsefCapacity(organizationId);
      }
      const encryptedToken = encryptKsefToken(parsed.ksefToken);
      await prisma.carbonProfile.upsert({
        where: { organizationId },
        update: {
          taxId: parsed.contextNip,
          ksefTokenEncrypted: encryptedToken,
          ksefTokenMasked: `${parsed.ksefToken.slice(0, 4)}...${parsed.ksefToken.slice(-4)}`,
        },
        create: {
          organizationId,
          companyName: 'Organization',
          reportingYear: new Date().getFullYear(),
          baseYear: new Date().getFullYear(),
          boundaryApproach: 'operational_control',
          industry: 'Unspecified',
          taxId: parsed.contextNip,
          ksefTokenEncrypted: encryptedToken,
          ksefTokenMasked: `${parsed.ksefToken.slice(0, 4)}...${parsed.ksefToken.slice(-4)}`,
        },
      });
    }

    await prisma.organization.update({
      where: { id: organizationId },
      data: { onboardingStep: 3 },
    });

    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 400 }
    );
  }
}
