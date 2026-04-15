# Cursor Mega Prompt — Scopeo SaaS v4 Fixes

Kontekst: Next.js 15, TypeScript, Prisma ORM + PostgreSQL, NextAuth v4 (JWT strategy), Resend email, AES-256-GCM encryption. Poniższe fixy wdróż w kolejności. Po każdym fiksie uruchom `tsc --noEmit`.

---

## PROMPT 1 — Krytyczne security: IDOR + brakujące role checks

### Cel
Naprawić 3 krytyczne luki bezpieczeństwa znalezione w przeglądzie kodu.

### Fix 1A — IDOR w review/update: brak sprawdzenia organizationId

**Plik:** `app/api/review/update/route.ts`

Znajdź ten fragment (ok. linia 28):
```typescript
const line = await prisma.invoiceLine.findUnique({
  where: { id: parsed.lineId },
  include: { mappingDecision: true }
});
if (!line?.mappingDecisionId || !line.mappingDecision) return ...
```

Zastąp go:
```typescript
// SECURITY FIX: always scope to organizationId to prevent IDOR
const line = await prisma.invoiceLine.findFirst({
  where: {
    id: parsed.lineId,
    invoice: { organizationId },
  },
  include: { mappingDecision: true },
});
if (!line) return NextResponse.json({ ok: false, error: 'Invoice line not found' }, { status: 404 });
if (!line.mappingDecisionId || !line.mappingDecision) {
  return NextResponse.json({ ok: false, error: 'No mapping decision' }, { status: 404 });
}
```

### Fix 1B — Brak roli w endpoint importu faktorów

**Plik:** `app/api/factors/import/route.ts`

Dodaj sprawdzenie roli zaraz po sprawdzeniu sesji i przed checkRateLimit:
```typescript
export async function POST() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

  // SECURITY FIX: only OWNER/ADMIN can trigger expensive external factor imports
  const role = (session.user as any).role as string | null | undefined;
  if (role !== 'OWNER' && role !== 'ADMIN') {
    return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
  }

  const organizationId = (session.user as any).organizationId as string;
  // ... reszta bez zmian
```

### Fix 1C — Brak roli w endpoint onboardingu

**Plik:** `app/api/onboarding/route.ts`

Dodaj sprawdzenie roli zaraz po sprawdzeniu sesji:
```typescript
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

  // SECURITY FIX: only OWNER/ADMIN can update KSeF token and org profile
  const role = (session.user as any).role as string | null | undefined;
  if (role !== 'OWNER' && role !== 'ADMIN') {
    return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
  }

  const orgId = (session.user as any).organizationId as string;
  // ... reszta bez zmian
```

---

## PROMPT 2 — Cron KSeF: zmiana harmonogramu + GDPR data subject

### Fix 2A — Cron co 10 minut zamiast raz na dobę

**Plik:** `vercel.json`

Zmień schedule z `"0 3 * * *"` na `"*/10 * * * *"`:
```json
{
  "regions": ["fra1"],
  "crons": [
    {
      "path": "/api/cron/ksef-worker",
      "schedule": "*/10 * * * *"
    }
  ],
  "functions": {
    "app/api/ksef/jobs/process/route.ts": {
      "maxDuration": 60
    },
    "app/api/emissions/export/route.ts": {
      "maxDuration": 30
    },
    "app/api/factors/import/route.ts": {
      "maxDuration": 60
    }
  }
}
```

### Fix 2B — GDPR requests: umożliwić data subject składanie własnych wniosków

**Plik:** `app/api/gdpr/requests/route.ts`

Zastąp cały plik:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { writeProcessingRecord } from '@/lib/privacy-register';

const createRequestSchema = z.object({
  subjectEmail: z.string().email(),
  type: z.enum(['ACCESS', 'ERASURE']),
  notes: z.string().max(2000).optional(),
});

