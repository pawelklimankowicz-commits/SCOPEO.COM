import { prisma } from '@/lib/prisma';

const stopwords = new Set([
  'i', 'oraz', 'the', 'for', 'do', 'na', 'z', 'w', 'usluga', 'towar',
  'za', 'od', 'ze', 'po', 'przy', 'przez', 'przed', 'nad', 'pod',
  'lub', 'czy', 'nie', 'jak', 'jako', 'sa', 'sie', 'to', 'a', 'o',
]);

function normalize(text: string) {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function stemToken(token: string): string {
  // Lightweight PL/EN suffix trimming for invoice keywords (not a full stemmer).
  const suffixes = [
    'owania', 'owaniem', 'owaniu', 'owac', 'owego', 'owej', 'owych', 'owym',
    'acja', 'acje', 'acji', 'acyjny', 'acyjna', 'acyjne',
    'ami', 'ach', 'owie', 'owiec', 'owa', 'owe', 'owy',
    'enie', 'enia', 'eniu', 'eniu', 'eniach',
    'osci', 'osc', 'anie', 'ania', 'aniu',
    'iem', 'om', 'em', 'ie', 'e', 'a', 'y', 'u',
    'ing', 'ings', 'ed', 'es', 's',
  ];
  for (const suffix of suffixes) {
    if (token.length > suffix.length + 2 && token.endsWith(suffix)) {
      return token.slice(0, -suffix.length);
    }
  }
  return token;
}

function tokens(text: string) {
  const base = normalize(text)
    .split(' ')
    .filter(Boolean)
    .filter((t) => !stopwords.has(t));
  return Array.from(new Set(base.map(stemToken)));
}

function hasAny(ts: string[], words: string[]) {
  return words.some((w) => ts.includes(w));
}

const CAT1_PURCHASED_GOODS_AND_SERVICES = 'scope3_cat1_purchased_services';

export function classifyInvoiceLine(input: {
  description: string;
  quantity?: number | null;
  unit?: string | null;
  netValue: number;
}) {
  const normalized = normalize(`${input.description} ${input.unit || ''}`);
  const ts = tokens(normalized);
  const unit = normalize(input.unit || '');
  const isLiterUnit = ['l', 'ltr', 'litr', 'litr', 'litry'].includes(unit);
  const isGasUnit = ['m3', 'nm3', 'kwh', 'mwh'].includes(unit);
  const candidates: any[] = [];
  if (hasAny(ts, ['energ', 'electric', 'prad', 'power']) || unit === 'kwh') {
    candidates.push({
      scope: 'SCOPE2',
      categoryCode: 'scope2_electricity',
      factorTags: ['electricity', 'grid'],
      method: 'ACTIVITY',
      confidence: unit === 'kwh' ? 0.98 : 0.9,
      ruleMatched: 'electricity_kwh_rule',
      activityUnit: 'kWh',
      activityValue: input.quantity ?? null,
    });
  }
  if (hasAny(ts, ['ciepl', 'heat', 'ogrzew', 'siec', 'komunaln', 'co'])) {
    candidates.push({
      scope: 'SCOPE2',
      categoryCode: 'scope2_district_heat',
      factorTags: ['heat', 'district'],
      method: 'ACTIVITY',
      confidence: 0.9,
      ruleMatched: 'district_heat_rule',
      activityUnit: 'kWh',
      activityValue: input.quantity ?? null,
    });
  }
  if (hasAny(ts, ['diesel', 'olej', 'naped', 'paliw']) || isLiterUnit) {
    candidates.push({
      scope: 'SCOPE1',
      categoryCode: 'scope1_fuel',
      factorTags: ['fuel', 'diesel'],
      method: 'ACTIVITY',
      confidence: isLiterUnit ? 0.97 : 0.88,
      ruleMatched: 'diesel_rule',
      activityUnit: 'l',
      activityValue: input.quantity ?? null,
    });
  }
  if (hasAny(ts, ['gaz', 'ziemn', 'lpg', 'lng', 'metan', 'propan']) || isGasUnit) {
    candidates.push({
      scope: 'SCOPE1',
      categoryCode: 'scope1_fuel_gas',
      factorTags: ['fuel', 'gas'],
      method: 'ACTIVITY',
      confidence: isGasUnit ? 0.94 : 0.86,
      ruleMatched: 'natural_gas_rule',
      activityUnit: isGasUnit ? unit : 'm3',
      activityValue: input.quantity ?? null,
    });
  }
  if (hasAny(ts, ['hotel', 'flight', 'lotnicz', 'air', 'taxi', 'uber', 'bolt', 'travel', 'podroz', 'delegacj', 'rail', 'pociag'])) {
    candidates.push({ scope: 'SCOPE3', categoryCode: 'scope3_cat6_business_travel', factorTags: ['travel'], method: 'SPEND', confidence: 0.93, ruleMatched: 'business_travel_rule' });
  }
  if (hasAny(ts, ['kurier', 'courier', 'spedycj', 'transport', 'shipping', 'freight', 'logistic', 'dhl', 'fedex', 'ups', 'inpost', 'poczt', 'znaczk'])) {
    candidates.push({ scope: 'SCOPE3', categoryCode: 'scope3_cat4_transport', factorTags: ['transport', 'shipping'], method: 'SPEND', confidence: 0.91, ruleMatched: 'upstream_transport_rule' });
  }
  if (hasAny(ts, ['odpad', 'waste', 'recycl', 'utylizac', 'disposal'])) {
    candidates.push({ scope: 'SCOPE3', categoryCode: 'scope3_cat5_waste', factorTags: ['waste'], method: 'SPEND', confidence: 0.9, ruleMatched: 'waste_rule' });
  }
  if (hasAny(ts, ['leasing', 'najem', 'wynajem', 'dzierzaw'])) {
    candidates.push({
      scope: 'SCOPE3',
      categoryCode: CAT1_PURCHASED_GOODS_AND_SERVICES,
      factorTags: ['lease', 'rent'],
      method: 'SPEND',
      confidence: 0.95,
      ruleMatched: 'lease_rule',
    });
  }
  if (hasAny(ts, ['komputer', 'laptop', 'serwer', 'monitor', 'drukark', 'vehicle', 'samochod', 'maszyn', 'machine', 'sprzet'])) {
    candidates.push({ scope: 'SCOPE3', categoryCode: 'scope3_cat2_capital_goods', factorTags: ['capex', 'equipment'], method: 'SPEND', confidence: 0.87, ruleMatched: 'capital_goods_rule' });
  }
  if (hasAny(ts, ['consult', 'doradztw', 'software', 'saas', 'licencj', 'marketing', 'uslug', 'abonament', 'subscription', 'hosting', 'telekom', 'internet', 'ubezpieczen', 'leasing', 'najem'])) {
    candidates.push({ scope: 'SCOPE3', categoryCode: CAT1_PURCHASED_GOODS_AND_SERVICES, factorTags: ['services', 'software'], method: 'SPEND', confidence: 0.84, ruleMatched: 'services_rule' });
  }
  if (hasAny(ts, ['stal', 'steel', 'cement', 'beton', 'material', 'papier', 'opakowan', 'packaging', 'surow', 'zywnos', 'spozyw', 'artykul', 'food'])) {
    candidates.push({ scope: 'SCOPE3', categoryCode: CAT1_PURCHASED_GOODS_AND_SERVICES, factorTags: ['materials', 'goods'], method: 'SPEND', confidence: 0.86, ruleMatched: 'materials_rule' });
  }
  if (candidates.length === 0) {
    candidates.push({ scope: 'SCOPE3', categoryCode: CAT1_PURCHASED_GOODS_AND_SERVICES, factorTags: ['services'], method: 'SPEND', confidence: 0.35, ruleMatched: 'fallback_services_rule' });
  }
  candidates.sort((a, b) => b.confidence - a.confidence);
  const matchedTokens = candidates[0]
    ? ts.filter((token) => normalize(candidates[0].ruleMatched || '').includes(token.slice(0, 4)))
    : [];
  return { ...candidates[0], normalizedText: normalized, tokens: ts, matchedTokens, candidates };
}

export async function classifyWithContext(
  description: string,
  supplierId: string | null,
  organizationId: string
): Promise<{
  categoryCode: string;
  confidence: number;
  source: 'supplier_hint' | 'nlp' | 'fallback';
  reasoning: string;
  matchedTokens: string[];
  scope: 'SCOPE1' | 'SCOPE2' | 'SCOPE3';
  method: 'ACTIVITY' | 'SPEND';
  activityUnit?: string | null;
  activityValue?: number | null;
}> {
  if (supplierId) {
    const hint = await prisma.supplierCategoryHint.findFirst({
      where: { organizationId, supplierId, confidence: { gte: 0.8 } },
      orderBy: { sampleCount: 'desc' },
    });
    if (hint && hint.sampleCount >= 3) {
      return {
        categoryCode: hint.categoryCode,
        confidence: hint.confidence,
        source: 'supplier_hint',
        reasoning: `Dostawca historycznie klasyfikowany jako "${hint.categoryCode}" (${hint.sampleCount} potwierdzen)`,
        matchedTokens: [],
        scope: hint.categoryCode.startsWith('scope1')
          ? 'SCOPE1'
          : hint.categoryCode.startsWith('scope2')
            ? 'SCOPE2'
            : 'SCOPE3',
        method: 'SPEND',
      };
    }
  }

  const nlpResult = classifyInvoiceLine({
    description,
    netValue: 0,
    quantity: null,
    unit: null,
  });
  return {
    categoryCode: nlpResult.categoryCode ?? 'uncategorized',
    confidence: nlpResult.confidence ?? 0.5,
    source: nlpResult.ruleMatched === 'fallback_services_rule' ? 'fallback' : 'nlp',
    reasoning: `NLP: dopasowane slowa kluczowe: [${(nlpResult.matchedTokens ?? []).join(', ') || 'brak'}]`,
    matchedTokens: nlpResult.matchedTokens ?? [],
    scope: (nlpResult.scope as 'SCOPE1' | 'SCOPE2' | 'SCOPE3') ?? 'SCOPE3',
    method: (nlpResult.method as 'ACTIVITY' | 'SPEND') ?? 'SPEND',
    activityUnit: nlpResult.activityUnit ?? null,
    activityValue: nlpResult.activityValue ?? null,
  };
}