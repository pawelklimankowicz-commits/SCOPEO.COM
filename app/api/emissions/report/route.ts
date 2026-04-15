import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import React from 'react';
import { auth } from '@/lib/auth';
import { calculateOrganizationEmissions } from '@/lib/emissions';
import { GhgReportDocument } from '@/lib/ghg-report-pdf';
import { prisma } from '@/lib/prisma';
import { checkRateLimit, getClientIp } from '@/lib/security';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const organizationId = (session.user as any).organizationId as string;
  const ip = getClientIp(req.headers);
  const rl = await checkRateLimit(`ghg-report:${organizationId}:${ip}`, { windowMs: 5 * 60_000, maxRequests: 5 });
  if (!rl.ok) {
    return NextResponse.json({ ok: false, error: 'Too many requests' }, { status: 429 });
  }

  const reportYear = Number(req.nextUrl.searchParams.get('year'));
  const validYear = Number.isFinite(reportYear) && reportYear >= 2020 && reportYear <= 2100 ? reportYear : undefined;

  const [profile, result] = await Promise.all([
    prisma.carbonProfile.findUnique({ where: { organizationId } }),
    calculateOrganizationEmissions(organizationId, validYear, { persist: false }),
  ]);

  if (!profile) {
    return NextResponse.json(
      { ok: false, error: 'Profil organizacji nie jest skonfigurowany.' },
      { status: 400 }
    );
  }

  const pdfBuffer = await renderToBuffer(
    React.createElement(GhgReportDocument, {
      data: {
        companyName: profile.companyName,
        reportingYear: validYear ?? profile.reportingYear,
        baseYear: profile.baseYear,
        boundaryApproach: profile.boundaryApproach,
        industry: profile.industry,
        scope1: result.scope1,
        scope2: result.scope2,
        scope3: result.scope3,
        totalKg: result.totalKg,
        byCategory: result.byCategory,
        linesCount: result.lineCount,
        generatedAt: new Date().toLocaleDateString('pl-PL'),
      },
    })
  );

  const filename = `raport-ghg-${profile.companyName
    .replace(/\s+/g, '-')
    .toLowerCase()}-${validYear ?? profile.reportingYear}.pdf`;

  return new NextResponse(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
