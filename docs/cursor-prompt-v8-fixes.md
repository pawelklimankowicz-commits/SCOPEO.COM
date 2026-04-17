# Cursor Prompts — v8 Fixes

> Kolejność: wykonuj od góry. Każdy prompt to osobna sesja Cursor Composer.

---

## V8-FIX-1 — Paywall po wygaśnięciu trialu [KRYTYCZNE]

```
Zaimplementuj egzekwowanie paywall po wygaśnięciu trialu. Potrzebujemy 3 elementów:

### 1. Cron job do expire trials

Stwórz `app/api/cron/expire-trials/route.ts`:
- Metoda: GET (Vercel Cron wywołuje GET)
- Sprawdź nagłówek `Authorization: Bearer ${process.env.CRON_SECRET}` — jeśli brak, zwróć 401
- Znajdź wszystkie subskrypcje z `status = 'TRIALING'` i `trialEndsAt < new Date()`
- Zaktualizuj je: `status = 'CANCELED'`, `plan = 'MIKRO'`, `ksefConnectionLimit = 1`, `userLimit = 1`
- Zaloguj liczbę zaktualizowanych rekordów przez `logger`
- Zwróć `{ ok: true, expired: count }`

Dodaj w `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/expire-trials",
      "schedule": "0 * * * *"
    }
  ]
}
```
(co godzinę)

### 2. Strona /dashboard/billing-required

Stwórz `app/dashboard/billing-required/page.tsx` — Server Component:
- Sprawdź sesję przez `auth()` — jeśli brak, redirect `/login`
- Pobierz subskrypcję przez `getSubscription(organizationId)`
- Jeśli `status === 'ACTIVE' || status === 'TRIALING'` — redirect `/dashboard` (nie potrzebuje tej strony)
- Renderuj prostą stronę z:
  - Tytuł: "Twój trial wygasł"
  - Opis: "Aby kontynuować korzystanie ze Scopeo, wybierz plan subskrypcji."
  - Przycisk `<Link href="/dashboard/settings/billing">` → "Wybierz plan"
  - Link `/kontakt` → "Masz pytania? Skontaktuj się z nami"
  - Używaj istniejących klas CSS dashboardu

### 3. Middleware — sprawdzenie statusu subskrypcji

W `middleware.ts` po sekcji sprawdzania onboardingu:
- Pobierz subscription status z JWT tokenu (dodaj pole `subscriptionStatus` do JWT)
  - W `lib/auth.ts` w callbacku `jwt`, gdy `user` lub `trigger === 'update'`:
    - Pobierz `prisma.subscription.findUnique({ where: { organizationId }, select: { status: true } })`
    - Ustaw `token.subscriptionStatus = sub?.status ?? 'CANCELED'`
- W middleware: jeśli `token.subscriptionStatus === 'CANCELED'` lub `token.subscriptionStatus === 'PAST_DUE'`:
  - I pathname zaczyna się od `/dashboard` (ale NIE jest `/dashboard/billing-required` ani `/dashboard/settings/billing`)
  - Redirect do `/dashboard/billing-required`
- Dodaj `CRON_SECRET` do `.env.example`

UWAGA: Nie blokuj dostępu do `/dashboard/settings/billing` — user musi móc wybrać plan.
UWAGA: Nie blokuj dostępu do `/api/billing/*` — muszą działać webhooks i checkout.
```

---

## V8-FIX-2 — Landing page: zaktualizuj sekcję cennikową i FAQ [KRYTYCZNE]

```
W pliku `app/(marketing)/page.tsx` wprowadź następujące zmiany:

### 1. Sekcja "Cennik — skrót" (linie ~268–303)

Zastąp obecną sekcję z 3 kartami (Micro/Growth/Enterprise) nową sekcją z 4 planami zgodnymi z aktualnym cennikiem:

Nowa zawartość kart:
- Mikro: 149 zł / mc, "1 połączenie KSeF · 1 użytkownik"
- Starter: 279 zł / mc, "1 połączenie KSeF · do 5 użytkowników"  
- Growth: 499 zł / mc, "3 połączenia KSeF · do 15 użytkowników · Polecany"
- Scale: 849 zł / mc, "10 połączeń KSeF · bez limitu użytkowników"

Każda karta: Link href="/cennik" className="mkt-btn mkt-btn--secondary" → "Pełny cennik"

Sekcja lead text (linia ~272): zmień "Progresja według wolumenu faktur" na:
"Progresja według liczby połączeń KSeF i użytkowników — bez limitu faktur."

### 2. FAQ — zaktualizuj odpowiedzi (linie ~310–340)

Zmień lub usuń odpowiedź na pytanie "Czy nadaje się dla MŚP?":
STARA: "Tak — niższe plany są liczone pod mniejszy wolumen faktur."
NOWA: "Tak — plan Mikro (149 zł/mc) jest przeznaczony dla firm z 1 połączeniem KSeF i jednym użytkownikiem. Bez limitu liczby faktur."

Dodaj nowe pytanie do FAQ:
- Q: "Ile kosztuje i od czego zależy cena?"
- A: "Cena zależy od liczby połączeń KSeF i liczby użytkowników — nie od liczby faktur. Plany od 149 zł/mc. Szczegóły na stronie Cennik."

### 3. Badge w hero section (linia ~28)

Zmień:
`<p className="mkt-hero-badge">KSeF + GHG Protocol · starter</p>`

Na:
`<p className="mkt-hero-badge">KSeF + GHG Protocol · CSRD 2025</p>`
```

---

## V8-FIX-3 — PricingTable: CTA self-serve + polskie znaki [HIGH]

```
W pliku `components/marketing/PricingTable.tsx` wprowadź następujące zmiany:

### 1. Zmień CTA z "Umów demo" na "Zacznij trial"

Zastąp (linie ~144–149):
```tsx
<div style={{ marginTop: 16 }}>
  <Link href="/kontakt#demo" className="mkt-btn mkt-btn--primary" style={{ width: '100%' }}>
    Umów demo
  </Link>
  <p style={{ margin: '8px 0 0', fontSize: '0.75rem', color: '#64748b' }}>7 dni bezplatnego trialu</p>
</div>
```

Na:
```tsx
<div style={{ marginTop: 16 }}>
  <Link href="/register" className="mkt-btn mkt-btn--primary" style={{ width: '100%' }}>
    Zacznij bezpłatny trial
  </Link>
  <p style={{ margin: '8px 0 0', fontSize: '0.75rem', color: '#64748b' }}>7 dni bez karty kredytowej</p>
</div>
```

Dla karty Enterprise zostaw link do `/kontakt` ale zmień tekst na "Porozmawiaj o wdrożeniu".

### 2. Popraw polskie znaki diakrytyczne we wszystkich tablicach PLANS

Przejdź przez każdy obiekt w tablicy PLANS i popraw:
- `'polaczenie KSeF'` → `'połączenie KSeF'`
- `'polaczenia KSeF'` → `'połączenia KSeF'`
- `'uzytkownik'` → `'użytkownik'`
- `'uzytkownikow'` → `'użytkowników'`
- `'bezplatnego'` → `'bezpłatnego'`
- `'Polaczenia KSeF:'` → `'Połączenia KSeF:'`
- `'Uzytkownicy:'` → `'Użytkownicy:'`

### 3. Tekst roczny

Linia `<small>/ mc {annual ? 'przy płatności rocznej' : 'netto'}</small>` — OK, nie zmieniaj.

Linia z łączną kwotą roczną: sprawdź czy obliczenie jest poprawne: `p.annual * 12` — tak powinno być.
```

---

## V8-FIX-4 — Email HTML dla weryfikacji i trial [HIGH]

```
Zaimplementuj HTML emaile dla kluczowych wiadomości transakcyjnych w Resend.

### 1. Utwórz `lib/email-templates.ts`

Eksportuj funkcje zwracające `{ subject: string, html: string, text: string }`:

#### `verificationEmail(name: string, verifyUrl: string)`
- Subject: "Potwierdź adres email — Scopeo"
- HTML template (inline CSS, kompatybilny z email clientami):
  - Logo/nazwa "Scopeo" u góry
  - Powitanie: "Cześć {name},"
  - Krótki tekst: "Kliknij przycisk poniżej, aby potwierdzić adres email i aktywować konto."
  - Duży przycisk CTA (background: #10b981, kolor biały, border-radius: 6px, padding: 14px 28px): "Potwierdź email"
  - href: verifyUrl
  - Fallback tekst: "Jeśli przycisk nie działa, skopiuj ten link: {verifyUrl}"
  - Link ważny 24 godziny
  - Stopka: "Scopeo · scopeo.com · Nie zamawiałeś konta? Zignoruj tę wiadomość."
- text: plain text fallback (istniejący tekst)

#### `trialEndingEmail(name: string, daysLeft: number, billingUrl: string)`
- Subject: `Twój trial Scopeo kończy się za ${daysLeft} dni`
- Analogiczna struktura HTML
- Przycisk CTA: "Wybierz plan" → href: billingUrl

#### `paymentFailedEmail(name: string, portalUrl: string)`
- Subject: "Płatność za Scopeo nie powiodła się"
- Analogiczna struktura HTML
- Przycisk CTA: "Zaktualizuj metodę płatności" → href: portalUrl

### 2. Zaktualizuj `app/api/auth/register/route.ts`

Zaimportuj `verificationEmail` z `@/lib/email-templates` i użyj `html:` i `text:` zamiast tylko `text:`.

### 3. Zaktualizuj `app/api/webhooks/stripe/route.ts`

W funkcji `sendBillingEmail` — dodaj opcjonalny parametr `html?: string` i przekaż go do Resend.
W obsłudze `trial_will_end` użyj `trialEndingEmail`.
W obsłudze `invoice.payment_failed` użyj `paymentFailedEmail`.

Ważne: Resend obsługuje `html` i `text` jako osobne pola — zawsze podawaj oba dla kompatybilności.
```

---

## V8-FIX-5 — Env vars i schema cleanup [MEDIUM]

```
Wykonaj następujące drobne poprawki:

### 1. Dodaj brakujące zmienne do .env.example

Sprawdź `lib/payload-security.ts` — jaka jest nazwa zmiennej używanej przez `isRawPayloadEncryptionConfigured()`.
Jeśli to `DATA_ENCRYPTION_KEY` — dodaj do `.env.example`:
```
DATA_ENCRYPTION_KEY=<32 bajty base64, openssl rand -base64 32>
```
Jeśli to `KSEF_TOKEN_ENCRYPTION_KEY` — sprawdź czy jest w .env.example.

Dodaj też:
```
CRON_SECRET=<losowe 32 znaki, openssl rand -hex 16>
HEALTH_CHECK_SECRET=<losowe 32 znaki>
LEGAL_EMAIL_GENERAL=kontakt@twojadomena.pl
LEGAL_EMAIL_SUPPORT=support@twojadomena.pl
LEGAL_EMAIL_PRIVACY=privacy@twojadomena.pl
LEGAL_EMAIL_COMPLAINTS=reklamacje@twojadomena.pl
```

### 2. Usuń INVOICE_LIMIT_WARNING z schematu Prisma

W `prisma/schema.prisma` w enum `NotificationType` usuń linię:
```
INVOICE_LIMIT_WARNING
```

Sprawdź czy ta wartość jest używana gdzieś w kodzie (grep po całym projekcie):
- Jeśli jest używana → zamień na odpowiedni typ (`KSEF_LIMIT_WARNING` lub `USER_LIMIT_WARNING`)
- Jeśli nie jest używana → usuń bezpiecznie

Po zmianie schematu uruchom: `npx prisma generate`

### 3. Popraw diacritics w BillingPlansClient.tsx

W `components/BillingPlansClient.tsx` popraw:
- `'Twoj bezplatny trial konczy sie za {trialDaysLeft} dni.'`
  → `'Twój bezpłatny trial kończy się za {trialDaysLeft} dni.'`
- `'Dodaj karte, aby zachowac dostep.'`
  → `'Dodaj kartę, aby zachować dostęp.'`
- `'Uzytkownicy:'` → `'Użytkownicy:'`
- `'Polaczenia KSeF:'` → `'Połączenia KSeF:'`
- `'Aktywuj subskrypcje'` → `'Aktywuj subskrypcję'`
- `'Zarzadzaj subskrypcja'` → `'Zarządzaj subskrypcją'`
- `'Miesiecznie'` → `'Miesięcznie'`
- `'Rocznie (-20%)'` → OK
- `'Ladowanie...'` → `'Ładowanie...'`
- `'{plan.monthly} zl / mc'` → `'{plan.monthly} zł / mc'`
- `'{plan.annualMonthly} zl / mc (rocznie)'` → `'{plan.annualMonthly} zł / mc (rocznie)'`
- `'Twoj plan'` → `'Twój plan'`
- `'Wybierz plan'` → OK
- `'Porozmawiaj o wdrozeniu'` → `'Porozmawiaj o wdrożeniu'`

```

---

## Kolejność wdrożenia

| Fix | Priorytet | Czas | Blokuje launch? |
|-----|-----------|------|-----------------|
| V8-FIX-1 (paywall) | 🔴 | 3–4h | **TAK** |
| V8-FIX-2 (landing page) | 🔴 | 1h | **TAK** |
| V8-FIX-3 (CTA + diacritics) | 🟠 | 1h | TAK (konwersja) |
| V8-FIX-4 (email HTML) | 🟠 | 2h | Nie, ale ważne |
| V8-FIX-5 (env + schema) | 🟡 | 1h | Nie |

**Łączny czas szacowany: ~8–9 godzin roboczych z Cursorem.**
