# Cursor prompty — Naprawa błędów v7

> Kontekst: Next.js 15 App Router, Prisma/PostgreSQL, NextAuth v4 JWT, Stripe Billing, TypeScript strict.  
> Wklej każdy prompt osobno w Cursor Agent Mode z dostępem do całego projektu.

---

## PROMPT V7-FIX-1 — Zaktualizuj PricingTable do nowego modelu cenowego

```
Zaktualizuj stronę cennika w Scopeo SaaS. Obecny `components/marketing/PricingTable.tsx` pokazuje stary model (5 planów opartych o liczbę faktur, rabat −10%). Nowy model cenowy to:

**Nowe plany (źródło prawdy: `lib/stripe.ts` PLANS):**

| Plan       | Połączenia KSeF | Użytkownicy | Cena miesięczna | Cena roczna (−20%) |
|------------|----------------|-------------|----------------|-------------------|
| Mikro      | 1              | 1           | 149 zł         | 119 zł/mc         |
| Starter    | 1              | 5           | 279 zł         | 223 zł/mc         |
| Growth ⭐  | 3              | 15          | 499 zł         | 399 zł/mc         |
| Scale      | 10             | bez limitu  | 849 zł         | 679 zł/mc         |
| Enterprise | bez limitu     | bez limitu  | wycena         | —                 |

Fakturowanie: **bez limitu faktur** na każdym planie. Faktury nie są metryką limitu.
Rabat roczny: **−20%** (nie −10%).
Trial: **7 dni bezpłatnie** dla nowych klientów.

**Zaktualizuj `components/marketing/PricingTable.tsx`:**

1. Zastąp tablicę `PLANS` nowymi danymi (bez pola `invoices`, z polami `ksefLimit`, `userLimit`, `features`):
```typescript
const PLANS = [
  {
    id: 'mikro', name: 'Mikro', ksefLimit: 1, userLimit: 1, monthly: 149, annual: 119,
    features: ['1 połączenie KSeF', '1 użytkownik', 'Scope 1 i 2', 'Raport PDF GHG'],
  },
  {
    id: 'starter', name: 'Starter', ksefLimit: 1, userLimit: 5, monthly: 279, annual: 223,
    features: ['1 połączenie KSeF', 'do 5 użytkowników', 'Scope 1, 2 i 3', 'Export CSRD/ESRS', 'Raport PDF GHG'],
  },
  {
    id: 'growth', name: 'Growth', ksefLimit: 3, userLimit: 15, monthly: 499, annual: 399, featured: true,
    features: ['3 połączenia KSeF', 'do 15 użytkowników', 'Scope 1, 2 i 3', 'Export CSRD/ESRS', 'Workflow recenzji', 'Public API'],
  },
  {
    id: 'scale', name: 'Scale', ksefLimit: 10, userLimit: null, monthly: 849, annual: 679,
    features: ['10 połączeń KSeF', 'bez limitu użytkowników', 'Scope 1, 2 i 3', 'Export CSRD/ESRS', 'Workflow recenzji', 'Public API', 'Raporty white-label'],
  },
];
```

2. Zmień przełącznik roczny z "Rocznie (−10%)" na "Rocznie (−20%)" i zmień obliczenie z `* 0.9` na użycie pola `annual` z danych.

3. Każda karta planu powinna zawierać:
   - Nazwę i badge "Polecany" dla Growth
   - "Faktury: bez limitu" jako highlight (zielony chip)
   - Liczbę połączeń KSeF i użytkowników
   - Cenę z przełącznikiem miesięcznie/rocznie
   - Listę funkcji (checkmark ✓ przed każdą)
   - Przycisk "Umów demo" → /kontakt#demo (bez zmian)
   - Podpis "7 dni bezpłatnego trialu" pod przyciskiem

4. Karta Enterprise (osobna, bez ceny):
   - "Bez limitu połączeń KSeF i użytkowników"
   - Lista: SSO/SAML, dedykowane środowisko, SLA, dedykowany account manager
   - Przycisk "Porozmawiaj o wdrożeniu" → /kontakt#demo

5. Dodaj pod kartami sekcję: "Wszystkie plany zawierają: import z KSeF, automatyczne obliczanie emisji GHG, panel zarządzania, wskaźniki KOBiZE / UK DESNZ / EPA, 7-dniowy bezpłatny trial".

Nie zmieniaj struktury CSS/klas — używaj istniejących klas `mkt-price-card`, `mkt-price-name`, `mkt-badge`, `mkt-btn` itd.
```

