# Cursor mega prompty — poprawki v5 Scopeo

> Każdy prompt jest niezależny. Wklej w Cursor Chat / Agent Mode.  
> Kontekst: Next.js 15 App Router, Prisma, NextAuth v4 JWT, TypeScript strict.

---

## PROMPT 1 — [V5-C1] Napraw endpoint KSeF: InitSigned → InitToken

```
Napraw plik `lib/ksef-client.ts` w projekcie Next.js/TypeScript.

**Problem:** Funkcja `fetchKsefInvoiceXml` używa endpointu `InitSigned` do inicjalizacji sesji KSeF. Ten endpoint służy do uwierzytelniania kwalifikowanym podpisem XML. Aplikacja używa tokenów API — właściwy endpoint to `InitToken`.

**Wymagana zmiana protokołu KSeF (API token flow):**
1. `POST /online/Session/InitToken` z ciałem `{ "authToken": "<token>", "contextIdentifier": { "type": "onip", "identifier": "<NIP>" } }` — NIE używa Authorization header
2. Z odpowiedzi wyciągnąć `sessionToken` (pole `sessionToken.token` lub `sessionToken.value` w zależności od wersji API)
3. Do endpointu `/online/Invoice/KSeF` przekazać session token w nagłówku `SessionToken: <sessionToken>` (nie Bearer)
4. Zakończenie: `DELETE /online/Session/Terminate` z nagłówkiem `SessionToken: <sessionToken>`

**Obecny błędny kod (fragmenty do zastąpienia):**
```typescript
const initUrl = `${baseUrl}/online/Session/InitSigned`;
// ...
const sessionInitRes = await fetch(initUrl, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${input.token}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  body: JSON.stringify({}),
  // ...
});
const sessionPayload = ...
const sessionToken = sessionPayload.sessionToken || sessionPayload.referenceNumber || sessionPayload.token || input.token;
// ...
const response = await fetch(invoiceUrl, {
  headers: { Authorization: `Bearer ${sessionToken}`, ... },
  // ...
});
// ...
await fetch(terminateUrl, {
  method: 'DELETE',
  headers: { Authorization: `Bearer ${sessionToken}`, ... },
  // ...
});
```

**Wymagany poprawny kod — zastąp całą logikę sesji:**

```typescript
// InitToken — brak Authorization header, token w body
const initUrl = `${baseUrl}/online/Session/InitToken`;

const sessionInitRes = await fetch(initUrl, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  body: JSON.stringify({ authToken: input.token }),
  cache: 'no-store',
  signal: abortController.signal,
});

if (!sessionInitRes.ok) {
  throw new Error(`KSeF InitToken failed: ${sessionInitRes.status}`);
}

const sessionPayload = (await sessionInitRes.json().catch(() => ({}))) as Record<string, any>;
// W KSeF API odpowiedź InitToken ma pole sessionToken (string) lub sessionToken.token
const sessionToken: string =
  (typeof sessionPayload.sessionToken === 'string'
    ? sessionPayload.sessionToken
    : sessionPayload.sessionToken?.token) ??
  sessionPayload.token ??
  '';

if (!sessionToken) {
  throw new Error('KSeF InitToken response did not contain sessionToken');
}

// Pobieranie faktury — nagłówek SessionToken, NIE Authorization Bearer
const response = await fetch(invoiceUrl, {
  method: 'GET',
  headers: {
    SessionToken: sessionToken,
    Accept: 'application/xml, text/xml',
  },
  cache: 'no-store',
  signal: abortController.signal,
});

// ...obsługa błędów bez zmian...

// Terminate — nagłówek SessionToken
await fetch(terminateUrl, {
  method: 'DELETE',
  headers: {
    SessionToken: sessionToken,
    Accept: 'application/json',
  },
  cache: 'no-store',
}).catch(() => null);
```

Zmień **tylko** `lib/ksef-client.ts`. Zachowaj całą logikę retry z exponential backoff, timeout z AbortController, logowanie przez `logger`. Nie zmieniaj sygnatury funkcji `fetchKsefInvoiceXml`. Typy TypeScript mają pozostać strict (no `any` poza istniejącymi w payload).
```

---

## PROMPT 2 — [V5-C2] Utwórz `data/kobize-pl-factors.json` i napraw `loadKobizeFactorsFile`

