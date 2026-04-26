# Cursor prompty — Faza 3: Monetyzacja, Compliance, Ekosystem

> Kontekst: Next.js 15 App Router, Prisma/PostgreSQL, NextAuth v4 JWT, TypeScript strict, Resend, Upstash Redis.  
> Faza 2 musi być ukończona (testy Vitest, reset hasła, weryfikacja emaila, CI/CD, PDF raport, refaktor dashboardu).  
> Wklej każdy prompt osobno w Cursor Agent Mode z dostępem do całego projektu.

---

## PROMPT P3-1 — Billing / Stripe: plany, subskrypcje, webhook

```
Zaimplementuj integrację Stripe Billing w projekcie Scopeo SaaS.

**Kontekst biznesowy:** Scopeo ma 5 planów cenowych opartych na liczbie połączeń KSeF (podmiotów/NIP) i użytkowników — NIE na liczbie faktur. Faktury są bez limitu na każdym planie.

| Plan       | Połączenia KSeF | Użytkownicy | Cena miesięczna (netto) | Cena roczna (netto, −20%) |
|------------|----------------|-------------|------------------------|--------------------------|
| Mikro      | 1              | 1           | 149 zł                 | 119 zł/mc                |
| Starter    | 1              | 5           | 279 zł                 | 223 zł/mc                |
| Growth     | 3              | 15          | 499 zł                 | 399 zł/mc                |
| Scale      | 10             | bez limitu  | 849 zł                 | 679 zł/mc                |
| Enterprise | bez limitu     | bez limitu  | wycena indywidualna    | —                        |

Plan **Growth** jest oznaczony jako "Polecany". Enterprise ma SSO/SAML, dedykowane SLA i środowisko.
Rozliczenie roczne daje rabat −20% na wszystkich planach poza Enterprise.
Każdy nowy klient dostaje **7-dniowy bezpłatny trial** (pełny dostęp do planu Growth).
Organizacja ma jedno konto Stripe Customer przypisane do swojego rekordu.

**Czym różnią się plany (funkcje):**

| Funkcja                  | Mikro | Starter | Growth | Scale | Enterprise |
|--------------------------|-------|---------|--------|-------|------------|
| KSeF import (bez limitu) | ✓     | ✓       | ✓      | ✓     | ✓          |
| Scope 1 + 2              | ✓     | ✓       | ✓      | ✓     | ✓          |
| Scope 3                  | —     | ✓       | ✓      | ✓     | ✓          |
| PDF raport GHG           | ✓     | ✓       | ✓      | ✓     | ✓          |
| CSRD / ESRS export       | —     | ✓       | ✓      | ✓     | ✓          |
| Review workflow          | —     | —       | ✓      | ✓     | ✓          |
| Public API               | —     | —       | ✓      | ✓     | ✓          |
| White-label raporty      | —     | —       | —      | ✓     | ✓          |
| SSO / SAML               | —     | —       | —      | —     | ✓          |
| Dedykowane środowisko    | —     | —       | —      | —     | ✓          |
| Support                  | email | email   | priorytetowy | dedykowany | account manager |

Organizacja ma jedno konto Stripe Customer przypisane do swojego rekordu.

**Schemat Prisma — dodaj do schema.prisma:**
```prisma
model Subscription {
  id                   String             @id @default(cuid())
  organizationId       String             @unique
  organization         Organization       @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  stripeCustomerId     String             @unique
  stripeSubscriptionId String?            @unique
  plan                 SubscriptionPlan   @default(MIKRO)
  billingInterval      BillingInterval    @default(MONTHLY)
  status               SubscriptionStatus @default(TRIALING)
  trialEndsAt          DateTime?          // ustawiane przy rejestracji: now() + 7 dni
  currentPeriodEnd     DateTime?
  cancelAtPeriodEnd    Boolean            @default(false)
  ksefConnectionLimit  Int                @default(1)    // Mikro=1, Starter=1, Growth=3, Scale=10, Enterprise=999
  userLimit            Int                @default(1)    // Mikro=1, Starter=5, Growth=15, Scale=999, Enterprise=999
  createdAt            DateTime           @default(now())
  updatedAt            DateTime           @updatedAt

  @@index([stripeCustomerId])
}

enum SubscriptionPlan {
  MICRO
  STARTER
  GROWTH
  SCALE
  ENTERPRISE
}

enum BillingInterval {
  MONTHLY
  ANNUAL
}

enum SubscriptionStatus {
  ACTIVE
  PAST_DUE
  CANCELED
  TRIALING
}
```

**Zmień model Organization — dodaj relację:**
```prisma
subscription Subscription?
```

**Zmienne środowiskowe — dodaj do .env.example:**
```
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
# Ceny miesięczne (netto PLN)
STRIPE_PRICE_ID_MIKRO_MONTHLY="price_..."      # 149 zł
STRIPE_PRICE_ID_STARTER_MONTHLY="price_..."    # 279 zł
STRIPE_PRICE_ID_GROWTH_MONTHLY="price_..."     # 499 zł
STRIPE_PRICE_ID_SCALE_MONTHLY="price_..."      # 849 zł
# Ceny roczne (-20%, rozliczane co rok)
STRIPE_PRICE_ID_MIKRO_ANNUAL="price_..."       # 119 zł/mc × 12 = 1428 zł/rok
STRIPE_PRICE_ID_STARTER_ANNUAL="price_..."     # 223 zł/mc × 12 = 2676 zł/rok
STRIPE_PRICE_ID_GROWTH_ANNUAL="price_..."      # 399 zł/mc × 12 = 4788 zł/rok
STRIPE_PRICE_ID_SCALE_ANNUAL="price_..."       # 679 zł/mc × 12 = 8148 zł/rok
# Trial: 7 dni bezpłatnie (obsługiwane przez Stripe trial_period_days)
STRIPE_TRIAL_DAYS="7"
```

**Utwórz lib/stripe.ts:**
```typescript
import Stripe from 'stripe';
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
  typescript: true,
});

