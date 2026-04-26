# Scopeo SaaS — Analiza gotowości produkcyjnej
**Data analizy:** 14 kwietnia 2026  
**Analizowane pliki:** cały kod źródłowy (app/, lib/, prisma/, components/, tests/, docs/)  
**Wersja:** 0.9.2 (package.json)

---

## PODSUMOWANIE WYKONAWCZE

Aplikacja ma solidne jądro funkcjonalne: parsowanie XML KSeF, NLP mapping, workflow review z audit trail, import współczynników EPA/UK i kalkulacja emisji Scope 1–3. Jednak w obecnym stanie **nie nadaje się do wdrożenia produkcyjnego**. Poniżej opisano 11 obszarów wymagających pracy, oznaczonych priorytetem: 🔴 KRYTYCZNY, 🟠 WYSOKI, 🟡 ŚREDNI.

---

## 1. 🔴 BEZPIECZEŃSTWO — KRYTYCZNE BRAKI

### 1.1 Brak walidacji właściciela organizacji przy imporcie XML
**Plik:** `app/api/ksef/import/route.ts`, linia 14–15  
**Problem:** `organizationId` pochodzi z **body requesta** (`parsed.organizationId`), a nie z sesji użytkownika. Atakujący zalogowany jako użytkownik organizacji A może wysłać request z `organizationId` organizacji B i importować faktury do cudzego tenanta. Brak sprawdzenia czy `parsed.organizationId === session.user.organizationId`.  
**Poprawka:** Usunąć `organizationId` ze schematu `importInvoicesSchema` i zawsze pobierać go z sesji, analogicznie jak w `emissions/calculate/route.ts`.

### 1.2 KSeF Token przechowywany w jawnym tekście
**Plik:** `app/api/onboarding/route.ts`, `prisma/schema.prisma` — pole `ksefTokenMasked`  
**Problem:** Pole nazywa się `ksefTokenMasked`, ale w kodzie onboardingu token jest zapisywany bezpośrednio bez żadnego maskowania ani szyfrowania. Pełen token API w bazie danych — wyciek bazy = wyciek dostępu do KSeF klienta.  
**Poprawka:** Szyfrowanie AES-256-GCM kluczen z env (`ENCRYPTION_KEY`), przechowywanie tylko zaszyfrowanego bloba. Alternatywnie: dedykowany vault (np. Doppler, AWS Secrets Manager).

### 1.3 Brak rate limiting na endpointach API
**Dotyczy:** Wszystkich tras `/api/*`  
**Problem:** Brak jakiegokolwiek rate limitingu. Endpoint `/api/ksef/import` przyjmuje dowolnie duże i liczne requesty. Endpoint logowania (`/login`) nie ma ochrony przed brute force. Możliwy DoS i masowe próby łamania haseł.  
**Poprawka:** Biblioteka `@upstash/ratelimit` (Redis) lub middleware Next.js z licznikiem na IP/userId.

### 1.4 Brak brute force protection na logowaniu
**Plik:** `app/(auth)/login/page.tsx` — `loginAction`  
**Problem:** Brak blokady po N nieudanych próbach logowania. Atakujący może próbować haseł bez ograniczeń.

### 1.5 Brak sanityzacji XML (XXE attack)
**Plik:** `lib/ksef-xml.ts`  
**Problem:** `xml2js.parseStringPromise` parsuje XML bez wyłączenia external entity processing. Możliwy atak XML External Entity (XXE), który może odczytać pliki systemowe serwera.  
**Poprawka:** Konfiguracja `xml2js` z `explicitCharkey: true` i upewnić się że używana wersja nie procesuje `DOCTYPE` / external entities, lub zamienić na bibliotekę odporną na XXE.

### 1.6 Brak Content Security Policy (CSP)
**Plik:** `next.config.ts`  
**Problem:** Brak nagłówków bezpieczeństwa HTTP (CSP, HSTS, X-Frame-Options, X-Content-Type-Options). Aplikacja jest podatna na XSS i clickjacking.  
**Poprawka:** Dodać `headers()` w `next.config.ts` z odpowiednimi nagłówkami.

