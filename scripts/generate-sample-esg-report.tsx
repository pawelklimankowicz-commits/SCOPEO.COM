import { renderToBuffer, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import fs from 'node:fs/promises';
import path from 'node:path';
import React from 'react';

const styles = StyleSheet.create({
  page: { padding: 36, fontSize: 11, color: '#0f172a' },
  title: { fontSize: 22, marginBottom: 6 },
  subtitle: { fontSize: 11, marginBottom: 18, color: '#334155' },
  sectionTitle: { fontSize: 13, marginTop: 10, marginBottom: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#e2e8f0', paddingVertical: 6 },
  footer: { marginTop: 24, fontSize: 9, color: '#64748b' },
});

function stamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

async function main() {
  const generatedAt = new Date();
  const token = stamp();
  const companyName = 'Testowa Firma ESG Sp. z o.o.';
  const reportingYear = generatedAt.getFullYear();

  const scope1 = 12840;
  const scope2 = 21450;
  const scope3 = 56720;
  const totalKg = scope1 + scope2 + scope3;

  const t = (kg: number) => (kg / 1000).toFixed(2);
  const categories: Array<[string, number]> = [
    ['Scope 1 - paliwa', 8840],
    ['Scope 1 - gaz', 4000],
    ['Scope 2 - energia elektryczna', 17650],
    ['Scope 2 - cieplo sieciowe', 3800],
    ['Scope 3 - zakupione dobra', 26400],
    ['Scope 3 - transport', 14600],
    ['Scope 3 - odpady', 5720],
    ['Scope 3 - podroze sluzbowe', 10000],
  ];

  const doc = (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Testowy Raport ESG / GHG</Text>
        <Text style={styles.subtitle}>
          {companyName} | Rok raportowania: {reportingYear}
        </Text>

        <Text style={styles.sectionTitle}>Podsumowanie emisji (tCO2e)</Text>
        <View style={styles.row}><Text>Scope 1</Text><Text>{t(scope1)}</Text></View>
        <View style={styles.row}><Text>Scope 2</Text><Text>{t(scope2)}</Text></View>
        <View style={styles.row}><Text>Scope 3</Text><Text>{t(scope3)}</Text></View>
        <View style={styles.row}><Text>Lacznie</Text><Text>{t(totalKg)}</Text></View>

        <Text style={styles.sectionTitle}>Kategorie emisji</Text>
        {categories.map(([name, kg]) => (
          <View key={name} style={styles.row}>
            <Text>{name}</Text>
            <Text>{t(kg)}</Text>
          </View>
        ))}

        <Text style={styles.footer}>
          Wygenerowano: {generatedAt.toLocaleDateString('pl-PL')} | Dokument testowy do walidacji procesu.
        </Text>
      </Page>
    </Document>
  );

  const outDir = path.join(process.cwd(), 'reports');
  await fs.mkdir(outDir, { recursive: true });
  const outPath = path.join(outDir, `raport-esg-testowy-${token}.pdf`);
  const pdf = await renderToBuffer(doc);
  await fs.writeFile(outPath, pdf);

  console.log(`REPORT_PATH=${outPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
