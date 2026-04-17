# Scopeo SaaS — Roadmap Przed-Lansowy
> Wersja: 1.0 | Data: 2026-04-15  
> Kontekst: Solo founder, timeline 1–2 miesiące, spółka zwolniona z VAT, pełna automatyzacja

---

## Diagnoza punktu startowego

Po wdrożeniu poprawek z v7 Scopeo będzie gotowy technicznie w ~85%. Pozostałe 15% to nie błędy w kodzie — to brakujące elementy go-to-market: prawne, operacyjne i sprzedażowe. Ten dokument definiuje co konkretnie trzeba zrobić przed ogłoszeniem produktu światu.

---

## Blok 1 — Twarde blokery (bez nich nie można wystartować)

### 1.1 Stripe — konfiguracja dla spółki zwolnionej z VAT

Jako spółka zwolniona z VAT w Polsce (do 240k PLN obrotu) masz specyficzną sytuację prawno-podatkową w kontekście Stripe:

**Co musisz zrobić:**

1. **Stripe Tax — wyłącz lub skonfiguruj ostrożnie.** Jeśli Stripe Tax jest włączony z automatycznym naliczaniem VAT, będzie doliczał 23% VAT do faktur dla polskich klientów — a Ty jako podmiot zwolniony nie możesz tego robić. W Stripe Dashboard → Tax → upewnij się że jesteś na "Manual tax rates" lub wyłącz Stripe Tax.

2. **Stripe Invoice Settings** — w Dashboard → Settings → Invoices → ustaw:
   - Footer: "Sprzedawca zwolniony z podatku VAT na podstawie art. 113 ust. 1 ustawy z dnia 11 marca 2004 r. o podatku od towarów i usług"
   - Bez pola VAT number (lub puste)

3. **Nie wymagaj NIP klienta w checkout** — jeśli Stripe Billing pyta o VAT ID klienta, wyłącz to dla rynku polskiego. B2B polskie firmy będą chciały NIP na fakturze — ale **Stripe nie jest KSeF-em** i nie zastępuje faktury VAT. Twoje paragony Stripe to nie polskie faktury VAT dla firm.

4. **Regulamin → sekcja "Fakturowanie"** — napisz wprost: "Scopeo nie jest płatnikiem VAT. Faktury wystawiane przez Stripe nie stanowią faktury VAT w rozumieniu polskiego prawa podatkowego. Klienci B2B potrzebujący faktury VAT powinni skontaktować się z doradcą podatkowym."

5. **Przekroczenie progu 240k** — monitoruj przychody. Po przekroczeniu musisz w ciągu 7 dni zarejestrować się jako płatnik VAT i zmienić konfigurację Stripe. Ustaw alert przy ~200k PLN rocznego przychodu.

**Stripe Products & Prices — musisz stworzyć ręcznie w Dashboard:**

| Plan | Price ID env | Monthly PLN | Annual PLN | Trial |
|------|-------------|-------------|------------|-------|
| MIKRO | STRIPE_PRICE_ID_MIKRO_MONTHLY/ANNUAL | 149 | 119×12 | 7 dni |
| STARTER | STRIPE_PRICE_ID_STARTER_MONTHLY/ANNUAL | 279 | 223×12 | 7 dni |
| GROWTH | STRIPE_PRICE_ID_GROWTH_MONTHLY/ANNUAL | 499 | 399×12 | 7 dni |
| SCALE | STRIPE_PRICE_ID_SCALE_MONTHLY/ANNUAL | 849 | 679×12 | 7 dni |

Pamiętaj: ceny w Stripe ustawiasz w GROSZACH (14900, 27900, itd.) i waluta: PLN.

### 1.2 Zmienne środowiskowe produkcyjne — kompletna lista

Przed deploy'em na produkcję **każda** z tych zmiennych musi być ustawiona:

```env
# Auth
NEXTAUTH_SECRET=<64 znaki losowe, openssl rand -hex 32>
NEXTAUTH_URL=https://app.scopeo.com

# Database
DATABASE_URL=postgresql://...

# Stripe (10 Price IDs + 3 klucze)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_MIKRO_MONTHLY=price_...
STRIPE_PRICE_ID_MIKRO_ANNUAL=price_...
STRIPE_PRICE_ID_STARTER_MONTHLY=price_...
STRIPE_PRICE_ID_STARTER_ANNUAL=price_...
STRIPE_PRICE_ID_GROWTH_MONTHLY=price_...
STRIPE_PRICE_ID_GROWTH_ANNUAL=price_...
STRIPE_PRICE_ID_SCALE_MONTHLY=price_...
STRIPE_PRICE_ID_SCALE_ANNUAL=price_...
STRIPE_TRIAL_DAYS=7

# KSeF
KSEF_API_BASE_URL=https://ksef.mf.gov.pl/api
KSEF_FETCH_TIMEOUT_MS=10000
KSEF_FETCH_MAX_ATTEMPTS=2
KSEF_TOKEN_ENCRYPTION_KEY=<32 bajty base64>

# Email
RESEND_API_KEY=re_...
EMAIL_FROM=noreply@scopeo.com

# Redis (rate limiting)
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...

# Monitoring
SENTRY_DSN=https://...
HEALTH_CHECK_SECRET=<losowe 32 znaki>

# App
NEXT_PUBLIC_APP_URL=https://app.scopeo.com
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

### 1.3 Domeny i DNS

- `scopeo.com` → strona marketingowa (landing + cennik + blog)
- `app.scopeo.com` → aplikacja Next.js
- `mail.scopeo.com` → rekordy SPF/DKIM/DMARC dla Resend

Jeśli teraz wszystko jest na jednej domenie/Vercel — rozdziel przed startem. Landing na Vercel, aplikacja na Vercel (osobny projekt) lub Railway/Render dla lepszej kontroli.

### 1.4 Regulamin i Polityka Prywatności — wersja produkcyjna

Sprawdziłem `scopeo-legal-pages.html` — ten plik istnieje w repo. Przed startem:

1. Upewnij się że regulamin zawiera:
   - Dane sprzedawcy (pełna nazwa spółki, KRS, NIP, adres siedziby)
   - Ceny planów (zgodne z nowym cennikiem)
   - Zasady trialu 7-dniowego
   - Politykę zwrotów (rekomendacja: 14-dniowy zwrot bez pytań — buduje zaufanie)
   - Informację o VAT-zwolnieniu
   - Prawa do rozwiązania subskrypcji

2. Polityka Prywatności:
   - Administrator danych: Twoja spółka (pełne dane)
   - Cele przetwarzania: rejestracja, billing, KSeF import
   - Podmioty trzecie: Stripe (USA — Standard Contractual Clauses), Resend, Sentry, Upstash
   - Prawa RODO: dostęp, usunięcie, przeniesienie — linki do funkcji w aplikacji
   - Polityka cookies

3. Umieść linki w stopce aplikacji i landingu — przed wejściem na płatny plan użytkownik musi zaakceptować regulamin (checkbox w checkout lub przy rejestracji).

### 1.5 Weryfikacja KSeF produkcyjnego

Produkcyjne KSeF (`ksef.mf.gov.pl`) różni się od testowego (`ksef-test.mf.gov.pl`):
- Wymaga prawdziwego certyfikatu/tokenu podpisanego przez MF
- Endpoint InitToken ma inne nagłówki autoryzacyjne
- Odpowiedzi mogą mieć inne kody błędów

Przed startem przetestuj `fetchKsefInvoiceXml` z prawdziwym tokenem produkcyjnym (Twoją własną firmą) zanim klient to zrobi. Sprawdź czy `KSEF_API_BASE_URL` w produkcji wskazuje na `ksef.mf.gov.pl`, nie test.

---

## Blok 2 — Automatyczny onboarding bot

To jest Twój główny kanał sprzedaży zamiast ręcznych demo. Oto pełna architektura:

### 2.1 Filozofia: "Zero Touch Sales"

Klient trafia na stronę → rejestruje się → system automatycznie prowadzi go przez:
1. Rejestrację (email + hasło)
2. Wizard onboardingowy (4 kroki — już zaimplementowany)
3. Pierwsze połączenie KSeF
4. Pierwszy import faktur
5. Pierwszy raport śladu węglowego

Każdy krok, w którym klient "utknął", triggeruje automatyczny email.

### 2.2 Sekwencja emaili onboardingowych (Resend)

Zaimplementuj serię 7 emaili opartych na akcjach (behavioral triggers), nie na czasie:

```
Trigger: Rejestracja
→ Email 1 (natychmiast): "Witaj w Scopeo — zacznij tutaj" 
  Treść: 3 kroki do pierwszego raportu, link do dashboardu

