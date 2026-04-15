# Analiza produkcyjna Scopeo SaaS — v4

**Data analizy:** 2026-04-14  
**Podstawa:** Pełny przegląd kodu po czwartym cyklu zmian  
**Poprzednie raporty:** v1 → v2 → v3 → **v4 (niniejszy)**

---

## Co zostało naprawione od v3 ✅

| Problem v3 | Status |
|---|---|
| Rate limiter in-memory → Upstash Redis | ✅ Naprawione (`lib/security.ts`) |
| Nadpisanie hasła przy invite accept | ✅ Naprawione — explicit check |
| Brak rate limit na rejestracji | ✅ Dodane — 5/godz per IP |
| Export tworzy EmissionCalculation | ✅ Naprawione — `persist: false` |
| PDF obcięty do 20 wierszy | ✅ Naprawione — pełna paginacja |
| Cicha porażka wysyłki emaila | ✅ Naprawione — rzuca błąd |
| `registryNote` → `registryDetails` | ✅ OK (grep potwierdził) |
| Brak `vercel.json` | ✅ Stworzony |
| Brak cron dla workera KSeF | ✅ `/api/cron/ksef-worker` + cron w vercel.json |
| Brak rate limit na eksporcie | ✅ Dodane — 20/min |
| Brak emaila po ERASURE RODO | ✅ Dodane |
| Brak paginacji | ✅ `/api/invoices` i `/api/emissions` mają paginację |
| Review email do skrzynki zbiorczej | ✅ Naprawione — email do przypisanego użytkownika |
| GDPR ERASURE nie anonimizuje InvoiceLine | ✅ Dodane, gated przez `GDPR_ERASURE_ANONYMIZE_INVOICES` |
| Brak CI pipeline | ✅ `.github/workflows/ci.yml` istnieje |
| Brak cookie consent | ✅ `components/CookieConsent.tsx` |
| Brak UI zaproszeń | ✅ `app/(app)/settings/invitations/page.tsx` |
| Brak UI RODO | ✅ `app/(app)/settings/gdpr/page.tsx` |
| Brak wykresów emisji | ✅ `EmissionsCharts` w dashboardzie |

---

## Problemy pozostające do naprawy

### 🔴 KRYTYCZNE

#### 1. IDOR na liniach faktury w review endpoint
**Plik:** `app/api/review/update/route.ts` (linia 28)

```typescript
const line = await prisma.invoiceLine.findUnique({
  where: { id: parsed.lineId },
  include: { mappingDecision: true }
});
```

Zapytanie szuka linii wyłącznie po `id` — **bez filtrowania po `organizationId`**. Uwierzytelniony użytkownik z organizacji A może zmodyfikować status recenzji linii z organizacji B, podając jej `lineId`. `lineId` to cuid — nie jest tajny; może wyciekać przez logi lub być odgadnięty.

**Naprawa:** Filtrować przez powiązaną fakturę:
```typescript
const line = await prisma.invoiceLine.findFirst({
  where: {
    id: parsed.lineId,
    invoice: { organizationId }
  },
  include: { mappingDecision: true }
});
if (!line) return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
```

---

#### 2. Brak kontroli roli w endpoint importu faktorów
**Plik:** `app/api/factors/import/route.ts`

Każdy uwierzytelniony użytkownik (w tym VIEWER i ANALYST) może wywołać `importExternalFactors`, które:
- pobiera pliki XLSX z zewnętrznych URL (UK Gov ~2MB, EPA ~1MB)
- wykonuje setki zapytań `upsert` do bazy
- tworzy rekordy `FactorImportRun`

To otwiera atak DoS na bazę przez zwykłego pracownika z rolą VIEWER.

**Naprawa:** Dodać sprawdzenie roli:
```typescript
const role = (session.user as any).role as string | null | undefined;
if (role !== 'OWNER' && role !== 'ADMIN') {
  return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
}
```

---

#### 3. Brak kontroli roli w endpoint onboardingu
**Plik:** `app/api/onboarding/route.ts`

