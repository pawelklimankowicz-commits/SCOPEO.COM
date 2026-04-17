type FaqIntent = {
  id: string;
  question: string;
  answer: string;
  keywords: string[];
};

export const FAQ_ASSISTANT_INTENTS: FaqIntent[] = [
  {
    id: 'ksef-connect',
    question: 'Jak podłączyć Scopeo do KSeF?',
    answer:
      'Wejdź w Ustawienia i dodaj token autoryzacyjny KSeF. Po poprawnej weryfikacji Scopeo automatycznie pobiera faktury i uruchamia przeliczenia emisji.',
    keywords: ['ksef', 'token', 'podlaczyc', 'polaczyc', 'integracja'],
  },
  {
    id: 'company-data',
    question: 'Jak poprawnie dodać dane firmy?',
    answer:
      'W onboardingu uzupełnij: nazwę firmy, NIP, branżę, rok raportowania, rok bazowy i granice raportowania. Te pola bezpośrednio wpływają na poprawność raportu.',
    keywords: ['firma', 'nip', 'dane', 'onboarding', 'rok bazowy', 'granice'],
  },
  {
    id: 'scope-coverage',
    question: 'Czy Scopeo liczy Scope 1, 2 i 3?',
    answer:
      'Tak, Scopeo obsługuje Scope 1, Scope 2 i Scope 3, z evidence trail i raportem zgodnym z metodyką GHG Protocol.',
    keywords: ['scope', 'scope 1', 'scope 2', 'scope 3', 'ghg'],
  },
  {
    id: 'pricing',
    question: 'Od czego zależy cena?',
    answer:
      'Cena zależy od planu, liczby użytkowników i liczby połączeń KSeF. Szczegóły znajdziesz w sekcji cennik.',
    keywords: ['cena', 'cennik', 'plan', 'koszt', 'abonament'],
  },
  {
    id: 'security',
    question: 'Czy dane są bezpieczne?',
    answer:
      'Tak. Dane są izolowane per organizacja, dostęp jest oparty o role, a przetwarzanie odbywa się zgodnie z polityką prywatności i wymaganiami bezpieczeństwa.',
    keywords: ['bezpieczenstwo', 'rodo', 'dane', 'prywatnosc'],
  },
];

export function normalizeFaqText(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function findFaqIntent(question: string) {
  const normalized = normalizeFaqText(question);
  if (!normalized) return null;

  let best: { intent: FaqIntent; score: number } | null = null;
  for (const intent of FAQ_ASSISTANT_INTENTS) {
    const score = intent.keywords.reduce(
      (acc, keyword) => (normalized.includes(normalizeFaqText(keyword)) ? acc + 1 : acc),
      0
    );
    if (!best || score > best.score) best = { intent, score };
  }

  if (!best || best.score === 0) return null;
  return best.intent;
}

export function buildFaqSystemPrompt() {
  const intentsSummary = FAQ_ASSISTANT_INTENTS.map(
    (intent) => `- ${intent.id}: ${intent.question} => ${intent.answer}`
  ).join('\n');

  return [
    'Jesteś asystentem FAQ Scopeo.',
    'Odpowiadaj po polsku, konkretnie, maksymalnie 4 zdania.',
    'Skup się na onboardingu, danych firmy, podłączeniu KSeF, emisjach Scope 1-3, cenniku i bezpieczeństwie.',
    'Jeżeli pytanie wykracza poza zakres produktu, zaproponuj kontakt przez formularz /kontakt.',
    'Nie wymyślaj nieistniejących funkcji.',
    'Baza odpowiedzi referencyjnych:',
    intentsSummary,
  ].join('\n');
}
