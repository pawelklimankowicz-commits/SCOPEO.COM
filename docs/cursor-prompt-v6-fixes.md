# Cursor mega prompty — poprawki v6 Scopeo

> Każdy prompt jest niezależny. Wklej w Cursor Chat / Agent Mode.  
> Kontekst: Next.js 15 App Router, Prisma, NextAuth v4 JWT, TypeScript strict.

---

## PROMPT 1 — [V6-C1] Napraw eksport PDF — polskie znaki (ASCII sanitizer)

```
Napraw funkcję `toPdf` w `app/api/emissions/export/route.ts`.

**Problem:** `pdf-lib` z `StandardFonts.Helvetica` nie obsługuje polskich znaków diakrytycznych (ą ę ś ź ż ó ć ł ń). Wyświetlają się jako puste miejsca.

**Rozwiązanie:** Dodaj funkcję `sanitizeForPdf` konwertującą polskie litery na ASCII, i zastosuj ją do KAŻDEGO tekstu renderowanego przez `page.drawText()`.

**Krok 1: Dodaj funkcję sanityzacji bezpośrednio przed funkcją `toPdf`:**

```typescript
/**
 * Konwertuje polskie znaki diakrytyczne na ASCII — StandardFonts (Type1) nie obsługują Unicode.
 * Stosuj do każdego stringa przekazywanego do page.drawText().
 */
function sanitizeForPdf(text: string): string {
  return text
    .replace(/[ąĄ]/g, (c) => (c === 'ą' ? 'a' : 'A'))
    .replace(/[ćĆ]/g, (c) => (c === 'ć' ? 'c' : 'C'))
    .replace(/[ęĘ]/g, (c) => (c === 'ę' ? 'e' : 'E'))
    .replace(/[łŁ]/g, (c) => (c === 'ł' ? 'l' : 'L'))
    .replace(/[ńŃ]/g, (c) => (c === 'ń' ? 'n' : 'N'))
    .replace(/[óÓ]/g, (c) => (c === 'ó' ? 'o' : 'O'))
    .replace(/[śŚ]/g, (c) => (c === 'ś' ? 's' : 'S'))
    .replace(/[źŹ]/g, (c) => (c === 'ź' ? 'z' : 'Z'))
    .replace(/[żŻ]/g, (c) => (c === 'ż' ? 'z' : 'Z'))
    .replace(/[^\x00-\x7E]/g, '?'); // fallback dla pozostałych znaków spoza Latin-1
}
```

**Krok 2: Stwórz helper do rysowania tekstu:**

```typescript
/** Wrapper rysujący tekst z automatyczną sanityzacją i obcinaniem długich stringów. */
function drawSafeText(
  page: ReturnType<typeof pdfDoc.addPage>,
  text: string,
  options: Parameters<ReturnType<typeof pdfDoc.addPage>['drawText']>[1]
) {
  page.drawText(sanitizeForPdf(String(text ?? '')), options);
}
```

**Krok 3: Zastąp WSZYSTKIE wywołania `page.drawText(...)` przez `drawSafeText(page, ...)` wewnątrz funkcji `toPdf`.**

Przykład zamiany:
```typescript
// PRZED:
page.drawText('Raport emisji CO2', { x: MARGIN, y: y - 20, size: 16, font: boldFont, color: rgb(0,0,0) });

// PO:
drawSafeText(page, 'Raport emisji CO2', { x: MARGIN, y: y - 20, size: 16, font: boldFont, color: rgb(0,0,0) });
```

Dotyczy też funkcji `drawHeaders` — zamień jej wywołania `page.drawText(col, ...)` na `drawSafeText(page, col, ...)`.

Dla danych wierszy (cells): `sanitizeForPdf(String(row.invoiceNumber ?? '').slice(0,24))` itd.

**Nie zmieniaj:** eksportu CSV, eksportu XLSX, logiki paginacji PDF, nagłówków HTTP response.
```

---

## PROMPT 2 — [V6-C2] Napraw `KSEF_CONTEXT_NIP` — pobieraj NIP z CarbonProfile