export const PLANS = {
  MIKRO:      { name: 'Mikro',      ksefLimit: 1,       userLimit: 1,   monthlyPricePLN: 149,  annualPricePLN: 119,  priceIdMonthly: process.env.STRIPE_PRICE_ID_MIKRO_MONTHLY,   priceIdAnnual: process.env.STRIPE_PRICE_ID_MIKRO_ANNUAL },
  STARTER:    { name: 'Starter',    ksefLimit: 1,       userLimit: 5,   monthlyPricePLN: 279,  annualPricePLN: 223,  priceIdMonthly: process.env.STRIPE_PRICE_ID_STARTER_MONTHLY, priceIdAnnual: process.env.STRIPE_PRICE_ID_STARTER_ANNUAL },
  GROWTH:     { name: 'Growth',     ksefLimit: 3,       userLimit: 15,  monthlyPricePLN: 499,  annualPricePLN: 399,  priceIdMonthly: process.env.STRIPE_PRICE_ID_GROWTH_MONTHLY,  priceIdAnnual: process.env.STRIPE_PRICE_ID_GROWTH_ANNUAL,  recommended: true },
  SCALE:      { name: 'Scale',      ksefLimit: 10,      userLimit: 999, monthlyPricePLN: 849,  annualPricePLN: 679,  priceIdMonthly: process.env.STRIPE_PRICE_ID_SCALE_MONTHLY,   priceIdAnnual: process.env.STRIPE_PRICE_ID_SCALE_ANNUAL },
  ENTERPRISE: { name: 'Enterprise', ksefLimit: 999,     userLimit: 999, monthlyPricePLN: null, annualPricePLN: null, priceIdMonthly: null, priceIdAnnual: null },
} as const;

export const ANNUAL_DISCOUNT = 0.20; // -20%
export const TRIAL_DAYS = Number(process.env.STRIPE_TRIAL_DAYS ?? '7');
```

**Utwórz lib/billing.ts** z funkcjami:

- `getOrCreateStripeCustomer(organizationId: string): Promise<string>` — tworzy Stripe Customer jeśli nie istnieje (pobiera nazwę org z DB), zwraca stripeCustomerId, tworzy Subscription z plan=MIKRO i status=TRIALING, trialEndsAt=now()+7dni

- `getSubscription(organizationId: string): Promise<Subscription | null>`

- `isTrialActive(sub: Subscription): boolean` — zwraca true jeśli status=TRIALING i trialEndsAt > now()

- `checkKsefLimit(organizationId: string): Promise<{ allowed: boolean; used: number; limit: number }>` — liczy KSeF connections (np. unikalne KSEF_CONTEXT_NIP powiązane z org), porównuje z ksefConnectionLimit z Subscription

- `checkUserLimit(organizationId: string): Promise<{ allowed: boolean; used: number; limit: number }>` — liczy aktywne Membership dla org, porównuje z userLimit

- `getPriceId(plan: SubscriptionPlan, interval: BillingInterval): string | null`

**Utwórz app/api/billing/checkout/route.ts (POST):**
- Wymaga sesji (getServerSession) i roli OWNER/ADMIN
- Body: `{ plan: SubscriptionPlan, interval: 'MONTHLY' | 'ANNUAL' }`
- Odrzuca plan ENTERPRISE → zwróć `{ redirect: '/kontakt' }`
- Tworzy Stripe Checkout Session:
  - `mode: 'subscription'`
  - `trial_period_days: TRIAL_DAYS` (tylko jeśli klient jeszcze nie miał trialu — sprawdź po `stripeCustomerId` czy istnieje poprzednia subskrypcja)
  - `payment_method_collection: 'if_required'` — Stripe nie wymaga metody płatności na początku trialu, jeśli nie jest potrzebna
  - `success_url`, `cancel_url`
  - `metadata: { plan, interval, organizationId }`
- Jeśli klient już ma aktywną płatną subskrypcję → użyj Billing Portal (upgrade/downgrade)
- Zwraca `{ url: string }`

**Utwórz app/api/billing/portal/route.ts (POST):**
- Wymaga sesji OWNER/ADMIN
- Tworzy Stripe Customer Portal session
- Zwraca `{ url: string }`

**Utwórz app/api/webhooks/stripe/route.ts:**
- Weryfikuje `stripe.webhooks.constructEvent()` z `STRIPE_WEBHOOK_SECRET`
- Użyj `req.text()` do odczytu body
- Obsługuje zdarzenia:
  - `customer.subscription.created` / `checkout.session.completed` → upsert Subscription (plan, interval z metadata, status=TRIALING jeśli trial_end ustawiony, inaczej ACTIVE, ksefConnectionLimit i userLimit z PLANS[plan])
  - `customer.subscription.trial_will_end` (3 dni przed końcem) → wyślij email przez Resend: "Twój trial kończy się za 3 dni — dodaj kartę żeby zachować dostęp"
  - `customer.subscription.updated` → aktualizuj status, currentPeriodEnd, cancelAtPeriodEnd, ksefConnectionLimit, userLimit (z PLANS[plan])
  - `customer.subscription.deleted` → status=CANCELED, plan=MIKRO, ksefConnectionLimit=1, userLimit=1
  - `invoice.payment_failed` → status=PAST_DUE, email ostrzeżenia przez Resend
- W metadata Stripe Checkout zapisuj `{ plan, interval, organizationId }`

**Utwórz app/dashboard/settings/billing/page.tsx:**
- Banner trialowy (jeśli status=TRIALING): "Twój bezpłatny trial kończy się za X dni. Dodaj kartę żeby zachować dostęp." + przycisk "Aktywuj subskrypcję"
- Przełącznik Miesięcznie / Rocznie (−20%) — animowane przełączenie cen
- 5 kart planów: Mikro / Starter / Growth (badge "Polecany") / Scale / Enterprise
- Każda karta zawiera: nazwa, liczba połączeń KSeF, liczba użytkowników, lista funkcji (✓/—), cena miesięczna lub roczna
- Enterprise: przycisk "Porozmawiaj o wdrożeniu" → /kontakt
- Aktywny plan: zielone obramowanie, przycisk "Twój plan" (disabled)
- Trial: złote obramowanie na Growth (bo trial daje dostęp do Growth)
- Sekcja statusu nad kartami: plan, data odnowienia / koniec trialu, liczba użytkowników (used/limit), liczba połączeń KSeF (used/limit)
- Przycisk "Zarządzaj subskrypcją" (Stripe Portal) dla płacących

**Middleware guard — utwórz lib/billing-guard.ts:**
```typescript
export async function requireUserCapacity(organizationId: string) {
  const check = await checkUserLimit(organizationId);
  if (!check.allowed) {
    throw new Error(`Osiągnięto limit użytkowników planu (${check.used}/${check.limit}). Zmień plan w Ustawieniach → Billing.`);
  }
}

