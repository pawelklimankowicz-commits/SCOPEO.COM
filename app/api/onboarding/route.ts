import { NextRequest, NextResponse } from 'next/server';
import { onboardingSchema } from '@/lib/schema';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { checkRateLimit, getClientIp } from '@/lib/security';
import { encryptKsefToken } from '@/lib/ksef-token-crypto';
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  const orgId = (session.user as any).organizationId as string;
  const ip = getClientIp(req.headers);
  const limit = checkRateLimit(`onboarding:${orgId}:${ip}`, { windowMs: 60_000, max: 20 });
  if (!limit.ok) {
    return NextResponse.json(
      { ok: false, error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSec) } }
    );
  }
  try {
    const body = await req.json();
    const parsed = onboardingSchema.parse(body);
    const encryptedToken = encryptKsefToken(parsed.ksefToken);
    const profile = await prisma.carbonProfile.upsert({ where: { organizationId: orgId }, update: { companyName: parsed.companyName, reportingYear: parsed.reportingYear, baseYear: parsed.baseYear, boundaryApproach: parsed.boundaryApproach, industry: parsed.industry, ksefTokenMasked: `${parsed.ksefToken.slice(0, 4)}...${parsed.ksefToken.slice(-4)}`, ksefTokenEncrypted: encryptedToken, supportsMarketBased: parsed.supportsMarketBased, hasGreenContracts: parsed.hasGreenContracts, businessTravelIncluded: parsed.businessTravelIncluded, employeeCommutingIncluded: parsed.employeeCommutingIncluded, notes: parsed.notes }, create: { organizationId: orgId, companyName: parsed.companyName, reportingYear: parsed.reportingYear, baseYear: parsed.baseYear, boundaryApproach: parsed.boundaryApproach, industry: parsed.industry, ksefTokenMasked: `${parsed.ksefToken.slice(0, 4)}...${parsed.ksefToken.slice(-4)}`, ksefTokenEncrypted: encryptedToken, supportsMarketBased: parsed.supportsMarketBased, hasGreenContracts: parsed.hasGreenContracts, businessTravelIncluded: parsed.businessTravelIncluded, employeeCommutingIncluded: parsed.employeeCommutingIncluded, notes: parsed.notes } });
    await prisma.organization.update({ where: { id: orgId }, data: { regionCode: 'PL' } });
    return NextResponse.json({ ok: true, profile });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 400 });
  }
}