```
Napraw `lib/ksef-client.ts` i `app/api/ksef/jobs/process/route.ts` — NIP dla KSeF InitToken powinien pochodzić z organizacji, nie z env vara z hardcoded fallback.

**Problem:** `lib/ksef-client.ts` używa:
```typescript
const contextNip = (process.env.KSEF_CONTEXT_NIP || '9462761086').trim();
```
Hardcoded fallback NIP `9462761086` może powodować błędny kontekst sesji dla każdej organizacji, która nie ustawi env vara.

**Zmiana 1: `lib/ksef-client.ts` — dodaj `contextNip` jako wymagany parametr input**

Zmień sygnaturę funkcji:
```typescript
export async function fetchKsefInvoiceXml(input: {
  token: string;
  referenceNumber: string;
  contextNip?: string | null;  // NIP z CarbonProfile organizacji
}): Promise<string> {
  // ...
  const contextNip = (input.contextNip?.trim() || process.env.KSEF_CONTEXT_NIP?.trim() || '').trim();
  if (!contextNip) {
    throw new Error('KSeF contextNip (NIP organizacji) is required for InitToken. Set KSEF_CONTEXT_NIP env or pass contextNip from CarbonProfile.');
  }
  // Reszta bez zmian — użyj contextNip zamiast lokalnej const
}
```

**Zmiana 2: `app/api/ksef/jobs/process/route.ts` — przekaż NIP z CarbonProfile**

W miejscu gdzie pobierasz profil i wywołujesz `fetchKsefInvoiceXml`:

```typescript
const profile = await prisma.carbonProfile.findUnique({
  where: { organizationId: job.organizationId },
});
if (!profile?.ksefTokenEncrypted) {
  throw new Error('Missing encrypted KSeF token');
}
const token = decryptKsefToken(profile.ksefTokenEncrypted);

// NOWE: pobierz NIP z profilu lub env
const contextNip = profile.taxId?.trim() || process.env.KSEF_CONTEXT_NIP?.trim() || null;

const xmlPayload = await fetchKsefInvoiceXml({
  token,
  referenceNumber: job.referenceNumber,
  contextNip,  // NOWE
});
```

**WAŻNE:** `CarbonProfile` może nie mieć pola `taxId` — sprawdź schemat Prisma. Jeśli pola nie ma, dodaj je najpierw do `prisma/schema.prisma`:
```prisma
model CarbonProfile {
  // ... istniejące pola ...
  taxId   String?  // NIP organizacji dla KSeF (opcjonalne, fallback do KSEF_CONTEXT_NIP)
}
```
I zaktualizuj `onboardingSchema` w `lib/schema.ts`:
```typescript
export const onboardingSchema = z.object({
  // ... istniejące pola ...
  taxId: z.string().regex(/^\d{10}$/, 'NIP musi mieć 10 cyfr').optional().nullable(),
});
```
I zaktualizuj `app/api/onboarding/route.ts` — dodaj `taxId` do upsert data.

Uruchom `npx prisma generate && npx prisma db push` po zmianie schematu.

**Usuń** hardcoded fallback z `.env.example` — zmień:
```
KSEF_CONTEXT_NIP="9462761086"
```
na:
```
# NIP organizacji dla KSeF InitToken (fallback jeśli nie skonfigurowano w profilu CarbonProfile)
# Zalecane: ustaw taxId w profilu organizacji przez Onboarding
KSEF_CONTEXT_NIP=""
```
```

---

## PROMPT 3 — [V6-H1] Napraw minimalną długość hasła przy akceptacji zaproszenia

```
Napraw niezgodność w wymaganiach dotyczących hasła w `app/api/invites/accept/route.ts`.

**Problem:** Rejestracja wymaga hasła min 12 znaków (`lib/schema.ts`), ale zaproszeni użytkownicy mogą ustawić hasło już od 8 znaków.

**Zmiana 1: Zaktualizuj `acceptInviteSchema`**

```typescript
// PRZED:
const acceptInviteSchema = z.object({
  inviteToken: z.string().min(16),
  name: z.string().min(2).optional(),
  email: z.string().email(),
  password: z.string().min(8).optional(),
});