Każdy użytkownik (VIEWER, ANALYST) może wywołać `POST /api/onboarding` i nadpisać:
- szyfrowany token KSeF (`ksefTokenEncrypted`)
- rok raportowy, branżę, konfigurację scope

W praktyce każdy z dostępem do aplikacji może podmienić token KSeF całej organizacji.

**Naprawa:** Dodać sprawdzenie roli (OWNER/ADMIN):
```typescript
const role = (session.user as any).role as string | null | undefined;
if (role !== 'OWNER' && role !== 'ADMIN') {
  return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
}
```

---

#### 4. KSeF client — nieprawidłowy protokół sesji
**Plik:** `lib/ksef-client.ts`

Obecna implementacja wywołuje `POST /online/Session/InitSigned` z nagłówkiem `Authorization: Bearer {token}` i pustym body JSON. **To nie jest poprawne.** Prawdziwe API KSeF MF:

- `InitSigned` — wymaga podpisanego XML z podpisem XAdES-BES (certyfikat kwalifikowany), NIE tokena Bearer
- Dla tokenów API (bez certyfikatu) poprawny flow to:
  1. `POST /online/Session/AuthorisationChallenge` — z body `{"contextIdentifier":{"type":"onip","identifier":"9462761086"}}`
  2. Odpowiedź zawiera `challenge` (string, kilkadziesiąt znaków)
  3. `POST /online/Session/InitToken` — z base64-encoded strukturą `InitSessionTokenRequest` zawierającą challenge podpisany tokenem
  4. Odpowiedź zawiera `sessionToken`
  5. Faktury: `GET /online/Invoice/KSeF?ksefReferenceNumber=...` z `sessionToken` w nagłówku

Obecny klient nigdy nie uzyska sesji na rzeczywistym API MF.

**Naprawa:** Przepisanie `lib/ksef-client.ts` zgodnie z aktualną specyfikacją OpenAPI KSeF (dostępna na stronie MF).

---

#### 5. Cron KSeF uruchamiany raz na dobę
**Plik:** `vercel.json`

```json
"schedule": "0 3 * * *"
```

Cron działa **raz dziennie o 3:00 UTC**. Faktury zaimportowane przez użytkownika o 9:00 rano czekają na przetworzenie przez worker do **3:00 następnego dnia** — 18 godzin. To nieakceptowalne dla platformy finansowej.

**Naprawa:** Zmienić na co 5-10 minut:
```json
"schedule": "*/5 * * * *"
```
Uwaga: Vercel Hobby plan ma limit częstotliwości cron. Na planie Pro — bez ograniczeń.

---

### 🟠 POWAŻNE

#### 6. N+1 queries przy imporcie faktur KSeF
**Plik:** `lib/ksef-import-service.ts` (pętla od linii 62)

Dla każdej linii faktury wykonywane są **oddzielne zapytania do bazy**:
```typescript
for (const line of invoice.lines) {
  const factor = await resolveBestFactor(organizationId, regionCode, cls.categoryCode);
  // ^ 1 query na linię
  const decision = await prisma.mappingDecision.create({ ... });
  // ^ 1 query na linię  
  const created = await prisma.invoiceLine.create({ ... });
  // ^ 1 query na linię
}
```

Dla faktury z 50 liniami = ~150 sekwencyjnych zapytań. Przy wolnym DB to kilka-kilkanaście sekund na jedną fakturę.

**Naprawa (minimum):** Pre-fetching unikalnych kategorii:
```typescript
const uniqueCategories = [...new Set(invoice.lines.map(l => classifyInvoiceLine(l).categoryCode))];
const allFactors = await prisma.emissionFactor.findMany({
  where: { organizationId, categoryCode: { in: uniqueCategories } },
  include: { emissionSource: true },
  orderBy: [{ regionPriority: 'asc' }, { year: 'desc' }]
});
// Zbuduj mapę: categoryCode -> best factor
const factorMap = new Map<string, typeof allFactors[0]>();
for (const cat of uniqueCategories) {
  const best = allFactors.find(f => f.categoryCode === cat && f.region === regionCode)
    || allFactors.find(f => f.categoryCode === cat && f.region === 'EU')
    || allFactors.find(f => f.categoryCode === cat);
  if (best) factorMap.set(cat, best);
}
// Potem użyj factorMap.get(cls.categoryCode) zamiast resolveBestFactor()
```
Ponadto decyzje i linie można tworzyć przez `createMany` zamiast pętli.

