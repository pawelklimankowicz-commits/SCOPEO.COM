import { parseStringPromise } from 'xml2js';
const FORBIDDEN_XML_PATTERNS = [/<\!DOCTYPE/i, /<\!ENTITY/i, /SYSTEM\s+["']/i, /PUBLIC\s+["']/i];
function toArray<T>(value: T | T[] | undefined): T[] { if (!value) return []; return Array.isArray(value) ? value : [value]; }
function pick(node: any, keys: string[]): any {
  for (const key of keys) if (node?.[key] !== undefined) return node[key];
  if (!node || typeof node !== 'object') return undefined;
  const normalizedKeys = Object.keys(node).reduce<Record<string, any>>((acc, current) => {
    const localName = current.includes(':') ? current.split(':').pop() ?? current : current;
    acc[localName] = node[current];
    return acc;
  }, {});
  for (const key of keys) if (normalizedKeys[key] !== undefined) return normalizedKeys[key];
  return undefined;
}
function firstText(value: any): string | undefined { if (value == null) return undefined; if (typeof value === 'string') return value; if (Array.isArray(value)) return firstText(value[0]); if (typeof value === 'object' && '_' in value) return String(value._); return undefined; }
function num(value: any): number | null { const t = firstText(value); if (!t) return null; const n = Number(t.replace(',', '.')); return Number.isFinite(n) ? n : null; }
export async function parseKsefFa3Xml(xml: string) {
  if (FORBIDDEN_XML_PATTERNS.some((pattern) => pattern.test(xml))) {
    throw new Error('XML contains forbidden DTD or ENTITY declarations');
  }
  const parsed = await parseStringPromise(xml, { explicitArray: false, trim: true, mergeAttrs: true });
  const root = parsed?.Faktura || parsed?.Invoice || parsed;
  const fa = pick(root, ['Fa', 'fa']) || root;
  const seller = pick(root, ['Podmiot1', 'Seller']) || {};
  const rowsNode = pick(root, ['FaWiersze', 'InvoiceRows']) || root;
  const rowList = toArray(pick(rowsNode, ['FaWiersz', 'InvoiceRow']));
  const number = firstText(pick(fa, ['P_2', 'NumerFaktury', 'InvoiceNumber'])) || 'UNKNOWN';
  const issueDate = firstText(pick(fa, ['P_1', 'DataWystawienia', 'IssueDate'])) || new Date().toISOString().slice(0,10);
  const currency = firstText(pick(fa, ['KodWaluty', 'Currency'])) || 'PLN';
  const sellerName = firstText(pick(seller, ['Nazwa', 'PelnaNazwa', 'Name'])) || 'Unknown supplier';
  const sellerTaxId = firstText(pick(seller, ['NIP', 'TaxId']));
  const lines = rowList.map((row: any, idx: number) => ({ description: firstText(pick(row, ['P_7', 'NazwaTowaruUslugi', 'Description'])) || `Line ${idx+1}`, quantity: num(pick(row, ['P_8A', 'Ilosc', 'Quantity'])), unit: firstText(pick(row, ['P_8B', 'JednostkaMiary', 'Unit'])), netValue: num(pick(row, ['P_11', 'WartoscNetto', 'NetValue'])) || 0, currency }));
  const netValue = num(pick(fa, ['P_13_1', 'WartoscNetto', 'NetTotal'])) || lines.reduce((a,b)=>a+b.netValue,0);
  const grossValue = num(pick(fa, ['P_15', 'WartoscBrutto', 'GrossTotal'])) || netValue;
  return { externalId: `${number}-${issueDate}`, number, issueDate, sellerName, sellerTaxId, currency, netValue, grossValue, lines, rawPayload: xml };
}