```
W projekcie Scopeo (Next.js, TypeScript) wykonaj dwie zmiany:

### Zmiana 1: Utwórz plik `data/kobize-pl-factors.json`

Utwórz plik `data/kobize-pl-factors.json` z następującą strukturą (dane KOBiZE 2023, wskaźniki emisyjności dla Polski — publiczne dane z Krajowego Ośrodka Bilansowania i Zarządzania Emisjami):

```json
{
  "schemaVersion": 1,
  "factors": [
    {
      "codeSuffix": "ELEC_GRID_PL",
      "name": "Energia elektryczna z sieci krajowej - Polska",
      "scope": "SCOPE2",
      "categoryCode": "scope2_electricity",
      "factorValue": 0.7309,
      "factorUnit": "kgCO2e/kWh",
      "region": "PL",
      "regionPriority": 1,
      "activityKind": "electricity",
      "year": 2023,
      "tags": "electricity,grid,poland",
      "metadataJson": { "source": "KOBiZE", "publication": "Wartosci opalowe i wskazniki emisji 2023" }
    },
    {
      "codeSuffix": "HEAT_DISTRICT_PL",
      "name": "Cieplo sieciowe - srednia krajowa Polska",
      "scope": "SCOPE2",
      "categoryCode": "scope2_district_heat",
      "factorValue": 0.3248,
      "factorUnit": "kgCO2e/kWh",
      "region": "PL",
      "regionPriority": 1,
      "activityKind": "heat",
      "year": 2023,
      "tags": "heat,district,poland",
      "metadataJson": { "source": "KOBiZE", "publication": "Wartosci opalowe i wskazniki emisji 2023" }
    },
    {
      "codeSuffix": "NATGAS_PL",
      "name": "Gaz ziemny - Polska",
      "scope": "SCOPE1",
      "categoryCode": "scope1_fuel_gas",
      "factorValue": 2.0416,
      "factorUnit": "kgCO2e/m3",
      "region": "PL",
      "regionPriority": 1,
      "activityKind": "natural_gas",
      "year": 2023,
      "tags": "gas,natural_gas,poland",
      "metadataJson": { "source": "KOBiZE", "publication": "Wartosci opalowe i wskazniki emisji 2023" }
    },
    {
      "codeSuffix": "DIESEL_PL",
      "name": "Olej napedowy (diesel) - Polska",
      "scope": "SCOPE1",
      "categoryCode": "scope1_fuel",
      "factorValue": 2.6536,
      "factorUnit": "kgCO2e/l",
      "region": "PL",
      "regionPriority": 1,
      "activityKind": "diesel",
      "year": 2023,
      "tags": "fuel,diesel,poland",
      "metadataJson": { "source": "KOBiZE", "publication": "Wartosci opalowe i wskazniki emisji 2023" }
    },
    {
      "codeSuffix": "PETROL_PL",
      "name": "Benzyna - Polska",
      "scope": "SCOPE1",
      "categoryCode": "scope1_fuel",
      "factorValue": 2.3159,
      "factorUnit": "kgCO2e/l",
      "region": "PL",
      "regionPriority": 2,
      "activityKind": "petrol",
      "year": 2023,
      "tags": "fuel,petrol,benzyna,poland",
      "metadataJson": { "source": "KOBiZE", "publication": "Wartosci opalowe i wskazniki emisji 2023" }
    }
  ]
}
```

### Zmiana 2: Napraw `lib/kobize-pl-factors.ts` — memoizacja + graceful degradation

Zastąp implementację `loadKobizeFactorsFile()`:

```typescript
import fs from 'fs';
import path from 'path';

// ... (typy bez zmian) ...

/** Memoized — czytamy plik tylko raz per process lifetime. */
let _cached: KobizeFactorsFile | null = null;

export function loadKobizeFactorsFile(): KobizeFactorsFile {
  if (_cached) return _cached;
  const customPath = process.env.KOBIZE_FACTORS_JSON_PATH?.trim();
  const defaultPath = path.join(process.cwd(), 'data', 'kobize-pl-factors.json');
  const filePath = customPath || defaultPath;
  let raw: string;
  try {
    raw = fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === 'ENOENT') {
      // Graceful degradation — zwróć pustą strukturę jeśli plik nie istnieje
      // Zamiast crashować cały import faktorów
      return { schemaVersion: 1, factors: [] };
    }
    throw err;
  }
  _cached = JSON.parse(raw) as KobizeFactorsFile;
  return _cached;
}
```

Zachowaj istniejącą funkcję `buildKobizeParsedFactors` bez zmian.
```

