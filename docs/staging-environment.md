# Środowisko testowe (staging)

Osobne **staging** oznacza: **inna baza PostgreSQL**, **inne sekrety** i **inny publiczny URL** niż produkcja. Dzięki temu migracje, testy manualne i integracje (Stripe test, KSeF test) nie dotykają danych klientów.

## 1. Rekomendowany model na Vercel

1. **Utwórz drugi projekt Vercel** (np. `scopeo-saas-staging`) i **połącz go z tym samym repozytorium GitHub** co produkcja (`scopeo-saas`).
2. Ustaw **Production Branch** tego projektu na `develop` (lub dedykowany branch `staging`), żeby **automatyczne deploye „Production”** na Vercel szły na **staging**, a główny projekt produkcyjny niech trzyma `main` jako produkcję.
3. **Dodaj domenę** (np. `staging.scopeo.com` albo `scopeo-staging.vercel.app`) w ustawieniach projektu staging.
4. **Skopiuj `vercel.json`** — ten sam plik; różnią się wyłącznie **zmienne środowiskowe** w panelu (Environment: Production dla staging project = de facto staging).

> **Preview vs staging:** [Preview deployments](https://vercel.com/docs/deployments/preview-mode) (PR) są wygodne, ale **nie zastąpią** pełnego stagingu, jeśli nie przypniesz im **osobnego `DATABASE_URL`** i spójnego zestawu sekretów. Długo żyjące środowisko testowe = osobny projekt lub ustalone Preview + wspólna baza staging (świadomie).

## 2. Baza danych

- Utwórz **osobną** instancję Postgres (osobny projekt Supabase/Neon, albo drugi cluster) i **nigdy** nie używaj tego samego `DATABASE_URL` co produkcja.
- Po pierwszym wdrożeniu, z lokalnej maszyny (lub z joba CI z tajnymi zmiennymi):

  ```bash
  export DATABASE_URL="postgresql://...staging..."
  npx prisma migrate deploy
  ```

- Upewnij się, że build na staging **nie nadpisuje** produkcji — `migrate deploy` odpalaj tylko z URL-em stagingu.

## 3. Zmienne środowiskowe

- W panelu Vercel projektu **staging** ustaw **tę samą listę** co na produkcji, ale:
  - **Własne** wartości: `DATABASE_URL`, `AUTH_SECRET` / `NEXTAUTH_SECRET`, `DATA_ENCRYPTION_KEY`, `KSEF_TOKEN_ENCRYPTION_KEY`, `CRON_SECRET`, `HEALTH_CHECK_SECRET`, `KSEF_WORKER_SECRET`, ewentualnie `UPSTASH_*` (osobna instancja Redis lub wspólna z restrykcyjnym usage — zespół decyduje).
  - **URL-e aplikacji:** `NEXTAUTH_URL`, `NEXT_PUBLIC_APP_URL` muszą wskazywać **dokładnie** domenę stagingu (wraz z `https://`).
  - **Stripe:** na stagingu używaj **kluczy testowych** (`sk_test_...`, `pk_test_...`) i **osobnych** `price_...` z trybu testowego; w Stripe CLI / Dashboard dodaj **endpoint webhooka** wskazujący `https://<twoj-staging>/api/webhooks/stripe` i ustaw `STRIPE_WEBHOOK_SECRET` z tego endpointu.
  - **KSeF:** trzymaj `KSEF_API_BASE_URL=https://ksef-test.mf.gov.pl/api` na stagingu, żeby nie uderzać w produkcyjne API z testową bazą.
  - **Sentry (opcjonalnie):** osobny projekt lub to samo DSN z tagiem `environment=staging` — `VERCEL_ENV` na Vercel i tak rozróżnia `production` / `preview`.

Szablon lokalny: **`.env.staging.example`** → skopiuj do **`.env.staging`** (plik w `.gitignore`).

## 4. Crone (KSeF, trial)

Projekt reuses `vercel.json` z `crons`. **Drugie** wdrożenie (staging) będzie miało **własne** crone; jeśli nie chcesz nocnych jobów KSeF na testowej bazie, w projekcie staging w **Vercel → Crons** możesz je wyłączyć albo zostawić (przy KSeF test API i pustych danych zwykle jest OK — uzgodnij w zespole).

## 5. Weryfikacja po wdrożeniu

- `GET /api/health` — odpowiedź `ok`, ping DB.
- Rejestracja użytkownika + onboarding + jedna operacja zapisu (np. profil).
- (Opcjonalnie) płatność w Stripe w trybie testowym, webhook w logach Vercel.

## 6. Lokalne „udawanie” stagingu

```bash
cp .env.staging.example .env.staging
# Uzupełnij .env.staging; potem ładowanie zależy od narzędzia — np.:
# export $(grep -v '^#' .env.staging | xargs) && npm run dev
```

Na produkcję lokalną nadal używaj **`.env`** (nie committuj sekretów).
