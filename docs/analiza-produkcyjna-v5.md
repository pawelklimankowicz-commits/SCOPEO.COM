# Analiza produkcyjna Scopeo SaaS — v5

> Data: 2026-04-14  
> Podstawa: pełny przegląd kodu po zmianach v4→v5  
> Poprzednie raporty: v1, v2, v3, v4

---

## Co zostało naprawione między v4 a v5 ✅

Poniższe problemy z wcześniejszych raportów są potwierdzone jako naprawione:

| # | Problem | Dowód w kodzie |
|---|---------|----------------|
| 1 | IDOR w review/update | `findFirst({ where: { id, invoice: { organizationId } } })` |
| 2 | Brak role check w `/api/factors/import` | `if (role !== 'OWNER' && role !== 'ADMIN') return 403` |
| 3 | Brak role check w `/api/onboarding` | `if (role !== 'OWNER' && role !== 'ADMIN') return 403` |
| 4 | N+1 w ksef-import-service | `resolveBestFactorsForCategories` + `createManyAndReturn` |
| 5 | Re-import kasuje zatwierdzone linie | `lineFingerprint` + `PRESERVE_DECISION_STATUSES` |
| 6 | Hardcoded URL/kolumna w factor-import | `resolveFactorImportConfig()` z env vars |
| 7 | Brak timeout w fetchFactorWorkbook | `AbortController` z 25s limitem |
| 8 | Rate limiting logowania tylko po emailu | Dodano per-IP limit w `authorize(credentials, req)` |
| 9 | Brak faktorów KOBiZE PL | `lib/kobize-pl-factors.ts` + `buildKobizeParsedFactors()` |
| 10 | PrismaAdapter w JWT auth | Usunięto — `lib/auth.ts` działa bez adaptera |
| 11 | bcrypt rounds = 10 | `BCRYPT_SALT_ROUNDS = 12` w `lib/password-hash.ts` |
| 12 | Duplikaty EmissionCalculation | `emissionPersistFingerprint()` w `lib/emissions.ts` |
| 13 | Dashboard ładuje wszystkie faktory | `take: 200` z filtrem `categoryCode: { in: lineCategoryCodes }` |

---

## Problemy aktualne w v5 — do naprawy

### 🔴 KRYTYCZNE — blokują produkcję

---

#### [V5-C1] KSeF client używa `InitSigned` zamiast `InitToken`

**Plik:** `lib/ksef-client.ts`, linia 17  
**Problem:** Endpoint `POST /online/Session/InitSigned` służy do uwierzytelniania kwalifikowanym podpisem elektronicznym (certyfikat XML). Aplikacja używa go z `Authorization: Bearer {token}`, co jest protokolarnie błędne — API odrzuci każde żądanie. Dla uwierzytelnienia tokenem API właściwy endpoint to `POST /online/Session/InitToken`, a token trafia w ciele żądania (`{ "authToken": "..." }`), nie w nagłówku.

```typescript
// OBECNE (błędne):
const initUrl = `${baseUrl}/online/Session/InitSigned`;
// ...fetch z Authorization: `Bearer ${input.token}`

// POPRAWNE:
const initUrl = `${baseUrl}/online/Session/InitToken`;
// body: JSON.stringify({ authToken: input.token, contextIdentifier: { type: 'onip', identifier: 'NIP' } })
// sessionToken z response.sessionToken
```

**Wpływ:** Żaden import KSeF z produkcyjnego API nie zadziała. Całe flow fetchowania faktur jest zepsute.

---

#### [V5-C2] `data/kobize-pl-factors.json` nie istnieje w repozytorium

**Plik:** `lib/kobize-pl-factors.ts`, linia 44; `data/kobize-pl-factors.json` — brak pliku  
**Problem:** Funkcja `loadKobizeFactorsFile()` czyta plik JSON przez `fs.readFileSync`. Plik `data/kobize-pl-factors.json` nie istnieje w repozytorium (nie jest w `.gitignore`, po prostu go nie ma). Każde wywołanie `importExternalFactors()` będzie rzucać `ENOENT: no such file or directory`. Import faktorów KOBiZE jest całkowicie zablokowany.

**Co zrobić:**
1. Utworzyć plik `data/kobize-pl-factors.json` z danymi z publikacji KOBiZE (wskaźniki emisyjności dla energii elektrycznej i ciepła sieciowego dla Polski).
2. Dodać go do repozytorium (dane są publiczne, nie wrażliwe).
3. Dodać obsługę błędu w `loadKobizeFactorsFile()` gdy plik nie istnieje (graceful degradation).

