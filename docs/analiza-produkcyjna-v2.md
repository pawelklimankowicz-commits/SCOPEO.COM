# Scopeo SaaS — Analiza gotowości produkcyjnej v2
**Data analizy:** 14 kwietnia 2026  
**Poprzednia analiza:** 14 kwietnia 2026 (v1)  
**Commity od v1:** `bbd548a`, `291e9a6`, `6f76c2f`, `9efd7d5`, `723aa41`, `980fdd3`, `977624d`, `aa13cbe`

---

## CO SIĘ ZMIENIŁO OD POPRZEDNIEJ ANALIZY

Wszystkie 8 nowych commitów dotyczą **wyłącznie warstwy marketingowej i prawnej**. Żaden plik z rdzenia aplikacji nie został zmodyfikowany (`lib/`, `app/api/`, `prisma/`, `app/dashboard/`, `app/onboarding/`).

### ✅ Co zostało zrobione (postęp)
- Dodano kompletny pakiet dokumentów prawnych: Regulamin, Polityka prywatności, DPA (art. 28 RODO), Polityka cookies, Klauzule formularzy, hub `/prawne`, `/kontakt-prawny`
- Formularz demo (`LeadForm`) ma teraz: pole telefon (opcjonalne), wymagany checkbox akceptacji polityki prywatności, opcjonalne zgody marketingowe (email, telefon)
- Nowe API `/api/contact` waliduje dane formularza z Zod (w tym `acceptPrivacy: z.literal(true)`)
- Rozbudowane FAQ z kontekstem GHG Protocol, KOBIZE, CSRD i linkami do zewnętrznych źródeł
- Sekcja wideo na stronie głównej z polskimi napisami WebVTT
- `lib/legal.ts` — centralizacja stałych prawnych (nazwa firmy, emaile)

### ❌ Co nadal niezmienione
Wszystkie **krytyczne braki z analizy v1 pozostają nienaprawione**. Patrz sekcja poniżej.

---

## NOWE PROBLEMY WPROWADZONE W TYM CYKLU COMMITÓW

### 🔴 KRYTYCZNY: Formularz demo nie zapisuje leadów ani nie wysyła emaili
**Plik:** `app/api/contact/route.ts`  
**Problem:** To jest najbardziej kosztowny błąd biznesowy w całym projekcie. Endpoint `/api/contact` waliduje dane formularza przez Zod i zwraca `{ ok: true }` — ale **dosłownie nic więcej nie robi**. Żaden lead nie jest zapisywany do bazy danych, żaden email nie jest wysyłany do zespołu sprzedaży. Każde kliknięcie "Umów demo" na stronie głównej, /kontakt, /cennik i /dla-kogo kończy się cichym wyparowaniem danych.

```typescript
// OBECNY KOD — lead znika w nicości:
schema.parse(json);
return NextResponse.json({ ok: true }); // ← żadnego zapisu, żadnego emaila
```

**Wymagana poprawka:** Wybrać jeden z podejść:
- Wysyłanie emaila przez Resend/SendGrid (`resend.emails.send(...)`) na skrzynkę sprzedaży
- Zapis do tabeli `Lead` w bazie (wymaga nowego modelu w Prisma)
- Integracja z zewnętrznym CRM (HubSpot, Pipedrive) przez API
- Minimum: zapis do tabeli + email powiadomienie

### 🔴 KRYTYCZNY: Placeholder tekstu wyświetlany użytkownikom w Regulaminie
**Plik:** `lib/legal.ts`, `app/(marketing)/regulamin/page.tsx`  
**Problem:** W pliku `lib/legal.ts` pole `registryNote` zawiera:
```
'Pełne dane rejestrowe (KRS, NIP, REGON) oraz adres korespondencyjny — do publikacji produkcyjnej.'
```
Ten tekst deweloperski jest wstawiany bezpośrednio w treść Regulaminu (linia: `{LEGAL_COMPANY.registryNote}`). Każdy użytkownik odwiedzający `/regulamin` widzi wewnętrzną notatkę "do publikacji produkcyjnej". To dyskwalifikuje dokument prawnie i wizerunkowo.

