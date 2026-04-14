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

export const LEGAL_EMAIL = {
  general: 'hello@scopeo.pl',
  support: 'support@scopeo.pl',
  privacy: 'privacy@scopeo.pl',
  complaints: 'reklamacje@scopeo.pl',
} as const;
