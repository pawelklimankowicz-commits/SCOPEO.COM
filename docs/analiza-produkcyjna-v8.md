# Analiza produkcyjna Scopeo SaaS — v8

> Data: 2026-04-15  
> Podstawa: pełny przegląd kodu po wdrożeniu poprawek v7  
> Poprzednie raporty: v1–v7

---

## Co zostało naprawione między v7 a v8 ✅

| # | Problem v7 | Dowód w kodzie |
|---|-----------|----------------|
| V7-C1 | PricingTable stary cennik | `PricingTable.tsx` — 4 plany (Mikro/Starter/Growth/Scale), ceny 149/279/499/849, annual 119/223/399/679, −20%, features per plan, badge "Faktury: bez limitu" |
| V7-C2 | checkKsefLimit brak KsefConnection | Schema ma model `KsefConnection`, `checkKsefLimit` używa `prisma.ksefConnection.count()` + fallback na legacy profile |
| V7-H1 | Błędny typ notyfikacji INVOICE_LIMIT | Enum ma `KSEF_LIMIT_WARNING` i `USER_LIMIT_WARNING`, billing.ts używa ich poprawnie |
| V7-H2 | Stripe API call przy każdym checkout | `canUseTrial = !sub?.stripeSubscriptionId && Boolean(sub?.trialEndsAt > now)` — tylko lokalna DB |
| V7-H3 | Webhook double upsert | `if (alreadyHandled) return { ok: true }` przed upsert |
| V7-H4 | findMany bez limitu (OOM) | `take: maxLines + 1` (10 001), flaga `truncated` w response |
| V7-H5 | JWT DB query przy każdym request | `shouldRefreshOrganizations` — query tylko przy signIn, update lub pustej tablicy orgs |
| V7-M4 | DELETE notifications bez readOnly | Guard: `if (!readOnly) return 400` |
| V7-M5 | planLimits brak MIKRO case | `PLANS[plan as keyof typeof PLANS]` — object lookup zamiast if-chain |
| V7-M6 | Brak sprawdzenia planu przy API keys | GET i POST `/api/api-keys` sprawdzają `canAccessApi()` |
| V7-M7 | Membership bez status/createdAt | Schema: `status MembershipStatus @default(ACTIVE)`, `createdAt DateTime @default(now())` |
| V7-M8 | API v1 bez sprawdzenia planu | `withApiKey` importuje `canAccessApi` i sprawdza plan przed wywołaniem handlera |
| V7-M9 | Brak deduplicji powiadomień | `createNotification` ma parametr `deduplicateWithinHours` |

---

## Problemy aktualne w v8 — do naprawy

### 🔴 KRYTYCZNE

---

#### [V8-C1] `app/(marketing)/page.tsx` — stary cennik na stronie głównej

**Plik:** `app/(marketing)/page.tsx`, linie 279–303  
**Problem:** Strona główna (landing) nadal pokazuje sekcję „Cennik — skrót" z 3 planami opartymi na fakturach:

```tsx
{ n: 'Micro', p: '149 zł / mc', d: 'do 50 faktur' },
{ n: 'Growth', p: '349 zł / mc', d: 'do 200 faktur · polecany', f: true },
{ n: 'Enterprise', p: 'Wycena', d: 'powyżej 1000 faktur' },
```

Problemy:
- „Micro" zamiast „Mikro" (stara nazwa planu)
- „do 50 faktur", „do 200 faktur", „powyżej 1000 faktur" — stary model cenowy
- Growth 349 zł (stara cena) zamiast 499 zł
- Brak planów Starter i Scale

Dodatkowo FAQ na tej samej stronie (linia 323):
```tsx
{ q: 'Czy nadaje się dla MŚP?', a: '...niższe plany są liczone pod mniejszy wolumen faktur.' }
```
Jawnie mówi o „wolumenie faktur" co jest sprzeczne z nowym modelem.

**Skutek:** Użytkownik ze strony głównej widzi stare ceny, klika na `/cennik` i widzi inne ceny. Utrata zaufania, brak konwersji.

---

#### [V8-C2] Brak egzekwowania paywall po wygaśnięciu trialu

