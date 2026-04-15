# Cursor prompty — Faza 2: Od pilotu do produktu

> Kontekst: Next.js 15 App Router, Prisma/PostgreSQL, NextAuth v4 JWT, TypeScript strict, Resend email, Upstash Redis.  
> Te prompty budują NOWE funkcjonalności, nie naprawiają błędów.  
> Wklej każdy prompt osobno w Cursor Agent Mode z dostępem do całego projektu.

---

## PROMPT P2-1 — Dane KOBiZE PL: utwórz plik z oficjalnymi wskaźnikami

```
W projekcie Scopeo utwórz plik `data/kobize-pl-factors.json` z oficjalnymi polskimi wskaźnikami emisji z publikacji KOBiZE (Krajowy Ośrodek Bilansowania i Zarządzania Emisjami).

**Struktura pliku** musi być zgodna z typem `KobizeFactorsFile` z `lib/kobize-pl-factors.ts`:
```typescript
{ schemaVersion: 1, factors: KobizeFactorRow[] }
```

**Wypełnij plik następującymi danymi (oficjalne wartości KOBiZE 2023, źródło: publikacja "Wartości opałowe i wskaźniki emisji" + "Wskaźnik emisyjności dla energii elektrycznej w Polsce 2023"):**

```json
{
  "schemaVersion": 1,
  "factors": [
    {
      "codeSuffix": "ELEC_GRID_2023",
      "name": "Energia elektryczna z krajowej sieci elektroenergetycznej - Polska 2023",
      "scope": "SCOPE2",
      "categoryCode": "scope2_electricity",
      "factorValue": 0.7309,
      "factorUnit": "kgCO2e/kWh",
      "region": "PL",
      "regionPriority": 1,
      "activityKind": "electricity_kwh",
      "year": 2023,
      "tags": "electricity,grid,poland,kobize",
      "metadataJson": {
        "source": "KOBiZE",
        "publication": "Wskaznik emisyjnosci dla energii elektrycznej 2023",
        "unit_kgCO2_per_MWh": 730.9,
        "note": "Wskaznik emisyjnosci CO2 dla energii elektrycznej w Polsce - rynek krajowy"
      }
    },
    {
      "codeSuffix": "ELEC_GRID_2022",
      "name": "Energia elektryczna z krajowej sieci elektroenergetycznej - Polska 2022",
      "scope": "SCOPE2",
      "categoryCode": "scope2_electricity",
      "factorValue": 0.7685,
      "factorUnit": "kgCO2e/kWh",
      "region": "PL",
      "regionPriority": 1,
      "activityKind": "electricity_kwh",
      "year": 2022,
      "tags": "electricity,grid,poland,kobize",
      "metadataJson": { "source": "KOBiZE", "unit_kgCO2_per_MWh": 768.5 }
    },
    {
      "codeSuffix": "HEAT_DISTRICT_2023",
      "name": "Cieplo sieciowe (srednia krajowa) - Polska 2023",
      "scope": "SCOPE2",
      "categoryCode": "scope2_district_heat",
      "factorValue": 0.3248,
      "factorUnit": "kgCO2e/kWh",
      "region": "PL",
      "regionPriority": 1,
      "activityKind": "heat_kwh",
      "year": 2023,
      "tags": "heat,district_heating,poland,kobize",
      "metadataJson": { "source": "KOBiZE", "note": "Sredni wskaznik emisji ciepla sieciowego dla Polski" }
    },
    {
      "codeSuffix": "NATGAS_2023",
      "name": "Gaz ziemny wysokometanowy (E) - Polska 2023",
      "scope": "SCOPE1",
      "categoryCode": "scope1_fuel_gas",
      "factorValue": 2.0416,
      "factorUnit": "kgCO2e/m3",
      "region": "PL",
      "regionPriority": 1,
      "activityKind": "natural_gas_m3",
      "year": 2023,
      "tags": "gas,natural_gas,poland,kobize,scope1",
      "metadataJson": { "source": "KOBiZE", "calorific_value_MJ_per_m3": 34.0 }
    },
    {
      "codeSuffix": "DIESEL_2023",
      "name": "Olej napedowy (diesel, ON) - Polska 2023",
      "scope": "SCOPE1",
      "categoryCode": "scope1_fuel",
      "factorValue": 2.6536,
      "factorUnit": "kgCO2e/l",
      "region": "PL",
      "regionPriority": 1,
      "activityKind": "diesel_litre",
      "year": 2023,
      "tags": "fuel,diesel,poland,kobize,scope1",
      "metadataJson": { "source": "KOBiZE", "calorific_value_MJ_per_l": 35.86 }
    },
    {
      "codeSuffix": "PETROL_PB95_2023",
      "name": "Benzyna silnikowa PB95 - Polska 2023",
      "scope": "SCOPE1",
      "categoryCode": "scope1_fuel",
      "factorValue": 2.3159,
      "factorUnit": "kgCO2e/l",
      "region": "PL",
      "regionPriority": 2,
      "activityKind": "petrol_litre",
      "year": 2023,
      "tags": "fuel,petrol,pb95,poland,kobize,scope1",
      "metadataJson": { "source": "KOBiZE" }
    },
    {
      "codeSuffix": "LPG_2023",
      "name": "Gaz plynny LPG - Polska 2023",
      "scope": "SCOPE1",
      "categoryCode": "scope1_fuel",
      "factorValue": 1.6311,
      "factorUnit": "kgCO2e/l",
      "region": "PL",
      "regionPriority": 2,
      "activityKind": "lpg_litre",
      "year": 2023,
      "tags": "fuel,lpg,poland,kobize,scope1",
      "metadataJson": { "source": "KOBiZE" }
    },
    {
      "codeSuffix": "COAL_HARD_2023",
      "name": "Wegiel kamienny (energetyczny) - Polska 2023",
      "scope": "SCOPE1",
      "categoryCode": "scope1_fuel",
      "factorValue": 2.2684,
      "factorUnit": "kgCO2e/kg",
      "region": "PL",
      "regionPriority": 1,
      "activityKind": "coal_kg",
      "year": 2023,
      "tags": "fuel,coal,poland,kobize,scope1",
      "metadataJson": { "source": "KOBiZE" }
    }
  ]
}
```

Po utworzeniu pliku uruchom `npx ts-node -e "const {loadKobizeFactorsFile} = require('./lib/kobize-pl-factors'); console.log(loadKobizeFactorsFile().factors.length, 'factors loaded')"` aby zweryfikować poprawność parsowania JSON.

Dodaj też `data/kobize-pl-factors.json` do `.gitignore` **NIE** — ten plik powinien być w repozytorium (dane publiczne, nie wrażliwe).

Zaktualizuj `data/README.md` (utwórz jeśli nie istnieje):
```
# data/