export async function requireKsefCapacity(organizationId: string) {
  const check = await checkKsefLimit(organizationId);
  if (!check.allowed) {
    throw new Error(`Osiągnięto limit połączeń KSeF planu (${check.used}/${check.limit}). Zmień plan w Ustawieniach → Billing.`);
  }
}
```
Wywołaj `requireUserCapacity` w `app/api/invites/route.ts` przed wysłaniem zaproszenia.
Wywołaj `requireKsefCapacity` przed dodaniem nowego połączenia KSeF.

**Utwórz lib/billing-features.ts** — sprawdza dostęp do funkcji per plan:
```typescript
export function canAccessScope3(plan: SubscriptionPlan): boolean {
  return ['STARTER', 'GROWTH', 'SCALE', 'ENTERPRISE'].includes(plan);
}
export function canAccessCsrdExport(plan: SubscriptionPlan): boolean {
  return ['STARTER', 'GROWTH', 'SCALE', 'ENTERPRISE'].includes(plan);
}
export function canAccessReviewWorkflow(plan: SubscriptionPlan): boolean {
  return ['GROWTH', 'SCALE', 'ENTERPRISE'].includes(plan);
}
export function canAccessApi(plan: SubscriptionPlan): boolean {
  return ['GROWTH', 'SCALE', 'ENTERPRISE'].includes(plan);
}
export function canAccessWhiteLabel(plan: SubscriptionPlan): boolean {
  return ['SCALE', 'ENTERPRISE'].includes(plan);
}
```
Użyj tych funkcji w odpowiednich API routes — zwracaj 403 z komunikatem "Upgrade planu wymagany" jeśli funkcja niedostępna.

**Testy Vitest (lib/__tests__/billing.test.ts):**
- Sprawdź że `isTrialActive` zwraca false gdy trialEndsAt < now()
- Sprawdź że `checkUserLimit` zwraca `allowed: false` gdy membershipCount >= userLimit
- Sprawdź limity: MIKRO={ksef:1,users:1}, STARTER={ksef:1,users:5}, GROWTH={ksef:3,users:15}, SCALE={ksef:10,users:999}
- Sprawdź że `canAccessReviewWorkflow('STARTER')` zwraca false, dla 'GROWTH' zwraca true
- Sprawdź że `getPriceId('ENTERPRISE', 'MONTHLY')` zwraca null
```

---

## PROMPT P3-2 — CSRD / ESG export: raport XML Annex II i CSV tabela danych

```
Zaimplementuj eksport danych emisji w formacie zgodnym z CSRD (Corporate Sustainability Reporting Directive) oraz standardem GHG Protocol dla projektu Scopeo SaaS.

**Kontekst:** CSRD wymaga raportowania w ramach ESRS E1 (Climate change). Scopeo ma dane Scope 1, 2, 3 per kategoria per rok. Eksport ma być używany do wypełnienia raportów niefinansowych i audytów ESG.

**Utwórz lib/csrd-export.ts:**

```typescript
import { prisma } from './prisma';

export interface CsrdReportData {
  organizationId: string;
  reportYear: number;
  generatedAt: string;
  organizationName: string;
  taxId: string | null;
  scope1Total: number;        // tCO2e
  scope2Total: number;        // tCO2e (location-based)
  scope3Total: number;        // tCO2e
  totalGhg: number;           // tCO2e
  byCategory: CsrdCategory[];
  methodology: string;        // "GHG Protocol Corporate Standard"
  dataQuality: 'ESTIMATED' | 'CALCULATED' | 'MEASURED';
  boundaryApproach: 'OPERATIONAL_CONTROL';
}