**Przykładowa minimalna struktura pliku:**
```json
{
  "schemaVersion": 1,
  "factors": [
    {
      "codeSuffix": "ELEC_GRID_PL",
      "name": "Energia elektryczna z sieci - Polska",
      "scope": "SCOPE2",
      "categoryCode": "scope2_electricity",
      "factorValue": 0.7309,
      "factorUnit": "kgCO2e/kWh",
      "region": "PL",
      "regionPriority": 1,
      "activityKind": "electricity",
      "year": 2023
    }
  ]
}
```

---

#### [V5-C3] Eksport PDF nie obsługuje polskich znaków

**Plik:** `app/api/emissions/export/route.ts`, linia 43  
**Problem:** `pdf-lib` używa `StandardFonts.Helvetica` (Type1 font, zakodowany w WinAnsi/Latin-1). Polskie znaki diakrytyczne (ą ę ś ź ż ó ć ł ń) nie są obsługiwane — będą renderowane jako puste miejsca lub znaki zapytania. Kody kategorii (`scope2_electricity`) są ASCII, ale opisy linii faktur i nazwy dostawców mogą zawierać polskie litery.

**Rozwiązanie:** Osadzić font TTF z obsługą Unicode (np. Noto Sans, Liberation Sans), używając `pdfDoc.embedFont(fontBytes)`. Alternatywnie przejść na bibliotekę `puppeteer`/`@react-pdf/renderer` która renderuje HTML→PDF i obsługuje Unicode przez CSS.

---

### 🟠 HIGH — istotne braki funkcjonalne lub bezpieczeństwo

---

#### [V5-H1] Kalsyfikator NLP — niekompletne słownictwo polskie, brak stemming

**Plik:** `lib/nlp-mapping.ts`  
**Problem:** Klasyfikator opiera się na dopasowaniu dokładnych tokenów (`ts.includes(w)`). Polskie słowa deklinują się (paliwo/paliwa/paliwie/paliwem), więc:
- `hasAny(ts, ['paliwo'])` — pasuje do `paliwo` ale nie do `paliwa`, `paliwem`, `paliwem`, `paliwie`
- Brakuje kategorii: `gaz` (scope1_fuel_gas), media komunalne (scope2_district_heat vs scope1_gas), `leasing`/`najem` (scope3_cat6), `żywność`/`artykuły spożywcze` (scope3_cat1), `ubezpieczenie` (scope3_cat1_services), `opłata pocztowa`, `znaczek`

**Stopwords** zawiera tylko 8 słów — brakuje: `za`, `od`, `ze`, `po`, `przy`, `przez`, `przed`, `nad`, `pod`, `i`, `lub`, `czy`, `nie`, `jak`, `jako`, `są`, `się`, `na`, `że`.

**Fallback:** Wszystkie niezidentyfikowane linie trafiają do `scope3_cat1_purchased_services` z confidence 0.45. Dla typowej polskiej firmy to może być 30-50% linii — znaczący błąd klasyfikacji.

---

#### [V5-H2] Brak limitu wierszy w `calculateOrganizationEmissions` i eksporcie

**Pliki:** `lib/emissions.ts` linia 59; `app/api/emissions/export/route.ts` linia 143  
**Problem:**
```typescript
const lines = await prisma.invoiceLine.findMany({
  where: { invoice: { organizationId, ... } },
  // brak take!
});
```
Dla organizacji z 10 000+ faktur i >50 000 linii — OOM lub timeout 30s na eksport. Eksport i kalkulacja używają tego samego `calculateOrganizationEmissions()` bez limitu.

**Rozwiązanie:** Dodać paginację lub streaming w `calculateOrganizationEmissions`. Dla eksportu — użyć `cursor`-based pagination i streamować odpowiedź, lub dodać limit np. `take: 10_000` z informacją w nagłówku.

---

#### [V5-H3] Dashboard: 11 sekwencyjnych zapytań do bazy danych

**Plik:** `app/dashboard/page.tsx`  
**Problem:** Strona wykonuje sekwencyjnie:
1. `carbonProfile.findUnique`
2. `organization.findUnique`
3. `invoice.count`
4. `invoice.findMany` (z include — ciężkie)
5. `emissionFactor.count`
6. `emissionFactor.findMany`
7. `emissionSource.findMany`
8. `factorImportRun.findMany`
9. `reviewEvent.findMany`
10. `emissionCalculation.findFirst`
(+ `requireTenantMembership` wewnętrznie)

Zapytania 1-2 i 3-10 są niezależne — całkowity czas to suma czasów wszystkich zapytań. Przy 20ms/query = ~220ms sekwencyjnie vs ~60ms równolegle.

