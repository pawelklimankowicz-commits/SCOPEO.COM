import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

const PDF_FONT_FAMILY = process.env.DISABLE_REMOTE_PDF_FONTS === '1' ? 'Helvetica' : 'Noto Sans';

if (process.env.DISABLE_REMOTE_PDF_FONTS !== '1') {
  Font.register({
    family: 'Noto Sans',
    fonts: [
      {
        src: 'https://fonts.gstatic.com/s/notosans/v36/o-0bIpQlx3QUlC5A4PNB6Ryti20_6n1iPHjc5a7du3mhPy0.woff2',
        fontWeight: 'normal',
      },
      {
        src: 'https://fonts.gstatic.com/s/notosans/v36/o-0IIpQlx3QUlC5A4PNb4j5Ba_2c7fj2AI-instr-8517694.woff2',
        fontWeight: 'bold',
      },
    ],
  });
}

const styles = StyleSheet.create({
  page: {
    fontFamily: PDF_FONT_FAMILY,
    fontSize: 9,
    paddingTop: 36,
    paddingBottom: 40,
    paddingHorizontal: 40,
    color: '#0f172a',
    backgroundColor: '#ffffff',
  },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 4, color: '#0f172a' },
  subtitle: { fontSize: 9, color: '#64748b', marginBottom: 16 },
  row2: { flexDirection: 'row', gap: 16, marginBottom: 14 },
  col: { flex: 1 },
  boxLabel: { fontSize: 8, color: '#64748b', marginBottom: 4 },
  boxTitle: { fontSize: 10, fontWeight: 'bold', marginBottom: 4 },
  boxLine: { fontSize: 9, color: '#334155', marginBottom: 2, lineHeight: 1.35 },
  sectionTitle: { fontSize: 10, fontWeight: 'bold', marginBottom: 8, marginTop: 6 },
  th: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingVertical: 6,
    paddingHorizontal: 6,
  },
  tr: {
    flexDirection: 'row',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e2e8f0',
    paddingVertical: 5,
    paddingHorizontal: 6,
    backgroundColor: '#ffffff',
  },
  cLp: { width: 22, textAlign: 'center' },
  cDesc: { flex: 3.2, paddingRight: 4 },
  cQty: { width: 44, textAlign: 'right' },
  cNet: { width: 64, textAlign: 'right' },
  cVat: { width: 36, textAlign: 'right' },
  cGross: { width: 64, textAlign: 'right' },
  totalsWrap: { marginTop: 12, alignItems: 'flex-end' },
  totalRow: { flexDirection: 'row', width: 220, justifyContent: 'space-between', marginBottom: 4 },
  totalLabel: { fontSize: 9, color: '#475569' },
  totalValue: { fontSize: 9, fontWeight: 'bold' },
  totalBig: { fontSize: 11, fontWeight: 'bold', color: '#0f172a' },
  foot: { marginTop: 20, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#e2e8f0', fontSize: 7.5, color: '#94a3b8' },
});

export type InvoicePdfLine = {
  lp: number;
  description: string;
  quantity: number;
  unit: string;
  netValue: number;
  vatRatePct: number;
  vatAmount: number;
  grossValue: number;
};

export type InvoicePdfData = {
  number: string;
  issueDate: string;
  saleDate?: string;
  paymentDue?: string;
  currency: string;
  seller: { name: string; addressLines: string[]; taxId: string };
  buyer: { name: string; addressLines: string[]; taxId: string };
  lines: InvoicePdfLine[];
  netTotal: number;
  vatTotal: number;
  grossTotal: number;
  paymentMethod?: string;
  bankAccount?: string;
  notes?: string;
};

function fmtMoney(n: number, currency: string) {
  return `${n.toFixed(2)} ${currency}`;
}