export interface CsrdCategory {
  scope: 'SCOPE1' | 'SCOPE2' | 'SCOPE3';
  category: string;           // np. "scope1_fuel_gas"
  categoryLabel: string;      // np. "Spalanie paliw - gaz ziemny"
  totalTCO2e: number;
  lineCount: number;
  factorSource: string;       // "KOBiZE 2023" | "UK DESNZ 2024" | "EPA 2024"
}
```

Funkcja `generateCsrdReport(organizationId: string, year: number): Promise<CsrdReportData>`:
- Pobierz CarbonProfile (organizationName, taxId)
- Pobierz emisje z EmissionResult (groupBy categoryCode, scope, sum kgCO2e → konwertuj na tCO2e)
- Filtruj po roku (JOIN Invoice → issueDate)
- Określ dataQuality: jeśli wszystkie linie mają factorId → CALCULATED, inaczej ESTIMATED
- Zwróć strukturę CsrdReportData

**Utwórz app/api/emissions/csrd-export/route.ts (GET):**
- Query params: `year` (wymagany), `format` ('csv' | 'json', domyślnie 'json')
- Wymaga sesji + roli ANALYST/APPROVER/OWNER/ADMIN
- Wywołaj `generateCsrdReport`
- Dla `format=json`: zwróć JSON z nagłówkiem `Content-Disposition: attachment; filename="csrd-esrs-e1-{orgId}-{year}.json"`
- Dla `format=csv`: wygeneruj CSV zgodny z tabelą ESRS E1-6 (Gross Scopes 1, 2, 3):

```
GHG disclosure,Value,Unit,Year,Scope,Category,Methodology
"Gross Scope 1 GHG emissions",{scope1Total},"tCO2e",{year},"Scope 1","All","GHG Protocol"
"Gross Scope 2 GHG emissions (location-based)",{scope2Total},"tCO2e",{year},"Scope 2","All","GHG Protocol"
"Gross Scope 3 GHG emissions",{scope3Total},"tCO2e",{year},"Scope 3","All","GHG Protocol"
"Total GHG emissions",{totalGhg},"tCO2e",{year},"All","All","GHG Protocol"
{... per-category rows ...}
```

**Utwórz app/api/emissions/csrd-export/xml/route.ts (GET):**
- Generuje XML zgodny z ESRS Taxonomy (XBRL-lite, uproszczony format dla audytorów):
```xml
<?xml version="1.0" encoding="UTF-8"?>
<esrs:Report xmlns:esrs="https://xbrl.efrag.org/esrs/2024"
             contextRef="FY{year}" entityName="{orgName}" taxId="{taxId}">
  <esrs:E1-6_GrossScope1GHGEmissions decimals="3" unitRef="tCO2e">{scope1Total}</esrs:E1-6_GrossScope1GHGEmissions>
  <esrs:E1-6_GrossScope2GHGEmissionsLocationBased decimals="3" unitRef="tCO2e">{scope2Total}</esrs:E1-6_GrossScope2GHGEmissionsLocationBased>
  <esrs:E1-6_GrossScope3GHGEmissions decimals="3" unitRef="tCO2e">{scope3Total}</esrs:E1-6_GrossScope3GHGEmissions>
  <esrs:E1-6_TotalGHGEmissions decimals="3" unitRef="tCO2e">{totalGhg}</esrs:E1-6_TotalGHGEmissions>
  <esrs:methodology>GHG Protocol Corporate Standard</esrs:methodology>
  <esrs:boundaryApproach>Operational Control</esrs:boundaryApproach>
  <esrs:generatedAt>{generatedAt}</esrs:generatedAt>
</esrs:Report>
```
- Zwróć z `Content-Type: application/xml`, `Content-Disposition: attachment; filename="esrs-e1-{year}.xml"`

**Dodaj przyciski eksportu w dashboard/report/page.tsx:**
- "Pobierz CSRD JSON" → GET /api/emissions/csrd-export?year=X&format=json
- "Pobierz CSRD CSV" → GET /api/emissions/csrd-export?year=X&format=csv
- "Pobierz ESRS XML" → GET /api/emissions/csrd-export/xml?year=X

**Utwórz lib/__tests__/csrd-export.test.ts:**
- Mockuj prisma, sprawdź że scope1Total = suma kgCO2e z SCOPE1 / 1000
- Sprawdź że CSV zawiera wszystkie 4 nagłówkowe wiersze
- Sprawdź że XML jest valid XML (użyj `new DOMParser().parseFromString(...)` lub podobne)
```

---

## PROMPT P3-3 — Public API: klucze API, rate limiting, dokumentacja OpenAPI

```
Zaimplementuj Public REST API dla Scopeo SaaS — zewnętrzni klienci (systemy ERP, integracje BI) mogą pobierać dane emisji przez klucze API.

**Schemat Prisma — dodaj:**
```prisma
model ApiKey {
  id             String       @id @default(cuid())
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  name           String       // "Power BI integration", "SAP connector"
  keyHash        String       @unique  // SHA-256 hash klucza
  keyPrefix      String       // pierwsze 8 znaków klucza (do identyfikacji)
  scopes         String[]     // ["emissions:read", "suppliers:read", "factors:read"]
  lastUsedAt     DateTime?
  expiresAt      DateTime?
  createdBy      String       // userId
  revokedAt      DateTime?
  createdAt      DateTime     @default(now())

  @@index([organizationId])
  @@index([keyHash])
}
```

**Utwórz lib/api-keys.ts:**
```typescript
import { createHash, randomBytes } from 'crypto';

export function generateApiKey(): { raw: string; hash: string; prefix: string } {
  const raw = `scp_${randomBytes(32).toString('hex')}`;  // format: scp_<64 hex chars>
  const hash = createHash('sha256').update(raw).digest('hex');
  const prefix = raw.substring(0, 8);
  return { raw, hash, prefix };
}

export function hashApiKey(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

export async function validateApiKey(rawKey: string): Promise<{
  valid: boolean;
  organizationId?: string;
  scopes?: string[];
  keyId?: string;
}> {
  const hash = hashApiKey(rawKey);
  const key = await prisma.apiKey.findUnique({
    where: { keyHash: hash },
    select: { id: true, organizationId: true, scopes: true, revokedAt: true, expiresAt: true },
  });
  if (!key || key.revokedAt || (key.expiresAt && key.expiresAt < new Date())) {
    return { valid: false };
  }
  await prisma.apiKey.update({ where: { id: key.id }, data: { lastUsedAt: new Date() } });
  return { valid: true, organizationId: key.organizationId, scopes: key.scopes, keyId: key.id };
}
```

**Utwórz middleware dla API — lib/api-auth.ts:**
```typescript
export async function withApiKey(
  req: Request,
  requiredScope: string,
  handler: (organizationId: string) => Promise<Response>
): Promise<Response> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer scp_')) {
    return Response.json({ error: 'Missing or invalid API key' }, { status: 401 });
  }
  const rawKey = authHeader.replace('Bearer ', '');
  const { valid, organizationId, scopes } = await validateApiKey(rawKey);
  if (!valid || !organizationId) {
    return Response.json({ error: 'Invalid or expired API key' }, { status: 401 });
  }
  if (!scopes?.includes(requiredScope)) {
    return Response.json({ error: `Missing scope: ${requiredScope}` }, { status: 403 });
  }
  // Rate limit: 1000 req/hour per API key
  const limit = await checkRateLimit(`apikey:${rawKey.substring(0, 12)}`, { windowMs: 3600_000, maxRequests: 1000 });
  if (!limit.ok) {
    return Response.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }
  return handler(organizationId);
}
```

**Utwórz endpointy Public API pod app/api/v1/:**

`app/api/v1/emissions/route.ts (GET)` — scope `emissions:read`:
```
GET /api/v1/emissions?year=2024&scope=SCOPE1
Authorization: Bearer scp_...

