# Cursor Mega Prompt — Scopeo SaaS Production Fixes v3

You are working on a Next.js 15 SaaS application called **Scopeo** — a carbon footprint tracking platform for Polish businesses using KSeF (national e-invoice system) data. The app uses: Next.js 15 App Router, TypeScript, Prisma ORM + PostgreSQL, NextAuth v4 (stable), Resend for email, AES-256-GCM encryption for sensitive data, Sentry for monitoring.

Implement ALL of the following fixes in order. Do not skip any. After each fix, verify TypeScript compiles (`tsc --noEmit`).

---

## FIX 1 — Replace in-memory rate limiter with Redis (Upstash)

**Problem:** `lib/security.ts` uses a module-level `Map` for rate limiting. In serverless environments (Vercel), each cold start creates a new Map — rate limits are completely non-functional in production.

**Steps:**
1. Install: `npm install @upstash/ratelimit @upstash/redis`
2. Add to `.env.example`:
   ```
   UPSTASH_REDIS_REST_URL="https://..."
   UPSTASH_REDIS_REST_TOKEN="..."
   ```
3. Rewrite `lib/security.ts` to use Upstash:

```typescript
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

let redis: Redis | null = null;
function getRedis() {
  if (!redis) {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (!url || !token) return null;
    redis = new Redis({ url, token });
  }
  return redis;
}

const limiters: Record<string, Ratelimit> = {};

function getLimiter(key: string, requests: number, window: string): Ratelimit | null {
  const r = getRedis();
  if (!r) return null;
  if (!limiters[key]) {
    limiters[key] = new Ratelimit({
      redis: r,
      limiter: Ratelimit.slidingWindow(requests, window as any),
      prefix: `scopeo:rl:${key}`,
    });
  }
  return limiters[key];
}

export async function checkRateLimit(
  identifier: string,
  config: { maxRequests: number; windowMs: number }
): Promise<{ ok: true; remaining: number } | { ok: false; retryAfterSec: number }> {
  const windowSec = Math.floor(config.windowMs / 1000);
  const limiter = getLimiter(`${config.maxRequests}/${windowSec}s`, config.maxRequests, `${windowSec} s`);
  
  // Fallback: if Redis not configured, allow all requests (log warning)
  if (!limiter) {
    console.warn('[rate-limit] Upstash Redis not configured, rate limiting disabled');
    return { ok: true, remaining: config.maxRequests };
  }
  
  const result = await limiter.limit(identifier);
  if (result.success) {
    return { ok: true, remaining: result.remaining };
  }
  const retryAfterSec = Math.ceil((result.reset - Date.now()) / 1000);
  return { ok: false, retryAfterSec };
}

export function getClientIp(headers: Headers): string {
  // x-vercel-forwarded-for is set by Vercel infra and cannot be spoofed by clients
  const vercelIp = headers.get('x-vercel-forwarded-for');
  if (vercelIp) return vercelIp.split(',')[0].trim();
  // x-real-ip as fallback
  const realIp = headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  // Last resort (development only)
  const forwarded = headers.get('x-forwarded-for');
  return forwarded?.split(',')[0]?.trim() ?? '127.0.0.1';
}
```