## kobize-pl-factors.json

Polskie wskazniki emisji z publikacji KOBiZE (Krajowy Osrodek Bilansowania i Zarzadzania Emisjami).
Aktualizacja co roku po opublikowaniu nowych wartosci (zwykle marzec-kwiecien).

Zrodla:
- https://www.kobize.pl/pl/fileCategory/id/28/wskazniki-emisyjnosci (wskaznik dla energii elektrycznej)
- "Wartosci opalowe i wskazniki emisji" - publikacja roczna KOBiZE

Aby dodac nowy rok: skopiuj istniejacy rekord, zmien `year` i `factorValue`, zaktualizuj `codeSuffix`.
```
```

---

## PROMPT P2-2 — Testy automatyczne: unit testy dla core logic

```
Dodaj testy jednostkowe dla kluczowych funkcji w projekcie Scopeo (Next.js/TypeScript).

**Zainstaluj zależności testowe:**
```bash
npm install --save-dev vitest @vitest/coverage-v8 @testing-library/react @testing-library/jest-dom
```

**Utwórz `vitest.config.ts` w root projektu:**
```typescript
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['lib/**/*.ts'],
      exclude: ['lib/prisma.ts', 'lib/logger.ts'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
```

**Dodaj do `package.json`:**
```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage"
  }
}
```

**Utwórz `__tests__/emissions.test.ts`:**
```typescript
import { describe, it, expect } from 'vitest';
import { computeInvoiceLineCo2eKg } from '@/lib/emissions';

describe('computeInvoiceLineCo2eKg', () => {
  it('ACTIVITY method: activityValue * factorValue', () => {
    expect(computeInvoiceLineCo2eKg({
      calculationMethod: 'ACTIVITY',
      activityValue: 100,
      netValue: 500,
      factorValue: 0.7309,
    })).toBeCloseTo(73.09, 4);
  });

  it('SPEND method: netValue * factorValue', () => {
    expect(computeInvoiceLineCo2eKg({
      calculationMethod: 'SPEND',
      activityValue: null,
      netValue: 1000,
      factorValue: 0.001,
    })).toBeCloseTo(1.0, 4);
  });

  it('ACTIVITY method with null activityValue returns 0', () => {
    expect(computeInvoiceLineCo2eKg({
      calculationMethod: 'ACTIVITY',
      activityValue: null,
      netValue: 500,
      factorValue: 0.7309,
    })).toBe(0);
  });

  it('zero factorValue returns 0', () => {
    expect(computeInvoiceLineCo2eKg({
      calculationMethod: 'SPEND',
      activityValue: null,
      netValue: 1000,
      factorValue: 0,
    })).toBe(0);
  });
});
```

**Utwórz `__tests__/nlp-mapping.test.ts`:**
```typescript
import { describe, it, expect } from 'vitest';
import { classifyInvoiceLine } from '@/lib/nlp-mapping';

describe('classifyInvoiceLine', () => {
  it('klasyfikuje energię elektryczną po jednostce kWh', () => {
    const result = classifyInvoiceLine({ description: 'Sprzedaz energii', quantity: 500, unit: 'kWh', netValue: 300 });
    expect(result.scope).toBe('SCOPE2');
    expect(result.categoryCode).toBe('scope2_electricity');
    expect(result.confidence).toBeGreaterThan(0.95);
    expect(result.activityValue).toBe(500);
  });

  it('klasyfikuje diesel po jednostce l', () => {
    const result = classifyInvoiceLine({ description: 'Tankowanie pojazdu', quantity: 50, unit: 'l', netValue: 350 });
    expect(result.scope).toBe('SCOPE1');
    expect(result.categoryCode).toBe('scope1_fuel');
    expect(result.confidence).toBeGreaterThan(0.9);
  });

  it('klasyfikuje gaz po jednostce m3', () => {
    const result = classifyInvoiceLine({ description: 'Dostawa gazu ziemnego', quantity: 200, unit: 'm3', netValue: 800 });
    expect(result.scope).toBe('SCOPE1');
    expect(result.categoryCode).toBe('scope1_fuel_gas');
  });

  it('klasyfikuje transport/kurier jako Scope 3 Cat 4', () => {
    const result = classifyInvoiceLine({ description: 'Usluga kurierska DHL', quantity: null, unit: null, netValue: 50 });
    expect(result.scope).toBe('SCOPE3');
    expect(result.categoryCode).toBe('scope3_cat4_transport');
  });

  it('klasyfikuje hotel/delegacja jako Scope 3 Cat 6', () => {
    const result = classifyInvoiceLine({ description: 'Hotel Delegacja Warszawa', quantity: 2, unit: null, netValue: 400 });
    expect(result.scope).toBe('SCOPE3');
    expect(result.categoryCode).toBe('scope3_cat6_business_travel');
  });

  it('klasyfikuje leasing jako Scope 3 Cat 1', () => {
    const result = classifyInvoiceLine({ description: 'Leasing samochodu osobowego', quantity: null, unit: null, netValue: 1200 });
    expect(result.scope).toBe('SCOPE3');
    expect(result.ruleMatched).toBe('lease_rule');
  });

  it('fallback dla nieznanej kategorii ma niski confidence', () => {
    const result = classifyInvoiceLine({ description: 'Usługa XYZ-123 ABC', quantity: null, unit: null, netValue: 100 });
    expect(result.confidence).toBeLessThan(0.5);
    expect(result.ruleMatched).toBe('fallback_services_rule');
  });

  it('normalizuje polskie znaki prawidłowo', () => {
    const result = classifyInvoiceLine({ description: 'Zakup paliwa napędowego', quantity: 100, unit: 'l', netValue: 700 });
    expect(result.scope).toBe('SCOPE1');
    expect(result.categoryCode).toBe('scope1_fuel');
  });
});
```

**Utwórz `__tests__/ksef-xml.test.ts`:**
```typescript
import { describe, it, expect } from 'vitest';
import { parseKsefFa3Xml, taxIdSegmentForExternalId } from '@/lib/ksef-xml';