Response: {
  "data": [
    { "category": "scope1_fuel_gas", "scope": "SCOPE1", "totalKgCO2e": 12345.67, "totalTCO2e": 12.35, "year": 2024, "lineCount": 42 }
  ],
  "meta": { "organizationId": "...", "year": 2024, "generatedAt": "..." }
}
```

`app/api/v1/suppliers/route.ts (GET)` — scope `suppliers:read`:
```
GET /api/v1/suppliers?page=1&limit=50
Response: { "data": [{ "id": "...", "name": "...", "taxId": "..." }], "meta": { "total": 120, "page": 1, "limit": 50 } }
```

`app/api/v1/factors/route.ts (GET)` — scope `factors:read`:
- Zwraca listę dostępnych emission factors dla organizacji

**Utwórz endpointy zarządzania kluczami (wymagają sesji NextAuth):**

`app/api/api-keys/route.ts`:
- GET: listuj klucze organizacji (bez hash, z prefix + scopes + lastUsedAt)
- POST body `{ name, scopes, expiresAt? }`: generuj nowy klucz, zwróć raw key JEDEN RAZ, zapisz hash

`app/api/api-keys/[keyId]/route.ts`:
- DELETE: odwołaj klucz (ustaw revokedAt = now)

**Utwórz app/dashboard/settings/api-keys/page.tsx:**
- Lista aktywnych kluczy: nazwa, prefix (scp_XXXX...), zakresy, ostatnie użycie, data wygaśnięcia
- Przycisk "Utwórz klucz API" → modal z nazwą i checkboxami zakresów
- Po utworzeniu: pokaż raw key w modalu z kopiowaniem i ostrzeżeniem "Ten klucz widzisz tylko raz"
- Przycisk "Odwołaj" przy każdym kluczu (z potwierdzeniem)

**Utwórz app/api/v1/openapi.json/route.ts (GET):**
- Zwróć OpenAPI 3.1 spec dla wszystkich endpointów /api/v1/*
- Zawiera: info (title, version, contact), servers, security schemes (BearerAuth), paths z parametrami i przykładami odpowiedzi
```

---

## PROMPT P3-4 — Workspace switcher: multi-org dla jednego użytkownika

```
Zaimplementuj przełączanie organizacji dla użytkowników należących do wielu organizacji w Scopeo SaaS.

**Problem:** Użytkownik może być członkiem wielu organizacji (np. konsultant ESG obsługujący kilku klientów). Obecnie NextAuth JWT zapisuje tylko jedną organizację. Trzeba dodać "aktywną organizację" do sesji i UI do przełączania.

**Zmiana NextAuth — aktualizuj lib/auth.ts:**
Dodaj do JWT callback:
```typescript
// Przy logowaniu sprawdź wszystkie organizacje użytkownika
if (trigger === 'signIn' || trigger === 'update') {
  const memberships = await prisma.membership.findMany({
    where: { userId: token.sub!, status: 'ACTIVE' },
    include: { organization: { select: { id: true, name: true, slug: true } } },
    orderBy: { createdAt: 'asc' },
  });
  token.organizations = memberships.map(m => ({
    id: m.organization.id,
    name: m.organization.name,
    slug: m.organization.slug,
    role: m.role,
  }));
  // Aktywna org: z `update()` trigger jeśli podano, inaczej pierwsza
  if (trigger === 'update' && session.activeOrganizationId) {
    const valid = token.organizations.find(o => o.id === session.activeOrganizationId);
    token.activeOrganizationId = valid?.id ?? token.organizations[0]?.id;
  } else if (!token.activeOrganizationId) {
    token.activeOrganizationId = token.organizations[0]?.id;
  }
}
```

Zaktualizuj session callback żeby eksponował `organizations` i `activeOrganizationId`.

Zaktualizuj NextAuth types (types/next-auth.d.ts):
```typescript
declare module 'next-auth' {
  interface Session {
    user: { id: string; email: string; name: string; role: string; };
    organizationId: string;  // = activeOrganizationId
    organizations: { id: string; name: string; slug: string; role: string }[];
  }
}
```

**Utwórz app/api/auth/switch-organization/route.ts (POST):**
- Body: `{ organizationId: string }`
- Sprawdź że użytkownik ma Membership w tej organizacji
- Wywołaj `update({ activeOrganizationId: organizationId })` przez NextAuth
- Zwróć `{ ok: true }`

**Utwórz komponent components/workspace-switcher.tsx:**
```typescript
'use client';
// Dropdown z listą organizacji użytkownika
// Aktualnie aktywna zaznaczona checkmarkiem
// Po kliknięciu innej: POST /api/auth/switch-organization → router.refresh()
// Wyświetla: nazwa organizacji + rola użytkownika (badge)
// Jeśli user ma tylko 1 org: renderuj sam chip z nazwą bez dropdown
// Użyj Radix UI DropdownMenu lub headlessui
```

**Osadź WorkspaceSwitcher w app/dashboard/layout.tsx** — w nagłówku/sidebar obok nazwy użytkownika.

**Utwórz app/api/organizations/route.ts (GET):**
- Zwraca listę organizacji aktualnego użytkownika z rolą
- Używane przez WorkspaceSwitcher przy client-side refresh

**Guard middleware — zaktualizuj middleware.ts:**
Przy każdym request do /dashboard/* i /api/* (poza /api/auth/*) sprawdź że `session.organizationId` należy do `session.organizations` — blokuj jeśli ktoś manipuluje JWT.

**Utwórz app/onboarding/join-organization/page.tsx:**
- Strona dla użytkownika, który kliknął link zaproszenia do drugiej organizacji gdy jest już zalogowany
- Pokazuje: "Chcesz dołączyć do [nazwa org] jako [rola]?"
- Przycisk "Dołącz" → API accept invite → automatycznie przełącza na nową org
```