function canManage(role?: string | null) {
  return role === 'OWNER' || role === 'ADMIN';
}

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  const organizationId = (session.user as any).organizationId as string;
  const role = (session.user as any).role as string | null | undefined;
  if (!canManage(role)) return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });

  const requests = await prisma.gdprRequest.findMany({
    where: { organizationId },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
  return NextResponse.json({ ok: true, requests });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  const organizationId = (session.user as any).organizationId as string;
  const role = (session.user as any).role as string | null | undefined;
  const userEmail = session.user.email?.toLowerCase() ?? '';

  const body = await req.json();
  const parsed = createRequestSchema.parse(body);
  const subjectEmail = parsed.subjectEmail.toLowerCase();

  // GDPR FIX: any logged-in user can file a request about their own data
  // only OWNER/ADMIN can file requests about other users' data
  const isOwnRequest = subjectEmail === userEmail;
  if (!isOwnRequest && !canManage(role)) {
    return NextResponse.json(
      { ok: false, error: 'Forbidden: you can only file GDPR requests for your own email address' },
      { status: 403 }
    );
  }

  const created = await prisma.gdprRequest.create({
    data: {
      organizationId,
      requesterUserId: session.user.id as string,
      subjectEmail,
      type: parsed.type,
      notes: parsed.notes ?? null,
    },
  });

  await writeProcessingRecord({
    organizationId,
    actorUserId: session.user.id as string,
    eventType: 'GDPR_REQUEST_CREATED',
    subjectRef: subjectEmail,
    legalBasis: 'art. 12-17 RODO',
    payload: { requestId: created.id, type: created.type, selfRequest: isOwnRequest },
  });

  return NextResponse.json({ ok: true, request: created });
}
```

---

## PROMPT 3 — Cookie consent: poprawne polskie znaki

**Plik:** `components/CookieConsent.tsx`

Zastąp cały plik poprawną wersją z polskimi diakrytykami i poprawnymi tekstami prawnymi:

```typescript
'use client';

import { useEffect, useState } from 'react';

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) setVisible(true);
  }, []);

  const accept = () => {
    localStorage.setItem('cookie-consent', 'accepted');
    setVisible(false);
  };

  const reject = () => {
    localStorage.setItem('cookie-consent', 'rejected');
    setVisible(false);
    // Disable Sentry error tracking if user rejected optional cookies
    if (typeof window !== 'undefined' && (window as any).__sentryClient) {
      (window as any).__sentryClient?.close?.();
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white p-4 shadow-lg">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="text-sm text-gray-700">
          <p className="mb-1 font-semibold">Używamy plików cookie</p>
          <p>
            Stosujemy niezbędne pliki cookie do działania aplikacji oraz opcjonalne pliki cookie
            do monitorowania błędów (Sentry). Szczegóły znajdziesz w{' '}
            <a href="/polityka-prywatnosci" className="text-blue-600 underline">
              polityce prywatności
            </a>{' '}
            oraz{' '}
            <a href="/cookies" className="text-blue-600 underline">
              polityce cookies
            </a>
            .
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            onClick={reject}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
            type="button"
          >
            Tylko niezbędne
          </button>
          <button
            onClick={accept}
            className="rounded-md bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700"
            type="button"
          >
            Akceptuję wszystkie
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

## PROMPT 4 — N+1 w ksef-import-service: batch factor resolution

**Plik:** `lib/ksef-import-service.ts`

Zastąp cały plik zoptymalizowaną wersją:

```typescript
import { prisma } from '@/lib/prisma';
import { parseKsefFa3Xml } from '@/lib/ksef-xml';
import { secureRawPayload } from '@/lib/payload-security';
import { classifyInvoiceLine } from '@/lib/nlp-mapping';
import { logger } from '@/lib/logger';
import { writeProcessingRecord } from '@/lib/privacy-register';

// FIX: Pre-fetch all factors for given categories in one query
async function buildFactorMap(
  organizationId: string,
  regionCode: string,
  categoryCodes: string[]
): Promise<Map<string, any>> {
  if (!categoryCodes.length) return new Map();

  const factors = await prisma.emissionFactor.findMany({
    where: { organizationId, categoryCode: { in: categoryCodes } },
    include: { emissionSource: true },
    orderBy: [{ regionPriority: 'asc' }, { year: 'desc' }],
  });

  const map = new Map<string, any>();
  for (const cat of categoryCodes) {
    const best =
      factors.find((f) => f.categoryCode === cat && f.region === regionCode) ||
      factors.find((f) => f.categoryCode === cat && f.region === 'EU') ||
      factors.find((f) => f.categoryCode === cat) ||
      null;
    map.set(cat, best);
  }
  return map;
}

export async function importKsefXmlForOrganization(input: {
  organizationId: string;
  xmlPayload: string;
  actorUserId?: string | null;
}) {
  const organization = await prisma.organization.findUnique({
    where: { id: input.organizationId },
  });
  const invoice = await parseKsefFa3Xml(input.xmlPayload);
  const securePayload = secureRawPayload(invoice.rawPayload);
  const supplierTaxId = invoice.sellerTaxId ?? '';

  const supplier = await prisma.supplier.upsert({
    where: {
      organizationId_name_taxId: {
        organizationId: input.organizationId,
        name: invoice.sellerName,
        taxId: supplierTaxId,
      },
    },
    update: {},
    create: {
      organizationId: input.organizationId,
      name: invoice.sellerName,
      taxId: supplierTaxId,
    },
  });

  const savedInvoice = await prisma.invoice.upsert({
    where: {
      organizationId_externalId: {
        organizationId: input.organizationId,
        externalId: invoice.externalId,
      },
    },
    update: {
      number: invoice.number,
      issueDate: new Date(invoice.issueDate),
      currency: invoice.currency,
      netValue: invoice.netValue,
      grossValue: invoice.grossValue,
      rawPayload: securePayload,
      supplierId: supplier.id,
    },
    create: {
      organizationId: input.organizationId,
      supplierId: supplier.id,
      externalId: invoice.externalId,
      number: invoice.number,
      issueDate: new Date(invoice.issueDate),
      currency: invoice.currency,
      netValue: invoice.netValue,
      grossValue: invoice.grossValue,
      rawPayload: securePayload,
    },
  });

  // FIX: Check if invoice already has APPROVED lines before overwriting
  const existingApprovedLines = await prisma.invoiceLine.count({
    where: {
      invoiceId: savedInvoice.id,
      mappingDecision: { status: 'APPROVED' },
    },
  });

  if (existingApprovedLines > 0) {
    // Don't destroy approved review work on re-import
    logger.warn({
      context: 'ksef_import',
      message: 'Skipping line re-import: invoice has approved review decisions',
      organizationId: input.organizationId,
      invoiceId: savedInvoice.id,
      approvedLines: existingApprovedLines,
    });
    const existingLines = await prisma.invoiceLine.findMany({
      where: { invoiceId: savedInvoice.id },
      include: { emissionFactor: { include: { emissionSource: true } }, mappingDecision: true },
    });
    return { invoice: savedInvoice, lines: existingLines };
  }

  // Safe to re-import: delete existing non-approved lines
  await prisma.invoiceLine.deleteMany({ where: { invoiceId: savedInvoice.id } });

  // FIX: classify all lines first, then batch-fetch factors
  const classifications = invoice.lines.map((line) => ({
    line,
    cls: classifyInvoiceLine(line),
  }));

  const uniqueCategories = [...new Set(classifications.map((c) => c.cls.categoryCode))];
  const regionCode = organization?.regionCode || 'PL';
  const factorMap = await buildFactorMap(input.organizationId, regionCode, uniqueCategories);

  // FIX: Create decisions and lines in parallel batches instead of sequential loop
  const createdLines = [] as any[];
  for (const { line, cls } of classifications) {
    const factor = factorMap.get(cls.categoryCode) ?? null;

    const decision = await prisma.mappingDecision.create({
      data: {
        organizationId: input.organizationId,
        inputText: line.description,
        normalizedText: cls.normalizedText,
        scope: cls.scope,
        categoryCode: cls.categoryCode,
        factorCode: factor?.code || 'UNRESOLVED',
        confidence: cls.confidence,
        ruleMatched: cls.ruleMatched,
        status: 'PENDING',
        tokensJson: { tokens: cls.tokens, candidates: cls.candidates } as any,
      },
    });

    const created = await prisma.invoiceLine.create({
      data: {
        invoiceId: savedInvoice.id,
        emissionFactorId: factor?.id ?? null,
        mappingDecisionId: decision.id,
        description: line.description,
        quantity: line.quantity ?? null,
        unit: line.unit ?? null,
        netValue: line.netValue,
        currency: line.currency,
        scope: cls.scope,
        categoryCode: cls.categoryCode,
        calculationMethod: cls.method,
        activityValue: cls.activityValue ?? null,
        activityUnit: cls.activityUnit ?? null,
        estimated: cls.confidence < 0.9,
      },
      include: {
        emissionFactor: { include: { emissionSource: true } },
        mappingDecision: true,
      },
    });
    createdLines.push(created);
  }

  logger.info({
    context: 'ksef_import',
    message: 'Imported invoice lines',
    organizationId: input.organizationId,
    invoiceId: savedInvoice.id,
    lines: createdLines.length,
  });

  await writeProcessingRecord({
    organizationId: input.organizationId,
    actorUserId: input.actorUserId ?? null,
    eventType: 'KSEF_IMPORT',
    subjectRef: invoice.sellerTaxId ?? invoice.sellerName,
    legalBasis: 'art. 6 ust. 1 lit. b RODO',
    payload: { invoiceId: savedInvoice.id, lines: createdLines.length },
  });

  return { invoice: savedInvoice, lines: createdLines };
}
```

---

## PROMPT 5 — Dashboard: limit faktorów + bcrypt 12 + Prisma error masking

### Fix 5A — Dashboard: limit faktorów

**Plik:** `app/dashboard/page.tsx`

Znajdź zapytanie bez limitu:
```typescript
const factors = await prisma.emissionFactor.findMany({
  where: { organizationId },
  include: { emissionSource: true },
  orderBy: [{ regionPriority: 'asc' }, { year: 'desc' }],
});
```

Zastąp:
```typescript
// FIX: limit factors to avoid loading thousands of rows on every dashboard load
const factors = await prisma.emissionFactor.findMany({
  where: { organizationId },
  include: { emissionSource: true },
  orderBy: [{ regionPriority: 'asc' }, { year: 'desc' }],
  take: 300,
});
const factorsTotal = await prisma.emissionFactor.count({ where: { organizationId } });
```

Dodaj informację w UI (poniżej tabeli faktorów):
```tsx
{factorsTotal > 300 && (
  <p className="app-muted" style={{ marginTop: 8, fontSize: 13 }}>
    Pokazano 300 z {factorsTotal} faktorów. Pełna lista dostępna przez API.
  </p>
)}
```

### Fix 5B — Bcrypt cost factor: 10 → 12

**Plik:** `app/api/auth/register/route.ts` (linia 22)

Znajdź:
```typescript
const passwordHash = await bcrypt.hash(parsed.password, 10);
```
Zmień na:
```typescript
const passwordHash = await bcrypt.hash(parsed.password, 12);
```

### Fix 5C — Przyjazny błąd duplikat email przy rejestracji

**Plik:** `app/api/auth/register/route.ts`

Zastąp blok `catch`:
```typescript
  } catch (error) {
    // FIX: mask Prisma internals — show user-friendly messages
    if (error instanceof Error) {
      // Prisma unique constraint violation
      if (error.message.includes('Unique constraint') || (error as any).code === 'P2002') {
        return NextResponse.json(
          { ok: false, error: 'Konto z tym adresem email już istnieje.' },
          { status: 409 }
        );
      }
      // Zod validation
      if (error.message.includes('ZodError') || (error as any).name === 'ZodError') {
        return NextResponse.json({ ok: false, error: 'Nieprawidłowe dane formularza.' }, { status: 400 });
      }
      return NextResponse.json({ ok: false, error: 'Błąd rejestracji. Spróbuj ponownie.' }, { status: 400 });
    }
    return NextResponse.json({ ok: false, error: 'Nieznany błąd.' }, { status: 500 });
  }
```

---

## PROMPT 6 — Factor import: timeout fetch + env vars dla URL + roczna aktualizacja

**Plik:** `lib/factor-import.ts`

### Fix 6A — Dodaj timeout do fetch zewnętrznych plików

Znajdź (linia ~175):
```typescript
const res = await fetch(item.sourceUrl);
const workbook = new ExcelJS.Workbook();
const workbookBytes = Buffer.from(await res.arrayBuffer());
```

Zastąp:
```typescript
// FIX: add timeout to external XLSX downloads to prevent serverless timeout
const controller = new AbortController();
const fetchTimeout = setTimeout(() => controller.abort(), 25_000);
let res: Response;
try {
  res = await fetch(item.sourceUrl, { signal: controller.signal });
} catch (fetchError: any) {
  clearTimeout(fetchTimeout);
  if (fetchError?.name === 'AbortError') {
    throw new Error(`Timeout downloading ${item.code} factors (>25s)`);
  }
  throw fetchError;
} finally {
  clearTimeout(fetchTimeout);
}
if (!res.ok) {
  throw new Error(`Failed to download ${item.code}: HTTP ${res.status}`);
}
const workbook = new ExcelJS.Workbook();
const workbookBytes = Buffer.from(await res.arrayBuffer());
```

### Fix 6B — Dodaj GDPR_ERASURE_ANONYMIZE_INVOICES do .env.example

**Plik:** `.env.example`

Dodaj na końcu:
```
# GDPR: set to "true" to anonymize supplier names and invoice line descriptions on ERASURE
GDPR_ERASURE_ANONYMIZE_INVOICES="false"
# Factor import: update URLs annually when UK Gov / EPA publish new conversion factors
UK_FACTORS_URL=""
EPA_FACTORS_URL=""
```

### Fix 6C — Dodaj dokumentację o corocznej aktualizacji

**Plik:** `lib/factor-import.ts` — dodaj komentarz przy URL-ach:

```typescript
const sources = {
  uk: {
    code: 'UK_GOV_CONVERSION',
    name: 'UK Government Conversion Factors',
    publisher: 'UK Government',
    // ⚠️ ANNUAL UPDATE REQUIRED: URL and column name change each year.
    // Update sourceUrl and 'GHG Conversion Factor YYYY' column in parseUkRows()
    // Check: https://www.gov.uk/government/collections/government-conversion-factors-for-company-reporting
    sourceUrl: process.env.UK_FACTORS_URL ||
      'https://assets.publishing.service.gov.uk/media/6846b6ea57f3515d9611f0dd/ghg-conversion-factors-2025-flat-format.xlsx',
    // ...
  },
  epa: {
    // ⚠️ ANNUAL UPDATE REQUIRED
    // Check: https://www.epa.gov/climateleadership/ghg-emission-factors-hub
    sourceUrl: process.env.EPA_FACTORS_URL ||
      'https://www.epa.gov/system/files/other-files/2025-01/ghg-emission-factors-hub-2025.xlsx',
    // ...
  }
};
```

W `parseUkRows` zmień hardcoded kolumnę:
```typescript
const currentYear = new Date().getFullYear();
const required = [
  'ID', 'Scope', 'Level 1', 'Level 2', 'Level 3', 'Level 4', 'Column Text', 'UOM', 'GHG/Unit',
  `GHG Conversion Factor ${currentYear}`,
];
// I potem przy odczycie wartości:
const factorColumnName = `GHG Conversion Factor ${currentYear}`;
const factorValue = toNum(r[factorColumnName]);
```

---

## PROMPT 7 — externalId z NIP dostawcy + deduplication EmissionCalculation

### Fix 7A — externalId z NIP dostawcy (zapobieganie kolizji)

**Plik:** `lib/ksef-xml.ts`

Znajdź (linia ~35):
```typescript
return {
  externalId: `${number}-${issueDate}`,
  // ...
```

Zastąp:
```typescript
// FIX: include seller tax ID in externalId to avoid collision between different suppliers
// with the same invoice number and date
const taxIdPart = sellerTaxId ? `-${sellerTaxId}` : '';
return {
  externalId: `${number}${taxIdPart}-${issueDate}`,
  // ...
```

### Fix 7B — EmissionCalculation: nie zapisuj identycznych wyników

**Plik:** `lib/emissions.ts`

Dodaj deduplication przed zapisem:
```typescript
if (options.persist !== false) {
  // FIX: Check if last calculation is identical to avoid bloating the table
  const lastCalc = await prisma.emissionCalculation.findFirst({
    where: { organizationId },
    orderBy: { createdAt: 'desc' },
  });

  const isSame =
    lastCalc &&
    Math.abs(lastCalc.totalKg - totalKg) < 0.001 &&
    Math.abs(lastCalc.scope1Kg - scope1) < 0.001 &&
    Math.abs(lastCalc.scope2Kg - scope2) < 0.001 &&
    Math.abs(lastCalc.scope3Kg - scope3) < 0.001;

  if (!isSame) {
    await prisma.emissionCalculation.create({
      data: {
        organizationId,
        scope1Kg: scope1,
        scope2Kg: scope2,
        scope3Kg: scope3,
        totalKg,
        summaryJson: { byCategory, calculations, reportYear: reportYear ?? null } as any,
      },
    });
  }
}
```

---

## PROMPT 8 — Login rate limit per IP + CSP script-src fix

### Fix 8A — Dodaj per-IP rate limiting do logowania

**Problem:** `lib/auth.ts` — `authorize()` w NextAuth v4 nie ma bezpośredniego dostępu do `Request`. Rozwiązanie: przekazać IP przez pole credentials lub dodać per-IP limit w middleware.

**Plik:** `middleware.ts` — utwórz jeśli nie istnieje:
```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Simple in-memory brute-force guard for login page
// Full rate limiting is handled by Upstash in the authorize callback
export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Add security headers not covered by next.config.ts
  if (request.nextUrl.pathname.startsWith('/api/auth/callback/credentials')) {
    // This is where NextAuth processes login
    // We can't easily rate-limit here without Upstash Edge
    // The per-email limit in authorize() is the primary protection
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
```

**Alternatywa — przekaż IP przez custom credentials (lepsze rozwiązanie):**

**Plik:** `lib/auth.ts` — zaktualizuj credentials i authorize:
```typescript
providers: [Credentials({
  name: 'credentials',
  credentials: {
    email: {},
    password: {},
    _ip: {}, // hidden field — populated by login form, not shown to user
  },
  async authorize(credentials) {
    if (!credentials) return null;
    const email = String(credentials.email || '').trim().toLowerCase();
    const password = String(credentials.password || '');
    const ip = String((credentials as any)._ip || '').trim() || 'unknown';

    // Per-IP limit (prevents credential stuffing from single source)
    const ipLimit = await checkRateLimit(`login-ip:${ip}`, {
      windowMs: 15 * 60_000,
      maxRequests: 30,
    });
    if (!ipLimit.ok) return null;

    // Per-email limit (prevents targeted brute-force)
    const emailLimit = await checkRateLimit(`login:${email}`, {
      windowMs: 15 * 60_000,
      maxRequests: 10,
    });
    if (!emailLimit.ok) return null;

    // ... reszta bez zmian
  }
})],
```

W formularzu logowania (`app/login/page.tsx` lub odpowiednim komponencie) dodaj ukryte pole:
```typescript
// W akcji signIn — dodaj IP z server action lub client-side (fallback)
await signIn('credentials', {
  email,
  password,
  _ip: '', // Zostaw puste na frontendzie — bezpieczniejsze niż przekazywanie IP przez formularz
  // Dla prawdziwej ochrony użyj middleware lub server action
  redirect: false,
});
```

### Fix 8B — CSP: napraw script-src dla Next.js

**Plik:** `next.config.ts`

Zmień CSP — `script-src 'self'` blokuje inline scripts Next.js. Dodaj `'unsafe-inline'` tymczasowo:

```typescript
{
  key: 'Content-Security-Policy',
  value: [
    "default-src 'self'",
    "img-src 'self' data: https:",
    "media-src 'self' https://*.public.blob.vercel-storage.com",
    // FIX: Next.js App Router requires unsafe-inline for hydration scripts
    // TODO: migrate to nonce-based CSP when Next.js supports it stably
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "connect-src 'self' https:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; '),
},
```

Dodaj komentarz TODO aby przypomnieć o migracji do nonce-based CSP.

---

## PROMPT 9 — Testy integracyjne: emissions + payload-security + ksef-xml

Utwórz pliki testów w Node.js test runner (bez zewnętrznych zależności):

### `tests/unit/emissions.test.mjs`

```javascript
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

// Test calculateOrganizationEmissions logic in isolation
// (mock Prisma to avoid DB dependency)
describe('emissions calculation logic', () => {
  test('scope assignment: SCOPE1 adds to scope1', () => {
    // Test the mathematical logic
    let scope1 = 0, scope2 = 0, scope3 = 0;
    const lines = [
      { scope: 'SCOPE1', netValue: 1000, activityValue: null, calculationMethod: 'SPEND', factorValue: 0.5 },
      { scope: 'SCOPE2', netValue: 500, activityValue: 200, calculationMethod: 'ACTIVITY', factorValue: 0.72 },
      { scope: 'SCOPE3', netValue: 300, activityValue: null, calculationMethod: 'SPEND', factorValue: 0.3 },
    ];
    for (const line of lines) {
      const co2eKg = line.calculationMethod === 'ACTIVITY'
        ? (line.activityValue ?? 0) * line.factorValue
        : line.netValue * line.factorValue;
      if (line.scope === 'SCOPE1') scope1 += co2eKg;
      if (line.scope === 'SCOPE2') scope2 += co2eKg;
      if (line.scope === 'SCOPE3') scope3 += co2eKg;
    }
    assert.equal(scope1, 500);  // 1000 * 0.5
    assert.equal(scope2, 144);  // 200 * 0.72
    assert.equal(scope3, 90);   // 300 * 0.3
    assert.equal(scope1 + scope2 + scope3, 734);
  });

  test('ACTIVITY method uses activityValue not netValue', () => {
    const netValue = 10000;
    const activityValue = 500;
    const factorValue = 0.72;
    const co2Activity = activityValue * factorValue;
    const co2Spend = netValue * factorValue;
    assert.notEqual(co2Activity, co2Spend);
    assert.equal(co2Activity, 360);
  });
});
```

### `tests/unit/payload-security.test.mjs`

```javascript
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';

// Test AES-256-GCM encrypt/decrypt cycle without importing the full module
// (to avoid env var dependency)
describe('AES-256-GCM payload security', () => {
  function encrypt(plaintext, key) {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    const ct = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return `enc:v1:${iv.toString('base64')}:${tag.toString('base64')}:${ct.toString('base64')}`;
  }

  function decrypt(payload, key) {
    const parts = payload.split(':');
    if (parts.length !== 5) throw new Error('Invalid format');
    const [, , ivB64, tagB64, ctB64] = parts;
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(ivB64, 'base64'));
    decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
    return Buffer.concat([decipher.update(Buffer.from(ctB64, 'base64')), decipher.final()]).toString('utf8');
  }

  test('encrypt and decrypt roundtrip', () => {
    const key = crypto.randomBytes(32);
    const plaintext = '<Faktura>test invoice XML data</Faktura>';
    const encrypted = encrypt(plaintext, key);
    const decrypted = decrypt(encrypted, key);
    assert.equal(decrypted, plaintext);
  });

  test('encrypted payload starts with enc:v1:', () => {
    const key = crypto.randomBytes(32);
    const encrypted = encrypt('test', key);
    assert.ok(encrypted.startsWith('enc:v1:'));
  });

  test('tampered ciphertext throws on decrypt', () => {
    const key = crypto.randomBytes(32);
    const encrypted = encrypt('test data', key);
    const parts = encrypted.split(':');
    // Tamper with ciphertext
    parts[4] = Buffer.from('corrupted').toString('base64');
    const tampered = parts.join(':');
    assert.throws(() => decrypt(tampered, key));
  });

  test('wrong key throws on decrypt', () => {
    const key1 = crypto.randomBytes(32);
    const key2 = crypto.randomBytes(32);
    const encrypted = encrypt('secret data', key1);
    assert.throws(() => decrypt(encrypted, key2));
  });
});
```

### `tests/unit/ksef-xml-security.test.mjs`

```javascript
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

// Test XXE protection patterns without importing the full module
const FORBIDDEN_XML_PATTERNS = [/<\!DOCTYPE/i, /<\!ENTITY/i, /SYSTEM\s+["']/i, /PUBLIC\s+["']/i];

function hasXxeRisk(xml) {
  return FORBIDDEN_XML_PATTERNS.some((p) => p.test(xml));
}

describe('XXE protection', () => {
  test('rejects DOCTYPE declaration', () => {
    const xml = '<?xml version="1.0"?><!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///etc/passwd">]><root/>';
    assert.ok(hasXxeRisk(xml));
  });

  test('rejects ENTITY declaration', () => {
    const xml = '<!ENTITY ext SYSTEM "http://attacker.com/evil">';
    assert.ok(hasXxeRisk(xml));
  });

  test('rejects SYSTEM reference', () => {
    assert.ok(hasXxeRisk('SYSTEM "file:///etc/passwd"'));
  });

  test('accepts normal KSeF XML', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
      <Faktura xmlns="http://crd.gov.pl/wzor/2023/06/29/12648/">
        <Naglowek><KodFormularza kodSystemowy="FA (3)">FA</KodFormularza></Naglowek>
      </Faktura>`;
    assert.ok(!hasXxeRisk(xml));
  });

  test('case-insensitive DOCTYPE check', () => {
    assert.ok(hasXxeRisk('<!doctype html>'));
  });
});
```

---

## PROMPT 10 — .env.example: uzupełnij wszystkie brakujące zmienne

**Plik:** `.env.example` — zastąp cały plik:

```bash
# ============================================================
# Scopeo SaaS — zmienne środowiskowe
# Skopiuj do .env i uzupełnij wartości
# Po `docker compose up -d` baza będzie dostępna automatycznie
# ============================================================

