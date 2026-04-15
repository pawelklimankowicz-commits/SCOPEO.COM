# Analiza produkcyjna Scopeo SaaS — v6

> Data: 2026-04-15  
> Podstawa: pełny przegląd kodu po zmianach v5→v6  
> Poprzednie raporty: v1–v5

---

## Co zostało naprawione między v5 a v6 ✅

| # | Problem v5 | Dowód w kodzie |
|---|-----------|----------------|
| V5-C1 | KSeF InitSigned → InitToken | `initUrl = .../InitToken`, body `{ authToken, contextIdentifier }`, nagłówek `SessionToken` |
| V5-C2 | kobize-pl-factors.json crash | ENOENT → graceful empty, memoizacja `cachedFile` |
| V5-H4 | AUTH_SECRET w .env.example | `.env.example` ma `NEXTAUTH_SECRET`; `/api/health` akceptuje oba |
| V5-H1 | NLP słabe słownictwo PL | `stemToken()` z 30 sufiksami, rozszerzone stopwords, reguły: gaz, leasing/najem, `CAT1` stała |
| V5-H2 | Brak limitu wierszy w emisjach | Cursor-based pagination z `maxLines` (domyślnie 10 000), `truncated` flag |
| V5-M1 | fs.readFileSync bez cache | Zmienna `cachedFile` — czyta plik raz per process |
| V5-M2 | N+1 w persistFactors | Batch `$executeRaw` INSERT z `ON CONFLICT DO UPDATE`, chunki po 300 |
| V5-M3 | Hasło min 8 znaków | `z.string().min(12)` z komunikatem po polsku w `lib/schema.ts` |
| V5-M9b | INTERNAL_WORKER_URL | Dodane do `.env.example` i `cron/ksef-worker/route.ts` |

---

## Problemy aktualne w v6 — do naprawy

### 🔴 KRYTYCZNE

---

#### [V6-C1] PDF eksport nadal nie obsługuje polskich znaków

**Plik:** `app/api/emissions/export/route.ts`, linia 43–44  
**Status v5:** Nie naprawione (V5-C3 nadal otwarty)  
**Problem:** `StandardFonts.Helvetica` obsługuje tylko Latin-1. Polskie znaki (ą ę ś ź ż ó ć ł ń) wyświetlają się jako puste miejsca w wygenerowanych PDF. Kategorie emisji i opisy dostawców często zawierają polskie litery.

---

#### [V6-C2] `KSEF_CONTEXT_NIP` — hardcoded prawdziwy NIP jako domyślna wartość

**Plik:** `lib/ksef-client.ts`, linia 25; `.env.example`, linia 19  
**Problem:**
```typescript
const contextNip = (process.env.KSEF_CONTEXT_NIP || '9462761086').trim();
```
Domyślny fallback `'9462761086'` to konkretny numer NIP. Jeśli organizacja nie ustawi `KSEF_CONTEXT_NIP`, wszystkie jej sesje KSeF będą inicjowane z NIPem innej firmy — API KSeF zwróci błąd 401/403 (lub w najgorszym przypadku, jeśli ten NIP ma token, dostęp do cudzych danych). Numer NIP powinien być pobierany z `CarbonProfile.taxId` organizacji, a nie z env vara z hardcoded fallback.

**Poprawka:** Przekazywać NIP organizacji do `fetchKsefInvoiceXml`, pobierać z `CarbonProfile`.

---

### 🟠 HIGH

---

#### [V6-H1] `acceptInviteSchema` — niespójna minimalna długość hasła (8 zamiast 12)

**Plik:** `app/api/invites/accept/route.ts`, linie 12 i 44  
**Problem:** Schemat walidacji przy akceptacji zaproszenia:
```typescript
const acceptInviteSchema = z.object({
  password: z.string().min(8).optional(),  // powinno być min(12)
});
// ...
if (parsed.password.length < 8) {           // powinno być < 12
```
`lib/schema.ts` wymaga 12 znaków dla rejestracji, ale ta ścieżka (zaproszony nowy użytkownik) wymaga tylko 8. Zaproszeni użytkownicy mogą ustawiać słabsze hasła.

