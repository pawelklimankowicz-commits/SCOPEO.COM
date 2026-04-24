/**
 * Wykaz subprocesorów (art. 28 RODO, załącznik do DPA).
 * Aktualizuj przy zmianie dostawców lub regionów; data w SUBPROCESSOR_REGISTER_UPDATED.
 */

export const SUBPROCESSOR_REGISTER_UPDATED = '2026-04-24';

export type SubprocessorRow = {
  /** Nazwa handlowa / podmiotu */
  entity: string;
  /** Rola w Usłudze Scopeo */
  role: string;
  /** Miejsce przetwarzania / transfer poza EOG */
  locationTransfer: string;
};

export const subprocessorRows: SubprocessorRow[] = [
  {
    entity: 'Vercel Inc.',
    role:
      'Hosting aplikacji (Next.js), sieć CDN, wykonanie funkcji po stronie serwera w ramach wdrożenia produkcyjnego.',
    locationTransfer:
      'Przetwarzanie w regionach przypiętych do projektu; możliwy transfer do USA — Standard Contractual Clauses i postanowienia umowy / DPA udostępniane przez Vercel.',
  },
  {
    entity: 'Operator instancji PostgreSQL (np. Neon, Supabase lub inny w konfiguracji produkcyjnej)',
    role:
      'Baza danych aplikacji: przechowywanie danych kont, organizacji i treści wprowadzonych przez klienta (w zakresie objętym Usługą).',
    locationTransfer:
      'Faktyczne miejsce przechowywania wynika z regionu wybranego dla instancji; zalecane jest colocation w EOG. Umowa i DPA z operatorem hostingu bazy zgodnie z ofertą wybranego dostawcy.',
  },
  {
    entity: 'Stripe Technology Europe Ltd (billing Stripe, Inc. w zależności od produktu)',
    role: 'Płatności elektroniczne, subskrypcje, rozliczenia — dane płatnicze i metadane transakcji w zakresie niezbędnym do obsługi billingu.',
    locationTransfer:
      'Możliwy transfer do USA i innych państw trzecich — Standard Contractual Clauses (SCC) oraz instrumenty wskazane w dokumentacji Stripe.',
  },
  {
    entity: 'Resend Inc.',
    role: 'Wysyłka wiadomości e-mail o charakterze transakcyjnym (m.in. weryfikacja, zaproszenia, powiadomienia o zdarzeniach w koncie).',
    locationTransfer:
      'Przetwarzanie możliwe w infrastrukturze spółki; przy transferze poza EOG — zabezpieczenia w oparciu o ofertę prawną Resend (w tym odpowiednie klauzule).',
  },
  {
    entity: 'Functional Software Inc. (Sentry)',
    role: 'Monitoring błędów i stabilności aplikacji (zdarzenia techniczne, ograniczone dane diagnostyczne).',
    locationTransfer:
      'Zależnie od ustawień projektu Sentry; możliwy transfer do USA — mechanizmy przewidziane w ofercie Sentry (w tym SCC, tam gdzie stosowane).',
  },
  {
    entity: 'Upstash Inc.',
    role: 'Usługa Redis: limitowanie liczby żądań (rate limiting) i pamięć podręczna o ograniczonym, operacyjnym charakterze.',
    locationTransfer:
      'Region instancji wybierany w konfiguracji (dostępne regiony w EOG); w pozostałych przypadkach zabezpieczenia wynikają z umowy z Upstash.',
  },
];