### 1.7 Biblioteka `xlsx` w wersji z lukami bezpieczeństwa
**Plik:** `package.json` — `"xlsx": "^0.18.5"`  
**Problem:** SheetJS/xlsx 0.18.x ma znane podatności (CVE). Wersja community jest niezalecana do użycia produkcyjnego z niezaufanymi plikami.  
**Poprawka:** Aktualizacja do wersji pro (`xlsx-js-style`) lub zamiana na `exceljs` (aktywnie utrzymywana, brak znanych CVE).

---

## 2. 🔴 KRYTYCZNY BRAK FUNKCJONALNY — INTEGRACJA Z KSEF

### 2.1 Token KSeF zbierany, ale w ogóle nieużywany
**Pliki:** `components/onboarding/wizard-step.tsx` (pole tokenu), `app/api/onboarding/route.ts` (zapis), `lib/ksef-xml.ts`  
**Problem:** Główna obietnica produktu ("import z KSeF") jest w rzeczywistości **ręcznym wklejaniem XML w textarea**. Token KSeF jest zbierany podczas onboardingu i przechowywany, ale nigdzie w kodzie nie ma żadnego wywołania API KSeF. Użytkownik musi ręcznie pobrać XML z systemu KSeF i wkleić go do pola tekstowego w dashboardzie. To nie jest "automatyczny import z KSeF" opisany w marketingu.  
**Wymagane:** Implementacja klienta REST API KSeF (środowisko test: `https://ksef-test.mf.gov.pl/api`, produkcja: `https://ksef.mf.gov.pl/api`). Kluczowe endpointy: sesja interaktywna, pobieranie listy faktur, pobieranie pojedynczego XML.

### 2.2 Brak obsługi różnych wersji schematu FA
**Plik:** `lib/ksef-xml.ts`  
**Problem:** Parser obsługuje uproszczony schemat. Faktury KSeF występują w wersjach FA(1), FA(2), FA(3), FA(4) — każda ma inną strukturę elementów. Produkcyjna implementacja musi obsłużyć różnice w polach, strukturze wierszy i załącznikach.

---

## 3. 🔴 WYDAJNOŚĆ — KRYTYCZNE N+1 QUERIES

### 3.1 Pętla z zapytaniami do bazy w kalkulatorze emisji
**Plik:** `lib/emissions.ts`, linia 10  
**Problem:** Dla każdej linii faktury wykonywane jest osobne zapytanie `prisma.emissionFactor.findUnique()` wewnątrz pętli `for`. Przy 1000 liniach faktur = 1000+ round-tripów do bazy danych. Aplikacja zawiesi się przy jakimkolwiek wolumenie produkcyjnym.  
```typescript
// OBECNY KOD (błędny):
for (const line of lines) {
  const factor = factorId ? await prisma.emissionFactor.findUnique(...) : null;
  // ...
}
```
**Poprawka:** Zebrać wszystkie `factorId` z góry, wykonać jedno zapytanie `findMany({ where: { id: { in: factorIds } } })`, zbudować mapę `id -> factor`, i używać mapy w pętli.

### 3.2 Dashboard pobiera wszystkie faktury bez paginacji
**Plik:** `app/dashboard/page.tsx`, linia 17–29  
**Problem:** `prisma.invoice.findMany()` bez `take`/`skip` pobiera absolutnie wszystkie faktury organizacji z wszystkimi relacjami. Przy 500 fakturach z 10 liniami każda = 5000 rekordów ładowanych przy każdym wejściu na dashboard.  
**Poprawka:** Paginacja server-side, domyślnie ostatnie 50 faktur, z opcją "załaduj więcej".

---

## 4. 🟠 BAZA DANYCH

### 4.1 Brak migracji — używane `prisma db push`
**Problem:** `prisma db push` niszczy dane przy zmianach schematu i nie zostawia historii. W produkcji konieczne jest `prisma migrate deploy` z plikami migracji w repozytorium. Bez tego każda zmiana schematu jest ryzykiem utraty danych.  
**Poprawka:** Przejście na `prisma migrate dev` (development) i `prisma migrate deploy` (CI/CD).

