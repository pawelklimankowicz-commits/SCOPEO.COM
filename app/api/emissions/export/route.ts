import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { calculateOrganizationEmissions } from '@/lib/emissions';
import ExcelJS from 'exceljs';
import { PDFDocument, StandardFonts } from 'pdf-lib';

function toCsv(result: Awaited<ReturnType<typeof calculateOrganizationEmissions>>) {
  const headers = [
    'invoiceNumber',
    'description',
    'categoryCode',
    'factorCode',
    'factorSource',
    'reviewStatus',
    'co2eKg',
  ];
  const rows = result.calculations.map((row: any) =>
    headers.map((key) => JSON.stringify(row[key as keyof typeof row] ?? '')).join(',')
  );
  return `${headers.join(',')}\n${rows.join('\n')}`;
}

async function toXlsx(result: Awaited<ReturnType<typeof calculateOrganizationEmissions>>) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Emissions');
  sheet.columns = [
    { header: 'Invoice', key: 'invoiceNumber', width: 20 },
    { header: 'Description', key: 'description', width: 40 },
    { header: 'Category', key: 'categoryCode', width: 24 },
    { header: 'Factor', key: 'factorCode', width: 28 },
    { header: 'Source', key: 'factorSource', width: 20 },
    { header: 'Review', key: 'reviewStatus', width: 18 },
    { header: 'CO2e kg', key: 'co2eKg', width: 14 },
  ];
  sheet.addRows(result.calculations as any[]);
  return workbook.xlsx.writeBuffer();
}

async function toPdf(result: Awaited<ReturnType<typeof calculateOrganizationEmissions>>) {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  let page = pdf.addPage([595, 842]);
  let y = 810;
  const line = (text: string) => {
    if (y < 40) {
      page = pdf.addPage([595, 842]);
      y = 810;
    }
    page.drawText(text, { x: 40, y, size: 11, font });
    y -= 16;
  };
  line('Scopeo - Emissions Export');
  line(`Generated: ${new Date().toISOString()}`);
  line(`Scope1: ${result.scope1.toFixed(2)} kg`);
  line(`Scope2: ${result.scope2.toFixed(2)} kg`);
  line(`Scope3: ${result.scope3.toFixed(2)} kg`);
  line(`Total: ${result.totalKg.toFixed(2)} kg`);
  y -= 8;
  for (const row of result.calculations) {
    line(`${row.invoiceNumber} | ${row.categoryCode} | ${Number(row.co2eKg).toFixed(2)} kg`);
  }
  return pdf.save();
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  const organizationId = (session.user as any).organizationId as string;
  const format = (req.nextUrl.searchParams.get('format') ?? 'csv').toLowerCase();
  const reportYear = Number(req.nextUrl.searchParams.get('year'));
  const validReportYear =
    Number.isFinite(reportYear) && reportYear >= 2000 && reportYear <= 2100 ? reportYear : undefined;
  const result = await calculateOrganizationEmissions(organizationId, validReportYear, {
    persist: false,
  });

  if (format === 'xlsx') {
    const file = await toXlsx(result);
    return new NextResponse(file as BodyInit, {
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="emissions.xlsx"',
      },
    });
  }

  if (format === 'pdf') {
    const file = await toPdf(result);
    return new NextResponse(file as BodyInit, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="emissions.pdf"',
      },
    });
  }

  const csv = toCsv(result);
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="emissions.csv"',
    },
  });
}
