/**
 * Niektóre wdrożenia mają connection string zapisany pod inną nazwą niż DATABASE_URL
 * (np. etykieta po polsku w panelu — Vercel czasem nie eksportuje takiej nazwy do Node).
 * Uzupełnij DATABASE_URL przed utworzeniem klienta Prisma.
 */
function looksLikePostgresUrl(s: string): boolean {
  return /^postgres(ql)?:\/\//i.test(s.trim());
}

if (!(process.env.DATABASE_URL || '').trim()) {
  const legacy = (
    process.env['ADRES URL BAZY DANYCH'] ||
    process.env.ADRES_URL_BAZY_DANYCH ||
    ''
  ).trim();
  if (legacy) {
    process.env.DATABASE_URL = legacy;
  } else {
    const matches: string[] = [];
    for (const value of Object.values(process.env)) {
      const v = (value || '').trim();
      if (v && looksLikePostgresUrl(v)) matches.push(v);
    }
    const unique = [...new Set(matches)];
    if (unique.length === 1) process.env.DATABASE_URL = unique[0];
  }
}

export {};