---

#### 7. Login rate limit tylko per email — brak per IP
**Plik:** `lib/auth.ts`

```typescript
const loginLimit = await checkRateLimit(`login:${email}`, { windowMs: 15 * 60_000, maxRequests: 10 });
```

Limit blokuje konkretny email po 10 próbach. Atakujący może testować setki różnych emaili z jednego IP — każdy z limitem 10 prób. Atak credential stuffing jest niemożliwy do zablokowania tym mechanizmem.

**Naprawa:** Dodać drugi limit per IP:
```typescript
const ip = getClientIp(request.headers); // request dostępny w authorize callback przez headers
const ipLimit = await checkRateLimit(`login-ip:${ip}`, { windowMs: 15 * 60_000, maxRequests: 30 });
if (!ipLimit.ok) return null;
const emailLimit = await checkRateLimit(`login:${email}`, { windowMs: 15 * 60_000, maxRequests: 10 });
if (!emailLimit.ok) return null;
```

Problem: `authorize()` w NextAuth nie ma bezpośredniego dostępu do `Request`. Rozwiązanie: przekazać IP przez custom credentials pole lub dodać middleware blokujący przy zbyt wielu niepowodzeniach.

---

#### 8. Dashboard ładuje wszystkie emission factors bez limitu
**Plik:** `app/dashboard/page.tsx` (linia 73)

```typescript
const factors = await prisma.emissionFactor.findMany({
  where: { organizationId },
  include: { emissionSource: true },
  orderBy: [{ regionPriority: 'asc' }, { year: 'desc' }],
});
```

Po imporcie UK Gov + EPA factors w DB jest ~2000-5000 rekordów. To zapytanie zwraca **wszystkie z nich** przy każdym załadowaniu dashboardu. Każdy factor include-uje `emissionSource`, co generuje JOIN. Przy dużej bazie to poważny bottleneck.

**Naprawa:** Dodać `take: 200` lub przenieść wyświetlanie faktorów do osobnego endpointu z paginacją. Dashboard powinien pokazywać tylko podsumowanie (count, source names), nie wszystkie faktory.

---

#### 9. Cookie consent — brakujące znaki diakrytyczne (błąd prawny)
**Plik:** `components/CookieConsent.tsx` (linia 32-37)

```typescript
<p className="mb-1 font-semibold">Uzywamy plikow cookie</p>
<p>Stosujemy niezbedne pliki cookie...</p>
```

Tekst zgody na cookies wyświetla się bez polskich znaków — "Uzywamy" zamiast "Używamy", "plikow" zamiast "plików", "niezbedne" zamiast "niezbędne". Tekst prawny zgody RODO musi być zrozumiały i kompletny. Brakujące znaki mogą podważyć ważność zgody.

**Naprawa:** Poprawić wszystkie teksty na poprawną polszczyznę.

---

#### 10. GDPR request endpoint — tylko OWNER/ADMIN może złożyć wniosek
**Plik:** `app/api/gdpr/requests/route.ts` (POST handler)

```typescript
if (!canManage(role)) return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
```

Zarówno GET jak i POST wymagają roli OWNER/ADMIN. Ale RODO (art. 15-17) daje prawa **podmiotowi danych** — każdemu użytkownikowi — do żądania dostępu lub usunięcia. Zwykły użytkownik z rolą ANALYST lub VIEWER nie może złożyć wniosku o własne dane. To niezgodność z RODO.

**Naprawa:** POST powinien być dostępny dla każdego zalogowanego użytkownika, który składa wniosek o **własne** dane (weryfikacja przez `session.user.email === body.subjectEmail`). GET i execute — tylko dla OWNER/ADMIN.