---

## PROMPT P3-5 — Onboarding wizard: multi-step setup po rejestracji

```
Zaimplementuj wieloetapowy wizard onboardingowy w Scopeo SaaS — nowy użytkownik-właściciel przechodzi przez konfigurację organizacji przed dostępem do dashboardu.

**Kontekst:** Nowa organizacja po rejestracji ma pusty CarbonProfile i nie wie od czego zacząć. Wizard zbiera dane w 4 krokach i ustawia wszystko automatycznie.

**Schemat Prisma — dodaj do Organization:**
```prisma
onboardingCompletedAt DateTime?
onboardingStep        Int       @default(0)  // 0 = nie zaczęty, 4 = ukończony
```

**Middleware guard:** W middleware.ts przekieruj na `/onboarding` jeśli:
- Sesja jest ważna + rola OWNER
- `organization.onboardingCompletedAt === null`
- Ścieżka nie zaczyna się od `/onboarding`, `/api/auth`, `/api/onboarding`

**Utwórz app/onboarding/layout.tsx:**
- Prosty layout: logo Scopeo + progress bar (krok 1/4, 2/4, ...)
- Bez sidebar dashboardu

**Utwórz app/onboarding/page.tsx** — redirect do `/onboarding/step/1`

**Utwórz app/onboarding/step/[step]/page.tsx** z 4 krokami:

**Krok 1 — Profil organizacji:**
- Pola: Nazwa firmy (prefill z registration), NIP (taxId), Adres (ulica, kod, miasto), Rok sprawozdawczy (select: 2023, 2024, 2025)
- POST /api/onboarding/profile → zapisz do CarbonProfile + Organization

**Krok 2 — Branża i granice organizacyjne:**
- Select: Branża (lista 15 sektorów NACE: Przetwórstwo przemysłowe, Handel, Budownictwo, Transport, IT, ...)
- Select: Podejście do granic (Kontrola operacyjna / Kontrola finansowa / Udział w kapitale)
- Checkboxes: Zakresy do raportowania (Scope 1 ✓, Scope 2 ✓, Scope 3 opcjonalnie)
- POST /api/onboarding/boundary → zapisz do CarbonProfile (industry, boundaryApproach, scopes)

**Krok 3 — Połącz KSeF:**
- Info: "Połącz KSeF aby automatycznie importować faktury i obliczać emisje"
- Pole: KSeF Token (masked input)
- Pole: NIP kontekstu (prefill z kroku 1)
- Przycisk "Przetestuj połączenie" → POST /api/ksef/test → sprawdź czy token działa
- Jeśli OK: zielony status + "Połączono"
- Możliwość pominięcia ("Połączę później")
- POST /api/onboarding/ksef → zaszyfruj token, zapisz

**Krok 4 — Zaproś team:**
- Dodaj do 3 emaili z rolami (ANALYST, REVIEWER, APPROVER, ADMIN)
- Dynamicznie dodawaj wiersze "+" 
- Przycisk "Wyślij zaproszenia" → POST /api/invites (bulk)
- Możliwość pominięcia ("Zaproszę później")
- Przycisk "Zakończ konfigurację" → POST /api/onboarding/complete → ustaw onboardingCompletedAt, redirect /dashboard

**Utwórz endpointy /api/onboarding/:**
- `POST /api/onboarding/profile` — wymaga OWNER, walidacja Zod, upsert CarbonProfile, zapisz onboardingStep=1
- `POST /api/onboarding/boundary` — zapisz branżę i granice, onboardingStep=2
- `POST /api/onboarding/ksef` — jak obecna logika zapisywania tokenu KSeF, onboardingStep=3
- `POST /api/onboarding/complete` — onboardingCompletedAt=now(), redirect dashboard

**Utwórz komponent components/onboarding/step-indicator.tsx:**
- Horizontal stepper z krokami 1-4, zielony checkmark dla ukończonych
```

---

## PROMPT P3-6 — Notification center: powiadomienia in-app

```
Zaimplementuj centrum powiadomień in-app dla Scopeo SaaS (bell icon w nagłówku z unread count).

**Schemat Prisma — dodaj:**
```prisma
model Notification {
  id             String           @id @default(cuid())
  organizationId String
  organization   Organization     @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  userId         String?          // null = dla całej organizacji
  user           User?            @relation(fields: [userId], references: [id])
  type           NotificationType
  title          String
  body           String
  link           String?          // /dashboard/review, /dashboard/report itd.
  readAt         DateTime?
  createdAt      DateTime         @default(now())

  @@index([organizationId, userId, readAt])
}