---

#### [V6-H2] `/api/health` ujawnia konfigurację infrastruktury publicznie

**Plik:** `app/api/health/route.ts`, linia 6–8  
**Problem:** Endpoint zwraca bez uwierzytelnienia:
```json
{ "authSecretSet": true, "nextAuthUrlSet": true, "db": "ok" }
```
W przypadku błędu bazy danych ujawnia też `databaseUrlSet`. To informacje dla atakującego (np. czy klucze są skonfigurowane, jaki URL bazy). Endpoint nie ma żadnej ochrony.

**Poprawka:** Dodać uwierzytelnianie (np. `x-health-secret` nagłówek z losowym tokenem) lub usunąć pola konfiguracyjne z odpowiedzi.

---

#### [V6-H3] `Supplier` — NULL taxId powoduje duplikaty (PostgreSQL NULL ≠ NULL w UNIQUE)

**Plik:** `prisma/schema.prisma`, linia 177  
**Problem:**
```prisma
@@unique([organizationId, name, taxId])
```
W PostgreSQL NULL wartości nie są równe sobie w warunku unikalności. Więc dostawcy z `taxId = null` i tą samą nazwą mogą być zduplikowani w nieskończoność. Każdy import faktury od dostawcy bez NIP (np. osoba fizyczna) tworzy nowego dostawcę zamiast upsertować istniejącego.

**Poprawka:** Zmienić podejście — albo ustaw `taxId String @default("")` (pusty string zamiast null), albo dodaj dedykowany unikalny index z `COALESCE`:
```sql
CREATE UNIQUE INDEX supplier_orgid_name_taxid_null_safe 
ON "Supplier"("organizationId", "name", COALESCE("taxId", ''));
```

---

#### [V6-H4] Brak rate limitingu na `/api/invites/accept` i `/api/invites` POST

**Pliki:** `app/api/invites/accept/route.ts`; `app/api/invites/route.ts`  
**Problem:**

1. `POST /api/invites/accept` — brak rate limitingu. Każde wywołanie wykonuje `bcrypt.hash()` (kosztowna operacja CPU przy 12 rundach). Atakujący może wysyłać tysiące żądań i przeciążyć serwer.

2. `POST /api/invites` — brak rate limitingu na tworzenie zaproszeń. Admin może przypadkowo wygenerować tysiące zaproszeń lub atakujący (po przejęciu konta) może zaspamować system.

---

#### [V6-H5] `GDPR execute` — anonymizacja InvoiceLine w pętli N+1

**Plik:** `app/api/gdpr/requests/[requestId]/execute/route.ts`, linie 85–97  
**Problem:**
```typescript
const lines = await prisma.invoiceLine.findMany({ ... select: { id: true } });
for (const line of lines) {
  await prisma.invoiceLine.update({ where: { id: line.id }, data: { description: '[ANONYMIZED]' } });
}
```
Dla dostawcy z setkami linii faktur to setki osobnych zapytań UPDATE, sekwencyjnie. Powinno być:
```typescript
await prisma.invoiceLine.updateMany({
  where: { invoice: { organizationId, supplier: { name: 'Deleted Supplier' } } },
  data: { description: '[ANONYMIZED]' },
});
```

---

### 🟡 MEDIUM

---

#### [V6-M1] `lib/ksef-client.ts` — jeden AbortController dla dwóch requestów sieciowych

**Plik:** `lib/ksef-client.ts`, linia 29–104  
**Problem:** Pojedynczy `AbortController` z timeoutem startuje na początku iteracji i jest współdzielony między `InitToken` i fetch faktury. Jeśli `InitToken` zajmie 8s z 10s budżetu, fetch faktury ma tylko 2s. Timeout nie jest resetowany między requestami. Prowadzi do fałszywych timeout errors na wolnych połączeniach.

**Poprawka:** Osobny timeout dla każdego requestu sieciowego.

---