```typescript
// POST — każdy zalogowany użytkownik może złożyć wniosek o własny email
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return unauthorized();
  const organizationId = (session.user as any).organizationId as string;
  const body = await req.json();
  const parsed = createRequestSchema.parse(body);
  const role = (session.user as any).role as string;
  const isOwnRequest = parsed.subjectEmail.toLowerCase() === session.user.email?.toLowerCase();
  const canManageOthers = canManage(role);
  if (!isOwnRequest && !canManageOthers) {
    return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
  }
  // ...
}
```

---

#### 11. Brak email duplikat — surowy błąd Prisma eksponowany
**Plik:** `app/api/auth/register/route.ts`

Przy rejestracji z zajętym emailem Prisma rzuca `PrismaClientKnownRequestError` z kodem `P2002`. Ten błąd jest łapany przez generic catch i zwracany jako:
```json
{ "ok": false, "error": "Unique constraint failed on the fields: (`email`)" }
```
Surowy komunikat Prisma eksponuje schemat bazy danych użytkownikowi. Powinien być przyjazny:
```json
{ "ok": false, "error": "Konto z tym adresem email już istnieje." }
```

---

#### 12. Import faktorów — hardcoded URL i nazwy kolumn na rok 2025
**Plik:** `lib/factor-import.ts`

```typescript
sourceUrl: 'https://assets.publishing.service.gov.uk/media/6846b6ea57f3515d9611f0dd/ghg-conversion-factors-2025-flat-format.xlsx'
```
```typescript
const required = [..., 'GHG Conversion Factor 2025'];
```

URL z hashem media i nazwy kolumn ze wzmiankowanym rokiem zmieniają się przy każdej aktualizacji (UK Gov publikuje nową wersję co roku). Po 1 stycznia 2026 powyższe przestaną działać bez zmian w kodzie.

**Naprawa:** Przenieść URL i nazwy kolumn do zmiennych środowiskowych lub odczytywać dynamicznie (UK Gov ma API), albo przynajmniej udokumentować jako "wymaga corocznej aktualizacji".

---

#### 13. Re-import faktury usuwa zaakceptowane decyzje review
**Plik:** `lib/ksef-import-service.ts` (linia 43)

```typescript
update: {
  ...
  lines: { deleteMany: {} }, // usuwa WSZYSTKIE linie
}
```

Przy re-imporcie tej samej faktury (np. po błędzie) wszystkie linie (wraz z `MappingDecision` i historią `ReviewEvent`) są usuwane przez `deleteMany`. Jeśli recenzent zatwierdził 30 z 50 linii, re-import usuwa wszystkie zatwierdzenia.

**Naprawa:** Sprawdzić czy linia już istnieje przed usunięciem; zachować linie z `status = APPROVED` lub dodać flagę `preserveReviewed: boolean`.

---

#### 14. `lib/factor-import.ts` — fetch zewnętrznych plików bez timeout
**Plik:** `lib/factor-import.ts` (linia 175)

```typescript
const res = await fetch(item.sourceUrl);
```

Brak `AbortController` z timeout. UK Gov lub EPA mogą odpowiadać powoli (albo nie odpowiadać). Serverless funkcja może timeout'ować na Vercel (domyślnie 30s dla niespecjalizowanych endpointów) zostawiając `FactorImportRun` w statusie `STARTED` w DB.

**Naprawa:**
```typescript
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 25_000);
const res = await fetch(item.sourceUrl, { signal: controller.signal });
clearTimeout(timeout);
```

---

### 🟡 WAŻNE

#### 15. Kalkulacja emisji tworzy rekord przy każdym "Przelicz"
**Plik:** `app/api/emissions/calculate/route.ts`

Każde naciśnięcie przycisku "Przelicz emisje" na dashboardzie wywołuje `calculateOrganizationEmissions` z domyślnym `persist: true`. Tabela `EmissionCalculation` rośnie bez końca. Dashboard pokazuje "ostatnią kalkulację" — ale jest ich setki identycznych.

