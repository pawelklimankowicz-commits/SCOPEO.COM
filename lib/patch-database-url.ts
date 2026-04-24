/**
 * Wymagamy DATABASE_URL w runtime. Podczas `next build` (import tras API) zmienna
 * bywa niedostępna w preview/Dependabot — wtedy nie przerywamy builda. Pierwsze
 * rzeczywiste użycie bazy nadal wymaga poprawnej konfiguracji na serwerze.
 */
const hasDatabaseUrl = (): boolean => !!(process.env.DATABASE_URL || '').trim();

const isNextBuildOrExport = (): boolean => {
  const p = process.env.NEXT_PHASE || '';
  if (!p) return false;
  return (
    p === 'phase-production-build' ||
    p === 'phase-development-build' ||
    p === 'phase-export' ||
    (p.startsWith('phase-') && p.includes('export'))
  );
};

/**
 * Brak `DATABASE_URL` musi być dopuszczalny także poza `NEXT_PHASE=phase-*-build` — inaczej
 * każde API importujące `prisma` daje 500 (HTML) m.in. w `next dev` bez .env i na
 * Vercel Preview bez sekretu (faza build ma NEXT_PHASE, runtime już nie).
 */
function allowMissingDatabaseUrlAtImport(): boolean {
  if (isNextBuildOrExport()) return true;
  if (process.env.NODE_ENV === 'development') return true;
  if (process.env.NODE_ENV === 'test') return true;
  if (process.env.VERCEL_ENV === 'preview') return true;
  return false;
}

if (!hasDatabaseUrl()) {
  if (!allowMissingDatabaseUrlAtImport()) {
    throw new Error('DATABASE_URL is required');
  }
}

export {};