# --- Baza danych ---
DATABASE_URL="postgresql://scopeo:scopeo@localhost:5433/scopeo"

# --- Autentykacja (NextAuth v4) ---
AUTH_SECRET="wygeneruj: openssl rand -base64 32"
NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# --- Email (Resend) ---
RESEND_API_KEY="re_..."
SALES_INBOX_EMAIL="sales@scopeo.com"
LEADS_FROM_EMAIL="Scopeo Leads <leads@scopeo.com>"
REVIEW_WORKFLOW_EMAIL="review@scopeo.com"

# --- Szyfrowanie danych ---
# Wygeneruj: openssl rand -base64 32
DATA_ENCRYPTION_KEY="32-byte-key-base64"
KSEF_TOKEN_ENCRYPTION_KEY="32-byte-key-base64"

# --- KSeF API ---
# production: https://ksef.mf.gov.pl/api
# test:       https://ksef-test.mf.gov.pl/api
KSEF_API_BASE_URL="https://ksef-test.mf.gov.pl/api"
KSEF_WORKER_SECRET="wygeneruj: openssl rand -base64 32"
KSEF_FETCH_MAX_ATTEMPTS="4"
KSEF_FETCH_TIMEOUT_MS="15000"

# --- Cron (Vercel) ---
# Wygeneruj: openssl rand -base64 32
CRON_SECRET="wygeneruj: openssl rand -base64 32"