**Naprawa:** Albo zmienić na `persist: false` i wyświetlać wynik bez zapisu, albo dodać deduplication (sprawdź czy wynik różni się od poprzedniego przed zapisem), albo pozwolić użytkownikowi "zapisać snapshot" świadomym kliknięciem.

---

#### 16. Bcrypt cost factor 10 zamiast 12
**Plik:** `app/api/auth/register/route.ts` (linia 22)

```typescript
const passwordHash = await bcrypt.hash(parsed.password, 10);
```

OWASP rekomenduje minimum 12 rund dla bcrypt. Koszt 10 jest bezpieczny, ale poniżej aktualnych standardów. W `invites/accept` używane jest 12, co jest niespójne.

---

#### 17. Brak `GDPR_ERASURE_ANONYMIZE_INVOICES` w `.env.example`
**Plik:** `.env.example`

Zmienna `GDPR_ERASURE_ANONYMIZE_INVOICES=true` dodana w `execute/route.ts` kontroluje czy InvoiceLine opisywane są anonimizowane. Bez tej zmiennej w `.env.example` każda nowa instalacja nie będzie miała tej opcji udokumentowanej, a GDPR ERASURE nie będzie anonimizować danych dostawców.

---

#### 18. `externalId` faktury — ryzyko kolizji
**Plik:** `lib/ksef-xml.ts` (linia 35)

```typescript
externalId: `${number}-${issueDate}`
```

Identyfikator oparty na numerze faktury i dacie wystawienia. W teorii dwa różne dostawcy mogą wystawić fakturę o tym samym numerze i dacie (legalne przy różnych seriach numeracji). W takim przypadku `upsert` nadpisze pierwszą fakturę drugą. Powinien uwzględniać NIP dostawcy.

---

#### 19. CSP blokuje Next.js scripts w produkcji
**Plik:** `next.config.ts`

```
script-src 'self'
```

Next.js 15 z App Router generuje inline scripts (np. dla Server Components streaming i hydration). `script-src 'self'` bez `'unsafe-inline'` lub nonce zablokuje te skrypty w przeglądarkach przestrzegających CSP. Aplikacja może nie działać w produkcji dla użytkowników z rygorystycznymi ustawieniami bezpieczeństwa.

**Naprawa:** Dodać nonce-based CSP przez middleware (Next.js docs: `next/headers` + `nonce`), lub tymczasowo `'unsafe-inline'` dla `script-src` z planem migracji.

---

#### 20. `auth.ts` — PrismaAdapter z JWT strategy (zbędne tabele)
**Plik:** `lib/auth.ts`

`PrismaAdapter` jest używany razem z `session: { strategy: 'jwt' }`. Adapter jest przeznaczony dla database sessions. Z JWT strategy: tabele `Session`, `Account`, `VerificationToken` są w schemacie ale **nie są zapisywane** przy logowaniu przez Credentials. To zbędna złożoność. W `GDPR_ERASURE` endpoint jest `prisma.session.deleteMany()` — te rekordy prawdopodobnie nie istnieją, więc kasowanie jest no-op.

**Naprawa:** Usunąć `PrismaAdapter` lub przejść na `strategy: 'database'` (ale to wymaga zmian w sesjach) albo usunąć zbędne tabele ze schematu.

---

#### 21. CI pipeline — brak `npm audit` na dependencies fix
**Plik:** `.github/workflows/ci.yml`

CI ma `npm audit --audit-level=high`. Ale CI buduje ze starymi `package-lock.json`. Jeśli nowa podatność pojawi się w transitive dependency, CI zablokuje deploy bez wskazówki jak ją naprawić. Brakuje kroku `npm audit fix --dry-run` w raporcie.

---

#### 22. `components/CookieConsent.tsx` — consent przechowywany tylko w localStorage
Zgoda cookie jest przechowywana wyłącznie w `localStorage`. Nie jest:
- synchronizowana z kontem użytkownika w DB
- dostępna dla SSR (Next.js)
- możliwa do audytu (brak zapisu w `ProcessingRecord`)

Przy wylogowaniu i powrotnym zalogowaniu na innym urządzeniu baner pojawia się ponownie. Dla zalogowanego użytkownika zgoda powinna być persystowana w DB (model `UserConsent`).