### 4.2 JSON zapisywany jako string zamiast JSON column
**Problem:** Pola `summaryJson`, `diffJson`, `tokensJson`, `metadataJson`, `validationJson`, `rawPayload` są zadeklarowane jako `String` w Prisma, nie jako `Json`. PostgreSQL ma natywny typ `jsonb` który:
- kompresuje dane,
- umożliwia indeksowanie po zawartości,
- waliduje poprawność JSON przy zapisie.
**Poprawka:** Zmiana typów na `Json` w schema.prisma (Prisma obsługuje `@db.JsonB`).

### 4.3 rawPayload — pełny XML w bazie bez limitu rozmiaru
**Problem:** Pełny XML faktury KSeF jest zapisywany w polu `rawPayload` jako string bez żadnego limitu. Duże faktury z wieloma pozycjami, załącznikami lub danymi binarnymi mogą mieć setki KB. Brak kompresji, brak limitu.  
**Poprawka:** Kompresja (gzip) przed zapisem lub przeniesienie `rawPayload` do osobnego storage (S3/Cloudflare R2) z referencją URL w bazie.

### 4.4 Brak indeksów na kolumnach często filtrowanych
**Problem:** Brak jawnych indeksów na: `InvoiceLine.scope`, `InvoiceLine.categoryCode`, `MappingDecision.status`, `ReviewEvent.createdAt`, `Invoice.issueDate`. Zapytania na produkcji będą robić full table scan.

---

## 5. 🟠 BRAK KLUCZOWYCH FUNKCJI PRODUKTOWYCH

### 5.1 Brak eksportu danych
**Problem:** Nie ma możliwości wyeksportowania wyników kalkulacji emisji do żadnego formatu. Użytkownik końcowy potrzebuje: eksport do Excel (do dalszej pracy), eksport do PDF (raport dla zarządu/audytora), eksport do CSV (dla zewnętrznych systemów raportowania ESG).

### 5.2 Brak zarządzania użytkownikami i zaproszeniami
**Problem:** Nie ma UI ani API do zapraszania kolejnych użytkowników do organizacji. Jedyny sposób na dodanie użytkownika to... brak takiej opcji. Schemat Prisma ma role (ANALYST, REVIEWER, APPROVER), ale nie ma mechanizmu ich przypisywania po rejestracji. Firma ma 1 właściciela i nie może dodać zespołu ESG/finansów.

### 5.3 Brak wizualizacji emisji
**Problem:** Wynik kalkulacji emisji wyświetlany jest jako surowy JSON w `<pre>`. Brak jakichkolwiek wykresów (wykres kołowy Scope 1/2/3, trend miesięczny, top 10 kategorii). Produkt docelowy ma być używany przez CFO i ESG managerów — surowy JSON to nie jest UI dla tych osób.

### 5.4 Brak obsługi wielu lat raportowania
**Problem:** Kalkulacja emisji działa na WSZYSTKICH fakturach organizacji jednocześnie, bez filtrowania po roku raportowania. Firma raportująca za 2024 i 2025 zobaczy zsumowane emisje z obu lat.

### 5.5 Brak powiadomień email
**Problem:** System review workflow zakłada współpracę zespołu — ale nie ma żadnych emaili (przypisanie do recenzenta, prośba o zmiany, zatwierdzenie). Recenzent musi logować się i samodzielnie sprawdzać kolejkę.

### 5.6 Brak obsługi faktur spoza KSeF (OCR)
**Problem:** Marketing strony mówi o "OCR dokumentów", ale w kodzie nie ma żadnej implementacji OCR. Faktury papierowe, zagraniczne, sprzed KSeF — nie mogą być przetworzone.

---

## 6. 🟠 SILNIK NLP — NIEWYSTARCZAJĄCY DLA PRODUKCJI

### 6.1 Klasyfikacja oparta wyłącznie na keywordach
**Plik:** `lib/nlp-mapping.ts`  
**Problem:** Cały "silnik NLP" to lista słów kluczowych z ręcznie przypisanymi kategoriami. Nie ma:
- obsługi synonimów i odmian słownych (np. "elektryczność", "prąd", "energia el." → ten sam wynik),
- uczenia na podstawie decyzji review (system nie uczy się z poprawek),
- obsługi nowych kategorii bez edycji kodu,
- rankingu kandydatów przy konflikcie reguł.

