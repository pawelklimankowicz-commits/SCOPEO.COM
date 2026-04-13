/** Dane do uzupełnienia przed produkcją — spójne we wszystkich dokumentach prawnych. */
export const LEGAL_COMPANY = {
  name: 'Black Gold Sp. z o.o.',
  seat: 'Poznań',
  /** Uzupełnij: KRS, NIP, REGON, pełny adres do korespondencji. */
  registryNote: 'Pełne dane rejestrowe (KRS, NIP, REGON) oraz adres korespondencyjny — do publikacji produkcyjnej.',
} as const;

export const LEGAL_EMAIL = {
  general: 'hello@scopeo.pl',
  support: 'support@scopeo.pl',
  privacy: 'privacy@scopeo.pl',
  complaints: 'reklamacje@scopeo.pl',
} as const;
