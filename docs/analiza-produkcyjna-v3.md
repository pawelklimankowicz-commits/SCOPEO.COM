# Analiza produkcyjna Scopeo SaaS — v3

**Data analizy:** 2026-04-14  
**Podstawa:** Pełny przegląd kodu po trzecim cyklu zmian (bezpieczeństwo, KSeF, eksport, RODO, zaproszenia)  
**Poprzednie raporty:** `docs/analiza-produkcyjna.md` (v1), `docs/analiza-produkcyjna-v2.md` (v2)

---

## Co zostało naprawione od v2

### ✅ Bezpieczeństwo
- **IDOR w KSeF import** — `organizationId` pobierany z sesji, nie z body requestu
- **KSeF token w plaintext** — szyfrowanie AES-256-GCM przez `lib/ksef-token-crypto.ts`
- **XXE injection** — `lib/ksef-xml.ts` sprawdza wzorce `<!DOCTYPE`, `<!ENTITY`, `SYSTEM`, `PUBLIC` przed parsowaniem
- **Brak nagłówków HTTP** — dodane w `next.config.ts`: CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy
- **Niebezpieczna biblioteka `xlsx`** — zastąpiona przez `exceljs 4.4.0`

### ✅ Architektura i jakość kodu
- **N+1 w `lib/emissions.ts`** — naprawione; bulk prefetch overrideFactors do `Map<id, factor>`
- **NextAuth v5 beta** — downgrade do stabilnego v4.24.13
- **Structured logging** — `lib/logger.ts` z JSON output
- **Health check** — `/api/health` z pomiarem czasu odpowiedzi DB
- **Sentry** — `@sentry/nextjs` skonfigurowany, `withSentryConfig` w `next.config.ts`
- **Payload encryption** — `lib/payload-security.ts` szyfruje surowe XML przed zapisem; cap 120KB

### ✅ Funkcjonalności
- **Formularz kontaktowy** — `/api/contact` zapisuje `Lead` + `LeadMarketingConsent` w transakcji, wysyła email przez Resend
- **Eksport emisji** — `/api/emissions/export` z formatami CSV, XLSX, PDF i filtrem `?year=`
- **Zaproszenia użytkowników** — pełne API (GET/POST/PATCH) w `/api/invites`, token SHA-256 z 7-dniowym ważnością
- **RODO** — `/api/gdpr/requests` (składanie wniosków), `[requestId]/execute` (anonimizacja), `lib/privacy-register.ts`
- **Async queue KSeF** — model `KsefImportJob`, worker `/api/ksef/jobs/process` z backoffem wykładniczym
- **Filtrowanie roku** — eksport i obliczenia emisji obsługują `?year=`

### ✅ Legal / compliance
- **Dane spółki** — `lib/legal.ts` zawiera poprawne dane rejestrowe (KRS, NIP, REGON, adres)
- **Schemat Prisma** — nowe modele: `Lead`, `LeadMarketingConsent`, `GdprRequest`, `ProcessingRecord`, `Invitation`, `KsefImportJob`
- **Indeksy DB** — dodane na `Invoice`, `MappingDecision`, `EmissionFactor` i in.

---

## Problemy pozostające do naprawy

### 🔴 KRYTYCZNE — blokujące produkcję

#### 1. Rate limiter niedziałający w środowisku serverless
**Plik:** `lib/security.ts`

```typescript
const rateStore = new Map<string, RateLimitState>(); // module-level
```

`rateStore` to zwykła `Map` w pamięci modułu. Na Vercel (i każdym środowisku serverless) każdy cold start tworzy nową instancję — stan nie jest współdzielony między instancjami. Limity loginów, importów KSeF i rejestracji są **całkowicie nieskuteczne** w produkcji.

**Wymagane:** Redis z Upstash (pakiet `@upstash/ratelimit` + `@upstash/redis`).

```typescript
// lib/security.ts — docelowy kod
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();
export const loginRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "15 m"),
});
```

---

#### 2. Błędna implementacja klienta KSeF
**Plik:** `lib/ksef-client.ts`

