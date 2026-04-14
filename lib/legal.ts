export const LEGAL_COMPANY = {
  name: 'Black Gold Sp. z o.o.',
  seat: 'Poznań',
  /**
   * Dane rejestrowe publikujemy tylko jako komplet.
   * Uzupełnij prawdziwe wartości przed publikacją:
   * "KRS ..., NIP ..., REGON ..., adres korespondencyjny: ...".
   */
  registryDetails: '',
} as const;

export const LEGAL_EMAIL = {
  general: 'hello@scopeo.pl',
  support: 'support@scopeo.pl',
  privacy: 'privacy@scopeo.pl',
  complaints: 'reklamacje@scopeo.pl',
} as const;