enum NotificationType {
  KSEF_IMPORT_DONE
  KSEF_IMPORT_FAILED
  REVIEW_SUBMITTED
  REVIEW_APPROVED
  REVIEW_REJECTED
  INVOICE_LIMIT_WARNING   // 80% limitu billing
  GDPR_REQUEST_RECEIVED
  FACTOR_IMPORT_DONE
  MEMBER_JOINED
  MEMBER_ROLE_CHANGED
}
```

**Utwórz lib/notifications.ts:**
```typescript
export async function createNotification(input: {
  organizationId: string;
  userId?: string;  // jeśli null → dla wszystkich OWNER/ADMIN w org
  type: NotificationType;
  title: string;
  body: string;
  link?: string;
}): Promise<void> {
  if (input.userId) {
    await prisma.notification.create({ data: input });
  } else {
    // Dla całej org: znajdź wszystkich OWNER i ADMIN, utwórz dla każdego
    const members = await prisma.membership.findMany({
      where: { organizationId: input.organizationId, role: { in: ['OWNER', 'ADMIN'] }, status: 'ACTIVE' },
      select: { userId: true },
    });
    await prisma.notification.createMany({
      data: members.map(m => ({ ...input, userId: m.userId })),
    });
  }
}
```

**Dodaj wywołania createNotification w kluczowych miejscach:**
- `cron/ksef-worker/route.ts` — po zakończeniu importu: `KSEF_IMPORT_DONE` lub `KSEF_IMPORT_FAILED`
- `app/api/review/update/route.ts` — po zmianie statusu: `REVIEW_APPROVED`/`REVIEW_REJECTED`
- `app/api/invites/accept/route.ts` — po dołączeniu: `MEMBER_JOINED` (notify OWNER/ADMIN)
- `lib/billing.ts` — gdy `used >= limit * 0.8`: `INVOICE_LIMIT_WARNING`
- `app/api/gdpr/requests/route.ts` — po złożeniu wniosku: `GDPR_REQUEST_RECEIVED`

**Utwórz app/api/notifications/route.ts:**
- GET: zwróć 20 ostatnich powiadomień użytkownika (unread first), z unreadCount
- PATCH body `{ ids: string[] }`: oznacz jako przeczytane (readAt = now)
- DELETE query `?readOnly=true`: usuń przeczytane starsze niż 30 dni

**Utwórz komponenty:**

`components/notification-bell.tsx`:
```typescript
'use client';
// Bell icon w nagłówku
// Badge z liczbą nieprzeczytanych (czerwony, max "99+")
// Po kliknięciu: otwiera NotificationPanel (Popover lub Drawer)
// Polling co 30s przez SWR: useSWR('/api/notifications', fetcher, { refreshInterval: 30000 })
```

`components/notification-panel.tsx`:
```typescript
'use client';
// Lista powiadomień: icon (typ) + tytuł + body + czas (relative: "2 min temu", "3 godz. temu")
// Kliknięcie: oznacz jako przeczytane + navigate do link
// Przycisk "Oznacz wszystkie jako przeczytane"
// Puste: ilustracja "Brak nowych powiadomień"
```

**Osadź NotificationBell w app/dashboard/layout.tsx** — w nagłówku obok avatara użytkownika.

**Server-Sent Events (opcjonalne — zaimplementuj jeśli polling wydaje się za słaby):**
Zamiast pollingu: utwórz `app/api/notifications/stream/route.ts` jako SSE endpoint z keep-alive.
```

---

## PROMPT P3-7 — Audit log UI: historia zmian w dashboardzie

```
Zaimplementuj stronę historii zmian (audit log) w dashboardzie Scopeo SaaS. Tabela ProcessingRecord jest już zapełniana — teraz potrzebny jest UI do jej przeglądania.

**Kontekst:** `ProcessingRecord` w Prisma zawiera: eventType, subjectRef, legalBasis, payload (JSON), createdAt. Wypełniają go: import KSeF, review workflow, GDPR operations, lead capture, factor import (po P2 fix).

**Utwórz app/dashboard/audit/page.tsx:**
- Tytuł: "Rejestr Przetwarzania Danych"
- Tabela z kolumnami: Data i godzina | Zdarzenie | Podmiot | Podstawa prawna | Szczegóły
- Paginacja server-side (25 wierszy/strona, cursor-based)
- Filtry: zakres dat (date picker from/to), typ zdarzenia (multiselect), szukaj subjectRef
- Kliknięcie wiersza: modal z pełnym `payload` JSON (ładnie sformatowany z `JSON.stringify(payload, null, 2)`)

**Utwórz app/api/audit-log/route.ts (GET):**
- Query params: `page`, `limit` (max 100), `from`, `to` (ISO dates), `eventType`, `search` (subjectRef)
- Wymaga sesji + roli OWNER/ADMIN
- Cursor-based pagination po `id` DESC
- Zwróć: `{ data: ProcessingRecord[], nextCursor, total }`

**Utwórz komponent components/audit-log-table.tsx:**
```typescript
// Kolumna "Zdarzenie" — ładne etykiety PL:
const EVENT_LABELS: Record<string, string> = {
  LEAD_CAPTURED: 'Lead pozyskany',
  KSEF_INVOICE_IMPORTED: 'Faktura KSeF zaimportowana',
  KSEF_IMPORT_FAILED: 'Import KSeF nieudany',
  REVIEW_STATUS_CHANGED: 'Status recenzji zmieniony',
  GDPR_ACCESS_REQUEST: 'Wniosek RODO (dostęp)',
  GDPR_ERASURE_EXECUTED: 'Wniosek RODO (usunięcie)',
  FACTOR_IMPORT_DONE: 'Import faktorów emisji',
  // ...
};

// Kolumna "Podmiot" — skróć jeśli email > 30 znaków
// Kolumna "Szczegóły" — przycisk "Pokaż" → modal
```

**Dodaj eksport CSV:** Przycisk "Eksportuj CSV" → GET /api/audit-log?format=csv (bez limitu paginacji, max 10k wierszy) — wymagany dla audytów RODO.

**Dodaj link do audit log w sidebar dashboardu** (`app/dashboard/layout.tsx`) pod "Ustawienia" — widoczny tylko dla OWNER/ADMIN.

**Utwórz lib/__tests__/audit-log.test.ts:**
- Sprawdź że GET /api/audit-log bez sesji zwraca 401
- Sprawdź że ANALYST rola zwraca 403
- Sprawdź że filtry `from`/`to` poprawnie filtrują
```

---