Trigger: Email 1 otwarty, ale wizard nie ukończony po 24h
→ Email 2: "Twój ślad węglowy czeka — zostało tylko kilka minut"
  Treść: gif pokazujący jak działa wizard, przycisk "Wróć do konfiguracji"

Trigger: Wizard ukończony, ale brak połączenia KSeF po 48h
→ Email 3: "Jak podłączyć KSeF — krok po kroku"
  Treść: instrukcja z API MF, link do sekcji Integracje

Trigger: KSeF podłączony, brak importu faktur po 24h
→ Email 4: "Twoje faktury czekają na import"
  Treść: przycisk "Importuj teraz", info ile danych możesz przeanalizować

Trigger: Faktury zaimportowane, brak raportu po 48h
→ Email 5: "Twój pierwszy raport Scope 3 jest gotowy do wygenerowania"
  Treść: screenshot przykładowego raportu, przycisk "Wygeneruj"

Trigger: Trial kończy się za 3 dni
→ Email 6: "Twój bezpłatny okres próbny kończy się za 3 dni"
  Treść: podsumowanie co zrobiłeś w trialu, CTA "Wybierz plan"

Trigger: Trial wygasł, brak subskrypcji
→ Email 7 (po 24h od wygaśnięcia): "Wróć do Scopeo — specjalna oferta"
  Treść: pytanie co przeszkodziło, link do wyboru planu
```

**Jak zaimplementować:** Użyj Resend z `scheduledAt` lub zewnętrznego crona (Vercel Cron Jobs — bezpłatne). Każde zdarzenie w aplikacji zapisuj do tabeli `OnboardingEvent` lub sprawdzaj state w istniejących modelach.

### 2.3 Interaktywny bot w aplikacji (opcjonalnie, etap 2)

Na potrzeby startu wystarczą emaile. W etapie 2 (po walidacji) rozważ:
- Intercom lub Crisp (bezpłatny plan) z chatbotem FAQ
- Własny widget `<OnboardingAssistant />` — wyskakuje gdy klient jest na stronie >60s bez akcji

### 2.4 Automatyczna sekwencja follow-up po trialu (non-converters)

Klienci którzy nie konwertowali po trialu to cenne dane. Zbuduj prostą automatyzację:

```
Dzień 7 po wygaśnięciu trialu:
→ Email: "Dlaczego Scopeo nie był dla Ciebie?" 
  (1 pytanie + pole tekstowe → POST /api/feedback)

Dzień 14:
→ Email: "Zmieniły się przepisy — CSRD wymaga raportowania od 2025"
  (edukacyjny, nie sprzedażowy)