// PO:
const acceptInviteSchema = z.object({
  inviteToken: z.string().min(16),
  name: z.string().min(2).optional(),
  email: z.string().email(),
  password: z
    .string()
    .min(12, 'Hasło musi mieć co najmniej 12 znaków')
    .max(128, 'Hasło może mieć maksymalnie 128 znaków')
    .optional(),
});
```

**Zmiana 2: Zaktualizuj inline walidację (linia ~44)**

```typescript
// PRZED:
if (!parsed.password || typeof parsed.password !== 'string' || parsed.password.length < 8) {
  return NextResponse.json(
    { ok: false, error: 'Password must be at least 8 characters' },
    { status: 400 }
  );
}

// PO:
if (!parsed.password || typeof parsed.password !== 'string' || parsed.password.length < 12) {
  return NextResponse.json(
    { ok: false, error: 'Hasło musi mieć co najmniej 12 znaków.' },
    { status: 400 }
  );
}
```

Nie zmieniaj żadnej innej logiki w pliku.
```

---

## PROMPT 4 — [V6-H2] Zabezpiecz endpoint `/api/health`

```
Zabezpiecz `app/api/health/route.ts` przed ujawnianiem konfiguracji infrastruktury nieuwierzytelnionym użytkownikom.

**Podejście:** Dodaj opcjonalne uwierzytelnianie nagłówkiem `x-health-secret`. Jeśli env `HEALTH_CHECK_SECRET` jest ustawiony, endpoint wymaga nagłówka. Jeśli nie ustawiony — zwraca tylko minimalną odpowiedź bez szczegółów konfiguracji.

**Zastąp cały plik nową implementacją:**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.HEALTH_CHECK_SECRET?.trim();
  if (!secret) return false; // Brak sekretu = nigdy nie autoryzuj szczegółów
  return req.headers.get('x-health-secret') === secret;
}

export async function GET(req: NextRequest) {
  const authorized = isAuthorized(req);
  const startedAt = Date.now();

  try {
    await prisma.$queryRaw`SELECT 1`;

    if (authorized) {
      // Szczegółowa odpowiedź dla autoryzowanych monitoringów (uptime checks, alerting)
      return NextResponse.json(
        {
          ok: true,
          status: 'healthy',
          uptimeSec: Math.round(process.uptime()),
          db: 'ok',
          authSecretSet: Boolean(
            (process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || '').trim()
          ),
          nextAuthUrlSet: Boolean((process.env.NEXTAUTH_URL || '').trim()),
          responseMs: Date.now() - startedAt,
        },
        { status: 200 }
      );
    }

    // Publiczna odpowiedź — tylko status DB bez szczegółów konfiguracji
    return NextResponse.json(
      { ok: true, status: 'healthy', db: 'ok', responseMs: Date.now() - startedAt },
      { status: 200 }
    );
  } catch {
    if (authorized) {
      return NextResponse.json(
        {
          ok: false,
          status: 'unhealthy',
          db: 'error',
          responseMs: Date.now() - startedAt,
        },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { ok: false, status: 'unhealthy', responseMs: Date.now() - startedAt },
      { status: 503 }
    );
  }
}
```

Dodaj do `.env.example`:
```
# Opcjonalnie: secret dla /api/health — wymagany w nagłówku x-health-secret dla szczegółowych danych
# HEALTH_CHECK_SECRET="generate-with-openssl-rand-base64-16"
```
```

---

## PROMPT 5 — [V6-H3] Napraw duplikaty Supplier przy NULL taxId

```
Napraw problem duplikowania dostawców (`Supplier`) gdy `taxId` jest `null` w `prisma/schema.prisma` i `lib/ksef-import-service.ts`.

**Problem:** W PostgreSQL NULL ≠ NULL w warunkach UNIQUE, więc `@@unique([organizationId, name, taxId])` nie zapobiega duplikatom gdy `taxId = null`.

**Zmiana 1: `prisma/schema.prisma` — usuń unique constraint, dodaj index z COALESCE**

W modelu `Supplier`:
```prisma
model Supplier {
  id             String       @id @default(cuid())
  organizationId String
  name           String
  taxId          String?
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  invoices       Invoice[]
  // USUŃ: @@unique([organizationId, name, taxId])
  // DODAJ oba:
  @@index([organizationId, name])
}
```

Następnie dodaj migrację z raw SQL dla null-safe unique index:
```sql
-- Uruchom jako migrację Prisma lub w psql
CREATE UNIQUE INDEX IF NOT EXISTS supplier_orgid_name_taxid_null_safe 
ON "Supplier"("organizationId", "name", COALESCE("taxId", ''));
```

