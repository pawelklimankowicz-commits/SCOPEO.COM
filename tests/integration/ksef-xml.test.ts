import test from 'node:test';
import assert from 'node:assert/strict';
import { parseKsefFa3Xml, taxIdSegmentForExternalId } from '@/lib/ksef-xml';

const minimalFaXml = `<?xml version="1.0" encoding="UTF-8"?>
<Faktura>
  <Fa>
    <P_2>FV/2024/01</P_2>
    <P_1>2024-06-01</P_1>
    <KodWaluty>PLN</KodWaluty>
    <P_13_1>100.00</P_13_1>
    <P_15>123.00</P_15>
  </Fa>
  <Podmiot1>
    <NIP>123-456-78-90</NIP>
    <Nazwa>ACME Sp. z o.o.</Nazwa>
  </Podmiot1>
  <FaWiersze>
    <FaWiersz>
      <P_7>Usługa IT</P_7>
      <P_11>100</P_11>
    </FaWiersz>
  </FaWiersze>
</Faktura>`;

test('taxIdSegmentForExternalId normalizes NIP', () => {
  assert.equal(taxIdSegmentForExternalId('123-456-78-90'), '1234567890');
  assert.equal(taxIdSegmentForExternalId(null), 'NO_TAX_ID');
});

test('parseKsefFa3Xml extracts header, seller, line and externalId', async () => {
  const r = await parseKsefFa3Xml(minimalFaXml);
  assert.equal(r.number, 'FV/2024/01');
  assert.equal(r.issueDate, '2024-06-01');
  assert.equal(r.currency, 'PLN');
  assert.equal(r.sellerName, 'ACME Sp. z o.o.');
  assert.equal(r.sellerTaxId, '123-456-78-90');
  assert.equal(r.lines.length, 1);
  assert.equal(r.lines[0]?.description, 'Usługa IT');
  assert.equal(r.lines[0]?.netValue, 100);
  assert.equal(r.externalId, '1234567890-FV/2024/01-2024-06-01');
  assert.equal(r.rawPayload, minimalFaXml);
});

test('parseKsefFa3Xml includes seller name in externalId when NIP is missing', async () => {
  const xmlWithoutTaxId = `<?xml version="1.0" encoding="UTF-8"?>
<Faktura>
  <Fa>
    <P_2>FV/2024/001</P_2>
    <P_1>2024-01-15</P_1>
  </Fa>
  <Podmiot1>
    <Nazwa>Jan Kowalski Usługi</Nazwa>
  </Podmiot1>
</Faktura>`;

  const r = await parseKsefFa3Xml(xmlWithoutTaxId);
  assert.equal(r.externalId, 'NO_TAX_ID-JAN_KOWALSKI_USLUGI-FV/2024/001-2024-01-15');
});

test('parseKsefFa3Xml rejects DTD / ENTITY', async () => {
  const evil = `<!DOCTYPE foo [<!ENTITY xxe "x">]><Faktura><Fa><P_2>a</P_2><P_1>2024-01-01</P_1></Fa></Faktura>`;
  await assert.rejects(() => parseKsefFa3Xml(evil), /forbidden/i);
});
