# Analiza produkcyjna Scopeo SaaS — v7

> Data: 2026-04-15  
> Podstawa: pełny przegląd kodu po zmianach Phase 2 + Phase 3  
> Poprzednie raporty: v1–v6

---

## Co zostało naprawione między v6 a v7 ✅

| # | Problem v6 | Dowód w kodzie |
|---|-----------|----------------|
| V6-C2 | KSEF_CONTEXT_NIP hardcoded NIP | `fetchKsefInvoiceXml` wymaga `contextNip` jako argument, brak fallbacku na env |
| V6-H1 | accept invite min(8) zamiast min(12) | `acceptInviteSchema` ma `min(12)`, sprawdzenie `< 12` |
| V6-H2 | `/api/health` ujawnia config publicznie | Chronione przez `x-health-secret`, diagnostyki tylko z tokenem |
| V6-H3 | Supplier NULL taxId duplikaty | `taxId String @default("")` — pusty string zamiast NULL |
| V6-H4 | Brak rate limitingu na `/api/invites/accept` | `checkRateLimit('invites-accept:${ip}', { maxRequests: 12 })` |
| V6-H5 | GDPR N+1 `invoiceLine.update` w pętli | Zamienione na `invoiceLine.updateMany` z `supplierId: { in: supplierIds }` |
| V6-M1 | Jeden AbortController dla dwóch requestów | Osobny `fetchWithTimeout` per request sieciowy z własnym timeoutem |
| V6-M2 | `NEXTAUTH_URL` zamiast `NEXT_PUBLIC_APP_URL` | `NEXT_PUBLIC_APP_URL ?? NEXTAUTH_URL` w `lib/invitations.ts` |
| V6-M3 | Email contact synchroniczny | `void resend.emails.send(...).catch(...)` — fire and forget (choć z błędem 502 gdy email fail) |
| V6-M6 | Brak limitu rozmiaru XML | TODO — nadal brak sprawdzenia rozmiaru w `ksef/import` |
| V6-M7 | Brak auditu w factor import | TODO — nadal brak `writeProcessingRecord` w `factor-import.ts` |

---

## Problemy aktualne w v7 — do naprawy

### 🔴 KRYTYCZNE

---

#### [V7-C1] `PricingTable.tsx` — stary cennik z invoke limits zamiast nowego modelu

**Plik:** `components/marketing/PricingTable.tsx`, linie 6–38  
**Problem:** Strona `/cennik` nadal pokazuje stare plany oparte na liczbie faktur (5 planów: Micro/50, Starter/100, Growth/200, Scale/500, Plus/1000, rabat roczny −10%). Kod Stripe (`lib/stripe.ts`) i baza danych (`Subscription` model) mają już nowy model (4 płatne plany: Mikro/Starter/Growth/Scale bez limitu faktur, rabat −20%), ale **frontendowy cennik jest niespójny z backendiem**. Klient widzi stare ceny i stary plan "Plus" który nie istnieje w Stripe.

```typescript
// STARY kod w PricingTable.tsx:
{ id: 'micro', name: 'Micro', invoices: 'do 50 faktur / mc', monthly: 149 },
{ id: 'starter', name: 'Starter', invoices: 'do 100 faktur / mc', monthly: 229 },
{ id: 'growth', name: 'Growth', invoices: 'do 200 faktur / mc', monthly: 349 },
{ id: 'scale', name: 'Scale', invoices: 'do 500 faktur / mc', monthly: 549 },
{ id: 'plus', name: 'Plus', invoices: 'do 1000 faktur / mc', monthly: 899 }, // plan nie istnieje!
// rabat: 0.9 (−10%) — powinno być 0.8 (−20%)
```

Dodatkowo `BillingPlansClient.tsx` (strona `/dashboard/settings/billing`) może mieć analogiczny problem — wymaga osobnej weryfikacji.

---

#### [V7-C2] `checkKsefLimit` — błędna logika pomiaru połączeń KSeF