Dzień 30:
→ Email: "Nowe funkcje w Scopeo — może teraz to dobry moment?"
```

---

## Blok 3 — Strona marketingowa przed startem

### 3.1 Co musi być na landingu (bez tego nie konwertujesz)

Sprawdź `/` (strona główna) pod kątem:

**Above the fold (bez scrollowania):**
- Headline: co to jest, dla kogo, jaki problem rozwiązuje (max 10 słów)
- Subheadline: konkretna obietnica (np. "Automatyczny ślad węglowy z Twoich faktur KSeF — bez arkuszy Excel")
- CTA: "Zacznij bezpłatny trial 7 dni" (nie "Dowiedz się więcej")
- Social proof: nawet jeśli nie masz klientów — "Zgodny z CSRD 2025", "Integracja z KSeF MF"

**Sekcje obowiązkowe:**
1. Problem/rozwiązanie (3 bullet points: "Raportowanie GHG zajmowało Ci tygodnie → Scopeo robi to automatycznie")
2. Jak to działa (3 kroki z ikonami — już masz wizualizacje)
3. Cennik (PricingTable — musi być zaktualizowany, V7-C1!)
4. FAQ (min. 8 pytań — patrz niżej)
5. CTA końcowy + trust signals

**FAQ — kluczowe pytania dla polskiego rynku B2B:**
- "Co to jest Scope 3 i dlaczego mnie dotyczy?"
- "Czy CSRD obowiązuje moją firmę?"
- "Jak Scopeo używa moich danych z KSeF?"
- "Czy moje dane fakturowe są bezpieczne?"
- "Czy potrzebuję specjalisty ds. ESG żeby używać Scopeo?"
- "Co się dzieje po wygaśnięciu trialu?"
- "Jak wygląda faktura za Scopeo (VAT)?"
- "Czy mogę anulować w dowolnym momencie?"

### 3.2 SEO — podstawy przed startem

Rynek docelowy szuka po polsku. Zidentyfikuj 10 kluczowych fraz:

**Wysokie intent (kupujący):**
- "kalkulator śladu węglowego firma"
- "raport CSRD oprogramowanie"
- "scope 3 emisje oprogramowanie polskie"
- "GHG protocol oprogramowanie SaaS"

**Edukacyjne (świadomość):**
- "co to jest scope 3 emisje"
- "CSRD wymogi 2025 polska"
- "jak obliczyć ślad węglowy firmy"
- "KSeF a ślad węglowy"

Stwórz minimum 3 artykuły blogowe przed startem (Google indeksuje je w ~4-6 tygodni):
1. "CSRD 2025 — kogo dotyczy i od kiedy"
2. "Jak automatycznie obliczyć emisje Scope 3 z faktur"
3. "KSeF + ESG — nieoczekiwana synergia danych"

### 3.3 LinkedIn — główny kanał B2B

Jako solo founder bez budżetu reklamowego LinkedIn organic to najskuteczniejszy kanał:

- Profil personal (Twój) > profil firmowy — ludzie kupują od ludzi
- Plan: 3 posty tygodniowo przez 8 tygodni przed startem
- Tematy: "budowanie Scopeo w public" (build-in-public lite — bez ujawniania produktu, tylko insights z rynku ESG)
- Format: "Wiedziałeś, że polska firma XXX musi raportować emisje do 2025? Oto co musisz wiedzieć..." + infografika

Nie musisz ujawniać produktu — możesz budować audiencję ESG-świadomą zanim ogłosisz launch.

---

## Blok 4 — Monitoring operacyjny (solo founder musi wiedzieć co się dzieje)

### 4.1 Alerty produkcyjne — minimum viable monitoring

Zaimplementuj alerty przez Sentry lub bezpośrednio przez Resend:

```typescript
// Natychmiastowy alert email gdy:
// 1. Webhook Stripe nie obsłużony (status 500)
// 2. KSeF import failure (> 50% faktur z błędem)
// 3. Rejestracja użytkownika (wiedz o każdym nowym kliencie!)
// 4. Pierwsza płatność (webhook invoice.paid)
// 5. Churned klient (webhook customer.subscription.deleted)
// 6. DB response time > 2s (health endpoint)
```

### 4.2 Dashboard solo-foundera (bez Mixpanela)

Na początku wystarczy prosta strona `/admin` (chroniona IP lub HEALTH_CHECK_SECRET):

```
Metryki które musisz śledzić codziennie:
- Nowe rejestracje dziś/tydzień
- Trial → płatny konwersje
- Aktywne subskrypcje (MRR)
- Klienci którzy ukończyli onboarding
- Klienci którzy nie ukończyli onboardingu > 48h (do ręcznego followup początkowo)
- Błędy KSeF import (% sukcesu)
- Churned klienci
```

Możesz to zrobić jako `/app/api/admin/metrics/route.ts` zwracający JSON + prosty frontend.

### 4.3 Uptime monitoring

Użyj bezpłatnego Better Uptime lub UptimeRobot:
- Monitor `https://app.scopeo.com/api/health` co 5 minut
- Alert SMS/email gdy down > 2 minuty
- Status page (publiczna) dla klientów: `status.scopeo.com`

