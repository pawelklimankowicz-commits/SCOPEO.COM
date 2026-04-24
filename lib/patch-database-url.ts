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

if (!hasDatabaseUrl()) {
  if (!isNextBuildOrExport()) {
    throw new Error('DATABASE_URL is required');
  }
}

export {};