**Plik:** `lib/billing.ts`, linie 58–85  
**Problem:**
```typescript
const used = profile?.taxId ? 1 : 0;
```
Funkcja zawsze zwraca `used = 0` lub `used = 1` — zakłada że jest dokładnie jedno połączenie KSeF (z `CarbonProfile.taxId`). Ale model biznesowy zakłada że organizacja może mieć wiele połączeń KSeF (plan Growth = 3, Scale = 10). Nie ma mechanizmu do przechowywania wielu połączeń KSeF per organizacja — ani w schemacie Prisma, ani w kodzie. Limit KSeF nie może być egzekwowany poprawnie bez modelu `KsefConnection`.

**Skutek:** Płatny plan Growth (3 połączenia) jest niemożliwy do wykorzystania — architektura nie przewiduje >1 NIP/token per organizacja.

---

### 🟠 HIGH

---

#### [V7-H1] `lib/billing.ts` — `checkKsefLimit` wysyła notyfikację `INVOICE_LIMIT_WARNING` dla limitu KSeF

**Plik:** `lib/billing.ts`, linie 65–83  
**Problem:** Funkcja monitorująca limit KSeF używa `type: 'INVOICE_LIMIT_WARNING'` — błędny typ notyfikacji dla przekroczenia limitu KSeF. Analogicznie `checkUserLimit` (linia 94–108) używa tego samego złego typu dla limitu użytkowników. Brakuje enum wartości `KSEF_LIMIT_WARNING` i `USER_LIMIT_WARNING` w modelu `NotificationType`.

---

#### [V7-H2] `app/api/billing/checkout/route.ts` — trial sprawdzany przez `stripe.subscriptions.list` (race condition + dodatkowy koszt API)

**Plik:** `app/api/billing/checkout/route.ts`, linie 58–63  
**Problem:**
```typescript
const previousSubscriptions = await stripe.subscriptions.list({
  customer: customerId,
  status: 'all',
  limit: 1,
});
const canUseTrial = previousSubscriptions.data.length === 0;
```
Każdy checkout call wykonuje dodatkowy request do Stripe API żeby sprawdzić historię subskrypcji. Jest to:
1. Dodatkowy koszt API i latencja
2. Race condition — między `list` a `create` ktoś może zdążyć uruchomić trial
3. Niepotrzebne — wystarczy sprawdzić `subscription.trialEndsAt` w lokalnej DB

**Poprawka:** Sprawdź w lokalnej DB czy `Subscription.trialEndsAt` jest już ustawione — jeśli tak, nie dawaj trialu.

---

#### [V7-H3] `app/api/webhooks/stripe/route.ts` — brak idempotentności, podwójny upsert

**Plik:** `app/api/webhooks/stripe/route.ts`, linie 76–145  
**Problem:** Webhook obsługuje zarówno `checkout.session.completed` jak i `customer.subscription.created` — oba mogą wystąpić dla tej samej transakcji i oba robią `prisma.subscription.upsert`. Przy wolnej bazie danych lub retry webhooków (Stripe retryuje nieudane do 72h) to może spowodować podwójny zapis lub wyścig. Brak sprawdzenia idempotentności przez `stripeSubscriptionId`.

---

#### [V7-H4] `app/api/v1/emissions/route.ts` — `findMany` bez limitu, potencjalny OOM

**Plik:** `app/api/v1/emissions/route.ts`, linia 17  
**Problem:**
```typescript
const lines = await prisma.invoiceLine.findMany({
  where: { invoice: { organizationId, ... } },
  include: { emissionFactor: true },
});
```
Brak `take` — dla organizacji z dziesiątkami tysięcy linii faktur (Scale/Enterprise plan) zwróci wszystkie linie do pamięci serwera. Paginacja jest tylko w response (grouped), ale samo zapytanie ładuje wszystko.

**Poprawka:** Agregacja powinna być wykonana po stronie DB (Prisma `groupBy`) zamiast w pamięci JS, lub dodać `take: 10000` z `truncated` flagą.

---

#### [V7-H5] `lib/auth.ts` — DB query przy każdym JWT refresh (N+2 queries per request)