#### [V6-M2] `lib/invitations.ts` — URL zaproszenia używa `NEXTAUTH_URL` zamiast `NEXT_PUBLIC_APP_URL`

**Plik:** `lib/invitations.ts`, linia 18  
**Problem:**
```typescript
const appUrl = process.env.NEXTAUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL;
```
`NEXTAUTH_URL` jest zmienną wewnętrzną NextAuth (może wskazywać na wewnętrzny host). `NEXT_PUBLIC_APP_URL` to właściwy publiczny URL aplikacji. Jeśli różnią się (np. internal vs. public hostname), link w emailu zaproszenia będzie nieprawidłowy.

**Poprawka:** Zamień priorytety: `process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL`.

---

#### [V6-M3] `app/api/contact/route.ts` — email do sales jest synchroniczny, blokuje odpowiedź

**Plik:** `app/api/contact/route.ts`, linia 112  
**Problem:** `await resend.emails.send(...)` — lead jest już zapisany w bazie, ale odpowiedź czeka na dostarczenie emaila. Jeśli Resend jest powolny/niedostępny, formularz kontaktowy wydaje się "zawieszony". Dane leada są bezpieczne w DB niezależnie od emaila.

**Poprawka:** Fire-and-forget: usuń `await`, dodaj `.catch(logger.error)`.

---

#### [V6-M4] `app/api/review/update/route.ts` — email review nadal synchroniczny

**Plik:** `app/api/review/update/route.ts`, linia 68  
**Status v5:** Nie naprawione (V5-M4 nadal otwarty)  
**Problem:** `await resend.emails.send(...)` w handlerze review blokuje odpowiedź o latencję Resend.

---

#### [V6-M5] `app/api/gdpr/.../execute` — email potwierdzający realizację GDPR synchroniczny

**Plik:** `app/api/gdpr/requests/[requestId]/execute/route.ts`, linia 131  
**Problem:** `await resend.emails.send(...)` po wykonaniu anonimizacji. Realizacja wniosku GDPR może trwać długo (N+1 problem z [V6-H5]), a na końcu blokuje jeszcze na email delivery.

---

#### [V6-M6] Brak walidacji rozmiaru XML w KSeF import

**Plik:** `app/api/ksef/import/route.ts`, linia 33  
**Problem:** `parsed.xml` może być dowolnie dużym stringiem. Nie ma limitu rozmiaru XML przed przetwarzaniem. Złośliwy lub błędny XML o rozmiarze >50MB może spowodować OOM w funkcji serverless. `lib/payload-security.ts` obcina do `MAX_RAW_PAYLOAD_BYTES = 120 000` dopiero przy szyfrowaniu — ale `parseKsefFa3Xml` przetwarza cały XML przez `xml2js` przed tym krokiem.

**Poprawka:** Dodać limit przed parsowaniem:
```typescript
if (parsed.xml && Buffer.byteLength(parsed.xml, 'utf8') > 2 * 1024 * 1024) {
  return NextResponse.json({ ok: false, error: 'XML payload too large (max 2MB)' }, { status: 413 });
}
```

---

#### [V6-M7] Brak auditu ProcessingRecord dla importu faktorów

**Plik:** `lib/factor-import.ts`, funkcja `importExternalFactors`  
**Problem:** Import faktorów (`/api/factors/import`) nie zapisuje wpisu w `ProcessingRecord`. Wszystkie inne operacje danych (KSEF import, review, GDPR, cookie consent) piszą audit log. Import faktorów przetwarza zewnętrzne dane i zmienia bazę wskaźników emisji — powinien też być odnotowany.

**Poprawka:** Dodać `writeProcessingRecord` po udanym imporcie z informacją o liczbie zaimportowanych faktorów.

---

#### [V6-M8] CSP: `connect-src 'self' https:` — zbyt szeroki

**Plik:** `middleware.ts`, linia 22  
**Status v5:** Nie naprawione (V5-M5 nadal otwarty)  
**Problem:** Pozwala frontendowi na połączenia z dowolnym hostem HTTPS. Powinien whitelist tylko Sentry.

---

