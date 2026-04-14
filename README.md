# Scopeo — KSeF GHG (SaaS)

Aplikacja multi-tenant do importu faktur (XML KSeF), mapowania linii do kategorii GHG (scope 1–3), workflow review z historią zmian oraz kalkulacji emisji. Stack: **Next.js 15**, **Prisma**, **NextAuth (Credentials)**, **PostgreSQL** (Docker lokalnie lub hosting w chmurze).

## Wymagania

- Node.js 20+
- npm
- Docker (do lokalnej bazy) — albo zewnętrzny `DATABASE_URL` (Neon, Supabase itd.)

## Uruchomienie lokalne

```bash
cd scopeo-saas
cp .env.example .env
# Ustaw AUTH_SECRET (np. openssl rand -base64 32)

docker compose up -d
npm install
npx prisma generate
npx prisma db push
npm run dev
```

Otwórz [http://localhost:3000](http://localhost:3000). Zarejestruj konto (tworzy organizację / tenant), przejdź przez **Onboarding**, potem **Dashboard**: import faktorów (UK / EPA + **KOBiZE PL** z `data/kobize-pl-factors.json`), import przykładowego XML KSeF, **Przelicz emisje**.

### Współczynniki KOBiZE (PL)

Import „faktorów zewnętrznych” dokłada krajowy zestaw z pliku **`data/kobize-pl-factors.json`** (m.in. energia elektryczna u odbiorcy końcowego — **0,597 kg CO₂e/kWh** za rok sprawozdawczy **2023**, zgodnie z publikacją KOBiZE). Możesz podać własną ścieżkę: **`KOBIZE_FACTORS_JSON_PATH`**. Co roku warto uzupełnić plik o nowe wartości z [materiałów KOBiZE](https://www.kobize.pl/pl/fileCategory/id/28/wskazniki-emisyjnosci).

### Testy

- `npm test` — testy jednostkowe w `tests/unit/` oraz integracyjne w `tests/integration/` (m.in. `lib/emissions`, `lib/ksef-xml`, `lib/payload-security`; handler `GET` `/api/health` z rzeczywistym pingiem DB).
- Bez ustawionego `DATABASE_URL` test integracyjny health jest **pomijany**. W GitHub Actions job **`migrations`** (po `prisma migrate deploy` na tymczasowej Postgresie) uruchamia ten test osobno.

### Wielokrotne organizacje (brak przełączania workspace)

Model danych pozwala jednemu użytkownikowi mieć wiele członkostw (`Membership`). **Sesja (JWT) i cała aplikacja operują na jednej „aktywnej” organizacji:** przy logowaniu wybierane jest **pierwsze** członkostwo w kolejności `id` rosnąco (`lib/auth.ts`). Nie ma endpointów ani UI do zmiany aktywnej organizacji. Planowana rozbudowa produktu: przełącznik workspace + utrwalanie wybranego `organizationId` w tokenie lub w sesji po stronie serwera.

## Produkcja

Ustaw `DATABASE_URL` i `AUTH_SECRET` w środowisku (Vercel, Railway itd.). Port **5433** w przykładzie jest tylko dla lokalnego Dockera — na produkcji użyj connection stringa od dostawcy.

**Migracje bazy:** build aplikacji (np. na Vercel) **nie** uruchamia `prisma migrate deploy`. Po wdrożeniu lub w pipeline CI/CD wywołaj w środowisku z ustawionym `DATABASE_URL`:

```bash
npx prisma migrate deploy
```

GitHub Actions w tym repo uruchamia `migrate deploy` + `migrate status` na tymczasowej bazie (job `migrations`), żeby wyłapać błędne pliki migracji — to **nie** aktualizuje produkcyjnej bazy.

---

## Pojedyncze komendy — lokalnie

Wykonuj po kolei (w katalogu `scopeo-saas`):

```bash
cd scopeo-saas
```

```bash
cp .env.example .env
```

```bash
openssl rand -base64 32
```

Skopiuj wynik do `.env` jako wartość `AUTH_SECRET=...`.

```bash
docker compose up -d
```

```bash
npm install
```

```bash
npx prisma db push
```

```bash
npm run dev
```

---

## GitHub (nowe repo, pierwszy push)

W katalogu projektu:

```bash
git init
```

```bash
git add .
```

```bash
git commit -m "Initial commit: Scopeo KSeF GHG"
```

Utwórz puste repo na GitHub (bez README), potem:

```bash
git remote add origin https://github.com/TWOJ_USER/TWOJ_REPO.git
```

```bash
git branch -M main
```

```bash
git push -u origin main
```

(Zamiast HTTPS możesz użyć SSH: `git@github.com:TWOJ_USER/TWOJ_REPO.git`.)

---

## Vercel

1. W panelu Vercel: **Add New → Project → Import** wybrane repozytorium z GitHub.
2. **Framework Preset:** Next.js (wykryje sam). **Build Command:** `npm run build` (domyślnie). **Install Command:** `npm install`.
3. **Environment Variables** (Settings → Environment Variables), dla **Production** (i opcjonalnie Preview):

| Nazwa | Wartość |
|--------|---------|
| `DATABASE_URL` | Connection string PostgreSQL (np. [Neon](https://neon.tech) lub Supabase — musi zaczynać się od `postgresql://`) |
| `AUTH_SECRET` | Ten sam sekret co lokalnie (`openssl rand -base64 32`) |
| `NEXTAUTH_URL` | `https://twoja-domena.vercel.app` (dokładnie URL produkcji, bez końcowego `/`) |

**Import faktorów (UK Government flat file + EPA Hub):** co roku ministerstwa publikują nowe pliki XLSX i zmieniają nagłówki kolumn (np. „GHG Conversion Factor 2026”). Bez aktualizacji zmiennych środowiskowych import może się nie powieść. Ustaw w Vercelu (lub lokalnie) m.in. `FACTOR_IMPORT_UK_FLAT_XLSX_URL`, `FACTOR_IMPORT_EPA_HUB_XLSX_URL`, opcjonalnie `FACTOR_IMPORT_UK_GHG_COLUMN` oraz `FACTOR_IMPORT_DATA_YEAR` / `FACTOR_IMPORT_UK_DATA_YEAR` / `FACTOR_IMPORT_EPA_DATA_YEAR` — szczegóły w `.env.example`. Domyślne wartości w kodzie odpowiadają wydaniu 2025 i wymagają odświeżenia po przejściu na nowe pliki.

4. **Pierwsza synchronizacja bazy** (jednorazowo, z Twojego komputera — wstaw ten sam URL co w Vercel):

```bash
DATABASE_URL="postgresql://USER:HASLO@HOST/BAZA?sslmode=require" npx prisma db push
```

(W katalogu `scopeo-saas`, po `npm install`.) Tworzy tabele w bazie produkcyjnej.

5. **Deploy:** po pushu na `main` Vercel zbuduje projekt sam (`postinstall` uruchomi `prisma generate`).

**Uwaga:** `.env` nie commituj — tylko `.env.example`. Na Vercel sekrety są w panelu.

## Skrypty

| Skrypt        | Opis                    |
|---------------|-------------------------|
| `npm run dev` | Serwer dev (Turbopack)  |
| `npm run dev:webpack` | Serwer dev (webpack) |
| `npm run build` / `start` | Build i produkcja |
| `npm test`    | Testy jednostkowe       |

## Struktura

- `app/` — App Router: `login`, `onboarding`, `dashboard`, API (`ksef/import`, `factors/import`, `emissions/calculate`, `review/update`)
- `lib/` — logika emisji, importu faktorów, workflow review, parser XML
- `prisma/schema.prisma` — model danych (organizacje, faktury, linie, review, importy)

Dokumentacja produktowa i landing (HTML) może być poza tym repozytorium (np. osobny folder `scopeo.com` na Pulpicie — **nie wklejaj go do środka `scopeo-saas`**, bo zepsuje build).

## Gdy „strona nie działa” / błędy dev

1. **Wyczyść cache i zależności:** `rm -rf .next node_modules && npm install`
2. **Dev domyślnie używa Turbopack** (`npm run dev`) — omija typowe błędy webpack / DevTools. Przy problemach: `npm run dev:webpack`.
3. **Port:** jeśli 3000 jest zajęty, Next uruchomi **3001** — sprawdź adres w terminalu.
4. **Nie umieszczaj kopii całego `scopeo.com` ani `v10.2 2` wewnątrz folderu projektu** — TypeScript wtedy kompiluje zduplikowany kod i pojawiają się błędy typów.