---

## PROMPT V7-FIX-2 — Dodaj model KsefConnection i popraw checkKsefLimit

```
Dodaj obsługę wielu połączeń KSeF per organizacja w Scopeo SaaS. Obecnie organizacja ma zawsze dokładnie 1 NIP/token (z CarbonProfile), co uniemożliwia korzystanie z limitu KSeF w planach Growth (3) i Scale (10).

**Krok 1 — Dodaj model do `prisma/schema.prisma`:**
```prisma
model KsefConnection {
  id                    String       @id @default(cuid())
  organizationId        String
  organization          Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  label                 String       // np. "Firma główna", "Spółka zależna XYZ"
  taxId                 String       // NIP kontekstu
  tokenEncrypted        String?      // zaszyfrowany token (AES-256-GCM, jak w CarbonProfile)
  tokenMasked           String       // np. "****abc123"
  isDefault             Boolean      @default(false)
  lastUsedAt            DateTime?
  createdAt             DateTime     @default(now())
  updatedAt             DateTime     @updatedAt

  @@unique([organizationId, taxId])
  @@index([organizationId])
}
```

Dodaj relację do Organization:
```prisma
ksefConnections  KsefConnection[]
```

Uruchom `npx prisma migrate dev --name add_ksef_connection`.

**Krok 2 — Zaktualizuj `lib/billing.ts` — funkcja `checkKsefLimit`:**
```typescript
export async function checkKsefLimit(organizationId: string): Promise<{ allowed: boolean; used: number; limit: number }> {
  const [sub, used] = await Promise.all([
    prisma.subscription.findUnique({ where: { organizationId }, select: { ksefConnectionLimit: true } }),
    prisma.ksefConnection.count({ where: { organizationId } }),
  ]);
  const limit = sub?.ksefConnectionLimit ?? 1;
  // Usuń też logikę notyfikacji INVOICE_LIMIT_WARNING — zostanie naprawiona w V7-FIX-3
  return { allowed: used < limit, used, limit };
}
```

**Krok 3 — Utwórz `app/api/ksef/connections/route.ts`:**
- `GET` — lista połączeń KSeF dla organizacji (bez `tokenEncrypted`, z `tokenMasked`, `taxId`, `label`, `isDefault`)
- `POST` body `{ label, taxId, token }`:
  - Sprawdź `requireKsefCapacity(organizationId)` z billing-guard
  - Zaszyfruj token przez `lib/ksef-token-crypto.ts`
  - Utwórz `KsefConnection`
  - Jeśli to pierwsze połączenie — ustaw `isDefault: true`

**Krok 4 — Utwórz `app/api/ksef/connections/[connectionId]/route.ts`:**
- `DELETE` — usuń połączenie (sprawdź że nie jest to jedyne połączenie jeśli `isDefault: true`)
- `PATCH` body `{ label?, isDefault? }` — zmień label lub ustaw jako domyślne (automatycznie odznacza poprzednie)

**Krok 5 — Zaktualizuj `lib/ksef-import-service.ts`:**
Przy pobieraniu tokenu KSeF do importu faktury — użyj `KsefConnection` gdzie `isDefault: true` zamiast `CarbonProfile.ksefTokenEncrypted`:
```typescript
const connection = await prisma.ksefConnection.findFirst({
  where: { organizationId, isDefault: true },
});
if (!connection?.tokenEncrypted || !connection.taxId) {
  throw new Error('Brak skonfigurowanego połączenia KSeF. Skonfiguruj w Ustawieniach → KSeF.');
}
// Odszyfruj token i wywołaj fetchKsefInvoiceXml({ token, referenceNumber, contextNip: connection.taxId })
```

**Krok 6 — Zaktualizuj onboarding Step 3:**
W `app/api/onboarding/ksef/route.ts` — zamiast zapisywać do `CarbonProfile.ksefTokenEncrypted`, utwórz `KsefConnection` z `isDefault: true`.

**Zachowaj wsteczną kompatybilność:** Jeśli organizacja ma token w `CarbonProfile` ale nie ma `KsefConnection`, w serwisie importu zrób fallback na `CarbonProfile` z deprecation warning.
```

---

## PROMPT V7-FIX-3 — Popraw typy notyfikacji dla limitów billing

