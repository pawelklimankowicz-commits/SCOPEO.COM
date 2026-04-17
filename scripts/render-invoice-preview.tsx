/**
 * Zapisuje przykladowa fakture VAT w PDF na Pulpit.
 * Uzycie: DISABLE_REMOTE_PDF_FONTS=1 node --import tsx scripts/render-invoice-preview.tsx
 */
import { renderToBuffer } from '@react-pdf/renderer';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import React from 'react';
import { InvoicePdfDocument, type InvoicePdfData } from '@/lib/invoice-pdf';

function sampleInvoice(): InvoicePdfData {
  const currency = 'PLN';
  const l1Net = 4000;
  const l2Net = 3500;
  const l3Net = 2500;
  const rate = 23;
  const vat = (n: number) => Math.round(n * (rate / 100) * 100) / 100;
  const l1Vat = vat(l1Net);
  const l2Vat = vat(l2Net);
  const l3Vat = vat(l3Net);
  const l1Gross = Math.round((l1Net + l1Vat) * 100) / 100;
  const l2Gross = Math.round((l2Net + l2Vat) * 100) / 100;
  const l3Gross = Math.round((l3Net + l3Vat) * 100) / 100;
  const netTotal = l1Net + l2Net + l3Net;
  const vatTotal = l1Vat + l2Vat + l3Vat;
  const grossTotal = Math.round((netTotal + vatTotal) * 100) / 100;

  return {
    number: 'FV/DEMO/2026/00042',
    issueDate: new Date().toLocaleDateString('pl-PL'),
    saleDate: new Date().toLocaleDateString('pl-PL'),
    paymentDue: new Date(Date.now() + 14 * 86400000).toLocaleDateString('pl-PL'),
    currency,
    seller: {
      name: 'SCOPEO DEMO Sp. z o.o.',
      addressLines: ['ul. Przykladowa 12', '00-001 Warszawa', 'Polska'],
      taxId: '5252847238',
    },
    buyer: {
      name: 'Klient Testowy Sp. z o.o.',
      addressLines: ['al. Biznesowa 8', '30-001 Krakow', 'Polska'],
      taxId: '6793108059',
    },
    lines: [
      {
        lp: 1,
        description: 'Subskrypcja oprogramowania Scopeo — pakiet Professional (1 mc.)',
        quantity: 1,
        unit: 'usl.',
        netValue: l1Net,
        vatRatePct: rate,
        vatAmount: l1Vat,
        grossValue: l1Gross,
      },
      {
        lp: 2,
        description: 'Konsultacje wdrozeniowe ESG / GHG (8h)',
        quantity: 8,
        unit: 'godz.',
        netValue: l2Net,
        vatRatePct: rate,
        vatAmount: l2Vat,
        grossValue: l2Gross,
      },
      {
        lp: 3,
        description: 'Integracja API KSeF — jednorazowa opata uruchomieniowa',
        quantity: 1,
        unit: 'usl.',
        netValue: l3Net,
        vatRatePct: rate,
        vatAmount: l3Vat,
        grossValue: l3Gross,
      },
    ],
    netTotal,
    vatTotal,
    grossTotal,
    paymentMethod: 'przelew',
    bankAccount: 'PL 12 3456 7890 1234 5678 9012 3456',
    notes: 'Faktura demonstracyjna wygenerowana z repozytorium Scopeo (skrypt render-invoice-preview).',
  };
}

async function main() {
  const data = sampleInvoice();
  const pdf = Buffer.from(await renderToBuffer(<InvoicePdfDocument data={data} />));

  const desktopPath = path.join(os.homedir(), 'Desktop', 'faktura.pdf');
  await fs.writeFile(desktopPath, pdf);

  const reportsDir = path.join(process.cwd(), 'reports');
  await fs.mkdir(reportsDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const repoCopy = path.join(reportsDir, `faktura-demo-${stamp}.pdf`);
  await fs.writeFile(repoCopy, pdf);

  console.log(`INVOICE_DESKTOP=${desktopPath}`);
  console.log(`INVOICE_REPO=${repoCopy}`);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