---

## PROMPT 3 — [V5-C3] Napraw eksport PDF — obsługa polskich znaków

```
Napraw eksport PDF w `app/api/emissions/export/route.ts`.

**Problem:** `StandardFonts.Helvetica` (pdf-lib) nie obsługuje polskich znaków (ą, ę, ś, ź, ż, ó, ć, ł, ń). Znaki te renderują się jako puste miejsca.

**Rozwiązanie: sanityzacja tekstu przed renderowaniem w PDF**

Dodaj funkcję `sanitizeForPdf` która zamienia polskie litery na ASCII odpowiedniki:

```typescript
/** Zamienia polskie znaki diakrytyczne na ASCII — Standard Type1 fonts nie obsługują Unicode */
function sanitizeForPdf(text: string): string {
  return text
    .replace(/ą/g, 'a').replace(/Ą/g, 'A')
    .replace(/ć/g, 'c').replace(/Ć/g, 'C')
    .replace(/ę/g, 'e').replace(/Ę/g, 'E')
    .replace(/ł/g, 'l').replace(/Ł/g, 'L')
    .replace(/ń/g, 'n').replace(/Ń/g, 'N')
    .replace(/ó/g, 'o').replace(/Ó/g, 'O')
    .replace(/ś/g, 's').replace(/Ś/g, 'S')
    .replace(/ź/g, 'z').replace(/Ź/g, 'Z')
    .replace(/ż/g, 'z').replace(/Ż/g, 'Z')
    // Litery z innych języków które mogą wystąpić
    .replace(/[^\x00-\x7E]/g, '?');
}
```

Zastosuj `sanitizeForPdf()` do KAŻDEGO stringa renderowanego przez `page.drawText(...)`:

W funkcji `toPdf`:
- Tytuł: `sanitizeForPdf('Raport emisji CO2')` (bez zmian bo ASCII)
- Nagłówki kolumn: `sanitizeForPdf(col)` w `drawHeaders`
- Dane wiersza: `sanitizeForPdf(String(row.invoiceNumber ?? ''))`, `sanitizeForPdf(String(row.categoryCode ?? ''))`, `sanitizeForPdf(String(row.factorSource ?? ''))`
- Dane w nagłówku: `sanitizeForPdf(...)` dla scope values

Wrapper pattern — zamień bezpośrednie wywołania `page.drawText(text, ...)` na helper:
```typescript
function drawSafeText(page: PDFPage, text: string, options: Parameters<PDFPage['drawText']>[1]) {
  page.drawText(sanitizeForPdf(text), options);
}
```

Zachowaj całą istniejącą logikę paginacji PDF. Nie zmieniaj eksportu CSV ani XLSX.

**Uwaga:** To rozwiązanie tymczasowe (ASCII fallback). Docelowo rozważ zamianę na `@react-pdf/renderer` który obsługuje Unicode przez fontki TTF — ale to większy refactor na osobny sprint.
```

---

## PROMPT 4 — [V5-H1] Rozszerz klasyfikator NLP o polskie deklinacje i brakujące kategorie

```
Rozszerz `lib/nlp-mapping.ts` — klasyfikator NLP linii faktur dla polskiego rynku.

**Zachowaj istniejące funkcje:** `normalize()`, `tokens()`, `hasAny()` — nie zmieniaj ich.

**Zmiana 1: Rozszerz stopwords o polskie słowa funkcyjne**

```typescript
const stopwords = new Set([
  // istniejące
  'i','oraz','the','for','do','na','z','w','usluga','towar',
  // polskie słowa funkcyjne do dodania
  'za','od','ze','po','przy','przez','przed','nad','pod',
  'lub','czy','nie','jak','jako','sa','sie','ze','to','ten','ta',
  'tych','tego','tej','temu','tym','jest','byl','byla','bylo',
  'sp','zoo','sp','z','o','o','sa','nip','vat','faktura','fv',
]);
```

**Zmiana 2: Rozszerz reguły o polskie formy deklinacyjne i nowe kategorie**

Zastąp blok `candidates.push(...)` w funkcji `classifyInvoiceLine` rozszerzonym zestawem:

```typescript
// SCOPE 2 — energia elektryczna
if (hasAny(ts, ['energia','electricity','prad','power','pradu','energie','pradzie']) || 
    unit === 'kwh' || unit === 'mwh') 
  candidates.push({ scope:'SCOPE2', categoryCode:'scope2_electricity', factorTags:['electricity','grid'], method:'ACTIVITY', confidence: unit === 'kwh' || unit === 'mwh' ? 0.98 : 0.9, ruleMatched:'electricity_kwh_rule', activityUnit:'kWh', activityValue: input.quantity ?? null });