```
Napraw błędne typy notyfikacji w systemie billing Scopeo SaaS.

**Problem:** `lib/billing.ts` używa `INVOICE_LIMIT_WARNING` dla powiadomień o limitach KSeF i użytkowników. Ten typ jest semantycznie błędny (nie ma limitu faktur w nowym modelu).

**Krok 1 — Dodaj nowe typy do `prisma/schema.prisma`:**
```prisma
enum NotificationType {
  KSEF_IMPORT_DONE
  KSEF_IMPORT_FAILED
  REVIEW_SUBMITTED
  REVIEW_APPROVED
  REVIEW_REJECTED
  KSEF_LIMIT_WARNING      // nowe — zastępuje INVOICE_LIMIT_WARNING dla KSeF
  USER_LIMIT_WARNING      // nowe — zastępuje INVOICE_LIMIT_WARNING dla userów
  INVOICE_LIMIT_WARNING   // zachowaj dla kompatybilności wstecznej (deprecated)
  GDPR_REQUEST_RECEIVED
  FACTOR_IMPORT_DONE
  MEMBER_JOINED
  MEMBER_ROLE_CHANGED
}
```

Uruchom `npx prisma migrate dev --name add_notification_types`.

**Krok 2 — Zaktualizuj `lib/billing.ts`:**

W `checkKsefLimit` zmień `type: 'INVOICE_LIMIT_WARNING'` na `type: 'KSEF_LIMIT_WARNING'`:
```typescript
await createNotification({
  organizationId,
  type: 'KSEF_LIMIT_WARNING',
  title: 'Zbliżasz się do limitu połączeń KSeF',
  body: `Wykorzystano ${used}/${limit} połączeń KSeF. Rozważ zmianę planu.`,
  link: '/dashboard/settings/billing',
});
```

W `checkUserLimit` zmień `type: 'INVOICE_LIMIT_WARNING'` na `type: 'USER_LIMIT_WARNING'`:
```typescript
await createNotification({
  organizationId,
  type: 'USER_LIMIT_WARNING',
  title: 'Zbliżasz się do limitu użytkowników',
  body: `Wykorzystano ${used}/${limit} miejsc w planie. Rozważ zmianę planu.`,
  link: '/dashboard/settings/billing',
});
```

Zmień też selector deduplicji — zamiast szukać `INVOICE_LIMIT_WARNING` szukaj odpowiedniego nowego typu.

**Krok 3 — Zaktualizuj `components/notification-panel.tsx`:**
Dodaj do mapy etykiet:
```typescript
KSEF_LIMIT_WARNING: 'Limit połączeń KSeF',
USER_LIMIT_WARNING: 'Limit użytkowników',
```

**Krok 4 — Dodaj deduplicję do `lib/notifications.ts`:**
Dodaj opcjonalny parametr `deduplicateWithinHours?: number`:
```typescript
export async function createNotification(input: {
  organizationId: string;
  userId?: string;
  type: NotificationType;
  title: string;
  body: string;
  link?: string;
  deduplicateWithinHours?: number;  // jeśli podane, nie tworzy jeśli podobne istnieje w tym oknie
}): Promise<void> {
  if (input.deduplicateWithinHours) {
    const cutoff = new Date(Date.now() - input.deduplicateWithinHours * 3600_000);
    const existing = await prisma.notification.findFirst({
      where: { organizationId: input.organizationId, type: input.type, createdAt: { gte: cutoff } },
      select: { id: true },
    });
    if (existing) return;
  }
  // ... reszta bez zmian
}
```

Wywołaj z `deduplicateWithinHours: 24` w `checkKsefLimit` i `checkUserLimit`.
```

---

## PROMPT V7-FIX-4 — Popraw JWT callback — usuń zbędne DB queries per request

