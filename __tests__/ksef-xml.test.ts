import { describe, it, expect } from 'vitest';
import { parseKsefFa3Xml, taxIdSegmentForExternalId } from '@/lib/ksef-xml';

const SAMPLE_XML = `<?xml version="1.0" encoding="UTF-8"?>
<Faktura>
  <Fa>
    <P_1>2024-03-15</P_1>
    <P_2>FV/2024/001</P_2>
    <KodWaluty>PLN</KodWaluty>
    <P_13_1>1000.00</P_13_1>
    <P_15>1230.00</P_15>
  </Fa>
  <Podmiot1>
    <NIP>1234567890</NIP>
    <Nazwa>Test Supplier Sp. z o.o.</Nazwa>
  </Podmiot1>
  <FaWiersze>
    <FaWiersz>
      <P_7>Energia elektryczna</P_7>
      <P_8A>500</P_8A>
      <P_8B>kWh</P_8B>
      <P_11>1000.00</P_11>
    </FaWiersz>
  </FaWiersze>
</Faktura>`;

describe('parseKsefFa3Xml', () => {
  it('parsuje podstawową fakturę FA(3)', async () => {
    const result = await parseKsefFa3Xml(SAMPLE_XML);
    expect(result.number).toBe('FV/2024/001');
    expect(result.issueDate).toBe('2024-03-15');
    expect(result.currency).toBe('PLN');
    expect(result.sellerName).toBe('Test Supplier Sp. z o.o.');
    expect(result.sellerTaxId).toBe('1234567890');
    expect(result.netValue).toBe(1000);
    expect(result.grossValue).toBe(1230);
    expect(result.lines).toHaveLength(1);
    expect(result.lines[0].description).toBe('Energia elektryczna');
    expect(result.lines[0].quantity).toBe(500);
    expect(result.lines[0].unit).toBe('kWh');
  });

  it('generuje stabilny externalId', async () => {
    const result = await parseKsefFa3Xml(SAMPLE_XML);
    expect(result.externalId).toBe('1234567890-FV/2024/001-2024-03-15');
  });

  it('odrzuca XML z DTD injection', async () => {
    const malicious = `<!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///etc/passwd">]><root>&xxe;</root>`;
    await expect(parseKsefFa3Xml(malicious)).rejects.toThrow(/forbidden/i);
  });
});

describe('taxIdSegmentForExternalId', () => {
  it('zwraca NIP bez spacji', () => {
    expect(taxIdSegmentForExternalId('123 456 78 90')).toBe('1234567890');
  });
  it('zwraca NO_TAX_ID dla null', () => {
    expect(taxIdSegmentForExternalId(null)).toBe('NO_TAX_ID');
  });
});
