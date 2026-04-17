export const LEGAL_COMPANY = {
  name: 'PROMETHEUS SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ',
  seat: 'Lublin',
  /**
   * Dane rejestrowe publikujemy tylko jako komplet.
   * Uzupełnij prawdziwe wartości przed publikacją:
   * "KRS ..., NIP ..., REGON ..., adres korespondencyjny: ...".
   */
  registryDetails:
    'KRS: 0001208042, NIP: 9462761086, REGON: 54335415700000, adres korespondencyjny: ul. Kowalska 5, 20-115 Lublin, Polska.',
} as const;

function envOrFallback(
  value: string | undefined,
  fallback: string
): string {
  const normalized = value?.trim();
  return normalized && normalized.includes('@') ? normalized : fallback;
}

const legalEmailFallback = envOrFallback(
  process.env.SALES_INBOX_EMAIL,
  'kontakt@scopeo.pl'
);

export const LEGAL_EMAIL = {
  general: envOrFallback(process.env.LEGAL_EMAIL_GENERAL, legalEmailFallback),
  support: envOrFallback(process.env.LEGAL_EMAIL_SUPPORT, legalEmailFallback),
  privacy: envOrFallback(process.env.LEGAL_EMAIL_PRIVACY, legalEmailFallback),
  complaints: envOrFallback(process.env.LEGAL_EMAIL_COMPLAINTS, legalEmailFallback),
} as const;