```
Zoptymalizuj `lib/auth.ts` w Scopeo SaaS — JWT callback wykonuje niepotrzebne DB queries przy każdym request.

**Problem:** Funkcja `jwt` callback w NextAuth zawiera:
1. `loadUserOrganizations(token.sub)` — query do `Membership` tabeli
2. `prisma.organization.findUnique(...)` — query do `Organization` tabeli

Oba są wywoływane przy każdym odświeżeniu JWT (czyli przy każdym request który używa `getServerSession()`), a nie tylko przy logowaniu lub jawnej aktualizacji sesji.

**Zaktualizuj `lib/auth.ts` — funkcję `jwt` callback:**

```typescript
async jwt({ token, user, trigger, session }) {
  // Przy logowaniu — załaduj pełne dane
  if (user) {
    token.organizationId = (user as any).organizationId;
    token.organizationSlug = (user as any).organizationSlug;
    token.role = (user as any).role;
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { emailVerified: true },
    });
    token.emailVerified = dbUser?.emailVerified ?? null;
  }

  // Załaduj organizacje TYLKO przy logowaniu lub jawnym update
  // NIE przy każdym request — dane są już w JWT token
  const shouldRefreshOrganizations =
    Boolean(user) ||                                    // pierwsze logowanie
    trigger === 'update' ||                             // jawna aktualizacja (switch-organization)
    !Array.isArray(token.organizations) ||              // brak danych w tokenie (po migracji)
    (token.organizations as any[]).length === 0;        // pusty token (fallback)

  if (token.sub && shouldRefreshOrganizations) {
    const organizations = await loadUserOrganizations(String(token.sub));
    token.organizations = organizations;
    const requestedOrgId =
      trigger === 'update' ? ((session as any)?.activeOrganizationId as string | undefined) : undefined;
    const activeOrganizationId = pickActiveOrganization(
      organizations,
      requestedOrgId ?? null,
      (token.activeOrganizationId as string | undefined) ?? (token.organizationId as string | undefined)
    );
    token.activeOrganizationId = activeOrganizationId;
    token.organizationId = activeOrganizationId;
    const active = organizations.find((item) => item.id === activeOrganizationId);
    token.organizationSlug = active?.slug ?? null;
    token.role = active?.role ?? null;
  }

  // Odświeżaj onboarding status TYLKO przy logowaniu lub jawnym update
  // (onboarding completion jest rzadkim zdarzeniem — nie wymaga sprawdzania per request)
  if (token.sub && (Boolean(user) || trigger === 'update')) {
    const organizationId = (token.activeOrganizationId as string | undefined) ?? (token.organizationId as string | undefined);
    if (organizationId) {
      const org = await prisma.organization.findUnique({
        where: { id: organizationId },
        select: { onboardingCompletedAt: true, onboardingStep: true },
      });
      token.onboardingCompletedAt = org?.onboardingCompletedAt?.toISOString() ?? null;
      token.onboardingStep = org?.onboardingStep ?? 0;
    }
  }

  return token;
},
```

**Ważne:** Po ukończeniu onboardingu (`POST /api/onboarding/complete`) wywołaj `update({ activeOrganizationId: organizationId })` przez NextAuth client, żeby wymusić refresh tokenu z nowym `onboardingCompletedAt`. Dodaj to do `app/api/onboarding/complete/route.ts` — zwróć `{ ok: true, requiresSessionRefresh: true }` i obsłuż po stronie klienta przez `useSession().update()`.
```

---

## PROMPT V7-FIX-5 — Napraw Public API: agregacja w DB, guard planu, rate limit per org

