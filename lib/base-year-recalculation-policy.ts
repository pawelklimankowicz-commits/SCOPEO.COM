/** Tylko dane statyczne — import bez `prisma` (np. generowanie PDF offline). */
export const BASE_YEAR_RECALCULATION_POLICY = {
  standard: 'GHG Protocol Corporate Standard',
  version: '1.0',
  objective:
    'Zapewnia spójność i porównywalność danych emisyjnych poprzez formalne rekalkulacje roku bazowego.',
  mandatoryTriggers: [
    'Znaczna zmiana granic organizacyjnych (fuzja, przejęcie, wydzielenie).',
    'Istotna zmiana granic operacyjnych lub metodologii liczenia.',
    'Wykryta istotna korekta danych historycznych wpływająca na trend emisji.',
  ],
  materialityRule:
    'Rekalkulacja jest wymagana, gdy wpływ zmiany na całkowitą emisję roku bazowego przekracza 5%.',
  governance: [
    'Rekalkulacja wymaga uzasadnienia biznesowego i zatwierdzenia przez OWNER/ADMIN.',
    'Każda rekalkulacja musi zostać zapisana w nieusuwalnym rejestrze.',
    'Raporty po zatwierdzeniu odwołują się do wersji rekalkulacji i hashy snapshotów.',
  ],
} as const;