**Plik:** `middleware.ts` + brak cron job  
**Problem:** Middleware sprawdza tylko:
1. Czy użytkownik jest zalogowany
2. Czy context organizacji jest poprawny
3. Czy onboarding jest ukończony

Nie sprawdza statusu subskrypcji ani czy trial wygasł. Gdy trial wygasa (`trialEndsAt < now`), nie ma żadnego mechanizmu który:
- Zmienia status subskrypcji z `TRIALING` na `CANCELED`
- Blokuje dostęp do dashboard
- Przekierowuje na stronę płatności

Użytkownik może korzystać z aplikacji bezterminowo bez płacenia.

**Skutek:** Zero przychodów. Klienci nie mają powodu żeby płacić.

**Poprawka składa się z 2 części:**
1. Cron job (`/api/cron/expire-trials`) — sprawdza co godzinę subskrypcje z `status=TRIALING` i `trialEndsAt < now`, ustawia `status=CANCELED`
2. Middleware — sprawdza `status` subskrypcji z JWT lub DB; jeśli `CANCELED` lub `PAST_DUE` → redirect `/dashboard/billing-required`

---

### 🟠 HIGH

---

#### [V8-H1] `PricingTable.tsx` — CTA prowadzi do formularza demo zamiast rejestracji

**Plik:** `components/marketing/PricingTable.tsx`, linia 145  
**Problem:**
```tsx
<Link href="/kontakt#demo" className="mkt-btn mkt-btn--primary">
  Umów demo
</Link>
```

Każda karta planu ma przycisk „Umów demo" który prowadzi do formularza kontaktowego. W modelu self-serve (bez sales) to jest śmiertelny błąd konwersji. Użytkownik zdecydowany na zakup klika → trafia na formularz → musi czekać na odpowiedź → rezygnuje.

**Poprawka:**
```tsx
<Link href="/register" className="mkt-btn mkt-btn--primary">
  Zacznij bezpłatny trial — 7 dni
</Link>
```
Opcjonalny krótszy tekst pod przyciskiem (np. o okresie próbnym) — może wspierać zaufanie.

---

#### [V8-H2] `app/(marketing)/page.tsx` — badge „starter" w hero section

**Plik:** `app/(marketing)/page.tsx`, linia 28  
**Problem:**
```tsx
<p className="mkt-hero-badge">KSeF + GHG Protocol · starter</p>
```

Słowo „starter" wygląda jak artifact deweloperski (nazwa planu/etapu). Pierwsze co widzi użytkownik na stronie to badge z niezrozumiałym „starter". Powinno być np. „KSeF + GHG Protocol · Beta" lub „KSeF + GHG Protocol · CSRD 2025" lub usunięte.

---

#### [V8-H3] Brak `DATA_ENCRYPTION_KEY` w dokumentacji env vars

**Plik:** `app/api/ksef/import/route.ts`, linia 14  
**Problem:**
```typescript
if (!isRawPayloadEncryptionConfigured()) {
  return NextResponse.json(
    { ok: false, error: 'KSeF import is disabled until DATA_ENCRYPTION_KEY is configured' },
    { status: 503 }
  );
}
```

Cały KSeF import zwróci 503 jeśli `DATA_ENCRYPTION_KEY` nie jest ustawiony. Ten klucz **nie jest wymieniony** w żadnej dokumentacji ani `.env.example`. Deweloper deployujący produkcję nie wie że musi go ustawić.

**Sprawdź:** czy zmienna nazywa się `DATA_ENCRYPTION_KEY` czy `KSEF_TOKEN_ENCRYPTION_KEY` — są dwa różne klucze. Upewnij się że oba są w `.env.example`.

---

#### [V8-H4] Rejestracja wysyła plain text email

**Plik:** `app/api/auth/register/route.ts`, linia 67–74  
**Problem:**
```typescript
text: `Witaj ${parsed.name},\n\nAby dokończyć rejestrację, potwierdź swój adres email:\n\n${verifyUrl}\n\nLink ważny przez 24 godziny.`
```