const SAMPLE_XML = `<?xml version="1.0" encoding="UTF-8"?>
<Faktura>
  <Fa>
    <P_1>2024-03-15</P_1>
    <P_2>FV/2024/001</P_2>
    <KodWaluty>PLN</KodWaluty>
    <P_13_1>1000.00</P_13_1>
    <P_15>1230.00</P_15>
  </Fa>
  <Podmiot1>
    <NIP>1234567890</NIP>
    <Nazwa>Test Supplier Sp. z o.o.</Nazwa>
  </Podmiot1>
  <FaWiersze>
    <FaWiersz>
      <P_7>Energia elektryczna</P_7>
      <P_8A>500</P_8A>
      <P_8B>kWh</P_8B>
      <P_11>1000.00</P_11>
    </FaWiersz>
  </FaWiersze>
</Faktura>`;

describe('parseKsefFa3Xml', () => {
  it('parsuje podstawową fakturę FA(3)', async () => {
    const result = await parseKsefFa3Xml(SAMPLE_XML);
    expect(result.number).toBe('FV/2024/001');
    expect(result.issueDate).toBe('2024-03-15');
    expect(result.currency).toBe('PLN');
    expect(result.sellerName).toBe('Test Supplier Sp. z o.o.');
    expect(result.sellerTaxId).toBe('1234567890');
    expect(result.netValue).toBe(1000);
    expect(result.grossValue).toBe(1230);
    expect(result.lines).toHaveLength(1);
    expect(result.lines[0].description).toBe('Energia elektryczna');
    expect(result.lines[0].quantity).toBe(500);
    expect(result.lines[0].unit).toBe('kWh');
  });

  it('generuje stabilny externalId', async () => {
    const result = await parseKsefFa3Xml(SAMPLE_XML);
    expect(result.externalId).toBe('1234567890-FV/2024/001-2024-03-15');
  });

  it('odrzuca XML z DTD injection', async () => {
    const malicious = `<!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///etc/passwd">]><root>&xxe;</root>`;
    await expect(parseKsefFa3Xml(malicious)).rejects.toThrow(/forbidden/i);
  });
});

describe('taxIdSegmentForExternalId', () => {
  it('zwraca NIP bez spacji', () => {
    expect(taxIdSegmentForExternalId('123 456 78 90')).toBe('1234567890');
  });
  it('zwraca NO_TAX_ID dla null', () => {
    expect(taxIdSegmentForExternalId(null)).toBe('NO_TAX_ID');
  });
});
```

**Utwórz `__tests__/review-workflow.test.ts`:**
```typescript
import { describe, it, expect } from 'vitest';
import { ensureAllowedTransition } from '@/lib/review-workflow';

describe('ensureAllowedTransition', () => {
  it('ANALYST może otworzyć review z PENDING', () => {
    expect(() => ensureAllowedTransition({ currentStatus: 'PENDING', nextStatus: 'IN_REVIEW', actorRole: 'ANALYST' })).not.toThrow();
  });

  it('VIEWER nie może zmieniać statusu', () => {
    expect(() => ensureAllowedTransition({ currentStatus: 'PENDING', nextStatus: 'IN_REVIEW', actorRole: 'VIEWER' })).toThrow();
  });

  it('REVIEWER może APPROVE z IN_REVIEW', () => {
    expect(() => ensureAllowedTransition({ currentStatus: 'IN_REVIEW', nextStatus: 'APPROVED', actorRole: 'REVIEWER' })).not.toThrow();
  });

  it('OVERRIDDEN wymaga zmiany faktora lub kategorii', () => {
    expect(() => ensureAllowedTransition({ currentStatus: 'IN_REVIEW', nextStatus: 'OVERRIDDEN', actorRole: 'REVIEWER', hasOverride: false })).toThrow(/override/i);
    expect(() => ensureAllowedTransition({ currentStatus: 'IN_REVIEW', nextStatus: 'OVERRIDDEN', actorRole: 'REVIEWER', hasOverride: true })).not.toThrow();
  });
});
```

Uruchom: `npm test` — powinno przejść 15+ testów bez błędów.
```

---

## PROMPT P2-3 — Password reset: pełny flow email → token → nowe hasło

```
Zaimplementuj kompletny flow resetowania hasła w projekcie Scopeo.

**Schemat Prisma — dodaj model `PasswordResetToken` do `prisma/schema.prisma`:**
```prisma
model PasswordResetToken {
  id        String   @id @default(cuid())
  tokenHash String   @unique
  email     String
  expiresAt DateTime
  usedAt    DateTime?
  createdAt DateTime @default(now())

  @@index([email, createdAt])
}
```

Uruchom `npx prisma migrate dev --name add_password_reset_token`.

**Utwórz `app/api/auth/password-reset/request/route.ts`:**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkRateLimit, getClientIp } from '@/lib/security';
import { Resend } from 'resend';
import crypto from 'crypto';
import { z } from 'zod';

const schema = z.object({ email: z.string().email() });

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);
  const rl = await checkRateLimit(`pwd-reset-req:${ip}`, { windowMs: 15 * 60_000, maxRequests: 5 });
  if (!rl.ok) return NextResponse.json({ ok: false, error: 'Too many requests' }, { status: 429 });

  const body = await req.json();
  const { email } = schema.parse(body);

  // Zawsze odpowiadaj OK — nie ujawniaj czy email istnieje
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user || !user.passwordHash) {
    return NextResponse.json({ ok: true }); // Nie ujawniaj braku konta
  }

  // Unieważnij stare tokeny tego emaila
  await prisma.passwordResetToken.deleteMany({
    where: { email: email.toLowerCase(), usedAt: null },
  });

  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 godzina

  await prisma.passwordResetToken.create({
    data: { tokenHash, email: email.toLowerCase(), expiresAt },
  });

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL ?? '').replace(/\/$/, '');
  const resetUrl = `${appUrl}/reset-password?token=${encodeURIComponent(rawToken)}`;

  const resend = new Resend(process.env.RESEND_API_KEY);
  resend.emails.send({
    from: process.env.LEADS_FROM_EMAIL ?? 'noreply@scopeo.com',
    to: email.toLowerCase(),
    subject: 'Reset hasła — Scopeo',
    text: `Otrzymaliśmy prośbę o reset hasła dla konta ${email}.\n\nKliknij link, aby ustawić nowe hasło:\n${resetUrl}\n\nLink ważny przez 1 godzinę. Jeśli nie prosiłeś o reset, zignoruj tę wiadomość.`,
  }).catch(console.error); // fire-and-forget

  return NextResponse.json({ ok: true });
}
```

**Utwórz `app/api/auth/password-reset/confirm/route.ts`:**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkRateLimit, getClientIp } from '@/lib/security';
import { BCRYPT_SALT_ROUNDS } from '@/lib/password-hash';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { z } from 'zod';