#### [V6-M9] `next.config.ts` — `NEXTAUTH_URL` w bloku `env:` wycieka do klienta

**Plik:** `next.config.ts`, linie 7–9  
**Status v5:** Nie naprawione (V5-M8 nadal otwarty)  
**Problem:** Blok `env:` eksponuje `NEXTAUTH_URL` do bundla klienta.

---

#### [V6-M10] Paginacja dashboard — `aria-disabled` nie blokuje nawigacji

**Plik:** `app/dashboard/page.tsx`, linie 281–292  
**Status v5:** Nie naprawione (V5-M10 nadal otwarty)

---

#### [V6-M11] `lib/ksef-xml.ts` — kolizja `externalId` dla dostawców bez NIP

**Plik:** `lib/ksef-xml.ts`, linia 43  
**Problem:**
```typescript
const externalId = `${taxIdSegmentForExternalId(sellerTaxId)}-${number}-${issueDate}`;
// Gdy sellerTaxId jest null → externalId = "NO_TAX_ID-FV/2024/001-2024-01-15"
```
Dwie różne firmy bez NIP wystawiające fakturę z tym samym numerem w tym samym dniu wygenerują identyczny `externalId`. Import drugiej faktury nadpisze pierwszą (upsert po `externalId`). Rare edge case, ale realny w polskim rynku (mikroprzedsiębiorcy bez NIP).

---

#### [V6-M12] `Supplier.taxId` w ERASURE — anonimizacja `taxId: null` nie działa

**Plik:** `app/api/gdpr/requests/[requestId]/execute/route.ts`, linia 74  
**Problem:**
```typescript
data: { name: 'Deleted Supplier', taxId: null },
```
`taxId` jest już `String?` (nullable) — ustawienie na `null` po anonimizacji jest poprawne. ALE potem:
```typescript
const lines = await prisma.invoiceLine.findMany({
  where: { invoice: { organizationId, supplier: { name: 'Deleted Supplier' } } },
});
```
Jeśli wcześniej istniało wielu dostawców o różnych NIP (z różnych GDPR erasure), wszystkie będą miały `name: 'Deleted Supplier'` — zapytanie zwróci linie od wszystkich poprzednich anonimizacji, nie tylko od bieżącego podmiotu. Anonimizacja linii faktur będzie nadmiarowa.

---

#### [V6-M13] `lib/patch-database-url.ts` — skanuje całe `process.env` przez regex

**Plik:** `lib/patch-database-url.ts`, linie 19–25  
**Problem:** Gdy `DATABASE_URL` jest pusta, kod iteruje przez WSZYSTKIE zmienne środowiskowe i szuka tej, która wygląda jak PostgreSQL URL. W środowisku z wieloma zmiennymi (np. Vercel z dziesiątkami zmiennych) może omyłkowo przypisać zły connection string jeśli wiele zmiennych zawiera `postgresql://`. Rozwiązanie "magic auto-detection" jest niebezpieczne dla produkcji.

**Rekomendacja:** Usunąć auto-detection, wymagać jawnie `DATABASE_URL`.

---

## Podsumowanie v6

| Priorytet | Nowe | Nadal otwarte z v5 | Łącznie |
|-----------|------|-------------------|---------|
| 🔴 Krytyczne | 1 (V6-C2) | 1 (V5-C3→V6-C1) | 2 |
| 🟠 High | 4 | 1 (V5-M6→V6-H1) | 5 |
| 🟡 Medium | 7 | 4 (V5-M4,M5,M8,M10) | 11 |

### TOP priorytety:
1. **[V6-C1]** PDF — polskie znaki (nadal zepsute)
2. **[V6-C2]** KSEF_CONTEXT_NIP — hardcoded NIP może powodować błędny kontekst sesji KSeF
3. **[V6-H1]** Hasło min 8 przy accept invite — niezgodność z polityką
4. **[V6-H3]** Supplier NULL taxId — duplikaty dostawców przy imporcie
5. **[V6-H5]** GDPR anonymize N+1 — zamień na `updateMany`
