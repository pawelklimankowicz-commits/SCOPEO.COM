import { renderToBuffer } from '@react-pdf/renderer';
import { PrismaClient } from '@prisma/client';
import { GhgReportDocument } from '@/lib/ghg-report-pdf';
import { calculateOrganizationEmissions } from '@/lib/emissions';
import fs from 'node:fs/promises';
import path from 'node:path';
import React from 'react';

const prisma = new PrismaClient();

function stamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

async function main() {
  const token = stamp();
  const companyName = `Firma Testowa ESG ${token.slice(0, 10)}`;
  const slug = `firma-testowa-esg-${token.toLowerCase()}`.replace(/[^a-z0-9-]/g, '-');
  const email = `test-esg-${token.toLowerCase()}@scopeo.local`;
  const reportYear = new Date().getFullYear();
  const issueDate = new Date(`${reportYear}-03-15T00:00:00.000Z`);

  const user = await prisma.user.create({
    data: {
      email,
      name: 'Uzytkownik Testowy ESG',
      passwordHash: 'test-only-hash',
    },
  });

  const organization = await prisma.organization.create({
    data: {
      name: companyName,
      slug,
      onboardingCompletedAt: new Date(),
      onboardingStep: 3,
      memberships: {
        create: {
          userId: user.id,
          role: 'OWNER',
          status: 'ACTIVE',
        },
      },
    },
  });

  await prisma.carbonProfile.create({
    data: {
      organizationId: organization.id,
      companyName,
      taxId: '5250000000',
      reportingYear: reportYear,
      baseYear: reportYear - 1,
      boundaryApproach: 'operational_control',
      industry: 'Uslugi profesjonalne',
      ksefTokenMasked: '********',
    },
  });

  const source = await prisma.emissionSource.create({
    data: {
      organizationId: organization.id,
      code: `TEST_SRC_${token}`,
      name: 'Testowy zestaw faktorow',
      publisher: 'Scopeo QA',
      methodology: 'GHG Protocol',
      version: '1.0',
      validFromYear: reportYear,
      region: 'PL',
    },
  });

  const factor = await prisma.emissionFactor.create({
    data: {
      organizationId: organization.id,
      emissionSourceId: source.id,
      code: `TEST_FACTOR_${token}`,
      name: 'Energia elektryczna test',
      scope: 'SCOPE2',
      categoryCode: 'scope2_electricity',
      factorValue: 0.7309,
      factorUnit: 'kgCO2e/kWh',
      year: reportYear,
      region: 'PL',
      regionPriority: 1,
      activityKind: 'electricity_kwh',
    },
  });

  const invoice = await prisma.invoice.create({
    data: {
      organizationId: organization.id,
      externalId: `TEST-INV-${token}`,
      number: `FV/TEST/${token.slice(0, 8)}`,
      issueDate,
      currency: 'PLN',
      netValue: 15000,
      grossValue: 18450,
      rawPayload: '<xml>test</xml>',
      lines: {
        create: [
          {
            description: 'Zuzycie energii elektrycznej biuro',
            netValue: 15000,
            currency: 'PLN',
            scope: 'SCOPE2',
            categoryCode: 'scope2_electricity',
            calculationMethod: 'ACTIVITY',
            activityValue: 12000,
            activityUnit: 'kWh',
            emissionFactorId: factor.id,
          },
        ],
      },
    },
    include: { lines: true },
  });

  const result = await calculateOrganizationEmissions(organization.id, reportYear, { persist: false });

  const doc = (
    <GhgReportDocument
      data={{
        companyName,
        reportingYear: reportYear,
        baseYear: reportYear - 1,
        boundaryApproach: 'operational_control',
        industry: 'Uslugi profesjonalne',
        scope1: result.scope1,
        scope2: result.scope2,
        scope3: result.scope3,
        totalKg: result.totalKg,
        byCategory: result.byCategory,
        linesCount: result.lineCount,
        generatedAt: new Date().toLocaleDateString('pl-PL'),
      }}
    />
  );

  const pdfBuffer = await renderToBuffer(doc);
  const outDir = path.join(process.cwd(), 'reports');
  await fs.mkdir(outDir, { recursive: true });
  const outPath = path.join(outDir, `raport-esg-test-${token}.pdf`);
  await fs.writeFile(outPath, pdfBuffer);

  console.log(`REPORT_PATH=${outPath}`);
  console.log(`ORG_ID=${organization.id}`);
  console.log(`USER_EMAIL=${user.email}`);
  console.log(`INVOICE_ID=${invoice.id}`);
  console.log(`TOTAL_KG=${result.totalKg.toFixed(2)}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