const schema = z.object({
  token: z.string().min(32),
  password: z.string().min(12, 'Hasło musi mieć co najmniej 12 znaków').max(128),
});

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);
  const rl = await checkRateLimit(`pwd-reset-confirm:${ip}`, { windowMs: 15 * 60_000, maxRequests: 10 });
  if (!rl.ok) return NextResponse.json({ ok: false, error: 'Too many requests' }, { status: 429 });

  const body = await req.json();
  const { token, password } = schema.parse(body);
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  const record = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });

  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return NextResponse.json({ ok: false, error: 'Token nieprawidłowy lub wygasł.' }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

  await prisma.$transaction([
    prisma.user.update({
      where: { email: record.email },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.update({
      where: { tokenHash },
      data: { usedAt: new Date() },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
```

**Utwórz `app/reset-password/page.tsx`** — formularz (2 kroki: podaj email → podaj nowe hasło):

```typescript
'use client';
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'done' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  if (!token) {
    // Krok 1: Poproś o email
    return (
      <main style={{ maxWidth: 400, margin: '80px auto', padding: 24 }}>
        <h1 style={{ fontSize: 24, marginBottom: 16 }}>Reset hasła</h1>
        {status === 'sent' ? (
          <p style={{ color: '#16a34a' }}>Jeśli konto istnieje, wysłaliśmy link resetujący na podany adres email.</p>
        ) : (
          <form onSubmit={async (e) => {
            e.preventDefault();
            setStatus('loading');
            const res = await fetch('/api/auth/password-reset/request', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email }),
            });
            setStatus(res.ok ? 'sent' : 'error');
          }}>
            <label style={{ display: 'block', marginBottom: 8 }}>
              Adres email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ display: 'block', width: '100%', padding: '8px 12px', marginTop: 4, border: '1px solid #cbd5e1', borderRadius: 6 }}
              />
            </label>
            <button type="submit" disabled={status === 'loading'}
              style={{ marginTop: 16, padding: '10px 20px', background: '#2563eb', color: '#fff', border: 0, borderRadius: 6, cursor: 'pointer', width: '100%' }}>
              {status === 'loading' ? 'Wysyłanie...' : 'Wyślij link resetujący'}
            </button>
          </form>
        )}
        <p style={{ marginTop: 16, fontSize: 13 }}><a href="/login">Wróć do logowania</a></p>
      </main>
    );
  }

  // Krok 2: Ustaw nowe hasło (token z URL)
  return (
    <main style={{ maxWidth: 400, margin: '80px auto', padding: 24 }}>
      <h1 style={{ fontSize: 24, marginBottom: 16 }}>Ustaw nowe hasło</h1>
      {status === 'done' ? (
        <p style={{ color: '#16a34a' }}>Hasło zostało zmienione. <a href="/login">Zaloguj się</a></p>
      ) : (
        <form onSubmit={async (e) => {
          e.preventDefault();
          if (password !== confirm) { setErrorMsg('Hasła nie są zgodne.'); return; }
          if (password.length < 12) { setErrorMsg('Hasło musi mieć co najmniej 12 znaków.'); return; }
          setStatus('loading'); setErrorMsg('');
          const res = await fetch('/api/auth/password-reset/confirm', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, password }),
          });
          const data = await res.json();
          if (res.ok) setStatus('done');
          else { setStatus('error'); setErrorMsg(data.error ?? 'Błąd — spróbuj ponownie.'); }
        }}>
          {errorMsg && <p style={{ color: '#dc2626', marginBottom: 12 }}>{errorMsg}</p>}
          <label style={{ display: 'block', marginBottom: 8 }}>
            Nowe hasło (min. 12 znaków)
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={12}
              style={{ display: 'block', width: '100%', padding: '8px 12px', marginTop: 4, border: '1px solid #cbd5e1', borderRadius: 6 }} />
          </label>
          <label style={{ display: 'block', marginBottom: 8 }}>
            Powtórz hasło
            <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required
              style={{ display: 'block', width: '100%', padding: '8px 12px', marginTop: 4, border: '1px solid #cbd5e1', borderRadius: 6 }} />
          </label>
          <button type="submit" disabled={status === 'loading'}
            style={{ marginTop: 16, padding: '10px 20px', background: '#2563eb', color: '#fff', border: 0, borderRadius: 6, cursor: 'pointer', width: '100%' }}>
            {status === 'loading' ? 'Zapisywanie...' : 'Zmień hasło'}
          </button>
        </form>
      )}
    </main>
  );
}
```

Dodaj link do resetu na stronie logowania: `<a href="/reset-password">Zapomniałeś hasła?</a>`
```

---

## PROMPT P2-4 — Weryfikacja emaila przy rejestracji

```
Dodaj weryfikację adresu email przy rejestracji użytkownika w projekcie Scopeo.

**Dodaj model do `prisma/schema.prisma`:**
```prisma
model EmailVerificationToken {
  id        String   @id @default(cuid())
  tokenHash String   @unique
  email     String
  expiresAt DateTime
  verifiedAt DateTime?
  createdAt DateTime @default(now())
  @@index([email])
}
```

**Dodaj pole do `User`:**
```prisma
model User {
  // ... istniejące pola ...
  emailVerified DateTime?  // już istnieje — upewnij się
}
```

Uruchom `npx prisma migrate dev --name add_email_verification`.

**Zaktualizuj `app/api/auth/register/route.ts` — wyślij email weryfikacyjny po rejestracji:**

Po `prisma.user.create(...)` dodaj:
```typescript
// Wyślij email weryfikacyjny (fire-and-forget)
const rawToken = crypto.randomBytes(32).toString('hex');
const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
await prisma.emailVerificationToken.create({
  data: {
    tokenHash,
    email: parsed.email.toLowerCase(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
  },
});
const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL ?? '').replace(/\/$/, '');
const verifyUrl = `${appUrl}/verify-email?token=${encodeURIComponent(rawToken)}`;
const resend = new Resend(process.env.RESEND_API_KEY);
resend.emails.send({
  from: process.env.LEADS_FROM_EMAIL ?? 'noreply@scopeo.com',
  to: parsed.email.toLowerCase(),
  subject: 'Potwierdź adres email — Scopeo',
  text: `Witaj ${parsed.name},\n\nAby dokończyć rejestrację, potwierdź swój adres email:\n\n${verifyUrl}\n\nLink ważny przez 24 godziny.`,
}).catch(console.error);
```

**Utwórz `app/api/auth/verify-email/route.ts`:**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token') ?? '';
  if (!token || token.length < 32) {
    return NextResponse.redirect(new URL('/login?error=invalid_token', req.url));
  }
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const record = await prisma.emailVerificationToken.findUnique({ where: { tokenHash } });

  if (!record || record.verifiedAt || record.expiresAt < new Date()) {
    return NextResponse.redirect(new URL('/login?error=token_expired', req.url));
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { email: record.email },
      data: { emailVerified: new Date() },
    }),
    prisma.emailVerificationToken.update({
      where: { tokenHash },
      data: { verifiedAt: new Date() },
    }),
  ]);

  return NextResponse.redirect(new URL('/login?verified=1', req.url));
}
```