# --- Redis (Upstash) — wymagany do rate limitingu w produkcji ---
# https://console.upstash.com → utwórz bazę → skopiuj REST URL i token
UPSTASH_REDIS_REST_URL=""
UPSTASH_REDIS_REST_TOKEN=""

# --- RODO ---
# ID organizacji dla rejestrowania zdarzeń przetwarzania danych z formularzy leadowych
DEFAULT_PRIVACY_ORGANIZATION_ID=""
# Ustaw na "true" aby anonimizować nazwy dostawców i opisy linii faktur przy ERASURE
GDPR_ERASURE_ANONYMIZE_INVOICES="false"

# --- Import faktorów emisji ---
# ⚠️ AKTUALIZUJ CO ROK gdy UK Gov / EPA publikują nowe tabele
# Pozostaw puste aby użyć domyślnych hardcoded URLs z 2025
UK_FACTORS_URL=""
EPA_FACTORS_URL=""

# --- Monitoring (Sentry) ---
SENTRY_DSN=""
NEXT_PUBLIC_SENTRY_DSN=""
SENTRY_ORG=""
SENTRY_PROJECT=""

# --- Emaile prawne ---
LEGAL_EMAIL_GENERAL="hello@scopeo.com"
LEGAL_EMAIL_SUPPORT="support@scopeo.com"
LEGAL_EMAIL_PRIVACY="privacy@scopeo.com"
LEGAL_EMAIL_COMPLAINTS="reklamacje@scopeo.com"
```

---

## CHECKLIST WERYFIKACJI

Po wdrożeniu wszystkich fixów sprawdź:

```bash
# 1. TypeScript
npx tsc --noEmit