**Rozwiązanie:** Zgrupować niezależne zapytania w `Promise.all`.

---

#### [V5-H4] `AUTH_SECRET` vs `NEXTAUTH_SECRET` w `.env.example`

**Plik:** `.env.example`, linia 2  
**Problem:** Aplikacja używa NextAuth v4, który czyta `NEXTAUTH_SECRET`. Plik `.env.example` dokumentuje zmienną jako `AUTH_SECRET` (nazwa z Auth.js v5). Deweloper kopiujący `.env.example` ustawi `AUTH_SECRET` i NextAuth v4 **nie znajdzie sekretu** — może działać z losowym sekretem na każdy restart, co unieważnia wszystkie sesje.

**Poprawka:** Zmienić w `.env.example` na `NEXTAUTH_SECRET`.

---

### 🟡 MEDIUM — jakość, optymalizacja, UX

---

#### [V5-M1] `fs.readFileSync` blokuje event loop w `kobize-pl-factors.ts`

**Plik:** `lib/kobize-pl-factors.ts`, linia 44  
**Problem:** `fs.readFileSync(filePath, 'utf8')` blokuje event loop Node.js synchronicznie przy każdym imporcie faktorów. Plik JSON z setkami faktorów może być duży.

**Rozwiązanie:** Zmemoizować wynik przy pierwszym ładowaniu:
```typescript
let _cachedFactors: KobizeFactorsFile | null = null;
export function loadKobizeFactorsFile(): KobizeFactorsFile {
  if (_cachedFactors) return _cachedFactors;
  // ...readFileSync...
  _cachedFactors = parsed;
  return _cachedFactors;
}
```

---

#### [V5-M2] `persistFactors` — N+1 upserts przy zapisie faktorów

**Plik:** `lib/factor-import.ts` (funkcja `persistFactors`)  
**Problem:** Pętla iteruje przez każdy faktor i wykonuje indywidualny `prisma.emissionFactor.upsert()`. Przy imporcie UK Gov (~1500 faktorów) + EPA (~800) + KOBiZE (dziesiątki) = 2300+ oddzielnych zapytań do bazy danych. Import trwa wiele minut.

**Rozwiązanie:** Batch upsert przez `prisma.emissionFactor.createMany({ skipDuplicates: true })` dla nowych + `updateMany` dla istniejących, lub PostgreSQL `INSERT ... ON CONFLICT DO UPDATE`.

---

#### [V5-M3] Hasło minimalna długość 8 znaków

**Plik:** `lib/schema.ts`, linia 2  
**Problem:** `z.string().min(8)` — OWASP ASVS Level 1 wymaga minimum 12 znaków. 8 znaków to standard z lat 2010.

**Poprawka:** `z.string().min(12).max(128)` + komunikat błędu po polsku.

---

#### [V5-M4] Email review wysyłany synchronicznie w handlerze

**Plik:** `app/api/review/update/route.ts`, linia 68  
**Problem:** `await resend.emails.send(...)` blokuje odpowiedź o latencję Resend (50-500ms). Przy każdej akcji review (APPROVE/REJECT/etc.) użytkownik czeka na wysłanie emaila.

**Rozwiązanie:** Fire-and-forget: `resend.emails.send(...).catch(logger.warn)` bez `await`, lub enqueue do background job.

---

#### [V5-M5] CSP `connect-src 'self' https:` — zbyt szeroki

**Plik:** `middleware.ts`, linia 22  
**Problem:** `connect-src 'self' https:` pozwala frontendowi połączyć się z dowolnym hostem HTTPS. Zmniejsza skuteczność CSP jako zabezpieczenia przed exfiltracją danych.

**Poprawka:** Whitelist tylko potrzebnych domen:
```
connect-src 'self' https://o*.ingest.sentry.io https://*.sentry.io
```

---

#### [V5-M6] Brak rate limitingu na POST `/api/gdpr/requests`

**Plik:** `app/api/gdpr/requests/route.ts`  
**Problem:** Endpoint tworzenia wniosków GDPR nie ma rate limitingu. Każdy uwierzytelniony użytkownik może wysłać tysiące żądań ACCESS/ERASURE. Choć są uwierzytelnione, mogą zafloodować admina powiadomieniami i wpisy w bazie.

**Poprawka:** Dodać `checkRateLimit(`gdpr-request:${organizationId}:${userId}`, { windowMs: 60*60*1000, maxRequests: 5 })`.

---

#### [V5-M7] Brak per-job timeout w workerze KSeF