**Wymagana poprawka:** Uzupełnić prawdziwe dane rejestrowe (KRS, NIP, REGON, pełny adres) przed jakimkolwiek publicznym uruchomieniem.

### 🔴 KRYTYCZNY: Polityka prywatności zawiera tekst zastępczy widoczny publicznie
**Plik:** `content/legal-documents.json`, sekcja "2. Administrator danych"  
**Problem:** Treść polityki prywatności zawiera wprost: *"Dane identyfikacyjne Administratora...powinny zostać uzupełnione przed publikacją dokumentu."* Ten fragment renderuje się na publicznej stronie `/polityka-prywatnosci` widocznej dla wszystkich użytkowników.

### 🟠 Brak zapisu zgód marketingowych — problem RODO
**Plik:** `components/marketing/LeadForm.tsx`, `app/api/contact/route.ts`  
**Problem:** Formularz zbiera `marketingEmail: boolean` i `marketingPhone: boolean` — ale dane te nie są nigdzie przechowywane (brak tabeli w bazie, brak CRM). Jeśli użytkownik udzieli zgody, a później poprosi o jej potwierdzenie (prawo RODO do dostępu do danych, art. 15), organizacja nie będzie w stanie udowodnić jej udzielenia ani daty. Brak rejestru zgód to naruszenie art. 7 ust. 1 RODO.

### 🟠 Data ostatniej aktualizacji Regulaminu hardcoded
**Plik:** `app/(marketing)/regulamin/page.tsx`, linia 24  
**Problem:**
```tsx
Ostatnia aktualizacja: {new Date().getFullYear()}-04-13
```
Rok jest dynamiczny, ale miesiąc i dzień są zakodowane na sztywno jako `-04-13`. W 2027 roku strona będzie wyświetlać "2027-04-13" bez żadnej zmiany w dokumencie. Regulamin powinien mieć statyczną, ręcznie aktualizowaną datę, nie generowaną dynamicznie.

### 🟠 Brak banera zgody na cookies (cookie consent)
**Problem:** Strona `/cookies` opisuje używanie plików cookies, ale brak jakiegokolwiek mechanizmu uzyskiwania zgody użytkownika (banner, modal, CMP). Ustawa o świadczeniu usług drogą elektroniczną + dyrektywa ePrivacy wymagają aktywnej zgody przed zapisem plików cookies analitycznych lub marketingowych. Publikacja strony bez tego mechanizmu jest niezgodna z prawem.

### 🟡 Plik wideo MP4 w repozytorium git (2,8 MB)
**Plik:** `public/marketing/scopeo-landing.mp4` (2 883 159 bajtów w repo)  
**Problem:** Binarne pliki mediów w repozytorium git: spowalniają każde `git clone`, nie są odtwarzalne przez CDN cache, rosną z każdą wersją. Przy aktualizacji wideo historia repo rośnie nieodwracalnie.  
**Poprawka:** Przeniesienie do Vercel Blob Storage, Cloudflare R2, lub innego CDN. W repo zostaje tylko URL.

### 🟡 Adresy email w legal.ts mogą nie działać
**Plik:** `lib/legal.ts`  
**Problem:** Zdefiniowane adresy (`hello@scopeo.pl`, `support@scopeo.pl`, `privacy@scopeo.pl`, `reklamacje@scopeo.pl`) są wyświetlane publicznie w dokumentach prawnych. Jeśli domena `scopeo.pl` lub skrzynki nie są skonfigurowane, użytkownicy będą wysyłali wiadomości w pustkę, a dostarczalność wymagań prawnych (np. żądań RODO) będzie niemożliwa do udowodnienia.

---

## STATUS PROBLEMÓW Z ANALIZY V1

### 🔴 Nadal krytyczne — NIENAPRAWIONE