Email weryfikacyjny jest tylko plain textem. Brak HTML oznacza:
- Niski delivery score (Resend AI może oznaczyć jako spam)
- Brak branding/logo Scopeo
- Nieczytelny na urządzeniach mobilnych
- Brak wyraźnego CTA button

To jest **pierwszy kontakt klienta z produktem** po rejestracji — decyduje o tym czy użytkownik potwierdzi email i wróci do aplikacji.

---

### 🟡 MEDIUM

---

#### [V8-M1] `INVOICE_LIMIT_WARNING` — nieużywany typ w enum NotificationType

**Plik:** `prisma/schema.prisma`, linia 64  
**Problem:**
```prisma
enum NotificationType {
  ...
  KSEF_LIMIT_WARNING
  USER_LIMIT_WARNING
  INVOICE_LIMIT_WARNING  // ← stary typ, nie używany nigdzie w kodzie
  ...
}
```

Pozostałość po starym modelu invoice limits. Nikt go nie używa, ale jest w schemacie. Może przypadkowo zostać użyty w przyszłości.

---

#### [V8-M2] `PricingTable.tsx` — brak polskich znaków diakrytycznych

**Plik:** `components/marketing/PricingTable.tsx`, linie 15–63  
**Problem:** Strona `/cennik` wyświetlana klientom zawiera błędy ortograficzne:
- `'1 polaczenie KSeF'` → powinno być `'1 połączenie KSeF'`
- `'do 5 uzytkownikow'` → `'do 5 użytkowników'`
- `'7 dni bezplatnego trialu'` → `'7 dni bezpłatnego trialu'`
- `'Polaczenia KSeF: {p.ksefLimit} · Uzytkownicy: {p.userLimit}'` → pełne polskie znaki

To jest strona cennikowa widoczna dla wszystkich potencjalnych klientów.

---

#### [V8-M3] `app/(marketing)/page.tsx` — FAQ używa starego modelu

**Plik:** `app/(marketing)/page.tsx`, linia 323  
**Problem:**
```tsx
{ q: 'Czy nadaje się dla MŚP?', a: 'Tak — niższe plany są liczone pod mniejszy wolumen faktur.' }
```
Odpowiedź jawnie mówi o „wolumenie faktur" co jest sprzeczne z nowym modelem (KSeF connections + users). Należy zaktualizować FAQ na stronie głównej.

---

#### [V8-M4] `lib/legal.ts` — adres korespondencyjny wymaga weryfikacji

**Plik:** `lib/legal.ts`, linia 10  
**Problem:**
```typescript
registryDetails: 'KRS: 0001208042, NIP: 9462761086, REGON: 54335415700000, adres korespondencyjny: ul. Kowalska 5, 20-115 Lublin, Polska.'
```

KRS/NIP/REGON wydają się wypełnione. Adres „ul. Kowalska 5" — należy zweryfikować czy to rzeczywisty adres siedziby. Regulamin publikuje te dane publicznie.

---

#### [V8-M5] Brak strony `/dashboard/billing-required` (needed for V8-C2)

**Problem:** Gdy dodasz egzekwowanie paywall (V8-C2), użytkownicy z wygasłym trialu będą przekierowani. Potrzebujesz dedykowanej strony z:
- Jasnym komunikatem że trial wygasł
- Przyciskiem do wyboru planu
- Kontaktem w razie problemów

---

## Podsumowanie v8

| Priorytet | Nowe | Nadal otwarte | Łącznie |
|-----------|------|---------------|---------|
| 🔴 Krytyczne | 2 | 0 | 2 |
| 🟠 High | 4 | 0 | 4 |
| 🟡 Medium | 5 | 0 | 5 |

### TOP priorytety przed launchem:
1. **[V8-C2]** Paywall po wygaśnięciu trialu — bez tego aplikacja jest darmowa na zawsze
2. **[V8-C1]** Landing page stary cennik — klient widzi sprzeczne informacje
3. **[V8-H1]** CTA „Umów demo" → „Zacznij trial" — bez tego zero self-serve konwersji
4. **[V8-H2]** Badge „starter" w hero — wygląda nieprofesjonalnie
5. **[V8-H3]** DATA_ENCRYPTION_KEY w .env.example — bez tego KSeF import = 503 w produkcji