**Dodaj ostrzeżenie w `app/dashboard/page.tsx`** gdy `session.user.emailVerified` jest null:
```typescript
// Na początku JSX, po nawigacji:
{!(session.user as any).emailVerified && (
  <div style={{ background: '#fef9c3', border: '1px solid #fde68a', borderRadius: 8, padding: '12px 16px', marginBottom: 16 }}>
    ⚠️ Adres email nie jest potwierdzony.{' '}
    <a href="/api/auth/resend-verification" style={{ color: '#92400e', fontWeight: 600 }}>Wyślij ponownie</a>
  </div>
)}
```

**Dodaj `emailVerified` do JWT session** — w `lib/auth.ts` w callbacks:
```typescript
async session({ session, token }) {
  if (session.user) {
    (session.user as any).id = token.sub;
    (session.user as any).organizationId = token.organizationId;
    (session.user as any).organizationSlug = token.organizationSlug;
    (session.user as any).role = token.role;
    (session.user as any).emailVerified = token.emailVerified; // NOWE
  }
  return session;
},
async jwt({ token, user }) {
  if (user) {
    token.organizationId = (user as any).organizationId;
    token.organizationSlug = (user as any).organizationSlug;
    token.role = (user as any).role;
    // NOWE: emailVerified z bazy przy logowaniu
    const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { emailVerified: true } });
    token.emailVerified = dbUser?.emailVerified ?? null;
  }
  return token;
},
```
```

---

## PROMPT P2-5 — CI/CD: GitHub Actions pipeline

```
Utwórz plik `.github/workflows/ci.yml` — pipeline CI/CD dla projektu Scopeo (Next.js, Prisma, TypeScript, Vitest).

**Utwórz `.github/workflows/ci.yml`:**

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: '20'

jobs:
  lint-and-typecheck:
    name: Lint & TypeCheck
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      - run: npm ci
      - name: TypeScript typecheck
        run: npx tsc --noEmit
      - name: ESLint
        run: npx next lint --max-warnings 0

  test:
    name: Unit Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      - run: npm ci
      - name: Generate Prisma client (mock schema)
        run: npx prisma generate
        env:
          DATABASE_URL: "postgresql://fake:fake@localhost:5432/fake"
      - name: Run tests
        run: npm test
      - name: Upload coverage
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: coverage
          path: coverage/

  build:
    name: Build
    runs-on: ubuntu-latest
    needs: [lint-and-typecheck, test]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      - run: npm ci
      - name: Build Next.js
        run: npm run build
        env:
          DATABASE_URL: "postgresql://fake:fake@localhost:5432/fake"
          NEXTAUTH_SECRET: "ci-test-secret-minimum-32-characters-long"
          NEXTAUTH_URL: "http://localhost:3000"
          DATA_ENCRYPTION_KEY: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA="
          KSEF_TOKEN_ENCRYPTION_KEY: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA="

  migration-check:
    name: Prisma Migration Check
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_USER: scopeo
          POSTGRES_PASSWORD: scopeo
          POSTGRES_DB: scopeo_ci
        ports:
          - 5433:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      - run: npm ci
      - name: Run Prisma migrations
        run: npx prisma migrate deploy
        env:
          DATABASE_URL: "postgresql://scopeo:scopeo@localhost:5433/scopeo_ci"
      - name: Validate schema
        run: npx prisma validate
        env:
          DATABASE_URL: "postgresql://scopeo:scopeo@localhost:5433/scopeo_ci"
```

**Utwórz `.github/workflows/deploy.yml`** — auto-deploy na Vercel po merge do main:

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main]

jobs:
  deploy:
    name: Deploy Production
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

**Utwórz `.github/dependabot.yml`** — automatyczne aktualizacje zależności:

```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
      day: "monday"
    open-pull-requests-limit: 5
    ignore:
      - dependency-name: "prisma"
        update-types: ["version-update:semver-major"]
      - dependency-name: "@prisma/client"
        update-types: ["version-update:semver-major"]
```

Dodaj do `package.json` skrypt typecheck:
```json
{
  "scripts": {
    "typecheck": "tsc --noEmit"
  }
}
```

W GitHubie ustaw Secrets: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` (z dashboardu Vercel).
```

---

## PROMPT P2-6 — Raport GHG Protocol: generowanie PDF zgodnego ze standardem

```
Utwórz endpoint generowania raportu GHG Protocol w `app/api/emissions/report/route.ts`.

Raport ma być PDF zawierający: stronę tytułową, podsumowanie scope 1/2/3, tabelę kategorii z udziałem procentowym, listę metodologiczną, stopkę z podstawą prawną i datą.

**Zainstaluj zależność jeśli brakuje:**
```bash
npm install @react-pdf/renderer
```

**Utwórz `lib/ghg-report-pdf.tsx`** — komponent raportu:

```typescript
import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

Font.register({
  family: 'Noto Sans',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/notosans/v36/o-0bIpQlx3QUlC5A4PNB6Ryti20_6n1iPHjc5a7du3mhPy0.woff2', fontWeight: 'normal' },
    { src: 'https://fonts.gstatic.com/s/notosans/v36/o-0IIpQlx3QUlC5A4PNb4j5Ba_2c7fj2AI-instr-8517694.woff2', fontWeight: 'bold' },
  ],
});

const styles = StyleSheet.create({
  page: { fontFamily: 'Noto Sans', fontSize: 10, padding: 48, color: '#1e293b' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#16a34a', marginBottom: 4 },
  subtitle: { fontSize: 12, color: '#475569', marginBottom: 32 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 13, fontWeight: 'bold', borderBottomWidth: 1, borderBottomColor: '#e2e8f0', paddingBottom: 4, marginBottom: 10 },
  row: { flexDirection: 'row', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  cellLeft: { flex: 3, paddingRight: 8 },
  cellRight: { flex: 1, textAlign: 'right' },
  headerRow: { flexDirection: 'row', paddingVertical: 6, backgroundColor: '#f8fafc', marginBottom: 2 },
  kpiBox: { flex: 1, backgroundColor: '#f0fdf4', borderRadius: 4, padding: 10, marginRight: 8 },
  kpiValue: { fontSize: 18, fontWeight: 'bold', color: '#15803d' },
  kpiLabel: { fontSize: 9, color: '#4b5563', marginTop: 2 },
  footer: { position: 'absolute', bottom: 32, left: 48, right: 48, fontSize: 8, color: '#94a3b8', textAlign: 'center' },
  badge: { fontSize: 8, color: '#2563eb', backgroundColor: '#eff6ff', padding: '2 6', borderRadius: 3, marginLeft: 4 },
});

type ReportData = {
  companyName: string;
  reportingYear: number;
  baseYear: number;
  boundaryApproach: string;
  industry: string;
  scope1: number;
  scope2: number;
  scope3: number;
  totalKg: number;
  byCategory: Record<string, number>;
  linesCount: number;
  generatedAt: string;
};

function scopeLabel(s: string) {
  if (s.startsWith('scope1')) return 'Zakres 1';
  if (s.startsWith('scope2')) return 'Zakres 2';
  return 'Zakres 3';
}

function categoryLabel(code: string): string {
  const map: Record<string, string> = {
    scope1_fuel: 'Spalanie paliw (flota, kotłownia)',
    scope1_fuel_gas: 'Spalanie gazu ziemnego',
    scope2_electricity: 'Zakup energii elektrycznej',
    scope2_district_heat: 'Zakup ciepła sieciowego',
    scope3_cat1_purchased_services: 'Kat. 1: Kupione dobra i usługi',
    scope3_cat1_purchased_goods: 'Kat. 1: Kupione materiały',
    scope3_cat2_capital_goods: 'Kat. 2: Dobra kapitałowe',
    scope3_cat4_transport: 'Kat. 4: Transport i dystrybucja (upstream)',
    scope3_cat5_waste: 'Kat. 5: Odpady z działalności',
    scope3_cat6_business_travel: 'Kat. 6: Podróże służbowe',
  };
  return map[code] ?? code;
}

export function GhgReportDocument({ data }: { data: ReportData }) {
  const tCO2 = (kg: number) => (kg / 1000).toFixed(2);
  const pct = (kg: number) => data.totalKg > 0 ? ((kg / data.totalKg) * 100).toFixed(1) + '%' : '0%';

  const sortedCategories = Object.entries(data.byCategory)
    .sort(([, a], [, b]) => b - a)
    .filter(([, v]) => v > 0);

  return (
    <Document>
      {/* Strona 1: Tytuł + KPI */}
      <Page size="A4" style={styles.page}>
        <View style={styles.section}>
          <Text style={styles.title}>Raport emisji GHG</Text>
          <Text style={styles.subtitle}>{data.companyName} · Rok raportowania: {data.reportingYear}</Text>
        </View>

        <View style={[styles.section, { flexDirection: 'row', gap: 8 }]}>
          <View style={styles.kpiBox}>
            <Text style={styles.kpiValue}>{tCO2(data.totalKg)}</Text>
            <Text style={styles.kpiLabel}>tCO₂e łącznie</Text>
          </View>
          <View style={styles.kpiBox}>
            <Text style={styles.kpiValue}>{tCO2(data.scope1)}</Text>
            <Text style={styles.kpiLabel}>tCO₂e Zakres 1</Text>
          </View>
          <View style={styles.kpiBox}>
            <Text style={styles.kpiValue}>{tCO2(data.scope2)}</Text>
            <Text style={styles.kpiLabel}>tCO₂e Zakres 2</Text>
          </View>
          <View style={styles.kpiBox}>
            <Text style={styles.kpiValue}>{tCO2(data.scope3)}</Text>
            <Text style={styles.kpiLabel}>tCO₂e Zakres 3</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Emisje według kategorii</Text>
          <View style={styles.headerRow}>
            <Text style={[styles.cellLeft, { fontWeight: 'bold' }]}>Kategoria</Text>
            <Text style={[styles.cellRight, { fontWeight: 'bold' }]}>tCO₂e</Text>
            <Text style={[styles.cellRight, { fontWeight: 'bold' }]}>Udział</Text>
            <Text style={[styles.cellRight, { fontWeight: 'bold' }]}>Zakres</Text>
          </View>
          {sortedCategories.map(([code, kg]) => (
            <View key={code} style={styles.row}>
              <Text style={styles.cellLeft}>{categoryLabel(code)}</Text>
              <Text style={styles.cellRight}>{tCO2(kg)}</Text>
              <Text style={styles.cellRight}>{pct(kg)}</Text>
              <Text style={styles.cellRight}>{scopeLabel(code)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informacje o raporcie</Text>
          <View style={styles.row}><Text style={styles.cellLeft}>Firma</Text><Text style={styles.cellRight}>{data.companyName}</Text></View>
          <View style={styles.row}><Text style={styles.cellLeft}>Rok bazowy</Text><Text style={styles.cellRight}>{data.baseYear}</Text></View>
          <View style={styles.row}><Text style={styles.cellLeft}>Granica raportowania</Text><Text style={styles.cellRight}>{data.boundaryApproach}</Text></View>
          <View style={styles.row}><Text style={styles.cellLeft}>Branża</Text><Text style={styles.cellRight}>{data.industry}</Text></View>
          <View style={styles.row}><Text style={styles.cellLeft}>Liczba przeanalizowanych linii</Text><Text style={styles.cellRight}>{data.linesCount}</Text></View>
          <View style={styles.row}><Text style={styles.cellLeft}>Metodologia</Text><Text style={styles.cellRight}>GHG Protocol Corporate Standard</Text></View>
          <View style={styles.row}><Text style={styles.cellLeft}>Wskaźniki emisji</Text><Text style={styles.cellRight}>KOBiZE 2023, UK Gov 2025, EPA 2025</Text></View>
        </View>

        <Text style={styles.footer}>
          Raport wygenerowany przez Scopeo · {data.generatedAt} · Dane oparte na zaimportowanych fakturach KSeF.
          Raport ma charakter informacyjny i nie stanowi certyfikowanego raportu GHG Protocol.
        </Text>
      </Page>
    </Document>
  );
}
```