Utwórz plik `prisma/migrations/[timestamp]_supplier_null_safe_unique/migration.sql`:
```sql
-- Usuń stary constraint (jeśli istnieje jako named constraint)
ALTER TABLE "Supplier" DROP CONSTRAINT IF EXISTS "Supplier_organizationId_name_taxId_key";

-- Dodaj null-safe unique index
CREATE UNIQUE INDEX IF NOT EXISTS "supplier_orgid_name_taxid_null_safe" 
ON "Supplier"("organizationId", "name", COALESCE("taxId", ''));
```

**Zmiana 2: `lib/ksef-import-service.ts` — dostosuj upsert do nowego indexu**

```typescript
// PRZED upsert Supplier używał @@unique([organizationId, name, taxId]):
const supplier = await prisma.supplier.upsert({
  where: {
    organizationId_name_taxId: {
      organizationId: input.organizationId,
      name: invoice.sellerName,
      taxId: supplierTaxId,
    },
  },
  // ...
});

// PO — używamy findFirst + create/update bo Prisma nie obsługuje raw SQL unique index w where:
const existingSupplier = await prisma.supplier.findFirst({
  where: {
    organizationId: input.organizationId,
    name: invoice.sellerName,
    taxId: supplierTaxId || null,
  },
});

const supplier = existingSupplier
  ? existingSupplier
  : await prisma.supplier.create({
      data: {
        organizationId: input.organizationId,
        name: invoice.sellerName,
        taxId: supplierTaxId || null,
      },
    });
```

Po zmianie uruchom: `npx prisma generate && npx prisma migrate dev --name supplier_null_safe_unique`
```

---

## PROMPT 6 — [V6-H4] Dodaj rate limiting do accept invite i create invite

```
Dodaj rate limiting do dwóch endpointów w projekcie Scopeo.

### Zmiana 1: `app/api/invites/accept/route.ts` — rate limit na akceptację

Na początku funkcji `POST`, przed parsowaniem body, dodaj:

```typescript
import { checkRateLimit, getClientIp } from '@/lib/security';

export async function POST(req: NextRequest) {
  // NOWE: Rate limit na accept invite — bcrypt.hash() jest kosztowny (12 rund)
  const ip = getClientIp(req.headers);
  const rl = await checkRateLimit(`invite-accept:${ip}`, {
    windowMs: 15 * 60 * 1000, // 15 minut
    maxRequests: 10,
  });
  if (!rl.ok) {
    return NextResponse.json(
      { ok: false, error: 'Too many attempts. Try again later.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfterSec) } }
    );
  }

  // ... reszta bez zmian
}
```

### Zmiana 2: `app/api/invites/route.ts` — rate limit na tworzenie zaproszeń

W funkcji `POST` (create invite), po sprawdzeniu roli, przed parsowaniem body:

```typescript
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  const role = (session.user as any).role as string | null | undefined;
  if (!canManageInvites(role)) {
    return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
  }
  const organizationId = (session.user as any).organizationId as string;

  // NOWE: Rate limit na wysyłanie zaproszeń
  const ip = getClientIp(req.headers);
  const rl = await checkRateLimit(`invite-create:${organizationId}:${ip}`, {
    windowMs: 60 * 60 * 1000, // 1 godzina
    maxRequests: 20,
  });
  if (!rl.ok) {
    return NextResponse.json(
      { ok: false, error: 'Too many invitations sent. Try again later.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfterSec) } }
    );
  }

  // ... reszta bez zmian
}
```

Importuj `getClientIp` jeśli nie jest zaimportowane (sprawdź istniejące importy w pliku).
```

---

## PROMPT 7 — [V6-H5] Napraw GDPR anonymize — zamień N+1 na updateMany

```
Napraw N+1 loop w `app/api/gdpr/requests/[requestId]/execute/route.ts`.

**Problem:** Anonimizacja opisów linii faktur wykonuje osobny UPDATE dla każdej linii.

**Zastąp istniejący kod (linie ~85-98) jednym `updateMany`:**

