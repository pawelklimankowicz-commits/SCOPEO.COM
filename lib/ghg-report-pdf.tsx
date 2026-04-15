import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

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

const styles = StyleSheet.create({
  page: { fontFamily: 'Noto Sans', fontSize: 10, padding: 48, color: '#1e293b' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#16a34a', marginBottom: 4 },
  subtitle: { fontSize: 12, color: '#475569', marginBottom: 32 },
  section: { marginBottom: 20 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 4,
    marginBottom: 10,
  },
  row: { flexDirection: 'row', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  cellLeft: { flex: 3, paddingRight: 8 },
  cellRight: { flex: 1, textAlign: 'right' },
  headerRow: { flexDirection: 'row', paddingVertical: 6, backgroundColor: '#f8fafc', marginBottom: 2 },
  kpiBox: { flex: 1, backgroundColor: '#f0fdf4', borderRadius: 4, padding: 10, marginRight: 8 },
  kpiValue: { fontSize: 18, fontWeight: 'bold', color: '#15803d' },
  kpiLabel: { fontSize: 9, color: '#4b5563', marginTop: 2 },
  footer: {
    position: 'absolute',
    bottom: 32,
    left: 48,
    right: 48,
    fontSize: 8,
    color: '#94a3b8',
    textAlign: 'center',
  },
});

type ReportData = {
  companyName: string;
  reportingYear: number;
  baseYear: number;
  boundaryApproach: string;
  industry: string;
  scope1: number;
  scope2: number;
  scope3: number;
  totalKg: number;
  byCategory: Record<string, number>;
  linesCount: number;
  generatedAt: string;
};

function scopeLabel(s: string) {
  if (s.startsWith('scope1')) return 'Zakres 1';
  if (s.startsWith('scope2')) return 'Zakres 2';
  return 'Zakres 3';
}

function categoryLabel(code: string): string {
  const map: Record<string, string> = {
    scope1_fuel: 'Spalanie paliw (flota, kotlownia)',
    scope1_fuel_gas: 'Spalanie gazu ziemnego',
    scope2_electricity: 'Zakup energii elektrycznej',
    scope2_district_heat: 'Zakup ciepla sieciowego',
    scope3_cat1_purchased_services: 'Kat. 1: Kupione dobra i uslugi',
    scope3_cat1_purchased_goods: 'Kat. 1: Kupione materialy',
    scope3_cat2_capital_goods: 'Kat. 2: Dobra kapitalowe',
    scope3_cat4_transport: 'Kat. 4: Transport i dystrybucja (upstream)',
    scope3_cat5_waste: 'Kat. 5: Odpady z dzialalnosci',
    scope3_cat6_business_travel: 'Kat. 6: Podroze sluzbowe',
  };
  return map[code] ?? code;
}

export function GhgReportDocument({ data }: { data: ReportData }) {
  const tCO2 = (kg: number) => (kg / 1000).toFixed(2);
  const pct = (kg: number) => (data.totalKg > 0 ? `${((kg / data.totalKg) * 100).toFixed(1)}%` : '0%');

  const sortedCategories = Object.entries(data.byCategory)
    .sort(([, a], [, b]) => b - a)
    .filter(([, v]) => v > 0);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.section}>
          <Text style={styles.title}>Raport emisji GHG</Text>
          <Text style={styles.subtitle}>
            {data.companyName} · Rok raportowania: {data.reportingYear}
          </Text>
        </View>

        <View style={[styles.section, { flexDirection: 'row', gap: 8 }]}>
          <View style={styles.kpiBox}>
            <Text style={styles.kpiValue}>{tCO2(data.totalKg)}</Text>
            <Text style={styles.kpiLabel}>tCO2e lacznie</Text>
          </View>
          <View style={styles.kpiBox}>
            <Text style={styles.kpiValue}>{tCO2(data.scope1)}</Text>
            <Text style={styles.kpiLabel}>tCO2e Zakres 1</Text>
          </View>
          <View style={styles.kpiBox}>
            <Text style={styles.kpiValue}>{tCO2(data.scope2)}</Text>
            <Text style={styles.kpiLabel}>tCO2e Zakres 2</Text>
          </View>
          <View style={styles.kpiBox}>
            <Text style={styles.kpiValue}>{tCO2(data.scope3)}</Text>
            <Text style={styles.kpiLabel}>tCO2e Zakres 3</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Emisje wedlug kategorii</Text>
          <View style={styles.headerRow}>
            <Text style={[styles.cellLeft, { fontWeight: 'bold' }]}>Kategoria</Text>
            <Text style={[styles.cellRight, { fontWeight: 'bold' }]}>tCO2e</Text>
            <Text style={[styles.cellRight, { fontWeight: 'bold' }]}>Udzial</Text>
            <Text style={[styles.cellRight, { fontWeight: 'bold' }]}>Zakres</Text>
          </View>
          {sortedCategories.map(([code, kg]) => (
            <View key={code} style={styles.row}>
              <Text style={styles.cellLeft}>{categoryLabel(code)}</Text>
              <Text style={styles.cellRight}>{tCO2(kg)}</Text>
              <Text style={styles.cellRight}>{pct(kg)}</Text>
              <Text style={styles.cellRight}>{scopeLabel(code)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informacje o raporcie</Text>
          <View style={styles.row}>
            <Text style={styles.cellLeft}>Firma</Text>
            <Text style={styles.cellRight}>{data.companyName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.cellLeft}>Rok bazowy</Text>
            <Text style={styles.cellRight}>{data.baseYear}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.cellLeft}>Granica raportowania</Text>
            <Text style={styles.cellRight}>{data.boundaryApproach}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.cellLeft}>Branza</Text>
            <Text style={styles.cellRight}>{data.industry}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.cellLeft}>Liczba przeanalizowanych linii</Text>
            <Text style={styles.cellRight}>{data.linesCount}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.cellLeft}>Metodologia</Text>
            <Text style={styles.cellRight}>GHG Protocol Corporate Standard</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.cellLeft}>Wskazniki emisji</Text>
            <Text style={styles.cellRight}>KOBiZE 2023, UK Gov 2025, EPA 2025</Text>
          </View>
        </View>

        <Text style={styles.footer}>
          Raport wygenerowany przez Scopeo · {data.generatedAt} · Dane oparte na zaimportowanych fakturach
          KSeF. Raport ma charakter informacyjny i nie stanowi certyfikowanego raportu GHG Protocol.
        </Text>
      </Page>
    </Document>
  );
}