## PROMPT P3-8 — Zaawansowane NLP: kontekst dostawcy + auto-sugestie kategorii

```
Rozbuduj system klasyfikacji NLP w Scopeo SaaS — dodaj kontekst dostawcy i system sugestii kategorii dla recenzentów.

**Kontekst:** Obecne NLP (`lib/nlp-mapping.ts`) klasyfikuje każdą linię faktury przez opis. Problemy:
1. Ten sam dostawca zawsze dostarcza podobne produkty — można uczyć się z historii
2. Recenzenci często chcą wiedzieć "dlaczego NLP wybrało tę kategorię"
3. Brak mechanizmu feedback loop — zaakceptowane zmiany kategorii nie uczą systemu

**Schemat Prisma — dodaj:**
```prisma
model SupplierCategoryHint {
  id             String   @id @default(cuid())
  organizationId String
  supplierId     String
  supplier       Supplier @relation(fields: [supplierId], references: [id], onDelete: Cascade)
  categoryCode   String
  confidence     Float    @default(1.0)  // 1.0 = ręcznie ustawione, <1.0 = wyliczone
  sampleCount    Int      @default(1)    // ile linii potwierdziło tę kategorię
  updatedAt      DateTime @updatedAt

  @@unique([organizationId, supplierId, categoryCode])
  @@index([supplierId])
}
```

**Zaktualizuj lib/nlp-mapping.ts — dodaj funkcję `classifyWithContext`:**
```typescript
export async function classifyWithContext(
  description: string,
  supplierId: string | null,
  organizationId: string,
): Promise<{ categoryCode: string; confidence: number; source: 'supplier_hint' | 'nlp' | 'fallback'; reasoning: string }> {
  
  // 1. Sprawdź SupplierCategoryHint — jeśli confidence >= 0.8 i sampleCount >= 3 → użyj
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
        reasoning: `Dostawca historycznie klasyfikowany jako "${hint.categoryCode}" (${hint.sampleCount} potwierdzeń)`,
      };
    }
  }

  // 2. NLP standardowe
  const nlpResult = classifyLine(description);
  return {
    categoryCode: nlpResult.categoryCode ?? 'uncategorized',
    confidence: nlpResult.score ?? 0.5,
    source: 'nlp',
    reasoning: `NLP: dopasowane słowa kluczowe: [${nlpResult.matchedTokens?.join(', ') ?? 'brak'}]`,
  };
}
```

**Zaktualizuj `classifyLine` aby zwracał `matchedTokens: string[]`** — listę tokenów które zadecydowały o kategorii (do wyświetlenia w UI jako "dlaczego ta kategoria").

**Zapisuj reasoning w InvoiceLine:**
Dodaj do modelu `InvoiceLine` pole:
```prisma
classificationReasoning String?  // JSON: { source, confidence, reasoning }
```
Wypełniaj przy imporcie faktury.

**Feedback loop — zaktualizuj app/api/review/update/route.ts:**
Po zmianie kategorii przez recenzenta (APPROVED z nową kategorią):
```typescript
// Upsert SupplierCategoryHint
await prisma.supplierCategoryHint.upsert({
  where: { organizationId_supplierId_categoryCode: { organizationId, supplierId, categoryCode: newCategoryCode } },
  update: { sampleCount: { increment: 1 }, confidence: { set: Math.min(1.0, hint.confidence + 0.1) } },
  create: { organizationId, supplierId, categoryCode: newCategoryCode, confidence: 1.0, sampleCount: 1 },
});
```

**Dodaj panel "Dlaczego ta kategoria?" w UI recenzji (`app/dashboard/review/page.tsx`):**
- Przy każdej linii faktury: ikonka info (i) obok kategorii
- Tooltip/popover: pokazuje `classificationReasoning` — źródło (NLP / dostawca / fallback), pewność (0-100%), matched tokens

**Utwórz app/api/suppliers/[supplierId]/hints/route.ts:**
- GET: lista SupplierCategoryHint dla dostawcy (dla strony edycji dostawcy)
- DELETE `[hintId]`: usuń sugestię (reset dla dostawcy)

**Utwórz lib/__tests__/nlp-context.test.ts:**
- Sprawdź że classifyWithContext preferuje supplier_hint gdy sampleCount >= 3 i confidence >= 0.8
- Sprawdź że matchedTokens nie jest puste dla dobrze opisanych linii
- Sprawdź że feedback loop inkrementuje sampleCount
```

---

## Kolejność wdrożenia Phase 3

| Prompt | Zależności | Czas est. | Priorytet |
|--------|-----------|-----------|-----------|
| P3-5 Onboarding wizard | brak | 1-2 dni | 🔴 Wysoki — poprawia pierwszą sesję |
| P3-1 Billing / Stripe | P3-5 (profil org) | 2-3 dni | 🔴 Wysoki — monetyzacja |
| P3-4 Workspace switcher | lib/auth.ts, NextAuth | 1 dzień | 🟠 Średni — multi-tenant |
| P3-6 Notification center | cron, billing | 1-2 dni | 🟠 Średni — UX retencja |
| P3-2 CSRD export | lib/emissions.ts | 1 dzień | 🟠 Średni — compliance |
| P3-3 Public API | billing (limity) | 2 dni | 🟡 Niższy — integracje zewnętrzne |
| P3-7 Audit log UI | ProcessingRecord | 0.5 dnia | 🟡 Niższy — gotowe dane |
| P3-8 NLP kontekst | SupplierCategoryHint | 1-2 dni | 🟡 Niższy — poprawa jakości |

**Zalecana kolejność:** P3-5 → P3-1 → P3-4 → P3-6 → P3-2 → P3-7 → P3-3 → P3-8

Po ukończeniu Phase 3 Scopeo osiągnie poziom **~85-90% gotowości produkcyjnej** — pełny SaaS z monetyzacją, compliance CSRD, integracjami zewnętrznymi i profesjonalnym onboardingiem.