**Plik:** `app/api/ksef/jobs/process/route.ts`  
**Problem:** Budżet czasu sprawdzany jest PRZED rozpoczęciem joba, ale nie przerywa trwającego joba. `fetchKsefInvoiceXml` może potrwać `KSEF_FETCH_MAX_ATTEMPTS × KSEF_FETCH_TIMEOUT_MS` = `4 × 15s = 60s` — przekracza domyślny budżet 52s. Jeden "ciężki" job może zablokować cały batch.

**Rekomendacja:** Ustawić `KSEF_FETCH_MAX_ATTEMPTS=2` lub obniżyć `KSEF_FETCH_TIMEOUT_MS=10000` (2×10s = 20s max/job, zostawiając budżet na 2-3 joby).

---

#### [V5-M8] `NEXTAUTH_URL` wyciekające do bundla klienta

**Plik:** `next.config.ts`, linia 7-9  
**Problem:**
```typescript
env: {
  NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'http://localhost:3000',
},
```
Blok `env:` w `next.config.ts` eksponuje zmienne do bundla klienta przez `process.env.NEXTAUTH_URL`. `NEXTAUTH_URL` to zmienna serwerowa NextAuth — nie powinna być widoczna po stronie klienta (ujawnia wewnętrzny URL serwera).

**Poprawka:** Usunąć `NEXTAUTH_URL` z bloku `env:`. Jeśli URL aplikacji jest potrzebny po stronie klienta — używać `NEXT_PUBLIC_APP_URL`.

---

#### [V5-M9] Self-call w cron używa `NEXTAUTH_URL` (zewnętrzny URL)

**Plik:** `app/api/cron/ksef-worker/route.ts`, linia 24  
**Problem:**
```typescript
const workerUrl = new URL('/api/ksef/jobs/process', process.env.NEXTAUTH_URL ?? 'http://localhost:3000');
```
Na Vercel cron wywołuje `/api/ksef/jobs/process` przez `NEXTAUTH_URL` (np. `https://app.scopeo.com`) zamiast przez sieć wewnętrzną. Zwiększa latencję, zużywa zewnętrzne połączenie, naraża wewnętrzne API na publiczny internet.

**Poprawka:** Dodać `INTERNAL_WORKER_URL` do `.env.example`:
```
INTERNAL_WORKER_URL="http://localhost:3000"  # Vercel: pozostaw puste, użyje NEXTAUTH_URL
```

---

#### [V5-M10] Paginacja dashboard — `aria-disabled` nie blokuje kliknięcia

**Plik:** `app/dashboard/page.tsx`, linie 281-292  
**Problem:** `<Link aria-disabled={page <= 1}>` — `aria-disabled` to atrybut semantyczny dostępności, nie blokuje nawigacji. Użytkownik może kliknąć „Poprzednia strona" na stronie 1 i nie stać się nic (lub odświeży stronę z tym samym page=1), ale UX jest mylący.

**Poprawka:** Renderować `<span>` zamiast `<Link>` gdy dezaktywowany, lub dodać `tabIndex={-1}` i CSS `pointer-events: none`.

---

#### [V5-M11] `lib/nlp-mapping.ts` — `scope3_cat1_purchased_services` i `scope3_cat1_purchased_goods` to ta sama kategoria GHG Cat 1

**Plik:** `lib/nlp-mapping.ts`, linie 17-18  
**Problem:** Obie reguły (`services_rule` i `materials_rule`) mapują na kategorię 1 (Purchased Goods and Services) GHG Protocol, ale używają różnych `categoryCode`. W bazie mogą być dwa różne faktory dla tej samej kategorii, a obliczenia sumują się podwójnie jeśli faktory są rozbite.

**Rekomendacja:** Zunifikować nazwy kategorii z GHG Protocol (Cat1, Cat2... Cat15) i upewnić się, że faktory są przypisane do właściwych kodów.

---

## Podsumowanie v5

| Priorytet | Liczba | Status |
|-----------|--------|--------|
| 🔴 Krytyczne | 3 | Do natychmiastowej naprawy przed wdrożeniem prod |
| 🟠 High | 4 | Do naprawy w sprint 1 po wdrożeniu |
| 🟡 Medium | 8 | Do naprawy w sprint 2-3 |

### TOP 3 priorytety:
1. **[V5-C1]** Naprawić endpoint KSeF: `InitSigned` → `InitToken` — bez tego żaden import KSeF nie działa
2. **[V5-C2]** Dodać plik `data/kobize-pl-factors.json` — bez tego import faktorów PL crashuje
3. **[V5-H4]** Zmienić `AUTH_SECRET` → `NEXTAUTH_SECRET` w `.env.example` — risk utraty sesji w produkcji
