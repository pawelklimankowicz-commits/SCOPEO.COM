import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { calculateOrganizationEmissions } from '@/lib/emissions';
import { checkRateLimit, getClientIp } from '@/lib/security';
import ExcelJS from 'exceljs';
import * as fontkit from '@pdf-lib/fontkit';
import { PDFDocument, rgb } from 'pdf-lib';
import fs from 'node:fs/promises';
import path from 'node:path';

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
  const rows = result.calculations;
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);
  const fontBytes = await fs.readFile(
    path.join(process.cwd(), 'assets', 'fonts', 'NotoSans-Regular.ttf')
  );
  const font = await pdfDoc.embedFont(fontBytes, { subset: true });
  const boldFont = font;

  const PAGE_HEIGHT = 841.89; // A4
  const PAGE_WIDTH = 595.28;
  const MARGIN = 40;
  const ROW_HEIGHT = 18;
  const HEADER_HEIGHT = 80;
  const ROWS_PER_PAGE = Math.floor((PAGE_HEIGHT - MARGIN * 2 - HEADER_HEIGHT) / ROW_HEIGHT);

  const drawHeaders = (page: any, y: number) => {
    const cols = ['Faktura', 'Kategoria', 'Zrodlo', 'CO2e (kg)'];
    const colWidths = [130, 200, 120, 80];
    let x = MARGIN;
    cols.forEach((col, i) => {
      page.drawText(col, { x, y, size: 9, font: boldFont, color: rgb(0.3, 0.3, 0.3) });
      x += colWidths[i];
    });
  };

  let page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - MARGIN;

  page.drawText('Raport emisji CO2', {
    x: MARGIN,
    y: y - 20,
    size: 16,
    font: boldFont,
    color: rgb(0, 0, 0),
  });
  page.drawText(`Wygenerowano: ${new Date().toISOString()}`, {
    x: MARGIN,
    y: y - 40,
    size: 9,
    font,
    color: rgb(0.2, 0.2, 0.2),
  });
  page.drawText(
    `Suma: ${result.totalKg.toFixed(2)} kg (S1: ${result.scope1.toFixed(2)}, S2: ${result.scope2.toFixed(
      2
    )}, S3: ${result.scope3.toFixed(2)})`,
    {
      x: MARGIN,
      y: y - 56,
      size: 9,
      font,
      color: rgb(0.2, 0.2, 0.2),
    }
  );
  y -= 80;

  drawHeaders(page, y);
  y -= ROW_HEIGHT;

  for (let i = 0; i < rows.length; i += 1) {
    if ((i > 0 && i % ROWS_PER_PAGE === 0) || y < MARGIN + ROW_HEIGHT) {
      page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      y = PAGE_HEIGHT - MARGIN;
      drawHeaders(page, y);
      y -= ROW_HEIGHT;
    }

    const row = rows[i];
    const cells = [
      String(row.invoiceNumber ?? '').slice(0, 24),
      String(row.categoryCode ?? '').slice(0, 35),
      String(row.factorSource ?? '').slice(0, 22),
      Number(row.co2eKg ?? 0).toFixed(2),
    ];
    const colWidths = [130, 200, 120, 80];
    let x = MARGIN;
    cells.forEach((cell, colIdx) => {
      page.drawText(cell, { x, y, size: 8, font, color: rgb(0, 0, 0) });
      x += colWidths[colIdx];
    });
    y -= ROW_HEIGHT;
  }

  return pdfDoc.save();
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  const ip = getClientIp(req.headers);
  const organizationId = (session.user as any).organizationId as string;
  const rl = await checkRateLimit(`export:${organizationId}:${ip}`, {
    maxRequests: 20,
    windowMs: 60 * 1000,
  });
  if (!rl.ok) {
    return NextResponse.json(
      { ok: false, error: 'Too many export requests' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfterSec) } }
    );
  }
  const format = (req.nextUrl.searchParams.get('format') ?? 'csv').toLowerCase();
  const requestedMaxLines = Number(req.nextUrl.searchParams.get('maxLines'));
  const exportMaxLines =
    Number.isFinite(requestedMaxLines) && requestedMaxLines > 0
      ? Math.min(Math.floor(requestedMaxLines), 10000)
      : 10000;
  const reportYear = Number(req.nextUrl.searchParams.get('year'));
  const validReportYear =
    Number.isFinite(reportYear) && reportYear >= 2000 && reportYear <= 2100 ? reportYear : undefined;
  const result = await calculateOrganizationEmissions(organizationId, validReportYear, {
    persist: false,
    maxLines: exportMaxLines,
  });
  const exportMetaHeaders = {
    'X-Export-Max-Lines': String(result.maxLines ?? exportMaxLines),
    'X-Export-Line-Count': String(result.lineCount ?? result.calculations.length),
    'X-Export-Truncated': String(Boolean(result.truncated)),
  };

  if (format === 'xlsx') {
    const file = await toXlsx(result);
    return new NextResponse(file as BodyInit, {
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="emissions.xlsx"',
        ...exportMetaHeaders,
      },
    });
  }

  if (format === 'pdf') {
    const file = await toPdf(result);
    return new NextResponse(file as BodyInit, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="emissions.pdf"',
        ...exportMetaHeaders,
      },
    });
  }

  const csv = toCsv(result);
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="emissions.csv"',
      ...exportMetaHeaders,
    },
  });
}