| # | Problem | Status |
|---|---------|--------|
| 1.1 | `organizationId` z body requesta w importcie KSeF — luka bezpieczeństwa IDOR | ❌ nienaprawiony |
| 1.2 | Token KSeF w plaintext w bazie danych | ❌ nienaprawiony |
| 1.3 | Brak rate limiting na API | ❌ nienaprawiony |
| 1.4 | Brak brute force protection na logowaniu | ❌ nienaprawiony |
| 1.5 | Brak sanityzacji XML (XXE) | ❌ nienaprawiony |
| 1.6 | Brak nagłówków HTTP security (CSP, HSTS) | ❌ nienaprawiony |
| 1.7 | Biblioteka `xlsx` 0.18.5 z lukami CVE | ❌ nienaprawiony |
| 2.1 | Integracja z KSeF API de facto nie istnieje | ❌ nienaprawiony |
| 2.2 | Parser XML nie obsługuje różnych wersji FA | ❌ nienaprawiony |
| 3.1 | N+1 queries w `lib/emissions.ts` | ❌ nienaprawiony |
| 3.2 | Dashboard bez paginacji | ❌ nienaprawiony |

### 🟠 Nadal wysokie — NIENAPRAWIONE

| # | Problem | Status |
|---|---------|--------|
| 4.1 | `prisma db push` zamiast `prisma migrate` | ❌ nienaprawiony |
| 4.2 | JSON jako String zamiast jsonb | ❌ nienaprawiony |
| 4.3 | rawPayload bez limitu i szyfrowania | ❌ nienaprawiony |
| 4.4 | Brak indeksów DB | ❌ nienaprawiony |
| 5.1 | Brak eksportu (Excel, PDF, CSV) | ❌ nienaprawiony |
| 5.2 | Brak zarządzania użytkownikami i zaproszeń | ❌ nienaprawiony |
| 5.3 | Brak wizualizacji emisji (wykresy) | ❌ nienaprawiony |
| 5.4 | Brak filtrowania po roku raportowania | ❌ nienaprawiony |
| 5.5 | Brak powiadomień email w workflow review | ❌ nienaprawiony |
| 5.6 | OCR — wspomniane w marketingu, brak w kodzie | ❌ nienaprawiony |
| 6.1 | NLP oparty wyłącznie na słowach kluczowych | ❌ nienaprawiony |
| 6.2 | Brak polskich współczynników z KOBiZE/URE | ❌ nienaprawiony |
| 7.1 | Brak structured logging | ❌ nienaprawiony |
| 7.2 | Brak Sentry | ❌ nienaprawiony |
| 7.3 | Brak health check endpointu `/api/health` | ❌ nienaprawiony |
| 8.1 | Brak pipeline CI/CD (GitHub Actions) | ❌ nienaprawiony |
| 8.2 | Brak automatycznych backupów bazy | ❌ nienaprawiony |
| 8.3 | Brak Dockerfile produkcyjnego | ❌ nienaprawiony |
| 8.4 | `next-auth` v5 beta — niestabilne API | ❌ nienaprawiony |

### ✅ Częściowo zaadresowane z v1

| # | Problem | Status |
|---|---------|--------|
| 10.1 | Brak mechanizmu RODO — dokumentacja polityki | ✅ Dodano dokumenty prawne (politykę prywatności, DPA) — **ale brak technicznego mechanizmu usunięcia danych** |
| 10.2 | rawPayload bez szyfrowania | ⚠️ Wymieniony w polityce prywatności jako ryzyko, ale technicznie nienaprawiony |
| 10.3 | Brak rejestru przetwarzania | ✅ DPA i polityka prywatności jako dokumenty — brak rejestru operacyjnego |

---

## ZAKTUALIZOWANA LISTA PRIORYTETÓW

### Faza 0 — PRZED JAKIMKOLWIEK PUBLICZNYM URUCHOMIENIEM (blockers marketingowe)
1. **Uzupełnić dane rejestrowe** w `lib/legal.ts` (KRS, NIP, REGON, adres) — placeholder jest widoczny w Regulaminie
2. **Uzupełnić placeholder** w `content/legal-documents.json` sekcja "Administrator danych"
3. **Naprawić `/api/contact`** — dodać wysyłanie emaila (Resend/SendGrid) lub zapis do bazy — bez tego wszystkie leady demo są tracone
4. **Skonfigurować i przetestować skrzynki email** (`hello@scopeo.pl`, `privacy@scopeo.pl` itp.)
5. **Dodać baner cookies** — bez tego strona narusza prawo ePrivacy