```typescript
// PRZED (N+1 — każda linia osobno):
const lines = await prisma.invoiceLine.findMany({
  where: {
    invoice: { organizationId, supplier: { name: 'Deleted Supplier' } },
  },
  select: { id: true },
});
for (const line of lines) {
  await prisma.invoiceLine.update({
    where: { id: line.id },
    data: { description: '[ANONYMIZED]' },
  });
}
affectedInvoiceLines = lines.length;

// PO (jedno zapytanie):
const linesResult = await prisma.invoiceLine.updateMany({
  where: {
    invoice: { organizationId, supplier: { name: 'Deleted Supplier' } },
  },
  data: { description: '[ANONYMIZED]' },
});
affectedInvoiceLines = linesResult.count;
```

Jednocześnie zmień email w tym samym pliku (linia ~131) z `await` na fire-and-forget:

```typescript
// PRZED (blokujące):
await resend.emails.send({ ... });

// PO (fire-and-forget):
resend.emails.send({
  from: fromEmail,
  to: request.subjectEmail,
  subject: 'Potwierdzenie realizacji wniosku RODO - Scopeo',
  text: request.type === 'ERASURE'
    ? `Informujemy, ze Twoj wniosek o usuniecie danych osobowych (nr ${request.id}) zostal zrealizowany...`
    : `Informujemy, ze Twoj wniosek o dostep do danych osobowych (nr ${request.id}) zostal zrealizowany...`,
}).catch((err: unknown) => {
  // Loguj błąd emaila ale nie przerywaj — wniosek GDPR jest już wykonany
  console.error('[GDPR execute] Failed to send confirmation email:', err instanceof Error ? err.message : err);
});
```

Nie zmieniaj żadnych innych sekcji pliku.
```

---

## PROMPT 8 — [V6-M1] Napraw AbortController w ksef-client — osobny timeout per request

```
Napraw `lib/ksef-client.ts` — jeden AbortController i jeden timeout dla dwóch requestów sieciowych.

**Problem:** Obecna implementacja używa jednego `abortController` dla InitToken i fetch faktury. Jeśli InitToken zajmie większość okna czasowego, fetch faktury się przetimeoutuje natychmiast.

**Zastąp blok wewnątrz pętli `for (let attempt...)` nową implementacją z osobnymi kontrolerami:**

```typescript
for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
  try {
    // --- InitToken (osobny timeout) ---
    const initController = new AbortController();
    const initTimeout = setTimeout(() => initController.abort(), timeoutMs);
    let sessionToken: string;
    try {
      const sessionInitRes = await fetch(initUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ authToken: input.token, contextIdentifier: { type: 'onip', identifier: contextNip } }),
        cache: 'no-store',
        signal: initController.signal,
      });
      if (!sessionInitRes.ok) {
        throw new Error(`KSeF InitToken failed with status ${sessionInitRes.status}`);
      }
      const sessionPayload = (await sessionInitRes.json().catch(() => ({}))) as Record<string, any>;
      sessionToken =
        (typeof sessionPayload.sessionToken === 'string'
          ? sessionPayload.sessionToken
          : sessionPayload.sessionToken?.token) || sessionPayload.token || '';
      if (!sessionToken) throw new Error('KSeF InitToken response did not contain sessionToken');
    } finally {
      clearTimeout(initTimeout);
    }

    // --- Fetch faktury (osobny timeout) ---
    const fetchController = new AbortController();
    const fetchTimeout = setTimeout(() => fetchController.abort(), timeoutMs);
    try {
      const response = await fetch(invoiceUrl, {
        method: 'GET',
        headers: { SessionToken: sessionToken, Accept: 'application/xml, text/xml, application/octet-stream' },
        cache: 'no-store',
        signal: fetchController.signal,
      });

      if (!response.ok) {
        const body = await response.text().catch(() => '');
        const isRetryable = response.status >= 500 || response.status === 429 || response.status === 408;
        if (isRetryable && attempt < maxAttempts) {
          logger.warn({ context: 'ksef_connector', message: 'Retrying KSeF fetch', status: response.status, attempt });
          await wait(Math.min(1000 * 2 ** (attempt - 1), 10_000));
          continue;
        }
        logger.error({ context: 'ksef_connector', message: 'KSeF API request failed', status: response.status, responseBody: body.slice(0, 400) });
        throw new Error(`KSeF API responded with status ${response.status}`);
      }

      const xml = await response.text();
      if (!xml || !xml.includes('<')) throw new Error('KSeF API response did not contain XML payload');

      // Terminate — fire-and-forget, osobny request bez timeoutu
      fetch(terminateUrl, {
        method: 'DELETE',
        headers: { SessionToken: sessionToken, Accept: 'application/json' },
        cache: 'no-store',
      }).catch(() => null);

      return xml;
    } finally {
      clearTimeout(fetchTimeout);
    }

  } catch (error) {
    lastError = error instanceof Error ? error : new Error('Unknown KSeF fetch error');
    if (attempt < maxAttempts) {
      await wait(Math.min(1000 * 2 ** (attempt - 1), 10_000));
      continue;
    }
  }
}
```