// SCOPE 2 — ciepło sieciowe
if (hasAny(ts, ['cieplo','cieplna','cieplne','heat','ogrzewanie','ogrzewania','grzewcza','centralne'])) 
  candidates.push({ scope:'SCOPE2', categoryCode:'scope2_district_heat', factorTags:['heat','district'], method:'ACTIVITY', confidence: 0.9, ruleMatched:'district_heat_rule', activityUnit:'kWh', activityValue: input.quantity ?? null });

// SCOPE 1 — paliwo płynne (diesel, benzyna)
if (hasAny(ts, ['diesel','olej','napedowy','napedowa','paliwo','paliwa','paliwem','paliwu','benzyna','benzyny','pb95','pb98','lpg']) || 
    ['l','ltr','litr','litry','litrow'].includes(unit)) 
  candidates.push({ scope:'SCOPE1', categoryCode:'scope1_fuel', factorTags:['fuel','diesel'], method:'ACTIVITY', confidence: ['l','ltr','litr','litry','litrow'].includes(unit) ? 0.97 : 0.88, ruleMatched:'diesel_rule', activityUnit:'l', activityValue: input.quantity ?? null });

// SCOPE 1 — gaz ziemny
if (hasAny(ts, ['gaz','gazowy','gazowe','gazownia','ziemny','ziemnego','lpg','cng','lng']) || 
    ['m3','nm3'].includes(unit)) 
  candidates.push({ scope:'SCOPE1', categoryCode:'scope1_fuel_gas', factorTags:['gas','natural_gas'], method:'ACTIVITY', confidence: ['m3','nm3'].includes(unit) ? 0.97 : 0.88, ruleMatched:'gas_rule', activityUnit:'m3', activityValue: input.quantity ?? null });

// SCOPE 3 Cat 6 — podróże służbowe
if (hasAny(ts, ['hotel','flight','lotniczy','lotnicze','lotnicza','air','taxi','uber','bolt','travel','podroz','podrozy','podrozej','delegacja','delegacji','delegacje','rail','pociag','pociagu','autobus','autobusem','nocleg','noclegu'])) 
  candidates.push({ scope:'SCOPE3', categoryCode:'scope3_cat6_business_travel', factorTags:['travel'], method:'SPEND', confidence: 0.93, ruleMatched:'business_travel_rule' });

// SCOPE 3 Cat 4 — transport upstream
if (hasAny(ts, ['kurier','courier','spedycja','transport','shipping','freight','logistics','dhl','fedex','ups','inpost','paczka','paczki','paczke','przesylka','przesylki','dostawa','dostawy','dostawe'])) 
  candidates.push({ scope:'SCOPE3', categoryCode:'scope3_cat4_transport', factorTags:['transport','shipping'], method:'SPEND', confidence: 0.91, ruleMatched:'upstream_transport_rule' });

// SCOPE 3 Cat 5 — odpady
if (hasAny(ts, ['odpad','odpady','odpadow','odpadem','waste','recycling','utylizacja','utylizacji','disposal','wywoz','smietnik'])) 
  candidates.push({ scope:'SCOPE3', categoryCode:'scope3_cat5_waste', factorTags:['waste'], method:'SPEND', confidence: 0.9, ruleMatched:'waste_rule' });

// SCOPE 3 Cat 2 — dobra kapitałowe (sprzęt)
if (hasAny(ts, ['komputer','komputera','komputery','laptop','laptopa','laptopy','serwer','monitor','drukarka','vehicle','samochod','samochodu','samochody','maszyna','maszyny','sprzet','sprzetu','urzadzenie','urzadzenia'])) 
  candidates.push({ scope:'SCOPE3', categoryCode:'scope3_cat2_capital_goods', factorTags:['capex','equipment'], method:'SPEND', confidence: 0.87, ruleMatched:'capital_goods_rule' });

// SCOPE 3 Cat 1 — usługi niematerialne (IT, consulting, SaaS)
if (hasAny(ts, ['consulting','doradztwo','doradztwa','software','saas','licencja','licencji','marketing','uslugi','uslug','abonament','abonamentu','subscription','hosting','hostingu','serwis','serwisu','wsparcie','wsparcia','szkol','szkolenie','szkolenia'])) 
  candidates.push({ scope:'SCOPE3', categoryCode:'scope3_cat1_purchased_services', factorTags:['services','software'], method:'SPEND', confidence: 0.84, ruleMatched:'services_rule' });

