const stopwords = new Set(['i','oraz','the','for','do','na','z','w','usluga','towar']);
function normalize(text: string) { return text.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim(); }
function tokens(text: string) { return normalize(text).split(' ').filter(Boolean).filter(t => !stopwords.has(t)); }
function hasAny(ts: string[], words: string[]) { return words.some(w => ts.includes(w)); }
export function classifyInvoiceLine(input: { description: string; quantity?: number | null; unit?: string | null; netValue: number; }) {
  const normalized = normalize(`${input.description} ${input.unit || ''}`);
  const ts = tokens(normalized);
  const unit = normalize(input.unit || '');
  const candidates: any[] = [];
  if (hasAny(ts, ['energia','electricity','prad','power']) || unit === 'kwh') candidates.push({ scope:'SCOPE2', categoryCode:'scope2_electricity', factorTags:['electricity','grid'], method:'ACTIVITY', confidence: unit === 'kwh' ? 0.98 : 0.9, ruleMatched:'electricity_kwh_rule', activityUnit:'kWh', activityValue: input.quantity ?? null });
  if (hasAny(ts, ['cieplo','heat','ogrzewanie'])) candidates.push({ scope:'SCOPE2', categoryCode:'scope2_district_heat', factorTags:['heat','district'], method:'ACTIVITY', confidence: 0.9, ruleMatched:'district_heat_rule', activityUnit:'kWh', activityValue: input.quantity ?? null });
  if (hasAny(ts, ['diesel','olej','napedowy','paliwo']) || ['l','ltr','litr'].includes(unit)) candidates.push({ scope:'SCOPE1', categoryCode:'scope1_fuel', factorTags:['fuel','diesel'], method:'ACTIVITY', confidence: ['l','ltr','litr'].includes(unit) ? 0.97 : 0.88, ruleMatched:'diesel_rule', activityUnit:'l', activityValue: input.quantity ?? null });
  if (hasAny(ts, ['hotel','flight','lotniczy','air','taxi','uber','bolt','travel','podroz','delegacja','rail','pociag'])) candidates.push({ scope:'SCOPE3', categoryCode:'scope3_cat6_business_travel', factorTags:['travel'], method:'SPEND', confidence: 0.93, ruleMatched:'business_travel_rule' });
  if (hasAny(ts, ['kurier','courier','spedycja','transport','shipping','freight','logistics','dhl','fedex','ups','inpost'])) candidates.push({ scope:'SCOPE3', categoryCode:'scope3_cat4_transport', factorTags:['transport','shipping'], method:'SPEND', confidence: 0.91, ruleMatched:'upstream_transport_rule' });
  if (hasAny(ts, ['odpad','odpady','waste','recycling','utylizacja','disposal'])) candidates.push({ scope:'SCOPE3', categoryCode:'scope3_cat5_waste', factorTags:['waste'], method:'SPEND', confidence: 0.9, ruleMatched:'waste_rule' });
  if (hasAny(ts, ['komputer','laptop','serwer','monitor','drukarka','vehicle','samochod','maszyna','machine','sprzet'])) candidates.push({ scope:'SCOPE3', categoryCode:'scope3_cat2_capital_goods', factorTags:['capex','equipment'], method:'SPEND', confidence: 0.87, ruleMatched:'capital_goods_rule' });
  if (hasAny(ts, ['consulting','doradztwo','software','saas','licencja','marketing','uslugi','abonament','subscription','hosting'])) candidates.push({ scope:'SCOPE3', categoryCode:'scope3_cat1_purchased_services', factorTags:['services','software'], method:'SPEND', confidence: 0.84, ruleMatched:'services_rule' });
  if (hasAny(ts, ['stal','steel','cement','beton','material','materialy','papier','opakowania','packaging','surowiec'])) candidates.push({ scope:'SCOPE3', categoryCode:'scope3_cat1_purchased_goods', factorTags:['materials','goods'], method:'SPEND', confidence: 0.86, ruleMatched:'materials_rule' });
  if (candidates.length === 0) candidates.push({ scope:'SCOPE3', categoryCode:'scope3_cat1_purchased_services', factorTags:['services'], method:'SPEND', confidence: 0.45, ruleMatched:'fallback_services_rule' });
  candidates.sort((a,b)=>b.confidence-a.confidence);
  return { ...candidates[0], normalizedText: normalized, tokens: ts, candidates };
}