```
Napraw trzy problemy w Public API Scopeo (`app/api/v1/`):

**Problem 1 — OOM w `/api/v1/emissions`: `findMany` bez limitu**

Zaktualizuj `app/api/v1/emissions/route.ts` — zamień `findMany` z agregacją w JS na `groupBy` w Prisma:

```typescript
export async function GET(req: Request) {
  return withApiKey(req, 'emissions:read', async (organizationId) => {
    const url = new URL(req.url);
    const year = Number(url.searchParams.get('year'));
    const scopeParam = url.searchParams.get('scope');

    const dateFilter =
      Number.isFinite(year) && year >= 2000 && year <= 2100
        ? { gte: new Date(`${year}-01-01T00:00:00.000Z`), lt: new Date(`${year + 1}-01-01T00:00:00.000Z`) }
        : undefined;

    // Agregacja po stronie DB — nie ładuje wszystkich linii do pamięci
    const grouped = await prisma.invoiceLine.groupBy({
      by: ['scope', 'categoryCode'],
      where: {
        invoice: {
          organizationId,
          ...(dateFilter ? { issueDate: dateFilter } : {}),
        },
        ...(scopeParam ? { scope: scopeParam as any } : {}),
      },
      _sum: { netValue: true, activityValue: true },
      _count: { id: true },
    });

    // Pobierz faktory emisji dla kategorii (batch)
    const categoryCodes = [...new Set(grouped.map((g) => g.categoryCode))];
    const factors = await prisma.emissionFactor.findMany({
      where: { organizationId, categoryCode: { in: categoryCodes } },
      select: { categoryCode: true, factorValue: true },
      orderBy: { year: 'desc' },
    });
    const factorMap = new Map(factors.map((f) => [f.categoryCode, f.factorValue]));

    const data = grouped.map((g) => {
      const factorValue = factorMap.get(g.categoryCode) ?? 0;
      const totalKgCO2e = ((g._sum.activityValue ?? g._sum.netValue ?? 0)) * factorValue;
      return {
        category: g.categoryCode,
        scope: g.scope,
        totalKgCO2e: Number(totalKgCO2e.toFixed(2)),
        totalTCO2e: Number((totalKgCO2e / 1000).toFixed(3)),
        lineCount: g._count.id,
        year: Number.isFinite(year) ? year : null,
      };
    });

    return Response.json({
      data,
      meta: { organizationId, year: Number.isFinite(year) ? year : null, generatedAt: new Date().toISOString() },
    });
  });
}
```

**Problem 2 — Brak sprawdzenia planu w API routes**

Zaktualizuj `lib/api-auth.ts` — dodaj sprawdzenie planu:

```typescript
import { canAccessApi } from '@/lib/billing-features';
import { getSubscription } from '@/lib/billing';

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

  // Sprawdź plan subskrypcji
  const sub = await getSubscription(organizationId);
  if (!sub || !canAccessApi(sub.plan)) {
    return Response.json(
      { error: 'Public API requires Growth plan or higher. Upgrade at /dashboard/settings/billing' },
      { status: 403 }
    );
  }

  // Rate limit per organizacja (nie per klucz) — 1000 req/h per org łącznie
  const limit = await checkRateLimit(`apikey-org:${organizationId}`, {
    windowMs: 3_600_000,
    maxRequests: 1000,
  });
  if (!limit.ok) {
    return Response.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }
  return handler(organizationId);
}
```

**Problem 3 — Guard planu przy tworzeniu kluczy API**

Zaktualizuj `app/api/api-keys/route.ts` — dodaj sprawdzenie planu przed POST:
```typescript
import { canAccessApi } from '@/lib/billing-features';
import { getSubscription } from '@/lib/billing';

// W handler POST:
const sub = await getSubscription(organizationId);
if (!sub || !canAccessApi(sub.plan)) {
  return NextResponse.json(
    { ok: false, error: 'Tworzenie kluczy API wymaga planu Growth lub wyższego.' },
    { status: 403 }
  );
}
```
```

---

## PROMPT V7-FIX-6 — Popraw checkout: trial z lokalnej DB, bez Stripe API call

```
Zoptymalizuj `app/api/billing/checkout/route.ts` w Scopeo SaaS — usuń zbędny call do `stripe.subscriptions.list`.

**Problem:** Endpoint sprawdza historię subskrypcji przez Stripe API (`stripe.subscriptions.list`) żeby określić czy klient może dostać trial. To dodatkowy request do Stripe, latencja i potencjalny race condition.

**Rozwiązanie:** Użyj lokalnej DB — `Subscription.trialEndsAt` jest ustawiane przy rejestracji. Jeśli pole istnieje — klient już był na trialu.

**Zaktualizuj `app/api/billing/checkout/route.ts`:**

Zastąp blok (linie ~58-63):
```typescript
// STARY KOD — usuń:
const previousSubscriptions = await stripe.subscriptions.list({
  customer: customerId,
  status: 'all',
  limit: 1,
});
const canUseTrial = previousSubscriptions.data.length === 0;
```

Nowy kod:
```typescript
// Sprawdź w lokalnej DB czy trial już był użyty
const canUseTrial = !subscription?.trialEndsAt;
// trialEndsAt jest ustawiane przy getOrCreateStripeCustomer (rejestracja)
// Jeśli null → klient nigdy nie miał trialu → może dostać
```

Przy tworzeniu Checkout Session — przekaż `trial_period_days` tylko gdy `canUseTrial`:
```typescript
const checkout = await stripe.checkout.sessions.create({
  mode: 'subscription',
  customer: customerId,
  line_items: [{ price: priceId, quantity: 1 }],
  success_url: `${baseUrl}/dashboard/settings/billing?checkout=success`,
  cancel_url: `${baseUrl}/dashboard/settings/billing?checkout=cancel`,
  metadata: { plan: body.plan, interval: body.interval, organizationId },
  subscription_data: {
    metadata: { plan: body.plan, interval: body.interval, organizationId },
    ...(canUseTrial ? { trial_period_days: TRIAL_DAYS } : {}),
  },
  payment_method_collection: canUseTrial ? 'if_required' : 'always',
  // Gdy nie ma trialu → wymagaj karty od razu
});
```

**Poprawka dodatkowa — lazy Stripe Customer:**

W `app/api/auth/register/route.ts` usuń `void getOrCreateStripeCustomer(organizationId).catch(() => null)`.

Zamiast tego w `app/api/billing/checkout/route.ts` i `app/api/billing/portal/route.ts` — `getOrCreateStripeCustomer` jest już wywoływane — to wystarczy. Usunięcie z register eliminuje:
- Zbędny Stripe API call przy każdej rejestracji
- Problem gdy Stripe jest niedostępny (klient zarejestrowany ale bez customerId)
- Potrzebę obsługi `catch(() => null)` (silent failures)
```