---

#### 23. Brak timeout na import cron — możliwy self-call timeout
**Plik:** `app/api/cron/ksef-worker/route.ts`

Cron wywołuje `fetch('/api/ksef/jobs/process', { method: 'POST' })`. Jeśli worker procesuje 10 ciężkich jobów (każdy z 4 próbami KSeF z 15s timeout), czas wykonania może przekroczyć 60s maxDuration zdefiniowany w `vercel.json`. Wewnętrzny `fetch` nie ma własnego timeout — może czekać w nieskończoność.

---

#### 24. Brak obsługi wielu organizacji dla jednego użytkownika
**Plik:** `lib/auth.ts` (linia 28)

```typescript
const m = user.memberships[0];
```

Użytkownik może być członkiem wielu organizacji, ale token JWT zawsze bierze pierwszą z listy (`[0]`). Brak UI/API do przełączania organizacji. To ograniczenie produktowe (brak "workspace switching"), ale warto je udokumentować.

---

### 🔵 INFRASTRUKTURA

#### 25. Brak migracji Prisma — `prisma migrate dev` nieużywane w CI
**Plik:** `.github/workflows/ci.yml`

CI uruchamia `prisma validate` ale nie `prisma migrate status`. W produkcji schemat może być niespójny jeśli deploy nie uruchomi `prisma migrate deploy`. Brak kroku `prisma migrate deploy` w procesie CI/CD deploya.

---

#### 26. Brak testów integracyjnych
**Plik:** `tests/unit/` — zawiera testy unit (NLP parser, review workflow, diff viewer)

Istniejące testy pokrywają logikę domenową (parser NLP, przejścia stanów review). Brak testów dla:
- `lib/emissions.ts` (obliczenia CO₂e)
- `lib/ksef-xml.ts` (parsowanie XML)
- API routes (integracja z DB)
- `lib/payload-security.ts` (szyfrowanie/deszyfrowanie)

---

#### 27. Polskie współczynniki emisji KOBiZE — nadal brak
Tylko 2 nakładki PL (elektryczność 0.72 kgCO₂e/kWh, ciepło 0.28). KOBiZE publikuje corocznie pełne zestawy współczynników dla Polski. Bez nich raporty dla polskich organizacji są oparte na wartościach UK/EPA, co jest metodologicznie niepoprawne.

---

## Zestawienie v1→v2→v3→v4

| Obszar | v1 | v2 | v3 | v4 |
|---|---|---|---|---|
| IDOR KSeF import | 🔴 | ✅ | ✅ | ✅ |
| **IDOR review/update** | — | — | — | 🔴 |
| Rate limiting (serverless) | 🔴 | 🟠 | 🔴 | ✅ |
| **Rate limit login per IP** | — | — | — | 🟠 |
| **Rola: factors/import** | — | — | — | 🔴 |
| **Rola: onboarding** | — | — | — | 🔴 |
| KSeF protokół | 🔴 | 🔴 | 🔴 | 🔴 |
| Cron trigger | 🔴 | 🔴 | ✅ | 🟠 (1x/dobę) |
| Token encryption | 🔴 | ✅ | ✅ | ✅ |
| XXE protection | 🔴 | ✅ | ✅ | ✅ |
| HTTP headers | 🔴 | ✅ | ✅ | ✅ |
| **CSP script-src** | — | — | 🟠 | 🟠 |
| xlsx CVE | 🟠 | ✅ | ✅ | ✅ |
| N+1 emissions | 🟠 | ✅ | ✅ | ✅ |
| **N+1 ksef-import-service** | — | — | 🟠 | 🟠 |
| Export bez persist | — | 🔴 | ✅ | ✅ |
| PDF truncation | — | 🟠 | ✅ | ✅ |
| GDPR ERASURE InvoiceLine | 🔴 | 🔴 | 🟠 | ✅ (env-gated) |
| **GDPR request: data subject** | — | — | — | 🟠 |
| **GDPR_ERASURE_ANONYMIZE_INVOICES w .env.example** | — | — | — | 🟡 |
| Cookie consent | 🔴 | 🔴 | 🟡 | 🟠 (bez diacritics) |
| **Cookie consent w DB** | — | — | — | 🟡 |
| Invites UI | — | 🔴 | ✅ | ✅ |
| GDPR UI | — | 🔴 | ✅ | ✅ |
| Wykresy | 🔴 | 🔴 | ✅ | ✅ |
| Paginacja | 🟠 | 🟠 | ✅ | ✅ |
| **Dashboard: factors bez limitu** | — | — | — | 🟠 |
| **Re-import usuwa decyzje review** | — | — | — | 🟠 |
| **Factor import URL hardcoded 2025** | — | — | — | 🟠 |
| **Factor import bez timeout fetch** | — | — | — | 🟠 |
| **Błąd Prisma eksponowany przy rejestracji** | — | — | — | 🟡 |
| **Bcrypt cost 10 vs 12** | — | — | — | 🟡 |
| **EmissionCalculation za każdym Przelicz** | — | — | 🟠 | 🟠 |
| Testy unit | 🔴 | 🔴 | 🔴 | ✅ (7 plików) |
| Testy integracyjne | 🔴 | 🔴 | 🔴 | 🔴 |
| KOBiZE PL factors | 🔴 | 🔴 | 🔴 | 🔴 |
| Multi-org switching | — | — | — | 🟡 |

