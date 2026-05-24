# Ops Runbook — Scopeo SaaS

## 1. Kopie zapasowe bazy danych

Baza: **Supabase (PostgreSQL)** na `aws-1-eu-west-3`.

| Mechanizm | Częstotliwość | Retencja | Jak przywrócić |
|---|---|---|---|
| Supabase PITR (Point-in-Time Recovery) | ciągły (WAL) | 7 dni (Pro) / 28 dni (Team) | Dashboard → Database → Backups → Restore to point in time |
| Supabase Daily Backup | 1×/dobę | 7 dni | Dashboard → Database → Backups → Download / Restore |
| Ręczny dump | ad-hoc | nieograniczona | `pg_dump $DATABASE_URL > backup-$(date +%F).sql` |

**Weryfikacja**: raz w miesiącu przywróć backup do staging i uruchom `npm run test:integration`.

## 2. Procedura rollback

### Rollback aplikacji (Vercel)

```bash
# Lista ostatnich deployów
npx vercel ls --prod

# Promuj poprzedni deploy do produkcji
npx vercel promote <DEPLOYMENT_URL> --yes
```

Vercel utrzymuje wszystkie deploye — rollback to promowanie starszego buildu. Natychmiastowy, zero-downtime.

### Rollback migracji bazy

Prisma nie wspiera `migrate down`. Procedura:

1. **Przygotuj reverse migration** przed każdym deployem major:
   ```sql
   -- prisma/rollbacks/20260425130000_add_journey_events.down.sql
   DROP TABLE IF EXISTS "JourneyEvent";
   ```

2. **Wykonaj rollback**:
   ```bash
   psql $DATABASE_URL < prisma/rollbacks/<migration_name>.down.sql
   ```

3. **Przywróć kod**: `vercel promote <previous-deployment>`.

4. **Oznacz migrację jako wycofaną** w Prisma:
   ```bash
   npx prisma migrate resolve --rolled-back <migration_name>
   ```

### Rollback awaryjny (pełny)

Jeśli zarówno kod jak i schemat DB są uszkodzone:

1. Przywróć bazę z PITR do momentu sprzed deployu (Supabase Dashboard)
2. Promuj poprzedni deploy Vercel
3. Zweryfikuj `/api/health`

## 3. Alerty Sentry

SDK jest zintegrowany (`@sentry/nextjs`). Wymagana konfiguracja:

1. Utwórz projekt w [sentry.io](https://sentry.io) → Settings → Projects → Create
2. Ustaw env vars w Vercel Dashboard:
   - `SENTRY_DSN` — z Settings → Client Keys
   - `NEXT_PUBLIC_SENTRY_DSN` — ten sam DSN (client-side)
   - `SENTRY_ORG` — slug organizacji
   - `SENTRY_PROJECT` — slug projektu
   - `SENTRY_AUTH_TOKEN` — z Settings → Auth Tokens (do source maps)
3. Skonfiguruj alerty w Sentry:
   - **Alert 1**: New issue → Slack/email → natychmiast
   - **Alert 2**: Issue frequency > 10/h → PagerDuty/email → warning
   - **Alert 3**: Transaction p95 > 3s → email → daily digest

## 4. Ochrona gałęzi main

Ustaw w GitHub → Settings → Branches → Add rule (`main`):

- [x] Require pull request reviews (1 approval)
- [x] Require status checks: `lint-and-typecheck`, `test`, `build`, `migration-check`
- [x] Require branches to be up to date
- [x] Do not allow force pushes
- [x] Do not allow deletions

Alternatywnie przez CLI:
```bash
gh api repos/pawelklimankowicz-commits/SCOPEO.COM/branches/main/protection \
  -X PUT \
  -f 'required_pull_request_reviews[required_approving_review_count]=1' \
  -f 'required_status_checks[strict]=true' \
  -f 'required_status_checks[contexts][]=lint-and-typecheck' \
  -f 'required_status_checks[contexts][]=test' \
  -f 'required_status_checks[contexts][]=build' \
  -f 'enforce_admins=true' \
  -F 'allow_force_pushes=false' \
  -F 'allow_deletions=false' \
  -F 'restrictions=null'
```

## 5. Monitoring uptime

Endpoint: `GET /api/health` — zwraca `200 {ok:true}` lub `503 {ok:false}`.

Opcje monitoringu:

| Usługa | Darmowy tier | Interwał |
|---|---|---|
| BetterUptime | 10 monitorów | 3 min |
| UptimeRobot | 50 monitorów | 5 min |
| Checkly | 5 monitorów | 10 min |

Konfiguracja:
- URL: `https://scopeo-saas.vercel.app/api/health`
- Method: GET
- Expected: HTTP 200, body contains `"ok":true`
- Alert: email + Slack po 2 failures