Zachowaj istniejącą deklarację `lastError`, pętlę `for`, logowanie przez `logger`, finalny `throw lastError`.
```

---

## PROMPT 9 — [V6-M2+M3+M4] Napraw URL zaproszenia, fire-and-forget emaile

```
Trzy małe poprawki email/URL w projekcie Scopeo:

### Zmiana 1: `lib/invitations.ts` — URL zaproszenia z właściwego env vara

```typescript
// PRZED:
const appUrl = process.env.NEXTAUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL;

// PO (priorytet: publiczny URL aplikacji, fallback do NEXTAUTH_URL):
const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL)?.replace(/\/$/, '');
```

### Zmiana 2: `app/api/contact/route.ts` — email do sales fire-and-forget

Znajdź blok:
```typescript
const emailResult = await resend.emails.send({ ... });
if (emailResult.error) {
  logger.error({ ... });
  return NextResponse.json({ error: 'Lead saved, but failed to send notification email.' }, { status: 502 });
}
return NextResponse.json({ ok: true });
```

Zastąp:
```typescript
// Fire-and-forget — lead jest zapisany, email nie blokuje odpowiedzi
resend.emails.send({
  from: fromEmail,
  to: salesInbox,
  replyTo: lead.email,
  subject: `Nowy lead demo: ${lead.company}`,
  text: [ /* ... bez zmian ... */ ].join('\n'),
}).catch((err: unknown) => {
  logger.error({
    context: 'contact',
    message: 'Failed to send lead notification (async)',
    error: err instanceof Error ? err.message : 'unknown',
  });
});
return NextResponse.json({ ok: true });
```

Usuń blok `if (emailResult.error) { ... }` — nie ma już synchronicznego rezultatu.

### Zmiana 3: `app/api/review/update/route.ts` — email review fire-and-forget

Znajdź:
```typescript
const emailResult = await resend.emails.send({ ... });
if (emailResult.error) { logger.warn({ ... }); }
```

Zastąp:
```typescript
resend.emails.send({
  from: fromEmail,
  to: workflowRecipient,
  subject: `Scopeo review: ${before.status} -> ${after.status}`,
  text: [ /* ... bez zmian ... */ ].join('\n'),
}).then((emailResult) => {
  if (emailResult.error) {
    logger.warn({ context: 'review_update', message: 'Workflow email failed (async)', organizationId, error: emailResult.error.message });
  }
}).catch((err: unknown) => {
  logger.warn({ context: 'review_update', message: 'Workflow email threw (async)', organizationId, error: err instanceof Error ? err.message : 'unknown' });
});
```
```

---

## PROMPT 10 — [V6-M6+M7] Walidacja rozmiaru XML + audit ProcessingRecord dla factor import

```
Dwie niezależne poprawki:

### Zmiana 1: `app/api/ksef/import/route.ts` — walidacja rozmiaru XML

W bloku `if (!parsed.xml)` przed wywołaniem `importKsefXmlForOrganization`, dodaj:

```typescript
if (!parsed.xml) {
  return NextResponse.json({ ok: false, error: 'Missing XML payload' }, { status: 400 });
}

// NOWE: limit rozmiaru XML — zapobiega OOM w serverless
const MAX_XML_BYTES = 2 * 1024 * 1024; // 2MB
if (Buffer.byteLength(parsed.xml, 'utf8') > MAX_XML_BYTES) {
  logger.warn({
    context: 'ksef_import',
    message: 'XML payload too large — rejected',
    organizationId,
    sizeBytes: Buffer.byteLength(parsed.xml, 'utf8'),
  });
  return NextResponse.json(
    { ok: false, error: 'XML payload too large. Maximum size is 2MB.' },
    { status: 413 }
  );
}

const imported = await importKsefXmlForOrganization({ ... });
```