**Utwórz `app/api/emissions/report/route.ts`:**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { calculateOrganizationEmissions } from '@/lib/emissions';
import { checkRateLimit, getClientIp } from '@/lib/security';
import { renderToBuffer } from '@react-pdf/renderer';
import { GhgReportDocument } from '@/lib/ghg-report-pdf';
import React from 'react';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

  const organizationId = (session.user as any).organizationId as string;
  const ip = getClientIp(req.headers);
  const rl = await checkRateLimit(`ghg-report:${organizationId}:${ip}`, { windowMs: 5 * 60_000, maxRequests: 5 });
  if (!rl.ok) return NextResponse.json({ ok: false, error: 'Too many requests' }, { status: 429 });

  const reportYear = Number(req.nextUrl.searchParams.get('year'));
  const validYear = Number.isFinite(reportYear) && reportYear >= 2020 && reportYear <= 2100 ? reportYear : undefined;

  const [profile, result] = await Promise.all([
    prisma.carbonProfile.findUnique({ where: { organizationId } }),
    calculateOrganizationEmissions(organizationId, validYear, { persist: false }),
  ]);

  if (!profile) return NextResponse.json({ ok: false, error: 'Profil organizacji nie jest skonfigurowany.' }, { status: 400 });

  const pdfBuffer = await renderToBuffer(
    React.createElement(GhgReportDocument, {
      data: {
        companyName: profile.companyName,
        reportingYear: validYear ?? profile.reportingYear,
        baseYear: profile.baseYear,
        boundaryApproach: profile.boundaryApproach,
        industry: profile.industry,
        scope1: result.scope1,
        scope2: result.scope2,
        scope3: result.scope3,
        totalKg: result.totalKg,
        byCategory: result.byCategory,
        linesCount: result.lineCount,
        generatedAt: new Date().toLocaleDateString('pl-PL'),
      },
    })
  );

  const filename = `raport-ghg-${profile.companyName.replace(/\s+/g, '-').toLowerCase()}-${validYear ?? profile.reportingYear}.pdf`;
  return new NextResponse(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
```

Dodaj link w dashboard: `<Link className="btn btn-secondary" href="/api/emissions/report">Pobierz raport GHG (PDF)</Link>`
```

---

## PROMPT P2-7 — Dashboard: refaktor na dedykowane podstrony

```
Podziel monolityczny `app/dashboard/page.tsx` na dedykowane podstrony. Obecny dashboard ma 308 linii i obsługuje wszystko w jednym pliku — faktury, review, wykresy, GDPR, zaproszenia.

**Utwórz strukturę podstron:**

```
app/
  dashboard/
    page.tsx              ← Strona główna (KPI + akcje + nawigacja)
    invoices/
      page.tsx            ← Lista faktur z paginacją i filtrowaniem
    review/
      page.tsx            ← Panel review linii faktur
    report/
      page.tsx            ← Kalkulacja emisji + eksport + raport GHG
    settings/
      page.tsx            ← Onboarding profile, import faktorów, członkowie
    gdpr/
      page.tsx            ← Wnioski GDPR (tylko OWNER/ADMIN)
```

**Krok 1 — Utwórz `app/dashboard/layout.tsx`** z nawigacją między sekcjami:

```typescript
import Link from 'next/link';
import { requireTenantMembership } from '@/lib/tenant';
import LogoutButton from '@/components/LogoutButton';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { session, membership } = await requireTenantMembership();
  const role = (session.user as any).role as string;

  const navLinks = [
    { href: '/dashboard', label: 'Przegląd' },
    { href: '/dashboard/invoices', label: 'Faktury' },
    { href: '/dashboard/review', label: 'Review' },
    { href: '/dashboard/report', label: 'Raport emisji' },
    { href: '/dashboard/settings', label: 'Ustawienia' },
    ...(role === 'OWNER' || role === 'ADMIN' ? [{ href: '/dashboard/gdpr', label: 'GDPR' }] : []),
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Topbar */}
      <header style={{ background: '#0f172a', borderBottom: '1px solid #1e293b', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <span style={{ color: '#16a34a', fontWeight: 700, fontSize: 18 }}>Scopeo</span>
          <span style={{ color: '#475569', fontSize: 13 }}>{membership.organization.name}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: '#64748b', fontSize: 12 }}>{(session.user as any).email} · {role}</span>
          <LogoutButton />
        </div>
      </header>

      {/* Sidebar + content */}
      <div style={{ display: 'flex', flex: 1 }}>
        <nav style={{ width: 200, background: '#0f172a', borderRight: '1px solid #1e293b', padding: '24px 0' }}>
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href}
              style={{ display: 'block', padding: '10px 24px', color: '#94a3b8', textDecoration: 'none', fontSize: 14 }}>
              {link.label}
            </Link>
          ))}
        </nav>
        <main style={{ flex: 1, padding: 32, overflowY: 'auto' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
```

**Krok 2 — Przepisz `app/dashboard/page.tsx`** do roli strony głównej (tylko KPI + quick actions):

Przenieś do `page.tsx` tylko:
- 4 karty KPI (Profil, faktory, importy, review events)
- Komponent `DashboardActionsV9`
- Link do eksportów CSV/XLSX/PDF i raportu GHG
- Sekcję "ostatnia kalkulacja" (pre z JSON)

**Krok 3 — Utwórz `app/dashboard/invoices/page.tsx`:**

Przenieś logikę faktur z głównego dashboardu:
- `prisma.invoice.count` + `prisma.invoice.findMany` z paginacją
- `parsePagination` logic z URL searchParams
- Tabelę faktur z linkami do dostawcy, daty, wartości, liczby linii

**Krok 4 — Utwórz `app/dashboard/report/page.tsx`:**

Przenieś:
- Komponent `EmissionsCharts`
- Linki eksportu (CSV, XLSX, PDF)
- Link do raportu GHG (`/api/emissions/report`)
- Sekcję historii importów faktorów

**Krok 5 — Utwórz `app/dashboard/settings/page.tsx`:**

Przenieś:
- Informacje o profilu CarbonProfile
- Link do `/onboarding`
- Sekcję źródeł emisji (`EmissionSource`)
- Panel zaproszeń (`InvitesPanel`)

**Krok 6 — Utwórz `app/dashboard/review/page.tsx`:**

Przenieś:
- `ReviewPanel` komponent
- Historię zdarzeń review (`reviewEvent.findMany`)

Zachowaj wszystkie istniejące komponenty (`ReviewPanel`, `InvitesPanel`, `EmissionsCharts`, `DashboardActionsV9`) bez zmian — tylko przenieś ich wywołania do odpowiednich podstron.
```

---

## PROMPT P2-8 — Dodaj brakujące indeksy DB i query optymalizację

```
Zoptymalizuj bazę danych Scopeo — dodaj brakujące indeksy i usprawnij zapytania.

**Analiza obecnych zapytań i brakujące indeksy:**

**Zmiana 1: `prisma/schema.prisma` — dodaj indeksy:**

```prisma
model InvoiceLine {
  // ... istniejące pola ...
  
  // Dodaj indeks dla zapytań z emisjach (filtrowanie po scope + organizationId przez invoice):
  @@index([invoiceId, scope, categoryCode])   // już istnieje — zostaw
  @@index([mappingDecisionId])                 // już istnieje — zostaw
  // NOWE: dla zapytań calculateOrganizationEmissions (cursor pagination):
  @@index([invoiceId])                         // już jest przez FK — OK
}

model MappingDecision {
  // NOWE: ReviewPanel ładuje pending decisions dla organizacji:
  @@index([organizationId, status, createdAt])  // już istnieje — OK
  // NOWE: dla wyszukiwania po categoryCode (resolveBestFactorsForCategories):
  // (już obsługiwane przez EmissionFactor index)
}

model EmissionFactor {
  // Istniejący: @@index([organizationId, categoryCode, year])
  // NOWE: dla resolveBestFactorsForCategories z ORDER BY regionPriority, year:
  @@index([organizationId, categoryCode, regionPriority, year])  // DODAJ
}

model KsefImportJob {
  // Istniejący index pokrywa worker query — OK
  // NOWE: dla listowania jobów danej organizacji (api/ksef/jobs):
  @@index([organizationId, createdAt])  // DODAJ (obok istniejącego złożonego)
}
```

**Zmiana 2: Stwórz migrację z raw SQL dla brakujących indeksów:**

Utwórz `prisma/migrations/[timestamp]_performance_indexes/migration.sql`:
```sql
-- EmissionFactor: dla batch resolution z priorytetem regionu
CREATE INDEX CONCURRENTLY IF NOT EXISTS "EmissionFactor_orgid_catcode_region_year_idx"
ON "EmissionFactor"("organizationId", "categoryCode", "regionPriority" ASC, "year" DESC);

-- KsefImportJob: dla listowania
CREATE INDEX CONCURRENTLY IF NOT EXISTS "KsefImportJob_orgid_created_idx"
ON "KsefImportJob"("organizationId", "createdAt" DESC);

-- Invoice: dla szybkiego count po roku (dashboard year filter)
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Invoice_orgid_year_idx"
ON "Invoice"("organizationId", date_trunc('year', "issueDate"));
```

**Zmiana 3: `lib/emissions.ts` — dodaj LIMIT na override factors query:**

```typescript
// PRZED:
const overrideFactors = overrideFactorIds.length
  ? await prisma.emissionFactor.findMany({
      where: { id: { in: overrideFactorIds } },
      include: { emissionSource: true },
    })
  : [];

// PO — dodaj take dla bezpieczeństwa:
const overrideFactors = overrideFactorIds.length
  ? await prisma.emissionFactor.findMany({
      where: { id: { in: overrideFactorIds } },
      include: { emissionSource: true },
      take: overrideFactorIds.length, // dokładnie tyle ile potrzebujemy
    })
  : [];
```

**Zmiana 4: `app/dashboard/page.tsx` — zrównoleglij zapytania** (jeśli jeszcze nie zrobione z v5):

```typescript
const [profile, org, invoicesTotal, invoices, factorCount, importRuns, history, latestCalculation] =
  await Promise.all([
    prisma.carbonProfile.findUnique({ where: { organizationId } }),
    prisma.organization.findUnique({ where: { id: organizationId } }),
    prisma.invoice.count({ where: { organizationId, ...(issueDateFilter ? { issueDate: issueDateFilter } : {}) } }),
    prisma.invoice.findMany({ where: { organizationId, ...(issueDateFilter ? { issueDate: issueDateFilter } : {}) }, include: { supplier: true, lines: { include: { emissionFactor: { include: { emissionSource: true } }, mappingDecision: true } } }, orderBy: { issueDate: 'desc' }, skip, take: invoicePageSize }),
    prisma.emissionFactor.count({ where: { organizationId } }),
    prisma.factorImportRun.findMany({ where: { organizationId }, orderBy: { createdAt: 'desc' }, take: 20 }),
    prisma.reviewEvent.findMany({ where: { organizationId }, orderBy: { createdAt: 'desc' }, take: 50 }),
    prisma.emissionCalculation.findFirst({ where: { organizationId }, orderBy: { createdAt: 'desc' } }),
  ]);
```

Uruchom: `npx prisma migrate dev --name performance_indexes`
```

---

## Kolejność wdrożenia Fazy 2

| Kolejność | Prompt | Czas szacunkowy | Impact |
|-----------|--------|----------------|--------|
| 1 | P2-1 Dane KOBiZE | 30 min | 🔥 Odblokowanie importu PL |
| 2 | P2-2 Testy | 2-3h | 🛡️ Bezpieczeństwo regresji |
| 3 | P2-5 CI/CD | 1h | 🚀 Automatyczny deployment |
| 4 | P2-3 Password reset | 2h | 👤 Self-service użytkowników |
| 5 | P2-8 DB indexes | 1h | ⚡ Performance |
| 6 | P2-6 Raport GHG | 3-4h | 💼 Core value dla klientów |
| 7 | P2-4 Email verify | 2h | 🔐 Security baseline |
| 8 | P2-7 Podstrony | 4-6h | 🎨 UX / produkt |
```

---

## Co zostaje do zbudowania po Fazie 2 (Faza 3)

Po wdrożeniu wszystkich promptów z tej listy aplikacja będzie na poziomie **~75% gotowości produkcyjnej**. Do pełnego produktu zostaje:

- **Billing/Subscriptions** — Stripe integration, plany (starter / pro / enterprise)
- **Multi-org workspace switcher** — jeden użytkownik w wielu organizacjach
- **Eksport CSRD / raport zgodny z EU Taxonomy** — dla klientów pod ESG regulacją
- **API publiczne** — REST API z API keys dla integracji zewnętrznych
- **Benchmark branżowy** — porównanie emisji z medianą branży (potrzeba danych referencyjnych)
- **Alerty i powiadomienia** — email gdy emisje przekroczą próg, gdy cron failuje, gdy review czeka >7 dni