// SCOPE 3 Cat 1 — materiały / dobra fizyczne
if (hasAny(ts, ['stal','stali','steel','cement','beton','betonu','material','materialy','materialow','papier','papieru','opakowania','opakowan','surowiec','surowca','drewno','drewna','tworzywo'])) 
  candidates.push({ scope:'SCOPE3', categoryCode:'scope3_cat1_purchased_goods', factorTags:['materials','goods'], method:'SPEND', confidence: 0.86, ruleMatched:'materials_rule' });

// SCOPE 3 Cat 1 — telekomunikacja / media
if (hasAny(ts, ['telefon','telefonu','telekomunikacja','internet','internetu','siec','sieci','gsm','mobile','kom','abonament'])) 
  candidates.push({ scope:'SCOPE3', categoryCode:'scope3_cat1_purchased_services', factorTags:['telecom','services'], method:'SPEND', confidence: 0.82, ruleMatched:'telecom_rule' });

// SCOPE 3 Cat 1 — najem / leasing
if (hasAny(ts, ['najem','najmu','najemc','dzierzawa','dzierzawy','leasing','leasingu','wynajem','wynajmu','renta','czynsz','czynsze','czynszu'])) 
  candidates.push({ scope:'SCOPE3', categoryCode:'scope3_cat1_purchased_services', factorTags:['lease','rent'], method:'SPEND', confidence: 0.8, ruleMatched:'lease_rule' });

// Fallback
if (candidates.length === 0) 
  candidates.push({ scope:'SCOPE3', categoryCode:'scope3_cat1_purchased_services', factorTags:['services'], method:'SPEND', confidence: 0.35, ruleMatched:'fallback_services_rule' });
```

Zachowaj istniejące sortowanie i zwracanie wyniku. Nie zmieniaj sygnatury `classifyInvoiceLine`.
```

---

## PROMPT 5 — [V5-H2] Dodaj limit wierszy w `calculateOrganizationEmissions` + eksporcie

```
Napraw potencjalny OOM w `lib/emissions.ts` i `app/api/emissions/export/route.ts`.

**Zmiana 1: `lib/emissions.ts` — dodaj opcję limitu i pagination**

W funkcji `calculateOrganizationEmissions` dodaj opcję `maxLines`:

```typescript
export async function calculateOrganizationEmissions(
  organizationId: string,
  reportYear?: number,
  options: { persist?: boolean; maxLines?: number } = { persist: false }
) {
  // ...istniejące dateFilter...
  
  const MAX_LINES = options.maxLines ?? 50_000;
  
  const lines = await prisma.invoiceLine.findMany({
    where: { invoice: { organizationId, ...(dateFilter ? { issueDate: dateFilter } : {}) } },
    include: { emissionFactor: { include: { emissionSource: true } }, mappingDecision: true, invoice: true },
    take: MAX_LINES,
    orderBy: { id: 'asc' }, // stabilna kolejność dla paginacji
  });
  
  const truncated = lines.length >= MAX_LINES;
  
  // ...reszta bez zmian...
  
  return {
    scope1, scope2, scope3, totalKg, byCategory, calculations,
    reportYear: reportYear ?? null,
    snapshot,
    truncated,      // nowe pole — true jeśli osiągnięto limit
    linesLoaded: lines.length,
  };
}
```

**Zmiana 2: `app/api/emissions/export/route.ts` — obsłuż `truncated` w odpowiedzi**

W handlerze GET, po wywołaniu `calculateOrganizationEmissions`:
```typescript
const result = await calculateOrganizationEmissions(organizationId, validReportYear, {
  persist: false,
  maxLines: 50_000,
});

// Dla CSV — dodaj nagłówek ostrzegający o obcięciu
if (result.truncated) {
  // Dodaj wiersz na końcu CSV
  // lub odpowiedz z 206 Partial Content
}
```

Dla odpowiedzi CSV dodaj komentarz w pierwszej linii jeśli `truncated`:
```typescript
function toCsv(result: ...) {
  const truncationWarning = (result as any).truncated 
    ? `# UWAGA: Dane obciete do ${(result as any).linesLoaded} wierszy\n` 
    : '';
  // ...reszta bez zmian...
  return `${truncationWarning}${headers.join(',')}\n${rows.join('\n')}`;
}
```
```