Fallback rule (`scope3_cat1_purchased_services`, confidence 0.45) będzie przypisywany do bardzo wielu linii faktur, zalewając kolejkę review niepotrzebnymi pozycjami.

### 6.2 Brak polskich współczynników emisji z oficjalnych źródeł
**Problem:** Nakładka PL (`addPolandRegionalOverlays`) ma tylko 2 hardcoded współczynniki (energia elektryczna: 0.72, ciepło: 0.28). Brak: paliw silnikowych PL, ciepła sieciowego per miasto, współczynników KOBiZE dla poszczególnych branż. Wartość 0.72 kgCO2e/kWh jest orientacyjna — oficjalne dane URE/KOBiZE są inne i zmieniają się co rok.

---

## 7. 🟠 MONITORING I LOGGING

### 7.1 Brak structured logging
**Problem:** Wszystkie bloki `catch` tylko zwracają `error.message` przez API. Nie ma żadnego logowania na poziomie serwera. Gdy coś się posypie na produkcji, nie będzie żadnych logów do debugowania.  
**Poprawka:** Dodać bibliotekę `pino` lub `winston` z output JSON. Logować: userId, organizationId, endpoint, status, czas odpowiedzi.

### 7.2 Brak Sentry (wspomnianego w go-live-checklist)
**Problem:** `docs/go-live-checklist.md` wymienia "Sentry alerts tested" jako wymaganie, ale Sentry nie jest zainstalowane w projekcie (`package.json`). Brak `@sentry/nextjs`.

### 7.3 Brak health check endpointu
**Problem:** Brak `/api/health` lub `/api/healthz`. Niezbędne dla load balancerów, orchestratorów (Kubernetes), monitoring tools.

### 7.4 Brak metryk wydajności
**Problem:** Brak żadnego instrumentowania (czas importu, czas kalkulacji, liczba linii na request). Niemożliwe jest wykrycie degradacji wydajności.

---

## 8. 🟠 CI/CD I INFRASTRUKTURA

### 8.1 Brak pipeline CI/CD
**Problem:** `docs/go-live-checklist.md` wymaga "branch protection" i "required checks" — ale brak pliku `.github/workflows/ci.yml`. Testy można uruchomić lokalnie, ale nie ma automatycznej weryfikacji przy PR.  
**Poprawka:** GitHub Actions z: `npm run lint`, `npm run build`, `npm test`, `prisma validate`.

### 8.2 Brak automatycznych backupów bazy
**Problem:** Wspomniane w go-live-checklist ("Database backups verified") ale nieimplementowane. Na Neon/Supabase są wbudowane, ale trzeba je skonfigurować i przetestować odtworzenie.

### 8.3 Brak Dockerfile dla produkcji
**Problem:** Jest `docker-compose.yml` dla lokalnej bazy PostgreSQL, ale brak `Dockerfile` dla samej aplikacji. Wdrożenie poza Vercel (własny serwer, Kubernetes) wymaga obrazu Docker.

### 8.4 Zależności: next-auth w wersji beta
**Plik:** `package.json` — `"next-auth": "^5.0.0-beta.25"`  
**Problem:** NextAuth v5 jest w wersji beta. Nie nadaje się do produkcji — API może się zmienić, mogą być bugi.  
**Poprawka:** Powrót do stabilnej v4 (`next-auth@^4.24`) lub poczekanie na stable v5.

---

## 9. 🟡 UX I INTERFACE

### 9.1 Dashboard wymaga technicznej wiedzy
**Problem:** Import XML wymaga ręcznego wklejenia kodu XML. Wynik kalkulacji to surowy JSON. Tabele bez filtrowania i sortowania. Aplikacja nadaje się tylko dla developera testującego — nie dla końcowego użytkownika (ESG manager, księgowy).

### 9.2 Brak obsługi błędów w UI
**Problem:** Błędy API są wyświetlane jako surowy JSON w `<pre>`. Brak przyjaznych komunikatów błędów, brak loading states poza importem.

### 9.3 Brak responsywności mobilnej
**Problem:** Układ grid-2/grid-3 z tabelami nie jest responsywny. Aplikacja nie nadaje się do użycia na telefonie/tablecie.

