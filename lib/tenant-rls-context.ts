import { AsyncLocalStorage } from 'node:async_hooks';

export type TenantRlsMode = { kind: 'tenant'; userId: string; organizationId: string } | { kind: 'bypass' };

const storage = new AsyncLocalStorage<TenantRlsMode>();

export function getTenantRlsMode(): TenantRlsMode | undefined {
  return storage.getStore();
}

/**
 * Wszystkie operacje Prisma w tym async kontekście używają `set_config` w transakcji (RLS w Postgresie).
 * Użyj po zweryfikowaniu członkostwa w aktywnej organizacji.
 */
export function runWithTenantRls<T>(ctx: { userId: string; organizationId: string }, fn: () => Promise<T>): Promise<T> {
  return storage.run({ kind: 'tenant', userId: ctx.userId, organizationId: ctx.organizationId }, fn);
}

/**
 * Tylko dla ścieżek systemowych: auth, migracje, webhooki, joby, gdy nie ma jednej „aktywnej” organizacji.
 * Każde wywołanie = osobna transakcja z RLS „odblokowane” (policy `app.rls_bypass = on`).
 */
export function runWithRlsBypass<T>(fn: () => Promise<T>): Promise<T> {
  return storage.run({ kind: 'bypass' }, fn);
}

export function isRlsBypassedGlobally(): boolean {
  return process.env.DATABASE_RLS_APP_BYPASS === '1' || process.env.DATABASE_RLS_APP_BYPASS === 'true';
}

export function isRlsExtensionNoop(): boolean {
  return process.env.DATABASE_RLS_DISABLE === '1' || process.env.DATABASE_RLS_DISABLE === 'true';
}

/**
 * Gdy true (domyślnie): brak ALS = transakcja z `app.rls_bypass` (kompatybilność wsteczna).
 * Ustaw `DATABASE_RLS_RELAXED=0` w produkcji po upewnieniu się, że wszystkie ścieżki używają `runWithTenantRls` / bypass.
 */
export function isRlsRelaxedDefault(): boolean {
  const v = process.env.DATABASE_RLS_RELAXED?.trim();
  if (v === '0' || v === 'false') return false;
  return true;
}