**Plik:** `lib/auth.ts`, linie 131–158  
**Problem:** JWT callback zawiera:
1. `loadUserOrganizations()` — query do `Membership` przy każdym JWT refresh
2. `prisma.organization.findUnique()` — query do `Organization` przy każdym JWT refresh

Przy `session.strategy: 'jwt'` NextAuth odświeża token przy każdym request do `/api/*` który używa `getServerSession()`. Dla aplikacji z dużym ruchem to znacząca liczba zbędnych DB queries. W trybie produkcyjnym wszystkie te dane powinny być przechowywane w JWT (są już) i odświeżane tylko gdy `trigger === 'update'` lub przy logowaniu.

**Poprawka:** Dodaj warunek `if (trigger === 'signIn' || trigger === 'update' || !token.organizations)` — nie odpytuj DB przy każdym request.

---

### 🟡 MEDIUM

---

#### [V7-M1] `components/marketing/PricingTable.tsx` — brak tabeli porównawczej funkcji

**Plik:** `components/marketing/PricingTable.tsx`  
**Problem:** Karty planów pokazują tylko nazwę i cenę — brak listy funkcji per plan (Scope 3, CSRD export, Review workflow, API). Klient nie może zobaczyć co dostaje za wyższą cenę. Zachodnie cenniki zawsze mają tabelę "co zawiera plan".

---

#### [V7-M2] `lib/csrd-export.ts` — `generateCsrdReport` ładuje wszystkie linie do pamięci

**Plik:** `lib/csrd-export.ts`, linia 62–74  
**Problem:**
```typescript
prisma.invoiceLine.findMany({
  where: { invoice: { organizationId, issueDate: { gte: from, lt: to } } },
  include: { invoice: true, emissionFactor: { include: { emissionSource: true } } },
});
```
Brak `take` — dla dużej organizacji może załadować dziesiątki tysięcy linii do pamięci. Analogiczny problem jak V7-H4. Agregacja powinna być wykonana po stronie DB.

---

#### [V7-M3] `app/api/auth/register/route.ts` — Stripe customer tworzony fire-and-forget, bez retry

**Plik:** `app/api/auth/register/route.ts`, linia 56  
**Problem:**
```typescript
void getOrCreateStripeCustomer(organizationId).catch(() => null);
```
Jeśli Stripe jest niedostępny przy rejestracji, organizacja nie ma `stripeCustomerId` i nie może się nigdy zasubskrybować. Nie ma mechanizmu retry ani późniejszego naprawiania tej sytuacji. `getOrCreateStripeCustomer` jest idempotentna — można ją wywołać ponownie, ale nie ma triggera który to zrobi.

**Poprawka:** Wywołaj `getOrCreateStripeCustomer` lazy — przy pierwszym wejściu na `/dashboard/settings/billing` lub przy pierwszym `POST /api/billing/checkout`, a nie przy rejestracji.

---

#### [V7-M4] `app/api/notifications/route.ts` — DELETE bez `readOnly=true` usuwa WSZYSTKIE powiadomienia

**Plik:** `app/api/notifications/route.ts`, linia 62–69  
**Problem:**
```typescript
const where = readOnly
  ? { organizationId, userId, readAt: { not: null, lt: new Date(...) } }
  : { organizationId, userId };  // bez readOnly=true → usuwa WSZYSTKO
```
Wywołanie `DELETE /api/notifications` bez query param `readOnly=true` usuwa wszystkie powiadomienia użytkownika — przeczytane i nieprzeczytane. To destrukcyjna operacja dostępna bez dodatkowego potwierdzenia. Nie ma żadnego rate limitingu na tym endpoincie.

---

#### [V7-M5] `lib/billing.ts` — `planLimits('MIKRO')` zamiast `planLimits('MIKRO')` — niespójność enum case

**Plik:** `lib/billing.ts`, linia 7  
**Problem:**
```typescript
if (plan === 'STARTER') return { ksefConnectionLimit: 1, userLimit: 5 };
// brak explicit case dla 'MIKRO' — wpada w default:
return { ksefConnectionLimit: 1, userLimit: 1 }; // poprawne, ale bez explicit case
```
Brak explicit case `if (plan === 'MIKRO')` — MIKRO wpada w `default`. Jeśli ktoś doda nowy plan między MIKRO a STARTER, domyślnie dostanie limity MIKRO zamiast błędu. Lepiej użyć obiektu `PLANS` z `lib/stripe.ts` który jest source of truth dla limitów.