4. Update all callers of `checkRateLimit` to `await` it (it's now async): `lib/auth.ts`, `app/api/ksef/import/route.ts`, `app/api/auth/register/route.ts`

---

## FIX 2 — Prevent password overwrite on invite accept

**Problem:** `app/api/invites/accept/route.ts` uses `prisma.user.upsert` with `update: { passwordHash }`. If the invited email already has an account, the attacker with a stolen invite token can overwrite the password.

**Fix:** Replace `upsert` with explicit check + separate create/update paths:

```typescript
// In app/api/invites/accept/route.ts, replace the upsert block with:

const existingUser = await prisma.user.findUnique({
  where: { email: invite.email },
});

let userId: string;

if (existingUser) {
  // User already exists — just add membership, NEVER change password
  userId = existingUser.id;
} else {
  // New user — create account with provided password
  if (!body.password || typeof body.password !== 'string' || body.password.length < 8) {
    return NextResponse.json({ ok: false, error: 'Password must be at least 8 characters' }, { status: 400 });
  }
  const passwordHash = await bcrypt.hash(body.password, 12);
  const newUser = await prisma.user.create({
    data: {
      email: invite.email,
      name: body.name ?? null,
      passwordHash,
    },
  });
  userId = newUser.id;
}

// Check if membership already exists
const existingMembership = await prisma.membership.findFirst({
  where: { userId, organizationId: invite.organizationId },
});

if (!existingMembership) {
  await prisma.membership.create({
    data: {
      userId,
      organizationId: invite.organizationId,
      role: invite.role,
    },
  });
}

await prisma.invitation.update({
  where: { id: invite.id },
  data: { status: 'ACCEPTED' },
});
```

---

## FIX 3 — Add rate limiting to registration endpoint

**Problem:** `app/api/auth/register/route.ts` has no rate limiting — unlimited organization creation possible.

**Fix:** Add at the top of the POST handler in `app/api/auth/register/route.ts`:

```typescript
import { checkRateLimit, getClientIp } from '@/lib/security';

// Inside POST handler, before any DB operations:
const ip = getClientIp(request.headers);
const rl = await checkRateLimit(`register:${ip}`, { maxRequests: 5, windowMs: 60 * 60 * 1000 }); // 5/hour per IP
if (!rl.ok) {
  return NextResponse.json(
    { ok: false, error: 'Too many registration attempts. Try again later.' },
    { status: 429, headers: { 'Retry-After': String(rl.retryAfterSec) } }
  );
}
```

---

## FIX 4 — Fix export endpoint polluting EmissionCalculation table

**Problem:** `app/api/emissions/export/route.ts` calls `calculateOrganizationEmissions()` which always creates a new DB record. Every export = new record.

**Steps:**
1. In `lib/emissions.ts`, add a `persist` option to `calculateOrganizationEmissions`:

```typescript
export async function calculateOrganizationEmissions(
  organizationId: string,
  reportYear?: number,
  options: { persist?: boolean } = { persist: true }
) {
  // ... existing calculation logic ...
  
  // Only save to DB if persist is true (default: true)
  if (options.persist !== false) {
    await prisma.emissionCalculation.create({ data: { ... } });
  }
  
  return result;
}
```

2. In `app/api/emissions/export/route.ts`, pass `{ persist: false }`:

```typescript
const result = await calculateOrganizationEmissions(organizationId, validReportYear, { persist: false });
```

---

## FIX 5 — Fix PDF export truncation (remove slice(0, 20))

**Problem:** `app/api/emissions/export/route.ts` has `result.calculations.slice(0, 20)` — PDF is incomplete for orgs with >20 emission lines.

**Fix:** Remove the slice and implement proper multi-page PDF using pdf-lib. Replace the PDF generation block:

```typescript
// Replace: const rows = result.calculations.slice(0, 20);
// With full pagination across multiple pages:

const rows = result.calculations; // ALL rows

const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');
const pdfDoc = await PDFDocument.create();
const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

const PAGE_HEIGHT = 841.89; // A4
const PAGE_WIDTH = 595.28;
const MARGIN = 40;
const ROW_HEIGHT = 18;
const HEADER_HEIGHT = 80;
const ROWS_PER_PAGE = Math.floor((PAGE_HEIGHT - MARGIN * 2 - HEADER_HEIGHT) / ROW_HEIGHT);

let page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
let y = PAGE_HEIGHT - MARGIN;

// Title
page.drawText(`Raport emisji CO₂ — ${validReportYear ?? 'Wszystkie lata'}`, {
  x: MARGIN, y: y - 20, size: 16, font: boldFont, color: rgb(0, 0, 0),
});
y -= 50;

// Column headers
const cols = ['Kategoria', 'Zakres', 'CO₂e (kg)', 'Faktury'];
const colWidths = [200, 80, 100, 80];
let x = MARGIN;
cols.forEach((col, i) => {
  page.drawText(col, { x, y, size: 9, font: boldFont, color: rgb(0.3, 0.3, 0.3) });
  x += colWidths[i];
});
y -= ROW_HEIGHT;

// Data rows with automatic page breaks
for (const row of rows) {
  if (y < MARGIN + ROW_HEIGHT) {
    page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    y = PAGE_HEIGHT - MARGIN;
  }
  x = MARGIN;
  const cells = [
    (row.categoryCode ?? '').slice(0, 35),
    row.scope ?? '',
    (row.totalCo2eKg ?? 0).toFixed(2),
    String(row.invoiceCount ?? 0),
  ];
  cells.forEach((cell, i) => {
    page.drawText(String(cell), { x, y, size: 8, font, color: rgb(0, 0, 0) });
    x += colWidths[i];
  });
  y -= ROW_HEIGHT;
}

const pdfBytes = await pdfDoc.save();
```

---

## FIX 6 — Fix silent invitation email failure

**Problem:** `lib/invitations.ts` returns `null` silently when env vars are missing. The invitation is saved to DB but the email is never sent.

**Fix in `lib/invitations.ts`:**

```typescript
export async function sendInvitationEmail(input: { email: string; token: string }) {
  const appUrl = process.env.NEXTAUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL;
  const resendKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.LEADS_FROM_EMAIL;
  
  if (!appUrl || !resendKey || !fromEmail) {
    throw new Error(
      'Email service not configured: missing NEXTAUTH_URL, RESEND_API_KEY, or LEADS_FROM_EMAIL'
    );
  }
  
  const inviteUrl = `${appUrl.replace(/\/$/, '')}/login?inviteToken=${encodeURIComponent(input.token)}`;
  const resend = new Resend(resendKey);
  
  const result = await resend.emails.send({
    from: fromEmail,
    to: input.email.toLowerCase(),
    subject: 'Zaproszenie do Scopeo',
    text: `Otrzymujesz zaproszenie do organizacji w Scopeo.\n\nKliknij link, aby dołączyć:\n${inviteUrl}\n\nLink wygasa po 7 dniach.`,
  });
  
  if (result.error) {
    throw new Error(`Failed to send invitation email: ${result.error.message}`);
  }
  
  return result;
}
```

**Fix in `app/api/invites/route.ts` POST handler** — wrap email send in try/catch and return 500 if it fails (but only AFTER deciding whether to rollback the invitation):

```typescript
// After creating invite in DB, send email:
try {
  await sendInvitationEmail({ email: parsed.email.toLowerCase(), token });
} catch (emailError) {
  // Delete the invite we just created since user won't receive the link
  await prisma.invitation.delete({ where: { id: invite.id } });
  return NextResponse.json(
    { ok: false, error: 'Nie udało się wysłać emaila z zaproszeniem. Sprawdź konfigurację serwisu email.' },
    { status: 500 }
  );
}
```

---

## FIX 7 — Verify and fix LEGAL_COMPANY field rename

**Problem:** `lib/legal.ts` renamed `registryNote` to `registryDetails`. Any page still using `registryNote` shows `undefined`.

**Steps:**
1. Search all files: `grep -r "registryNote" app/ components/ lib/`
2. For every occurrence found, replace `.registryNote` with `.registryDetails`
3. Also check `content/legal-documents.json` for any placeholder text (search for "TODO", "PLACEHOLDER", "uzupełnij", "wpisz")

---

## FIX 8 — Add vercel.json for production deployment

**Create `vercel.json` in project root:**

```json
{
  "regions": ["fra1"],
  "crons": [
    {
      "path": "/api/cron/ksef-worker",
      "schedule": "*/5 * * * *"
    }
  ],
  "functions": {
    "app/api/ksef/jobs/process/route.ts": {
      "maxDuration": 60
    },
    "app/api/emissions/export/route.ts": {
      "maxDuration": 30
    }
  }
}
```

**Create `app/api/cron/ksef-worker/route.ts`** — a cron-friendly wrapper that calls the worker internally:

```typescript
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  // Vercel Cron authenticates with CRON_SECRET
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }
  
  const workerUrl = new URL('/api/ksef/jobs/process', process.env.NEXTAUTH_URL ?? 'http://localhost:3000');
  const response = await fetch(workerUrl.toString(), {
    method: 'POST',
    headers: {
      'x-ksef-worker-secret': process.env.KSEF_WORKER_SECRET ?? '',
      'Content-Type': 'application/json',
    },
  });
  
  const data = await response.json();
  return NextResponse.json(data);
}
```

**Add to `.env.example`:**
```
CRON_SECRET="generate-with-openssl-rand-base64-32"
```

---

## FIX 9 — Add rate limiting to export endpoint

**Problem:** `app/api/emissions/export/route.ts` has no rate limiting — can be abused to hammer DB with expensive calculations.

**Add at top of GET handler:**

```typescript
import { checkRateLimit, getClientIp } from '@/lib/security';

const ip = getClientIp(req.headers);
const orgId = (session.user as any).organizationId as string;
const rl = await checkRateLimit(`export:${orgId}:${ip}`, { maxRequests: 20, windowMs: 60 * 1000 }); // 20/min
if (!rl.ok) {
  return NextResponse.json(
    { ok: false, error: 'Too many export requests' },
    { status: 429, headers: { 'Retry-After': String(rl.retryAfterSec) } }
  );
}
```

---

## FIX 10 — Add GDPR erasure completion email

**Problem:** `app/api/gdpr/requests/[requestId]/execute/route.ts` doesn't notify the data subject after erasure (required by GDPR Art. 12).

**Add after successful erasure execution:**

```typescript
// After updating GdprRequest to COMPLETED status, send confirmation email:
import { Resend } from 'resend';

const resendKey = process.env.RESEND_API_KEY;
const fromEmail = process.env.LEADS_FROM_EMAIL;

if (resendKey && fromEmail && gdprRequest.email) {
  const resend = new Resend(resendKey);
  await resend.emails.send({
    from: fromEmail,
    to: gdprRequest.email,
    subject: 'Potwierdzenie realizacji wniosku RODO — Scopeo',
    text: gdprRequest.type === 'ERASURE'
      ? `Informujemy, że Twój wniosek o usunięcie danych osobowych (nr ${gdprRequest.id}) został zrealizowany. Twoje dane zostały zanonimizowane zgodnie z wymogami RODO.`
      : `Informujemy, że Twój wniosek o dostęp do danych osobowych (nr ${gdprRequest.id}) został zrealizowany. Skontaktuj się z nami, jeśli masz pytania.`,
  });
}
```

---

## FIX 11 — Add basic pagination to invoice/emissions list endpoints

**Problem:** Endpoints returning lists of invoices and emission calculations have no pagination — slow at scale.

For every list endpoint that uses `prisma.X.findMany` without `take`/`skip`, add pagination support:

```typescript
// Pattern to apply to: GET /api/invoices, GET /api/emissions, GET /api/ksef/jobs
const url = new URL(req.url);
const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1'));
const pageSize = Math.min(100, Math.max(1, parseInt(url.searchParams.get('pageSize') ?? '50')));

const [items, total] = await prisma.$transaction([
  prisma.invoice.findMany({
    where: { organizationId },
    orderBy: { issueDate: 'desc' },
    skip: (page - 1) * pageSize,
    take: pageSize,
  }),
  prisma.invoice.count({ where: { organizationId } }),
]);

return NextResponse.json({
  ok: true,
  items,
  pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
});
```

---

## FIX 12 — Cookie consent banner component

**Create `components/CookieConsent.tsx`:**

```tsx
'use client';

import { useState, useEffect } from 'react';

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
    // Disable Sentry if consent rejected
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.close();
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg p-4">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="text-sm text-gray-700">
          <p className="font-semibold mb-1">Używamy plików cookie</p>
          <p>
            Stosujemy niezbędne pliki cookie do działania aplikacji oraz opcjonalne do monitorowania błędów (Sentry).
            Szczegóły w{' '}
            <a href="/polityka-prywatnosci" className="underline text-blue-600">polityce prywatności</a>.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={reject}
            className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Tylko niezbędne
          </button>
          <button
            onClick={accept}
            className="px-4 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Akceptuję wszystkie
          </button>
        </div>
      </div>
    </div>
  );
}
```

**Add to root layout** (`app/layout.tsx`):
```tsx
import { CookieConsent } from '@/components/CookieConsent';
// In <body>:
<CookieConsent />
```

---

## FIX 13 — Invitation management UI page

**Create `app/(app)/settings/invitations/page.tsx`** — admin page for managing invitations:

```tsx
'use client';

import { useState, useEffect } from 'react';

type Invite = {
  id: string;
  email: string;
  role: string;
  status: string;
  expiresAt: string;
  createdAt: string;
};

const ROLES = ['ADMIN', 'ANALYST', 'REVIEWER', 'APPROVER', 'VIEWER'] as const;

export default function InvitationsPage() {
  const [invites, setInvites] = useState<Invite[]>([]);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<typeof ROLES[number]>('ANALYST');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => { fetchInvites(); }, []);

  async function fetchInvites() {
    const res = await fetch('/api/invites');
    if (res.ok) {
      const data = await res.json();
      setInvites(data.invites ?? []);
    }
  }

  async function sendInvite(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null); setSuccess(null);
    const res = await fetch('/api/invites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, role }),
    });
    const data = await res.json();
    if (data.ok) {
      setSuccess(`Zaproszenie wysłane na ${email}`);
      setEmail('');
      fetchInvites();
    } else {
      setError(data.error ?? 'Błąd wysyłki zaproszenia');
    }
    setLoading(false);
  }

  async function handleAction(inviteId: string, action: 'cancel' | 'resend') {
    const res = await fetch('/api/invites', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inviteId, action }),
    });
    if (res.ok) fetchInvites();
  }

  const statusColor: Record<string, string> = {
    PENDING: 'text-yellow-600',
    ACCEPTED: 'text-green-600',
    EXPIRED: 'text-gray-500',
    CANCELLED: 'text-red-500',
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Zaproszenia</h1>

      {/* Send invite form */}
      <form onSubmit={sendInvite} className="bg-white border rounded-lg p-5 mb-8 space-y-4">
        <h2 className="font-semibold text-lg">Zaproś użytkownika</h2>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        {success && <p className="text-green-600 text-sm">{success}</p>}
        <div className="flex gap-3">
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="adres@email.com"
            required
            className="flex-1 border rounded-md px-3 py-2 text-sm"
          />
          <select
            value={role}
            onChange={e => setRole(e.target.value as any)}
            className="border rounded-md px-3 py-2 text-sm"
          >
            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Wysyłam...' : 'Wyślij zaproszenie'}
          </button>
        </div>
      </form>

      {/* Invitations list */}
      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Rola</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Wygasa</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {invites.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-400">Brak zaproszeń</td></tr>
            )}
            {invites.map(inv => (
              <tr key={inv.id}>
                <td className="px-4 py-3">{inv.email}</td>
                <td className="px-4 py-3">{inv.role}</td>
                <td className={`px-4 py-3 font-medium ${statusColor[inv.status] ?? ''}`}>{inv.status}</td>
                <td className="px-4 py-3 text-gray-500">{new Date(inv.expiresAt).toLocaleDateString('pl-PL')}</td>
                <td className="px-4 py-3 flex gap-2 justify-end">
                  {inv.status === 'PENDING' && (
                    <>
                      <button onClick={() => handleAction(inv.id, 'resend')} className="text-blue-600 hover:underline text-xs">Wyślij ponownie</button>
                      <button onClick={() => handleAction(inv.id, 'cancel')} className="text-red-500 hover:underline text-xs">Anuluj</button>
                    </>
                  )}
                  {inv.status === 'EXPIRED' && (
                    <button onClick={() => handleAction(inv.id, 'resend')} className="text-blue-600 hover:underline text-xs">Odnów</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

---

## FIX 14 — GDPR requests UI page

**Create `app/(app)/settings/gdpr/page.tsx`** — for users to submit GDPR requests:

```tsx
'use client';

import { useState } from 'react';

export default function GdprPage() {
  const [type, setType] = useState<'ACCESS' | 'ERASURE'>('ACCESS');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setResult(null); setError(null);

    if (type === 'ERASURE') {
      const confirmed = window.confirm(
        'UWAGA: Usunięcie danych jest nieodwracalne. Twoje konto zostanie zanonimizowane i utracisz dostęp do aplikacji. Czy na pewno chcesz kontynuować?'
      );
      if (!confirmed) { setLoading(false); return; }
    }

    const res = await fetch('/api/gdpr/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type }),
    });
    const data = await res.json();

    if (data.ok) {
      setResult(
        type === 'ACCESS'
          ? 'Wniosek o dostęp do danych został złożony. Odpowiemy w ciągu 30 dni.'
          : 'Wniosek o usunięcie danych został złożony. Dane zostaną zanonimizowane. Potwierdzenie otrzymasz emailem.'
      );
    } else {
      setError(data.error ?? 'Błąd składania wniosku');
    }
    setLoading(false);
  }

  return (
    <div className="max-w-xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-2">Prawa RODO</h1>
      <p className="text-gray-600 mb-8 text-sm">
        Zgodnie z RODO przysługuje Ci prawo dostępu do danych oraz prawo do ich usunięcia.
        Wnioski są rozpatrywane w ciągu 30 dni.
      </p>

      <form onSubmit={submit} className="bg-white border rounded-lg p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium mb-2">Rodzaj wniosku</label>
          <div className="space-y-2">
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="radio" name="type" value="ACCESS" checked={type === 'ACCESS'} onChange={() => setType('ACCESS')} className="mt-0.5" />
              <div>
                <div className="font-medium text-sm">Dostęp do danych (art. 15 RODO)</div>
                <div className="text-xs text-gray-500">Otrzymasz kopię swoich danych osobowych przetwarzanych w Scopeo.</div>
              </div>
            </label>
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="radio" name="type" value="ERASURE" checked={type === 'ERASURE'} onChange={() => setType('ERASURE')} className="mt-0.5" />
              <div>
                <div className="font-medium text-sm text-red-700">Usunięcie danych (art. 17 RODO)</div>
                <div className="text-xs text-gray-500">Twoje konto zostanie zanonimizowane. Operacja jest nieodwracalna.</div>
              </div>
            </label>
          </div>
        </div>

        {result && <div className="bg-green-50 border border-green-200 rounded p-3 text-sm text-green-800">{result}</div>}
        {error && <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-800">{error}</div>}

        <button
          type="submit"
          disabled={loading || !!result}
          className={`w-full py-2 px-4 rounded-md text-sm font-medium disabled:opacity-50 ${
            type === 'ERASURE' ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {loading ? 'Wysyłam...' : 'Złóż wniosek'}
        </button>
      </form>
    </div>
  );
}
```

---

## FIX 15 — Basic emissions charts

**Install:** `npm install recharts`

**Create `components/EmissionsCharts.tsx`:**

```tsx
'use client';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';

type EmissionRow = {
  categoryCode: string;
  scope: string;
  totalCo2eKg: number;
};

const SCOPE_COLORS: Record<string, string> = {
  'Scope 1': '#16a34a',
  'Scope 2': '#2563eb',
  'Scope 3': '#9333ea',
};

export function EmissionsCharts({ data }: { data: EmissionRow[] }) {
  // Aggregate by scope
  const byScope = Object.entries(
    data.reduce<Record<string, number>>((acc, row) => {
      acc[row.scope] = (acc[row.scope] ?? 0) + row.totalCo2eKg;
      return acc;
    }, {})
  ).map(([scope, value]) => ({ scope, value: Math.round(value) }));

  // Top 10 categories
  const top10 = [...data]
    .sort((a, b) => b.totalCo2eKg - a.totalCo2eKg)
    .slice(0, 10)
    .map(r => ({
      name: r.categoryCode.replace('scope3_cat', 'S3-').replace('scope', 'S').slice(0, 20),
      value: Math.round(r.totalCo2eKg),
    }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
      {/* Scope breakdown pie */}
      <div className="bg-white border rounded-lg p-5">
        <h3 className="font-semibold text-sm text-gray-700 mb-4">Podział Scope 1/2/3 (kg CO₂e)</h3>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie data={byScope} dataKey="value" nameKey="scope" cx="50%" cy="50%" outerRadius={80} label>
              {byScope.map((entry) => (
                <Cell key={entry.scope} fill={SCOPE_COLORS[entry.scope] ?? '#94a3b8'} />
              ))}
            </Pie>
            <Tooltip formatter={(v: number) => [`${v} kg CO₂e`]} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Top 10 categories bar */}
      <div className="bg-white border rounded-lg p-5">
        <h3 className="font-semibold text-sm text-gray-700 mb-4">Top 10 kategorii emisji (kg CO₂e)</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={top10} layout="vertical" margin={{ left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 10 }} />
            <Tooltip formatter={(v: number) => [`${v} kg CO₂e`]} />
            <Bar dataKey="value" fill="#16a34a" radius={[0, 3, 3, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
```

**Add `<EmissionsCharts data={emissions} />` to the emissions dashboard page.**

---

## FINAL CHECKLIST

After implementing all fixes, verify:

- [ ] `tsc --noEmit` passes with no errors
- [ ] `next build` completes successfully  
- [ ] `.env.example` has all new variables: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `CRON_SECRET`
- [ ] `grep -r "registryNote" app/ components/ lib/` returns no results
- [ ] `grep -r "slice(0, 20)" app/` returns no results  
- [ ] `vercel.json` exists in project root
- [ ] `app/api/cron/ksef-worker/route.ts` exists
- [ ] Rate limiting is `async/await` in all callers
- [ ] `calculateOrganizationEmissions` accepts `options.persist` parameter
- [ ] `CookieConsent` component is included in root layout
- [ ] Invitation UI accessible at `/settings/invitations`
- [ ] GDPR UI accessible at `/settings/gdpr`
- [ ] `EmissionsCharts` component added to emissions dashboard