---

## PROMPT V7-FIX-7 — Dodaj status i createdAt do Membership, ogranicz DELETE notifications

```
Dwie niezależne poprawki modelu danych i API w Scopeo SaaS.

**Poprawka A — `Membership` model: dodaj status i createdAt**

Zaktualizuj `prisma/schema.prisma`:
```prisma
enum MembershipStatus {
  ACTIVE
  SUSPENDED
}

model Membership {
  id             String           @id @default(cuid())
  userId         String
  organizationId String
  role           Role             @default(OWNER)
  status         MembershipStatus @default(ACTIVE)
  createdAt      DateTime         @default(now())
  user           User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  organization   Organization     @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  @@unique([userId, organizationId])
  @@index([organizationId, status])
}
```

Uruchom `npx prisma migrate dev --name add_membership_status_and_dates`.

Zaktualizuj `lib/billing.ts` — `checkUserLimit` — licz tylko ACTIVE:
```typescript
prisma.membership.count({ where: { organizationId, status: 'ACTIVE' } })
```

Zaktualizuj `lib/auth.ts` — `loadUserOrganizations` — tylko ACTIVE:
```typescript
prisma.membership.findMany({
  where: { userId, status: 'ACTIVE' },
  ...
})
```

Zaktualizuj `app/api/invites/accept/route.ts` — przy tworzeniu Membership ustaw `status: 'ACTIVE'`.

**Poprawka B — `DELETE /api/notifications` — zabezpiecz destrukcyjną operację**

Zaktualizuj `app/api/notifications/route.ts`:

```typescript
export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

  const organizationId = (session.user as any).organizationId as string;
  const userId = session.user.id as string;
  const readOnly = req.nextUrl.searchParams.get('readOnly') === 'true';

  // Bez readOnly=true — odmów. Nigdy nie usuwaj wszystkich powiadomień przez API.
  if (!readOnly) {
    return NextResponse.json(
      { ok: false, error: 'Użyj ?readOnly=true żeby usunąć tylko przeczytane powiadomienia.' },
      { status: 400 }
    );
  }

  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const result = await prisma.notification.deleteMany({
    where: { organizationId, userId, readAt: { not: null, lt: cutoff } },
  });
  return NextResponse.json({ ok: true, deleted: result.count });
}
```

Dodaj rate limiting na DELETE:
```typescript
const limit = await checkRateLimit(`notif-delete:${userId}`, { windowMs: 60_000, maxRequests: 5 });
if (!limit.ok) return NextResponse.json({ ok: false, error: 'Too many requests' }, { status: 429 });
```
```

---

## PROMPT V7-FIX-8 — Dodaj HEALTH_CHECK_SECRET do .env.example i popraw billing planLimits