### 9.4 Brak filtrowania i sortowania w kolejce review
**Problem:** ReviewPanel wyświetla wszystkie linie do review bez możliwości filtrowania po statusie, kategorii, dostawcy, dacie.

---

## 10. 🟡 COMPLIANCE I RODO

### 10.1 Brak mechanizmu usunięcia danych (Right to be Forgotten)
**Problem:** RODO art. 17 wymaga możliwości usunięcia danych osobowych na żądanie. Faktury w KSeF zawierają dane osobowe (imię i nazwisko, NIP). Brak endpointu `/api/account/delete` ani procedury anonimizacji.

### 10.2 rawPayload z danymi osobowymi bez szyfrowania
**Problem:** Pełny XML faktury (z danymi nabywcy, sprzedawcy, wartościami) jest przechowywany jako plaintext w bazie danych. Wyciek bazy = wyciek danych osobowych klientów firmy.

### 10.3 Brak rejestru przetwarzania danych (RODO art. 30)
**Problem:** Aplikacja przetwarza dane osobowe z faktur, ale brak dokumentacji wewnętrznego rejestru przetwarzania i polityki retencji danych.

---

## 11. 🟡 TESTY

### 11.1 Brak testów integracyjnych dla API routes
**Problem:** Testy jednostkowe obejmują parsery i review workflow — to dobry start. Ale brak testów dla: `POST /api/ksef/import`, `POST /api/emissions/calculate`, `POST /api/review/update`. Błędy w logice API mogą przejść niezauważone.

### 11.2 Brak testów e2e (end-to-end)
**Problem:** Brak Playwright/Cypress. Podstawowe scenariusze (rejestracja → onboarding → import → review → kalkulacja) nie są automatycznie testowane.

### 11.3 Pokrycie testami NLP zbyt małe
**Problem:** `nlp-mapping.ts` nie ma testów dla edge case'ów: opisów mieszanych (np. "Transport i hotel"), opisów po angielsku, opisów z polskimi znakami, bardzo krótkich opisów (1-2 słowa).

---

## LISTA PRIORYTETÓW DO WDROŻENIA

### Faza 1 — BLOKERY (bez tego aplikacja nie powinna iść na produkcję)
1. Naprawić lukę bezpieczeństwa z `organizationId` w body importu XML
2. Zaszyfrować token KSeF przed zapisem do bazy
3. Dodać rate limiting na endpointach API i brute force protection na logowaniu
4. Naprawić N+1 queries w `lib/emissions.ts`
5. Przejść z `db push` na `prisma migrate` z plikami migracji
6. Dodać nagłówki HTTP security (CSP, HSTS)
7. Zaktualizować bibliotekę `xlsx` lub zamienić na `exceljs`

### Faza 2 — KLUCZOWE FUNKCJE (wymagane dla użytkowników pilotażowych)
8. Implementacja prawdziwej integracji z API KSeF (pobieranie faktur zamiast ręcznego XML)
9. Dodać paginację na dashboardzie
10. Dodać zarządzanie użytkownikami i zaproszenia (email invite)
11. Dodać eksport do Excel i PDF
12. Podstawowe wykresy emisji (Scope 1/2/3 pie chart, trend)
13. Filtrowanie kolejki review po statusie
14. Powiadomienia email (SendGrid/Resend) przy przypisaniu do review

### Faza 3 — DOJRZAŁOŚĆ PRODUKCYJNA
15. CI/CD pipeline w GitHub Actions
16. Structured logging (pino/winston) + Sentry
17. Health check endpoint
18. Backup bazy danych (weryfikacja i testowanie odtworzenia)
19. Migracja `next-auth` do stable v4 lub poczekanie na stable v5
20. Szyfrowanie `rawPayload` lub przeniesienie do zewnętrznego storage
21. Polskie współczynniki emisji z KOBiZE/URE
22. Testy integracyjne dla API routes
23. Mechanizm usunięcia konta i danych (RODO art. 17)
24. Dockerfile dla produkcji poza Vercel

---

*Raport wygenerowany przez analizę kodu źródłowego 14.04.2026.*