### Faza 1 — BLOKERY BEZPIECZEŃSTWA (bez tego produkcja jest ryzykowna)
6. Naprawić IDOR: `organizationId` pobrać z sesji, nie z body requesta (ksef/import)
7. Zaszyfrować token KSeF (AES-256-GCM lub vault)
8. Dodać rate limiting na API i brute force protection na login
9. Naprawić N+1 queries w `lib/emissions.ts`
10. Przejść z `db push` na `prisma migrate deploy` z plikami migracji
11. Dodać nagłówki HTTP security (CSP, HSTS, X-Frame-Options)
12. Zaktualizować `xlsx` do bezpiecznej wersji lub wymienić na `exceljs`

### Faza 2 — KLUCZOWE FUNKCJE BIZNESOWE
13. Wdrożyć prawdziwą integrację z KSeF REST API (kluczowa obietnica produktu)
14. Dodać paginację na dashboardzie
15. Zaimplementować zarządzanie użytkownikami i zaproszenia przez email
16. Dodać eksport: Excel, PDF (wyniki kalkulacji emisji)
17. Dodać wykresy emisji (Scope 1/2/3 pie, trend)
18. Wdrożyć powiadomienia email w workflow review (Resend/SendGrid)
19. Filtrowanie kolejki review i dashboard po roku raportowania
20. Dodać zapis zgód marketingowych do bazy danych (tabela `MarketingConsent`)

### Faza 3 — DOJRZAŁOŚĆ OPERACYJNA
21. CI/CD pipeline w GitHub Actions (lint + build + test + prisma validate)
22. Structured logging (pino) + Sentry
23. Health check endpoint `/api/health`
24. Backup bazy danych — konfiguracja i test odtworzenia
25. Stabilizacja next-auth (v4 stable lub stable v5)
26. Dockerfile dla produkcji poza Vercel
27. Przeniesienie wideo z repozytorium na CDN (Vercel Blob / Cloudflare R2)
28. Polskie współczynniki emisji z KOBiZE/URE
29. Mechanizm usunięcia danych na żądanie (RODO art. 17) — endpoint `/api/account/delete`
30. Testy integracyjne API routes i testy e2e (Playwright)

---

## PODSUMOWANIE OCENY

| Obszar | Poprzednia ocena | Aktualna ocena | Zmiana |
|--------|-----------------|----------------|--------|
| Bezpieczeństwo aplikacji | 🔴 Krytyczne braki | 🔴 Krytyczne braki | = brak zmian |
| Integracja z KSeF | 🔴 Nie istnieje | 🔴 Nie istnieje | = brak zmian |
| Wydajność bazy | 🔴 N+1 queries | 🔴 N+1 queries | = brak zmian |
| Dokumentacja prawna | 🔴 Brak | 🟡 Dodana, wymaga uzupełnienia | ↑ poprawa |
| Lead capture (demo) | 🟠 Brak systemu | 🔴 Formularz istnieje ale NIE działa | ↓ pogorszenie* |
| Zgodność RODO (techniczna) | 🔴 Brak | 🟠 Dokumenty OK, technika brak | ↑ poprawa |
| Monitoring | 🔴 Brak | 🔴 Brak | = brak zmian |
| CI/CD | 🔴 Brak | 🔴 Brak | = brak zmian |
| UX i funkcje końcowe | 🟠 Minimalne | 🟠 Minimalne | = brak zmian |

*Formularz demo bez backendu to **aktywny problem biznesowy** — przed zmianami nie było formularza, teraz jest formularz który udaje że działa, a leady znikają bez śladu.

**Wniosek:** Praca wykonana w tym cyklu poprawiła stronę prawną i marketingową, ale aplikacja nadal nie spełnia wymagań produkcyjnych. Priorytetem powinno być teraz naprawienie backendu `/api/contact` (tracone leady) oraz usunięcie placeholder tekstów z dokumentów prawnych — oba zadania można wykonać w ciągu kilku godzin.

---

*Raport wygenerowany na podstawie pełnej analizy kodu źródłowego. 14.04.2026.*