---

## Plan naprawczy v4

### Faza 0 — Hotfixy bezpieczeństwa (≤2 dni)
1. **IDOR review/update** — dodać `invoice: { organizationId }` do `findFirst`
2. **Rola factors/import** — dodać OWNER/ADMIN check
3. **Rola onboarding** — dodać OWNER/ADMIN check
4. **GDPR request: data subject** — umożliwić własne wnioski RODO
5. **Cron KSeF** — zmienić na `*/10 * * * *`
6. **Cookie consent diacritics** — poprawić polskie znaki

### Faza 1 — Wydajność i poprawność (tydzień 1)
7. **N+1 w ksef-import-service** — batch factorMap
8. **Login rate limit per IP** — drugi limit w authorize callback
9. **Dashboard factors limit** — `take: 200` lub osobny endpoint
10. **Factor import fetch timeout** — AbortController
11. **Factor import URL/kolumny** — env vars lub dokumentacja
12. **Re-import faktury** — ochrona zatwierdzonych decyzji

### Faza 2 — Compliance i jakość (tydzień 2-3)
13. **CSP nonce** — middleware + nonce dla script-src
14. **Bcrypt 12** — zmienić w register route
15. **Prisma error masking** — friendly error dla duplicate email
16. **GDPR_ERASURE_ANONYMIZE_INVOICES w .env.example**
17. **EmissionCalculation dedup** — nie zapisuj jeśli nic się nie zmieniło
18. **Cookie consent w DB** — model UserConsent, sync przy logowaniu
19. **KSeF protokół** — przepisanie client.ts zgodnie z spec MF

### Faza 3 — Skalowalność (miesiąc 2)
20. **Testy integracyjne** — ksef-xml.ts, emissions.ts, payload-security.ts
21. **Multi-org switching** — UI + `/api/auth/switch-org`
22. **KOBiZE factors** — import polskich współczynników
23. **PrismaAdapter cleanup** — usunąć zbędne tabele lub przejść na database sessions
24. **externalId z NIP dostawcy** — zabezpieczenie przed kolizją

---

## Ocena gotowości produkcyjnej

**Obecny stan: ~75% gotowości**

Trzy nowe krytyczne podatności bezpieczeństwa (IDOR na review, brak roli na factors import/onboarding) plus wadliwy protokół KSeF i cron co dobę — to są blokery przed soft launch. Po ich naprawieniu (Faza 0) aplikacja jest gotowa do ograniczonego beta z zaufanymi klientami.

**Szacowany czas do soft launch:** 3-5 dni (Faza 0)  
**Szacowany czas do pełnego launch:** 4-6 tygodni (Fazy 0-2 + KSeF przepisanie)