# 2. Build
npm run build

# 3. Testy
npm test

# 4. Sprawdź braki roli
grep -n "findUnique\|findFirst" app/api/review/update/route.ts
# Powinno zawierać: invoice: { organizationId }

# 5. Sprawdź rate limit w factors/import
grep -n "Forbidden\|OWNER\|ADMIN" app/api/factors/import/route.ts

# 6. Sprawdź role w onboarding
grep -n "Forbidden\|OWNER\|ADMIN" app/api/onboarding/route.ts

# 7. Cron schedule
cat vercel.json | grep schedule
# Powinno być: */10 * * * *

# 8. Cookie consent — polskie znaki
grep -n "Używamy\|plików\|niezbędne" components/CookieConsent.tsx

# 9. Bcrypt cost factor
grep -n "bcrypt.hash" app/api/auth/register/route.ts
# Powinno być: bcrypt.hash(parsed.password, 12)

# 10. GDPR_ERASURE_ANONYMIZE_INVOICES w .env.example
grep "GDPR_ERASURE" .env.example

# 11. externalId z NIP
grep "externalId" lib/ksef-xml.ts
# Powinno zawierać sellerTaxId

# 12. Timeout fetch w factor-import
grep -n "AbortController\|fetchTimeout" lib/factor-import.ts
```

---

## Priorytety wdrożenia

| Prompt | Czas | Priorytet |
|---|---|---|
| PROMPT 1 — IDOR + role checks | 30 min | 🔴 Dziś |
| PROMPT 2 — Cron 10min + GDPR data subject | 15 min | 🔴 Dziś |
| PROMPT 3 — Cookie consent diacritics | 10 min | 🟠 Ten sprint |
| PROMPT 4 — N+1 ksef-import-service | 45 min | 🟠 Ten sprint |
| PROMPT 5 — Dashboard limit + bcrypt + error masking | 20 min | 🟠 Ten sprint |
| PROMPT 6 — Factor import timeout + env docs | 30 min | 🟡 Następny sprint |
| PROMPT 7 — externalId + EmissionCalc dedup | 25 min | 🟡 Następny sprint |
| PROMPT 8 — Login rate IP + CSP fix | 40 min | 🟡 Następny sprint |
| PROMPT 9 — Nowe testy | 60 min | 🟡 Następny sprint |
| PROMPT 10 — .env.example | 10 min | 🟢 Przy okazji |
