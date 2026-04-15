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
    const normalizedContextNip = parsed.contextNip.replace(/\D/g, '');

    if (!parsed.skip) {
      const existingConnection = await prisma.ksefConnection.findFirst({
        where: { organizationId, taxId: normalizedContextNip },
        select: { id: true },
      });
      const legacyProfile = !existingConnection
        ? await prisma.carbonProfile.findUnique({
            where: { organizationId },
            select: { taxId: true, ksefTokenEncrypted: true },
          })
        : null;
      const sameLegacyConnection =
        Boolean(legacyProfile?.ksefTokenEncrypted) &&
        (legacyProfile?.taxId ?? '').replace(/\D/g, '') === normalizedContextNip;
      if (!existingConnection && !sameLegacyConnection) {
        await requireKsefCapacity(organizationId);
      }
      const encryptedToken = encryptKsefToken(parsed.ksefToken);
      await prisma.$transaction(async (tx) => {
        await tx.ksefConnection.upsert({
          where: {
            organizationId_taxId: {
              organizationId,
              taxId: normalizedContextNip,
            },
          },
          update: {
            label: 'Polaczenie onboarding',
            tokenEncrypted: encryptedToken,
            tokenMasked: `${parsed.ksefToken.slice(0, 4)}...${parsed.ksefToken.slice(-4)}`,
          },
          create: {
            organizationId,
            label: 'Polaczenie onboarding',
            taxId: normalizedContextNip,
            tokenEncrypted: encryptedToken,
            tokenMasked: `${parsed.ksefToken.slice(0, 4)}...${parsed.ksefToken.slice(-4)}`,
            isDefault: true,
          },
        });
        await tx.ksefConnection.updateMany({
          where: { organizationId, NOT: { taxId: normalizedContextNip } },
          data: { isDefault: false },
        });
      });
      await prisma.carbonProfile.upsert({
        where: { organizationId },
        update: {
          taxId: normalizedContextNip,
          // Legacy fallback fields (deprecated)
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
          taxId: normalizedContextNip,
          // Legacy fallback fields (deprecated)
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