### Zmiana 2: `lib/factor-import.ts` — dodaj ProcessingRecord dla importu faktorów

Na początku pliku dodaj import:
```typescript
import { writeProcessingRecord } from '@/lib/privacy-register';
```

Na końcu funkcji `importExternalFactors`, po `results.push({ source: 'KOBIZE_PL', ... })`:

```typescript
  // NOWE: audit log importu faktorów (GDPR — przetwarzamy zewnętrzne dane do bazy)
  const totalImported = results.reduce((sum, r) => sum + (r.importedCount ?? 0), 0);
  await writeProcessingRecord({
    organizationId,
    actorUserId: actorUserId ?? null,
    eventType: 'FACTOR_IMPORT',
    subjectRef: results.map((r) => r.source).join(', '),
    legalBasis: 'art. 6 ust. 1 lit. b RODO',
    payload: {
      results: results.map((r) => ({ source: r.source, ok: r.ok, importedCount: r.importedCount ?? 0 })),
      totalImported,
    },
  });

  return { results };
}
```
```

---

## PROMPT 11 — [V6-M8+M9+M10] CSP, NEXTAUTH_URL leak, paginacja aria-disabled

```
Trzy niezależne poprawki konfiguracyjne i UX:

### Zmiana 1: `middleware.ts` — zawęź CSP connect-src

```typescript
// PRZED:
`connect-src 'self' https:`,

// PO — whitelist tylko potrzebnych domen:
`connect-src 'self' https://*.sentry.io https://o*.ingest.sentry.io`,
```

Uwaga: Jeśli aplikacja używa `fetch` do zewnętrznych API z poziomu przeglądarki, dodaj te hosty. Z kodu widać, że fetch do KSeF API, UK Gov i EPA jest SERWEROWY (API routes) — nie potrzebuje connect-src po stronie klienta.

### Zmiana 2: `next.config.ts` — usuń NEXTAUTH_URL z bloku env

```typescript
// PRZED:
const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'http://localhost:3000',
  },
  // ...
};

// PO — usuń cały blok env:
const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  // Komentarz: NEXTAUTH_URL jest zmienną serwerową NextAuth — nie eksponuj do bundla klienta.
  // Jeśli potrzebujesz URL aplikacji po stronie klienta, użyj NEXT_PUBLIC_APP_URL.
  // ...
};
```

### Zmiana 3: `app/dashboard/page.tsx` — napraw paginację

Zastąp oba linki Poprzednia/Następna strona (na końcu pliku, linie ~279-293):

```typescript
{/* Poprzednia strona */}
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
    style={{ opacity: 0.4, pointerEvents: 'none', cursor: 'not-allowed' }}
    aria-disabled="true"
  >
    Poprzednia strona
  </span>
)}

{/* Następna strona */}
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
    style={{ opacity: 0.4, pointerEvents: 'none', cursor: 'not-allowed' }}
    aria-disabled="true"
  >
    Następna strona
  </span>
)}
```

Nie zmieniaj żadnych innych elementów strony.
```

---

## Kolejność wdrożenia v6

| Priorytet | Prompt | Problem | Ryzyko |
|-----------|--------|---------|--------|
| 1 | Prompt 1 | PDF polskie znaki | Zepsute eksporty |
| 2 | Prompt 2 | KSeF NIP context | Błędne sesje KSeF |
| 3 | Prompt 3 | Accept invite min 8 | Niezgodność polityki haseł |
| 4 | Prompt 5 | Supplier NULL taxId | Duplikaty dostawców |
| 5 | Prompt 7 | GDPR anonymize N+1 | Wolna realizacja wniosków |
| 6 | Prompt 4 | Health endpoint | Wyciek konfiguracji |
| 7 | Prompt 6 | Rate limit invites | Security |
| 8 | Prompt 8 | AbortController per-request | Fałszywe timeouty |
| 9 | Prompt 9 | Email fire-and-forget | Performance |
| 10 | Prompt 10 | XML size + audit log | Safety + compliance |
| 11 | Prompt 11 | CSP + env + pagination | Security + UX |