---

## Blok 5 — Co jeszcze technicznie wymaga uwagi przed startem

### 5.1 Testy które możesz zrobić sam (bez beta userów)

```bash
# Happy path test — pełny flow rejestracja → billing:
1. Otwórz prywatne okno przeglądarki
2. Zarejestruj się nowym emailem
3. Ukończ wizard onboardingowy
4. Dodaj połączenie KSeF (użyj środowiska testowego MF)
5. Zaimportuj faktury testowe
6. Wygeneruj raport
7. Kliknij "Wybierz plan" → przejdź przez Stripe Checkout (karta testowa: 4242 4242 4242 4242)
8. Sprawdź że subskrypcja jest aktywna w dashboardzie
9. Otwórz Portal Stripe → zmień plan
10. Anuluj subskrypcję → sprawdź co widzi użytkownik
```

Karty testowe Stripe:
- `4242 4242 4242 4242` — sukces
- `4000 0000 0000 9995` — odmowa (insufficient funds)
- `4000 0025 0000 3155` — wymaga 3DS

### 5.2 Mobile responsiveness

Sprawdź na mobile (iPhone SE jako worst case):
- Landing page / PricingTable
- Dashboard główny
- Formularz dodawania połączenia KSeF
- Widok raportu

### 5.3 Brakujące strony przed startem

Sprawdź czy istnieją:
- `/404` — custom page not found
- `/500` — custom error page
- `/cennik` — zaktualizowany PricingTable (V7-C1!)
- `/kontakt` — formularz lub mailto
- `/o-nas` — kto stoi za Scopeo (nawet krótki opis buduje zaufanie)

---

## Blok 6 — Plan tygodniowy (8 tygodni)

### Tydzień 1–2: Naprawa blokerów technicznych

```
[ ] Wdrożenie poprawek z cursor-prompt-v7-fixes.md (V7-FIX-1 do V7-FIX-8)
[ ] Aktualizacja PricingTable.tsx (V7-C1) — KRYTYCZNE
[ ] Dodanie modelu KsefConnection do schema.prisma (V7-C2)
[ ] Konfiguracja Stripe produkcyjnego (Price IDs, webhook, VAT settings)
[ ] Ustawienie wszystkich env vars produkcyjnych
[ ] Test happy path end-to-end (jak wyżej)
```

### Tydzień 3–4: Legal i content

```
[ ] Aktualizacja regulaminu (dane spółki, nowy cennik, trial, VAT-zwolnienie)
[ ] Aktualizacja polityki prywatności (Stripe SCC, Resend, Sentry)
[ ] Weryfikacja checkbox akceptacji regulaminu w rejestracji/checkout
[ ] 3 artykuły blogowe (CSRD, Scope 3, KSeF+ESG)
[ ] Uzupełnienie sekcji FAQ na landingu
[ ] Strona /kontakt, /o-nas
```

### Tydzień 5–6: Automatyzacja onboardingu

```
[ ] Implementacja sekwencji 7 emaili onboardingowych (Resend)
[ ] Vercel Cron Jobs do wysyłania timed emaili
[ ] Implementacja tabeli OnboardingEvent lub checkpointów w istniejących modelach
[ ] Alert email do Ciebie przy każdej rejestracji i płatności
[ ] Admin metrics endpoint + prosty dashboard
[ ] Uptime monitoring (Better Uptime)
```

### Tydzień 7: Pre-launch