Obecny klient zakłada endpoint `GET /invoices/{referenceNumber}/xml` z nagłówkiem `Authorization: Bearer <token>`. Rzeczywiste KSeF API (Ministerstwo Finansów) używa protokołu sesyjnego:

1. `POST /online/Session/InitSigned` — otwarcie sesji z podpisem XAdES
2. Faktury dostępne przez zapytania filtrowane
3. `GET /online/Invoice/KSeF` — pobranie faktury przez `ksefReferenceNumber`
4. `DELETE /online/Session/Terminate` — zamknięcie sesji

Ponadto `KSEF_API_BASE_URL=https://ksef-api.example.gov.pl` to placeholder — produkcyjny URL to `https://ksef.mf.gov.pl/api`, testowy `https://ksef-test.mf.gov.pl/api`.

**Wymagane:** Przepisanie `lib/ksef-client.ts` zgodnie z oficjalną dokumentacją KSeF (openapi.yaml MF).

---

#### 3. Brak wyzwalacza cron dla kolejki KSeF
**Plik:** `app/api/ksef/jobs/process/route.ts`

Worker istnieje, ale nic go nie wywołuje. Joby w statusie `PENDING` będą czekać w nieskończoność.

**Wymagane:** Cron job wyzwalający worker — np. Vercel Cron (`vercel.json`):