---

## PROMPT 6 — [V5-H3] Zrównoleglij zapytania DB na stronie Dashboard

```
Zoptymalizuj `app/dashboard/page.tsx` — zastąp sekwencyjne zapytania do bazy danych równoległymi.

**Problem:** 10+ zapytań Prisma wykonywanych sekwencyjnie (~200ms+). Niezależne zapytania można wywołać równolegle z `Promise.all`.

**Zachowaj bez zmian:**
- `requireTenantMembership()` — musi być pierwsze (potrzebuje `organizationId`)
- `prisma.invoice.findMany(...)` — musi być przed obliczeniem `emissionMap` i `lineCategoryCodes`
- `prisma.emissionFactor.findMany(...)` — potrzebuje `lineCategoryCodes` z powyższego

**Zastąp sekwencyjne zapytania po `requireTenantMembership()` blokiem `Promise.all`:**

```typescript
const { session, organizationId, membership } = await requireTenantMembership();

// ... params, page, selectedYear, skip, issueDateFilter bez zmian ...

// BATCH 1: zapytania niezależne od wyników innych
const [profile, org, invoicesTotal, invoices, factorCount, importRuns, history, latestCalculation] =
  await Promise.all([
    prisma.carbonProfile.findUnique({ where: { organizationId } }),
    prisma.organization.findUnique({ where: { id: organizationId } }),
    prisma.invoice.count({
      where: { organizationId, ...(issueDateFilter ? { issueDate: issueDateFilter } : {}) },
    }),
    prisma.invoice.findMany({
      where: { organizationId, ...(issueDateFilter ? { issueDate: issueDateFilter } : {}) },
      include: {
        supplier: true,
        lines: {
          include: {
            emissionFactor: { include: { emissionSource: true } },
            mappingDecision: true,
          },
        },
      },
      orderBy: { issueDate: 'desc' },
      skip,
      take: invoicePageSize,
    }),
    prisma.emissionFactor.count({ where: { organizationId } }),
    prisma.factorImportRun.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
    prisma.reviewEvent.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    prisma.emissionCalculation.findFirst({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

// Obliczenia na podstawie invoices — bez zmian
const lines = invoices.flatMap((i) => i.lines);
const emissionMap = ...; // bez zmian
const lineCategoryCodes = [...new Set(lines.map(...))];

// BATCH 2: zależy od lineCategoryCodes (musi być po BATCH 1)
const [factors, sources] = await Promise.all([
  prisma.emissionFactor.findMany({
    where: {
      organizationId,
      ...(lineCategoryCodes.length > 0 ? { categoryCode: { in: lineCategoryCodes } } : {}),
    },
    include: { emissionSource: true },
    orderBy: [{ regionPriority: 'asc' }, { year: 'desc' }],
    take: 200,
  }),
  prisma.emissionSource.findMany({
    where: { organizationId },
    orderBy: { code: 'asc' },
  }),
]);
```

Zachowaj całą resztę komponentu JSX bez zmian. Tylko reorganizuj wywołania Prisma.
```

---

## PROMPT 7 — [V5-H4] Napraw `.env.example`: AUTH_SECRET → NEXTAUTH_SECRET + uzupełnienie

```
Napraw plik `.env.example` w projekcie Next.js z NextAuth v4.

**Problem 1:** Zmienna `AUTH_SECRET` to nazwa z Auth.js v5. NextAuth v4 czyta `NEXTAUTH_SECRET`. Jeśli deweloper skopiuje `.env.example` i ustawi `AUTH_SECRET`, NextAuth v4 nie znajdzie sekretu.

**Poprawka:** Zmień linię:
```
AUTH_SECRET="wygeneruj-openssl-rand-base64-32"
```
na:
```
NEXTAUTH_SECRET="wygeneruj-openssl-rand-base64-32"
# Generuj przez: openssl rand -base64 32
```

**Problem 2:** Brakuje zmiennych dokumentujących nowe funkcjonalności v5.

Dodaj po istniejących zmiennych sekcję:
```
# KOBiZE PL — opcjonalnie nadpisz ścieżkę do pliku z faktorami (domyślnie: data/kobize-pl-factors.json)
# KOBIZE_FACTORS_JSON_PATH="/abs/path/kobize-pl-factors.json"

# Worker KSeF — wewnętrzny URL dla self-call z crona (domyślnie: NEXTAUTH_URL)
# INTERNAL_WORKER_URL="http://localhost:3000"
```

**Problem 3:** Brakuje `FACTOR_IMPORT_*` zmiennych jako aktywnych (nie zakomentowanych) z sensownymi wartościami domyślnymi dla dev.

Odkomentuj i ustaw sensowne defaults:
```
FACTOR_IMPORT_DATA_YEAR=2024
FACTOR_IMPORT_UK_DATA_YEAR=2024
FACTOR_IMPORT_EPA_DATA_YEAR=2024
FACTOR_IMPORT_UK_GHG_COLUMN="GHG Conversion Factor 2024"
# FACTOR_IMPORT_UK_FLAT_XLSX_URL — pobierz z: https://www.gov.uk/government/publications/greenhouse-gas-reporting-conversion-factors
# FACTOR_IMPORT_EPA_HUB_XLSX_URL — pobierz z: https://www.epa.gov/climateleadership/ghg-emission-factors-hub
```

Nie zmieniaj żadnych innych plików.
```

---

## PROMPT 8 — [V5-M2+M6] Napraw rate limiting GDPR + email review fire-and-forget

```
Dwie małe poprawki bezpieczeństwa i performance w projekcie Scopeo:

### Zmiana 1: Rate limiting na POST `/api/gdpr/requests`

W pliku `app/api/gdpr/requests/route.ts`, w funkcji `POST`, dodaj rate limiting PRZED `createRequestSchema.parse(body)`:

```typescript
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  const organizationId = (session.user as any).organizationId as string;
  const role = (session.user as any).role as string | null | undefined;
  
  // NOWE: rate limiting — maks. 10 wniosków GDPR na godzinę per user
  const userId = session.user.id as string;
  const { checkRateLimit, getClientIp } = await import('@/lib/security');
  const ip = getClientIp(req.headers);
  const rl = await checkRateLimit(`gdpr-request:${organizationId}:${userId}:${ip}`, {
    windowMs: 60 * 60 * 1000, // 1h
    maxRequests: 10,
  });
  if (!rl.ok) {
    return NextResponse.json(
      { ok: false, error: 'Zbyt wiele wniosków GDPR. Spróbuj za godzinę.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfterSec) } }
    );
  }
  
  // ...reszta bez zmian...
}
```

### Zmiana 2: Email review — fire-and-forget

W pliku `app/api/review/update/route.ts`, zmień `await resend.emails.send(...)` na fire-and-forget:

```typescript
// PRZED (blokujące):
const emailResult = await resend.emails.send({ ... });
if (emailResult.error) { logger.warn(...) }

// PO (fire-and-forget — nie blokuje odpowiedzi):
resend.emails.send({
  from: fromEmail,
  to: workflowRecipient,
  subject: `Scopeo review: ${before.status} -> ${after.status}`,
  text: [...].join('\n'),
}).then((emailResult) => {
  if (emailResult.error) {
    logger.warn({
      context: 'review_update',
      message: 'Workflow email send failed (async)',
      organizationId,
      error: emailResult.error.message,
    });
  }
}).catch((err: unknown) => {
  logger.warn({
    context: 'review_update',
    message: 'Workflow email send threw (async)',
    organizationId,
    error: err instanceof Error ? err.message : 'unknown',
  });
});
// Bez await — nie blokujemy odpowiedzi
```

Zachowaj całą logikę warunkową (`if (resendKey && workflowRecipient && fromEmail)`).
```

---

## PROMPT 9 — [V5-M3+M8+M9] Password min 12, usuń NEXTAUTH_URL z env bloku, napraw self-call URL

```
Trzy małe poprawki konfiguracyjne w projekcie Scopeo:

### Zmiana 1: `lib/schema.ts` — hasło min 12 znaków

```typescript
// PRZED:
export const registerSchema = z.object({
  ...
  password: z.string().min(8),
  ...
});

// PO:
export const registerSchema = z.object({
  ...
  password: z.string()
    .min(12, 'Hasło musi mieć co najmniej 12 znaków')
    .max(128, 'Hasło nie może przekraczać 128 znaków'),
  ...
});
```

### Zmiana 2: `next.config.ts` — usuń NEXTAUTH_URL z bloku `env:`

```typescript
// PRZED:
const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'http://localhost:3000',  // USUNĄĆ
  },
  // ...
};

// PO:
const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  // Usunięto blok env: — NEXTAUTH_URL jest zmienną serwerową NextAuth
  // nie powinna być eksponowana do bundla klienta
  // ...
};
```

### Zmiana 3: `app/api/cron/ksef-worker/route.ts` — użyj dedykowanego URL dla self-call

```typescript
// PRZED:
const workerUrl = new URL(
  '/api/ksef/jobs/process',
  process.env.NEXTAUTH_URL ?? 'http://localhost:3000'
);

// PO:
// INTERNAL_WORKER_URL — URL dla wewnętrznych self-call (może być localhost na serwerze)
// Jeśli nie ustawione, fallback do NEXTAUTH_URL (np. na Vercel)
const baseWorkerUrl = 
  process.env.INTERNAL_WORKER_URL?.trim() || 
  process.env.NEXTAUTH_URL?.trim() || 
  'http://localhost:3000';

const workerUrl = new URL('/api/ksef/jobs/process', baseWorkerUrl);
```

Zaktualizuj `.env.example` — dodaj (po `NEXTAUTH_URL`):
```
# Wewnętrzny URL dla self-call z crona. Na Vercel zostaw puste (użyje NEXTAUTH_URL).
# Na własnym serwerze ustaw na http://localhost:3000 aby uniknąć zewnętrznego ruchu.
# INTERNAL_WORKER_URL=""
```
```

---

## PROMPT 10 — [V5-M10] Napraw paginację Dashboard — aria-disabled nie działa

```
Napraw paginację w `app/dashboard/page.tsx`.

**Problem:** `<Link aria-disabled={page <= 1}>` nie blokuje kliknięcia — `aria-disabled` to atrybut semantyczny, nie wyłącza nawigacji.

**Zastąp oba linki paginacji** (Poprzednia i Następna strona) warunkowymi komponentami:

```typescript
// PRZED:
<Link
  className="btn btn-secondary"
  href={`/dashboard?page=${Math.max(1, page - 1)}${selectedYear ? `&year=${selectedYear}` : ''}`}
  aria-disabled={page <= 1}
>
  Poprzednia strona
</Link>
<Link
  className="btn btn-secondary"
  href={`/dashboard?page=${Math.min(totalPages, page + 1)}${selectedYear ? `&year=${selectedYear}` : ''}`}
  aria-disabled={page >= totalPages}
>
  Następna strona
</Link>

// PO:
{page > 1 ? (
  <Link
    className="btn btn-secondary"
    href={`/dashboard?page=${page - 1}${selectedYear ? `&year=${selectedYear}` : ''}`}
  >
    Poprzednia strona
  </Link>
) : (
  <span
    className="btn btn-secondary"
    style={{ opacity: 0.4, cursor: 'not-allowed', pointerEvents: 'none' }}
    aria-disabled="true"
  >
    Poprzednia strona
  </span>
)}
{page < totalPages ? (
  <Link
    className="btn btn-secondary"
    href={`/dashboard?page=${page + 1}${selectedYear ? `&year=${selectedYear}` : ''}`}
  >
    Następna strona
  </Link>
) : (
  <span
    className="btn btn-secondary"
    style={{ opacity: 0.4, cursor: 'not-allowed', pointerEvents: 'none' }}
    aria-disabled="true"
  >
    Następna strona
  </span>
)}
```

Nie zmieniaj żadnych innych elementów strony. Tylko te dwa linki paginacji.
```

---

## Kolejność wdrożenia

| Priorytet | Prompt | Ryzyko |
|-----------|--------|--------|
| 1 (pilne) | Prompt 1 — KSeF InitToken | Bez tego 0 faktur KSeF |
| 2 (pilne) | Prompt 2 — kobize-pl-factors.json | Crash przy imporcie PL |
| 3 (pilne) | Prompt 7 — AUTH_SECRET fix | Ryzyko utraty sesji prod |
| 4 | Prompt 3 — PDF polskie znaki | Zepsute eksporty |
| 5 | Prompt 4 — NLP rozszerzony | Błędna klasyfikacja ~30% linii |
| 6 | Prompt 6 — Dashboard Promise.all | Powolny dashboard |
| 7 | Prompt 5 — limit wierszy emisji | OOM przy dużych danych |
| 8 | Prompt 8 — rate limit GDPR + email async | Security + performance |
| 9 | Prompt 9 — password 12 + env fixes | Security + config |
| 10 | Prompt 10 — paginacja UX | UX |