```
[ ] LinkedIn: 3 posty budujące audiencję ESG
[ ] Test mobile responsiveness
[ ] Test wszystkich emaili (Resend logs)
[ ] Load test podstawowy (Artillery lub k6 — 50 concurrent users)
[ ] Backup DB + disaster recovery plan
[ ] Finalna weryfikacja KSEF prod endpoint
```

### Tydzień 8: Launch

```
[ ] Post na LinkedIn: "Scopeo jest już dostępny"
[ ] Wpis na Product Hunt (opcjonalnie — wymaga przygotowania)
[ ] Wpis w grupach FB: "Rachunkowość dla małych firm", "ESG w Polsce"
[ ] Email do swojej sieci kontaktów (10–20 osób z branży)
[ ] Monitorowanie alertów przez pierwsze 48h non-stop
```

---

## Blok 7 — Strategia cenowa w kontekście rynku

### Dlaczego obecne ceny są właściwe

Benchmarki zachodnich odpowiedników:
- Watershed (USA): ~$1500/msc dla małych firm
- Plan A (Niemcy): ~800€/msc
- Normative (Szwecja): indywidualna wycena, +10k€/rok

Twoje 149–849 PLN/msc (35–200€) to **1/5 do 1/10 zachodnich cen** przy dedykowanej integracji z polskim KSeF. To jest Twoja moat na polskim rynku.

### Kogo atakować na start

Priorytet 1: **Firmy 50–250 pracowników, 10–100 mln PLN przychodu**
- Muszą raportować CSRD od 2025/2026 (progi EU)
- Mają działy finansowe ale nie mają ESG managera
- Używają KSeF (obowiązkowy od 2025)
- Budżet na software: 500–2000 PLN/msc bez problemu

Priorytet 2: **Biura rachunkowe jako resellerzy**
- Jeden klient Starter/Growth = obsługa 5–10 ich klientów
- Kanał multiplikacyjny — jeden kontrakt = kilka firm
- Rozważ plan "Partner/Accountant" w Etapie 2

### MRR cel na pierwsze 6 miesięcy

```
Miesiąc 1-2 (launch): 5 klientów × 279 PLN avg = 1,395 PLN MRR
Miesiąc 3-4: 15 klientów × 350 PLN avg = 5,250 PLN MRR  
Miesiąc 5-6: 35 klientów × 400 PLN avg = 14,000 PLN MRR
```

Próg VAT 240k PLN rocznego przychodu ≈ 20,000 PLN MRR. Przy tym tempie możesz go osiągnąć w ~8-10 miesięcy od startu — zaplanuj rejestrację VAT zawczasu.

---

## Podsumowanie: TOP 10 rzeczy do zrobienia przed launchem

| # | Zadanie | Priorytet | Czas |
|---|---------|-----------|------|
| 1 | Naprawić PricingTable.tsx (V7-C1) | 🔴 Krytyczne | 2h |
| 2 | Dodać KsefConnection do schematu (V7-C2) | 🔴 Krytyczne | 4h |
| 3 | Skonfigurować Stripe prod (Price IDs + VAT) | 🔴 Krytyczne | 3h |
| 4 | Zaktualizować regulamin + politykę prywatności | 🟠 High | 4h |
| 5 | Wdrożyć V7-FIX-1..8 (Cursor prompts) | 🟠 High | 8h |
| 6 | Happy path test end-to-end | 🟠 High | 2h |
| 7 | Sekwencja emaili onboardingowych (7 emaili) | 🟠 High | 6h |
| 8 | Alert emaile dla Ciebie (rejestracja, płatność, churn) | 🟡 Medium | 2h |
| 9 | 3 artykuły blogowe SEO | 🟡 Medium | 6h |
| 10 | Uptime monitoring + admin metrics | 🟡 Medium | 3h |

**Łączny czas szacowany: ~40 godzin roboczych** przy intensywnej pracy z Cursorem i moją pomocą przy każdym etapie.

---

*Następny krok: Daj sygnał z której sekcji zaczynamy — mogę przygotować konkretne prompty Cursor dla bloków technicznych (2, 3, 4, 5) lub treści (regulamin, emaile onboardingowe, artykuły blogowe).*