```json
{
  "crons": [
    {
      "path": "/api/ksef/jobs/process",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

Uwaga: endpoint wymaga nagłówka `x-ksef-worker-secret`, więc Vercel Cron (który nie obsługuje custom headers) nie wystarczy — potrzebny zewnętrzny scheduler (np. GitHub Actions, Upstash QStash) lub middleware weryfikujący `CRON_SECRET` zamiast/obok worker secret.

---

#### 4. Podatność na nadpisanie hasła przy akceptacji zaproszenia
**Plik:** `app/api/invites/accept/route.ts`

```typescript
await prisma.user.upsert({
  where: { email: invite.email },
  create: { email, passwordHash, ... },
  update: { passwordHash, ... },   // ← PROBLEM
});
```

Jeśli email z zaproszenia należy do istniejącego konta, `update` nadpisuje `passwordHash` hasłem podanym przez osobę akceptującą. Atakujący z wykradzionym tokenem zaproszenia wysłanym na znany adres email może przejąć konto.

**Wymagane:** Sprawdzić istnienie użytkownika przed upsert:

```typescript
const existing = await prisma.user.findUnique({ where: { email: invite.email } });
if (existing) {
  // tylko dodaj membership, nie zmieniaj hasła
  await prisma.membership.create({ ... });
} else {
  await prisma.user.create({ ... });
}
```

---

#### 5. Brak rate limitingu na rejestracji
**Plik:** `app/api/auth/register/route.ts`

Endpoint nie ma żadnego ograniczenia szybkości. Atakujący może zautomatyzować tworzenie nieograniczonej liczby organizacji i kont, co prowadzi do:
- wyczerpania zasobów DB
- kosztów po stronie Resend (jeśli email wysyłany przy rejestracji)
- zaśmiecenia danych

**Wymagane:** Dodać `checkRateLimit` (docelowo Redis-based) — np. 5 rejestracji / godzinę z jednego IP.

---

### 🟠 POWAŻNE — wymagają naprawy przed startem

#### 6. Eksport tworzy rekord EmissionCalculation przy każdym wywołaniu
**Plik:** `app/api/emissions/export/route.ts`

```typescript
const result = await calculateOrganizationEmissions(organizationId, validReportYear);
```

`calculateOrganizationEmissions` zawsze zapisuje nowy rekord `EmissionCalculation` do bazy. Każde pobranie pliku CSV/XLSX/PDF przez użytkownika = nowy rekord w tabeli. Przy intensywnym użyciu tabela rośnie bez kontroli, a historyczne dane tracą sens (wiele identycznych obliczeń dla tego samego roku).

**Wymagane:** Dodać opcję `persist: false` do `calculateOrganizationEmissions` lub wyciągnąć logikę obliczeń bez zapisu i wywołać ją osobno z endpointu eksportu.

---

#### 7. PDF eksport obcięty do 20 wierszy
**Plik:** `app/api/emissions/export/route.ts`

```typescript
const rows = result.calculations.slice(0, 20); // hardcoded limit
```

Organizacja z >20 liniami emisji otrzyma niekompletny raport PDF bez żadnego ostrzeżenia.

**Wymagane:** Usunąć `slice(0, 20)`, zastąpić paginacją lub wielostronicowym PDF (pdf-lib obsługuje wiele stron).

---

#### 8. Cicha porażka wysyłki emaila przy zaproszeniach
**Plik:** `lib/invitations.ts`

```typescript
if (!inviteUrl || !resendKey || !fromEmail) return null; // brak errora
```

Zaproszenie zostaje zapisane w DB, ale email nie jest wysłany, a wywołujący kod (`app/api/invites/route.ts`) nie sprawdza wartości zwracanej przez `sendInvitationEmail`. Użytkownik (admin) myśli, że zaproszenie zostało wysłane, a adresat nigdy go nie otrzymuje.

**Wymagane:** Rzucić błąd lub zwrócić informację o nieudanej wysyłce, aby API odpowiedziało odpowiednim statusem:

```typescript
if (!inviteUrl || !resendKey || !fromEmail) {
  throw new Error('Email service not configured');
}
```

---

#### 9. Review workflow — email do skrzynki zbiorczej, nie do recenzenta
**Plik:** `lib/invitations.ts` / logika review

Powiadomienia o review trafiają na `REVIEW_WORKFLOW_EMAIL` (jedna skrzynka zbiorcza), nie na osobisty email przypisanego recenzenta/approvera. W organizacji z wieloma recenzentami każdy widzi wszystkie zlecenia.

**Wymagane:** Pobrać email użytkownika z `assignedReviewerId` i wysłać powiadomienie personalnie.

---

#### 10. GDPR ERASURE — InvoiceLine zawiera dane osobowe dostawców
**Plik:** `app/api/gdpr/requests/[requestId]/execute/route.ts`

Procedura anonimizacji czyści dane użytkownika (`User.email`, `User.name`, `User.passwordHash`) oraz `Lead`, ale nie dotyka tabel `Invoice` i `InvoiceLine`. Wiersze faktur zawierają:
- nazwy dostawców (np. pełna nazwa firmy osoby fizycznej prowadzącej działalność)
- opisy pozycji fakturowych

Jeśli podmiot danych jest osobą fizyczną (sole trader), te dane mogą być RODO-wrażliwe.

**Wymagane:** Ocenić czy `Invoice.sellerName` i `InvoiceLine.description` wymagają anonimizacji przy ERASURE, i udokumentować decyzję w RODO.

---

#### 11. CSP — `unsafe-inline` dla styli
**Plik:** `next.config.ts`

```typescript
"style-src 'self' 'unsafe-inline'"
```

`unsafe-inline` pozwala na wykonanie dowolnych stylów wstrzykniętych przez XSS. Ogranicza skuteczność CSP jako mechanizmu ochrony.

**Wymagane:** Nonce-based CSP (`'nonce-{random}'`) lub hash-based dla konkretnych stylów inline. W Next.js 15 można użyć `middleware.ts` do generowania nonce i przekazywania przez headers.

---

#### 12. `LEGAL_COMPANY.registryNote` → `registryDetails` — potencjalny undefined
**Plik:** `app/(marketing)/regulamin/page.tsx` i inne

Pole w `lib/legal.ts` zostało przemianowane z `registryNote` na `registryDetails`. Jeśli którakolwiek strona marketingowa nadal odwołuje się do `LEGAL_COMPANY.registryNote`, wyświetli `undefined` zamiast danych spółki — błąd prawny i reputacyjny.

**Wymagane:** `grep -r "registryNote" app/` i poprawić wszystkie wystąpienia.

---

### 🟡 WAŻNE — wymagane przed pełnym startem

#### 13. Brak UI dla zarządzania zaproszeniami
Pełne API istnieje (`/api/invites`), ale brak strony w panelu administratora gdzie można:
- wysłać zaproszenie (formularz z email + rola)
- zobaczyć listę oczekujących zaproszeń
- anulować / ponownie wysłać zaproszenie

Bez UI funkcja jest niedostępna dla użytkowników niebędących developerami.

---

#### 14. Brak UI dla wniosków RODO
Podobnie — API RODO istnieje, ale brak panelu dla:
- użytkownika (złożenie wniosku ACCESS/ERASURE)
- admina (przeglądanie i wykonanie wniosków)

---

#### 15. Brak cookie consent banner / CMP
Aplikacja nie ma mechanizmu zgody na cookies (wymaganego przez RODO i Prawo telekomunikacyjne). Dotyczy zwłaszcza analytics, Sentry (może zbierać dane sesji), i wszelkich przyszłych trackerów.

**Wymagane:** Wdrożenie lekkiego CMP (np. `react-cookie-consent` lub własna implementacja), z zapisem zgody w `localStorage` lub do `UserConsent` modelu w DB.

---

#### 16. Dashboard ładuje wszystkie faktury bez paginacji
**Plik:** zapytania w API dashboard

Przy dużej liczbie faktur (tysiące pozycji) zapytania bez `take`/`skip` będą coraz wolniejsze. Brak `cursor`-based lub `offset`-based paginacji.

**Wymagane:** Dodać paginację (`?page=&pageSize=`) lub `cursor`-based pagination do wszystkich endpointów listujących faktury i linie emisji.

---

#### 17. Brak wykresów / wizualizacji danych emisji
Dashboard nie ma żadnych wykresów — ani trendów miesięcznych, ani breakdown Scope 1/2/3, ani porównania rok-do-roku. Scopeo pozycjonuje się jako narzędzie analityczne, a brak wizualizacji jest poważnym gap w UX/produktowym.

**Wymagane:** Wdrożenie przynajmniej podstawowych wykresów (np. Recharts lub Chart.js):
- emisje per miesiąc (bar chart)
- podział Scope 1/2/3 (pie/donut)
- top 10 kategorii emisji

---

#### 18. Mapowanie NLP — wyłącznie keyword-based, brak uczenia się
**Plik:** `lib/nlp-mapping.ts`

Algorytm jest niezmieniony od v1 — proste dopasowanie tokenów (`hasAny(tokens, ['słowo1', 'słowo2'])`). Decyzje recenzentów (`MappingDecision` z `APPROVED`/`OVERRIDDEN`) są zapisywane w DB, ale **nigdy nie są używane** do poprawy klasyfikacji.

Fallback nadal przypisuje wszystko nierozpoznane do `scope3_cat1_purchased_services` z confidence 0.45 — potencjalnie błędne kategorie dla dużej części faktur.

**Wymagane (min.):** Implementacja reguł wywnioskowanych z zatwierdzeń recenzentów (supplier → category cache). Długoterminowo: integracja z modelem NLP lub fine-tuned embeddings.

---

#### 19. Brak polskich współczynników emisji KOBiZE / URE
Baza współczynników zawiera tylko 2 nakładki PL (`pl_electricity_grid`, `pl_natural_gas`). Krajowe raporty (KOBiZE) wymagają oficjalnych współczynników z Krajowego Ośrodka Bilansowania i Zarządzania Emisjami.

**Wymagane:** Import danych z publikacji KOBiZE (aktualizowany corocznie) oraz współczynniki sieciowe URE dla poszczególnych lat.

---

#### 20. Brak powiadomienia email po zakończeniu ERASURE
**Plik:** `app/api/gdpr/requests/[requestId]/execute/route.ts`

Po anonimizacji danych podmiot danych powinien otrzymać potwierdzenie emailem (art. 12 RODO — odpowiedź w ciągu miesiąca). Obecna implementacja nie wysyła żadnego emaila po wykonaniu wniosku.

---

#### 21. `getClientIp` — ślepe zaufanie do `x-forwarded-for`
**Plik:** `lib/security.ts`

```typescript
const forwarded = headers.get('x-forwarded-for');
return forwarded?.split(',')[0]?.trim() ?? '127.0.0.1';
```

Nagłówek `x-forwarded-for` może być sfałszowany przez klienta przed proxy. W efekcie atakujący może ustawić własne IP, omijając rate limiting.

**Wymagane:** Na Vercel używać `x-real-ip` lub `x-vercel-forwarded-for` (ustawiane przez infrastrukturę Vercel, niemożliwe do sfałszowania przez klienta). Alternatywnie: walidacja, że IP pochodzi z zaufanego proxy.

---

### 🔵 INFRASTRUKTURA I OPERACJE

#### 22. Brak `vercel.json` / konfiguracji deploymentu
Projekt nie zawiera `vercel.json`. Brak:
- definicji cron jobs (patrz problem #3)
- konfiguracji regionów (ważne dla RODO — dane w EU)
- limitów czasu wykonania funkcji (domyślnie 10s, worker KSeF może potrzebować więcej)

**Wymagane:** Stworzenie `vercel.json`:
```json
{
  "regions": ["fra1"],
  "functions": {
    "app/api/ksef/jobs/process/route.ts": { "maxDuration": 60 }
  }
}
```

---

#### 23. Brak strategii backupu DB
Nie ma dokumentacji ani skryptów backupu PostgreSQL. W przypadku awarii brak planu recovery.

**Wymagane:** Polityka backupu (daily automated backup, retention 30 dni) — najlepiej zarządzana przez dostawcę (Supabase, Neon, Railway — wszystkie oferują backupy automatyczne).

---

#### 24. `.github/workflows/ci.yml` — zawartość do weryfikacji
Plik CI istnieje, ale nie zweryfikowano czy obejmuje:
- `tsc --noEmit` (typecheck)
- `prisma validate`
- `next build`
- testy (jeśli istnieją)
- skanowanie podatności (`npm audit`)

**Wymagane:** Przegląd i uzupełnienie pipeline'u CI.

---

#### 25. Brak testów automatycznych
Projekt nie zawiera żadnych testów (`*.test.ts`, `*.spec.ts`). Przy iteracyjnym dodawaniu funkcji ryzyko regresji rośnie.

**Wymagane minimum:**
- Unit testy dla `lib/ksef-xml.ts` (parsowanie XML, XXE protection)
- Unit testy dla `lib/emissions.ts` (obliczenia emisji)
- Integration testy dla kluczowych endpointów API (auth, import, eksport)

---

## Podsumowanie stanu — zestawienie v1→v2→v3

| Obszar | v1 | v2 | v3 |
|--------|----|----|-----|
| IDOR security | 🔴 | ✅ | ✅ |
| Token encryption | 🔴 | ✅ | ✅ |
| XXE protection | 🔴 | ✅ | ✅ |
| HTTP security headers | 🔴 | ✅ | ✅ |
| Rate limiting | 🔴 | 🟠 (in-memory) | 🔴 (non-functional serverless) |
| NextAuth version | 🟠 | ✅ | ✅ |
| xlsx CVE library | 🟠 | ✅ | ✅ |
| N+1 query emissions | 🟠 | ✅ | ✅ |
| KSeF API correctness | 🔴 | 🟠 (stub) | 🔴 (wrong protocol) |
| KSeF cron trigger | 🔴 | 🔴 | 🔴 |
| Invite accept password overwrite | — | 🔴 | 🔴 |
| Registration rate limit | 🔴 | 🔴 | 🔴 |
| Export pollutes EmissionCalc | — | 🔴 | 🔴 |
| PDF export truncated | — | 🟠 | 🟠 |
| Silent invite email fail | — | 🟠 | 🟠 |
| CSP unsafe-inline | — | 🟠 | 🟠 |
| Legal field rename (registryNote) | — | 🟠 | 🟠 |
| Cookie consent | 🔴 | 🔴 | 🟡 |
| GDPR UI | 🔴 | 🔴 | 🟡 |
| Invites UI | — | 🔴 | 🟡 |
| Pagination | 🟠 | 🟠 | 🟡 |
| Charts / visualizations | 🔴 | 🔴 | 🟡 |
| NLP learning | 🔴 | 🔴 | 🟡 |
| Polish KOBiZE factors | 🔴 | 🔴 | 🟡 |
| Health check | 🔴 | ✅ | ✅ |
| Structured logging | 🔴 | ✅ | ✅ |
| Sentry | 🔴 | ✅ | ✅ |
| Lead form saving | 🔴 | ✅ | ✅ |
| Export (CSV/XLSX/PDF) | 🔴 | ✅ (z bugami) | 🟠 |
| Invitations API | 🔴 | ✅ | ✅ |
| GDPR API | 🔴 | ✅ | ✅ |
| Async KSeF queue | 🔴 | ✅ | ✅ |
| Tests | 🔴 | 🔴 | 🔴 |
| Backup strategy | 🔴 | 🔴 | 🔴 |
| vercel.json | — | — | 🔴 |

---

## Plan naprawczy — priorytety

### Faza 0 — Hotfixy blokujące (przed jakimkolwiek ruchem produkcyjnym)

1. **Rate limiting → Redis/Upstash** — zastąpić `lib/security.ts` Map na `@upstash/ratelimit`
2. **Invite accept — sprawdzenie istniejącego usera** przed upsert z nadpisaniem hasła
3. **Registration rate limit** — dodać `checkRateLimit` na `/api/auth/register`
4. **Export — oddzielić obliczenia od zapisu** — nie tworzyć `EmissionCalculation` przy eksporcie
5. **Weryfikacja `registryNote` → `registryDetails`** — `grep -r "registryNote" app/`

### Faza 1 — KSeF i infrastruktura (tydzień 1-2)

6. **KSeF client** — przepisanie zgodnie z oficjalnym API MF (session-based auth)
7. **Cron trigger** — `vercel.json` z cron lub Upstash QStash dla workera KSeF
8. **`vercel.json`** — regiony EU, limity czasu funkcji
9. **CI pipeline** — weryfikacja i uzupełnienie `.github/workflows/ci.yml`

### Faza 2 — UX i compliance (tydzień 2-4)

10. **Cookie consent banner** — implementacja CMP
11. **UI zaproszeń** — strona w panelu admin
12. **UI RODO** — formularz składania wniosków + panel admin
13. **Wykresy** — Recharts, minimum: trend miesięczny + podział Scope 1/2/3
14. **Paginacja** — dashboard, lista faktur, lista emisji
15. **ERASURE email** — powiadomienie do podmiotu danych po anonimizacji
16. **PDF eksport** — pełna paginacja, usunięcie `slice(0, 20)`
17. **Naprawa cichej porażki emaila** — `sendInvitationEmail` rzuca błąd przy brak konfiguracji

### Faza 3 — Jakość i skalowalność (miesiąc 2)

18. **NLP learning** — reguły z zatwierdzonych decyzji recenzentów
19. **Polskie współczynniki KOBiZE** — import oficjalnych danych
20. **Testy automatyczne** — unit + integration dla kluczowych komponentów
21. **Strategia backupu** — dokumentacja + automatyczne backupy przez dostawcę DB
22. **CSP nonce-based** — zastąpienie `unsafe-inline`
23. **Review email personalny** — do przypisanego recenzenta, nie do skrzynki zbiorczej
24. **GDPR ERASURE InvoiceLine** — decyzja i implementacja dot. anonimizacji danych dostawców

---

## Ocena gotowości produkcyjnej

**Obecny stan: ~65% gotowości**

Aplikacja posiada solidne fundamenty architektoniczne i znacznie poprawiony poziom bezpieczeństwa vs. v1. Jednak cztery krytyczne problemy (rate limiting w serverless, błędne KSeF API, brak cron, podatność na nadpisanie hasła) uniemożliwiają bezpieczny launch produkcyjny.

Po wdrożeniu Fazy 0 i Fazy 1 aplikacja będzie gotowa do **ograniczonego soft launch** (zamknięte beta, wybrani klienci). Pełny launch publiczny wymaga ukończenia Fazy 2 (UX, compliance) i przynajmniej częściowego pokrycia testami z Fazy 3.

**Szacowany czas do soft launch:** 2-3 tygodnie (Fazy 0+1)  
**Szacowany czas do pełnego launch:** 6-8 tygodni (Fazy 0+1+2)
