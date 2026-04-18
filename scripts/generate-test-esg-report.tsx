import { renderToBuffer } from '@react-pdf/renderer';
import { PrismaClient } from '@prisma/client';
import { buildGhgReportDocumentData } from '@/lib/ghg-report-document-data';
import { GhgReportDocument } from '@/lib/ghg-report-pdf';
import { calculateOrganizationEmissions } from '@/lib/emissions';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import React from 'react';

const prisma = new PrismaClient();

function stamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

/** 11 roznych kategorii + 11 linii faktury = 11 pozycji evidence (jak wymagany raport). */
const ELEVEN_LINE_SEED: Array<{
  scope: 'SCOPE1' | 'SCOPE2' | 'SCOPE3';
  categoryCode: string;
  description: string;
  activityValue: number;
  activityUnit: string;
  factorValue: number;
  netValue: number;
}> = [
  { scope: 'SCOPE1', categoryCode: 'scope1_fuel', description: 'Olej napedowy — flota', activityValue: 420, activityUnit: 'l', factorValue: 2.51, netValue: 8400 },
  { scope: 'SCOPE1', categoryCode: 'scope1_fuel_gas', description: 'Gaz ziemny — cieplo', activityValue: 9500, activityUnit: 'kWh', factorValue: 0.202, netValue: 6200 },
  { scope: 'SCOPE2', categoryCode: 'scope2_electricity', description: 'Energia elektryczna — biuro', activityValue: 12000, activityUnit: 'kWh', factorValue: 0.7309, netValue: 15000 },
  { scope: 'SCOPE2', categoryCode: 'scope2_district_heat', description: 'Cieplo sieciowe', activityValue: 180, activityUnit: 'GJ', factorValue: 55.0, netValue: 9000 },
  { scope: 'SCOPE3', categoryCode: 'scope3_cat1_purchased_services', description: 'Uslugi IT (upstream)', activityValue: 1, activityUnit: 'usl.', factorValue: 180.0, netValue: 12000 },
  { scope: 'SCOPE3', categoryCode: 'scope3_cat1_purchased_goods', description: 'Materialy biurowe', activityValue: 1, activityUnit: 'usl.', factorValue: 95.0, netValue: 8000 },
  { scope: 'SCOPE3', categoryCode: 'scope3_cat2_capital_goods', description: 'Sprzet IT kapitalowy', activityValue: 1, activityUnit: 'usl.', factorValue: 120.0, netValue: 22000 },
  { scope: 'SCOPE3', categoryCode: 'scope3_cat4_transport', description: 'Transport upstream', activityValue: 1, activityUnit: 'usl.', factorValue: 65.0, netValue: 5500 },
  { scope: 'SCOPE3', categoryCode: 'scope3_cat5_waste', description: 'Odpady komunalne', activityValue: 1, activityUnit: 'usl.', factorValue: 42.0, netValue: 2100 },
  { scope: 'SCOPE3', categoryCode: 'scope3_cat6_business_travel', description: 'Podroze sluzbowe', activityValue: 1, activityUnit: 'usl.', factorValue: 78.0, netValue: 4300 },
  { scope: 'SCOPE3', categoryCode: 'scope3_cat3_fuel_energy', description: 'Energia paliwowa upstream', activityValue: 1, activityUnit: 'usl.', factorValue: 55.0, netValue: 3600 },
];

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
      supportsMarketBased: true,
      hasGreenContracts: true,
      reportTotalDisplayBasis: 'LB',
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

  const factorIds: string[] = [];
  for (let i = 0; i < ELEVEN_LINE_SEED.length; i++) {
    const row = ELEVEN_LINE_SEED[i];
    const activityKind =
      row.scope === 'SCOPE2' && row.categoryCode === 'scope2_electricity' ? 'electricity_kwh' : null;
    const f = await prisma.emissionFactor.create({
      data: {
        organizationId: organization.id,
        emissionSourceId: source.id,
        code: `TEST_F_${i}_${token.slice(0, 8)}`,
        name: row.description.slice(0, 80),
        scope: row.scope,
        categoryCode: row.categoryCode,
        factorValue: row.factorValue,
        factorUnit: 'kgCO2e/jednostka',
        year: reportYear,
        region: 'PL',
        regionPriority: i + 1,
        activityKind,
      },
    });
    factorIds.push(f.id);
  }

  const netSum = ELEVEN_LINE_SEED.reduce((s, r) => s + r.netValue, 0);
  const grossSum = Math.round(netSum * 1.23 * 100) / 100;

  const invoice = await prisma.invoice.create({
    data: {
      organizationId: organization.id,
      externalId: `TEST-INV-${token}`,
      number: `FV/TEST/${token.slice(0, 8)}`,
      issueDate,
      currency: 'PLN',
      netValue: netSum,
      grossValue: grossSum,
      rawPayload: '<xml>test</xml>',
      lines: {
        create: ELEVEN_LINE_SEED.map((row, i) => ({
          description: row.description,
          netValue: row.netValue,
          currency: 'PLN',
          scope: row.scope,
          categoryCode: row.categoryCode,
          calculationMethod: 'ACTIVITY' as const,
          activityValue: row.activityValue,
          activityUnit: row.activityUnit,
          emissionFactorId: factorIds[i],
        })),
      },
    },
    include: { lines: true },
  });

  const result = await calculateOrganizationEmissions(organization.id, reportYear, { persist: false });

  const carbonProfile = await prisma.carbonProfile.findUniqueOrThrow({
    where: { organizationId: organization.id },
  });

  const reportData = buildGhgReportDocumentData({
    profile: {
      companyName: carbonProfile.companyName,
      baseYear: carbonProfile.baseYear,
      boundaryApproach: carbonProfile.boundaryApproach,
      industry: carbonProfile.industry,
    },
    reportingYear: reportYear,
    computed: result,
    snapshot: null,
    latestBaseYearRecalculation: null,
    generatedAt: new Date().toLocaleDateString('pl-PL'),
  });

  const doc = <GhgReportDocument data={reportData} />;

  const pdfBuffer = await renderToBuffer(doc);
  const outDir = path.join(process.cwd(), 'reports');
  await fs.mkdir(outDir, { recursive: true });
  const outPath = path.join(outDir, `raport-esg-test-${token}.pdf`);
  await fs.writeFile(outPath, pdfBuffer);

  const desktopPath = path.join(os.homedir(), 'Desktop', 'Raport-Scopeo-GHG-11.pdf');
  await fs.writeFile(desktopPath, Buffer.from(pdfBuffer));

  console.log(`REPORT_PATH=${outPath}`);
  console.log(`REPORT_DESKTOP=${desktopPath}`);
  console.log(`ORG_ID=${organization.id}`);
  console.log(`USER_EMAIL=${user.email}`);
  console.log(`INVOICE_ID=${invoice.id}`);
  console.log(`TOTAL_KG=${result.totalKg.toFixed(2)}`);
  console.log(`LINE_COUNT=${result.lineCount} CATEGORIES=${Object.keys(result.byCategory).length}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
