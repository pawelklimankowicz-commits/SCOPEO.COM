/**
 * Niektóre wdrożenia mają connection string zapisany pod inną nazwą niż DATABASE_URL
 * (np. etykieta po polsku w panelu). Uzupełnij DATABASE_URL przed utworzeniem klienta Prisma.
 */
const legacy = (
  process.env['ADRES URL BAZY DANYCH'] ||
  process.env.ADRES_URL_BAZY_DANYCH ||
  ''
).trim();
if (legacy && !(process.env.DATABASE_URL || '').trim()) {
  process.env.DATABASE_URL = legacy;
}

export {};