```
Dwie drobne, niezależne poprawki w Scopeo SaaS.

**Poprawka A — dodaj HEALTH_CHECK_SECRET do `.env.example`**

Dodaj do `.env.example` po sekcji CRON_SECRET:
```
# Opcjonalnie: token do autoryzacji diagnostyk /api/health (nagłówek x-health-secret)
# Bez tego endpointu health zwraca tylko: { ok, status, db } — bez szczegółów konfiguracji
# Wygeneruj: openssl rand -base64 24
HEALTH_CHECK_SECRET=""
```

**Poprawka B — refaktoruj `lib/billing.ts` — `planLimits` przez PLANS z lib/stripe.ts**

Obecna funkcja `planLimits` ma hardcoded wartości niezależne od `PLANS` w `lib/stripe.ts` (jeden source of truth). Jeśli ktoś zmieni limity w `lib/stripe.ts`, `planLimits` nie zostanie zaktualizowany.

Zastąp:
```typescript
export function planLimits(plan: SubscriptionPlan) {
  if (plan === 'STARTER') return { ksefConnectionLimit: 1, userLimit: 5 };
  if (plan === 'GROWTH') return { ksefConnectionLimit: 3, userLimit: 15 };
  if (plan === 'SCALE') return { ksefConnectionLimit: 10, userLimit: 999 };
  if (plan === 'ENTERPRISE') return { ksefConnectionLimit: 999, userLimit: 999 };
  return { ksefConnectionLimit: 1, userLimit: 1 }; // MIKRO
}
```

Nowy kod — używa PLANS jako source of truth:
```typescript
import { PLANS } from '@/lib/stripe';

export function planLimits(plan: SubscriptionPlan): { ksefConnectionLimit: number; userLimit: number } {
  const definition = PLANS[plan as keyof typeof PLANS];
  if (!definition) return { ksefConnectionLimit: 1, userLimit: 1 };
  return {
    ksefConnectionLimit: definition.ksefLimit,
    userLimit: definition.userLimit,
  };
}
```

Upewnij się że `lib/stripe.ts` jest importowalny po stronie serwera (nie ma `'use client'`).

**Poprawka C — dodaj brakujące pola do XML eksportu CSRD**

W `lib/csrd-export.ts`, funkcja `toEsrsXml` — dodaj pole `dataQuality` i `generatedBy`:
```typescript
return `<?xml version="1.0" encoding="UTF-8"?>
<esrs:Report xmlns:esrs="https://xbrl.efrag.org/esrs/2024"
             contextRef="FY${report.reportYear}"
             entityName="${safe(report.organizationName)}"
             taxId="${safe(report.taxId ?? '')}">
  <esrs:E1-6_GrossScope1GHGEmissions decimals="3" unitRef="tCO2e">${report.scope1Total}</esrs:E1-6_GrossScope1GHGEmissions>
  <esrs:E1-6_GrossScope2GHGEmissionsLocationBased decimals="3" unitRef="tCO2e">${report.scope2Total}</esrs:E1-6_GrossScope2GHGEmissionsLocationBased>
  <esrs:E1-6_GrossScope3GHGEmissions decimals="3" unitRef="tCO2e">${report.scope3Total}</esrs:E1-6_GrossScope3GHGEmissions>
  <esrs:E1-6_TotalGHGEmissions decimals="3" unitRef="tCO2e">${report.totalGhg}</esrs:E1-6_TotalGHGEmissions>
  <esrs:methodology>${safe(report.methodology)}</esrs:methodology>
  <esrs:dataQuality>${safe(report.dataQuality)}</esrs:dataQuality>
  <esrs:boundaryApproach>Operational Control</esrs:boundaryApproach>
  <esrs:generatedAt>${safe(report.generatedAt)}</esrs:generatedAt>
  <esrs:generatedBy>Scopeo SaaS</esrs:generatedBy>
</esrs:Report>`;
```
```

---

## Kolejność wdrożenia

| Prompt | Problem | Czas est. | Priorytet |
|--------|---------|-----------|-----------|
| V7-FIX-1 | PricingTable — stary cennik widoczny dla klientów | 1h | 🔴 Natychmiast |
| V7-FIX-3 | Typy notyfikacji + deduplicja | 30min | 🟠 Szybko |
| V7-FIX-8 | .env.example + planLimits refactor + CSRD XML | 30min | 🟠 Szybko |
| V7-FIX-6 | Checkout: usuń Stripe API call + lazy Customer | 45min | 🟠 |
| V7-FIX-4 | JWT callback — DB query per request | 30min | 🟠 |
| V7-FIX-5 | Public API: DB aggregation + plan guard | 1h | 🟠 |
| V7-FIX-7 | Membership status + DELETE notifications | 45min | 🟡 |
| V7-FIX-2 | KsefConnection model (duży zakres zmian) | 3-4h | 🟡 Ostatni |