export function InvoicePdfDocument({ data }: { data: InvoicePdfData }) {
  return (
    <Document title={`Faktura ${data.number}`}>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Faktura VAT</Text>
        <Text style={styles.subtitle}>
          Nr {data.number} · data wystawienia: {data.issueDate}
          {data.saleDate ? ` · data sprzedazy: ${data.saleDate}` : ''}
          {data.paymentDue ? ` · termin platnosci: ${data.paymentDue}` : ''}
        </Text>

        <View style={styles.row2}>
          <View style={styles.col}>
            <Text style={styles.boxLabel}>Sprzedawca</Text>
            <Text style={styles.boxTitle}>{data.seller.name}</Text>
            {data.seller.addressLines.map((line, i) => (
              <Text key={`s-${i}`} style={styles.boxLine}>
                {line}
              </Text>
            ))}
            <Text style={[styles.boxLine, { marginTop: 4 }]}>NIP: {data.seller.taxId}</Text>
          </View>
          <View style={styles.col}>
            <Text style={styles.boxLabel}>Nabywca</Text>
            <Text style={styles.boxTitle}>{data.buyer.name}</Text>
            {data.buyer.addressLines.map((line, i) => (
              <Text key={`b-${i}`} style={styles.boxLine}>
                {line}
              </Text>
            ))}
            <Text style={[styles.boxLine, { marginTop: 4 }]}>NIP: {data.buyer.taxId}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Pozycje</Text>
        <View style={styles.th}>
          <Text style={[styles.cLp, { fontWeight: 'bold' }]}>Lp.</Text>
          <Text style={[styles.cDesc, { fontWeight: 'bold' }]}>Nazwa towaru / uslugi</Text>
          <Text style={[styles.cQty, { fontWeight: 'bold' }]}>Ilosc</Text>
          <Text style={[styles.cNet, { fontWeight: 'bold' }]}>Netto</Text>
          <Text style={[styles.cVat, { fontWeight: 'bold' }]}>VAT %</Text>
          <Text style={[styles.cGross, { fontWeight: 'bold' }]}>Brutto</Text>
        </View>
        {data.lines.map((line) => (
          <View key={line.lp} style={styles.tr}>
            <Text style={styles.cLp}>{line.lp}</Text>
            <Text style={styles.cDesc}>{line.description}</Text>
            <Text style={styles.cQty}>
              {line.quantity} {line.unit}
            </Text>
            <Text style={styles.cNet}>{fmtMoney(line.netValue, data.currency)}</Text>
            <Text style={styles.cVat}>{line.vatRatePct}%</Text>
            <Text style={styles.cGross}>{fmtMoney(line.grossValue, data.currency)}</Text>
          </View>
        ))}

        <View style={styles.totalsWrap}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Razem netto</Text>
            <Text style={styles.totalValue}>{fmtMoney(data.netTotal, data.currency)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Razem VAT</Text>
            <Text style={styles.totalValue}>{fmtMoney(data.vatTotal, data.currency)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalBig}>Do zaplaty</Text>
            <Text style={styles.totalBig}>{fmtMoney(data.grossTotal, data.currency)}</Text>
          </View>
        </View>

        {(data.paymentMethod || data.bankAccount) && (
          <View style={{ marginTop: 14 }}>
            <Text style={styles.sectionTitle}>Platnosc</Text>
            {data.paymentMethod ? <Text style={styles.boxLine}>Sposob: {data.paymentMethod}</Text> : null}
            {data.bankAccount ? <Text style={styles.boxLine}>Rachunek: {data.bankAccount}</Text> : null}
          </View>
        )}

        {data.notes ? (
          <View style={{ marginTop: 10 }}>
            <Text style={styles.sectionTitle}>Uwagi</Text>
            <Text style={styles.boxLine}>{data.notes}</Text>
          </View>
        ) : null}

        <Text style={styles.foot}>
          Dokument wygenerowany automatycznie (Scopeo) — wzor demonstracyjny, nie stanowi dokumentu KSeF ani
          zrodla prawnie wiazacego, o ile nie zostal wystawiony w systemie ewidencji sprzedazy.
        </Text>
      </Page>
    </Document>
  );
}