---

#### [V7-M6] `app/api/api-keys/route.ts` — brak sprawdzenia planu przy tworzeniu klucza API

**Plik:** `app/api/api-keys/route.ts`  
**Problem:** `canAccessApi()` z `billing-features.ts` wymaga planu GROWTH+, ale endpoint tworzenia kluczy API nie sprawdza planu subskrypcji. Organizacja na planie MIKRO lub STARTER (bez dostępu do API) może tworzyć klucze API i używać ich do integracji — bez płacenia za odpowiedni plan.

---

#### [V7-M7] `Membership` — brak pola `status` (ACTIVE/INVITED/SUSPENDED)

**Plik:** `prisma/schema.prisma`, linia 255–263  
**Problem:**
```prisma
model Membership {
  id             String  @id @default(cuid())
  userId         String
  organizationId String
  role           Role    @default(OWNER)
  // brak: status, createdAt
}
```
Model nie ma `status` ani `createdAt`. `checkUserLimit` liczy **wszystkich** członków bez filtrowania aktywnych. Jeśli kiedyś doda się zawieszenie członka (`SUSPENDED`), nadal będzie liczony do limitu. Brak `createdAt` utrudnia audytowanie kto i kiedy dołączył.

---

#### [V7-M8] `app/api/v1/emissions/route.ts` — brak sprawdzenia planu (dostęp do API powinien wymagać GROWTH+)

**Plik:** `app/api/v1/emissions/route.ts`  
**Problem:** `withApiKey` sprawdza tylko scope (`emissions:read`), ale nie sprawdza czy plan organizacji pozwala na dostęp do API. Organizacja na planie MIKRO może tworzyć klucze (V7-M6) i używać endpointów v1. `lib/api-auth.ts` nie importuje `billing-features.ts`.

---

#### [V7-M9] `lib/notifications.ts` — brak deduplicji powiadomień tego samego typu w krótkim oknie

**Plik:** `lib/notifications.ts`  
**Problem:** `createNotification` nie sprawdza czy podobne powiadomienie już istnieje. Przy szybkim imporcie wielu faktur (np. 50 job-ów jednocześnie) każdy zakończony job tworzy powiadomienie `KSEF_IMPORT_DONE`. User może dostać 50 powiadomień naraz. Sprawdzenie deduplicji `billing.ts` dla `INVOICE_LIMIT_WARNING` (1 per 24h) nie jest uogólnione na `createNotification`.

---

#### [V7-M10] Brak `HEALTH_CHECK_SECRET` w `.env.example`

**Plik:** `.env.example`  
**Problem:** `app/api/health/route.ts` używa `HEALTH_CHECK_SECRET` do autoryzacji diagnostyk, ale ta zmienna nie jest udokumentowana w `.env.example`. Deweloper nie wie że musi ją ustawić — endpoint będzie zawsze zwracał tylko `{ ok, status, db }` bez diagnostyk, co utrudnia debugowanie produkcji.

---

## Podsumowanie v7

| Priorytet | Nowe | Nadal otwarte z v6 | Łącznie |
|-----------|------|-------------------|---------|
| 🔴 Krytyczne | 2 | 0 | 2 |
| 🟠 High | 5 | 0 | 5 |
| 🟡 Medium | 6 | 2 (V6-M6, V6-M7) | 8 |

### TOP priorytety:
1. **[V7-C1]** PricingTable — stary cennik z invoice limits (klient widzi błędne ceny!)
2. **[V7-C2]** checkKsefLimit — brak modelu `KsefConnection`, nie da się śledzić >1 NIP per org
3. **[V7-H1]** Błędny typ notyfikacji `INVOICE_LIMIT_WARNING` dla KSeF/user limits
4. **[V7-H4]** Public API `findMany` bez limitu — potencjalny OOM
5. **[V7-H5]** JWT callback odpytuje DB przy każdym request
