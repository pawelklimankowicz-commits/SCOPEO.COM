/**
 * Pełny katalog FAQ asystenta marketingowego (100 pozycji).
 * Służy do natychmiastowej odpowiedzi w UI oraz dopasowania w /api/faq-assistant.
 */
export type FaqCatalogEntry = {
  id: string;
  question: string;
  answer: string;
  keywords: string[];
};

function e(id: string, question: string, answer: string, keywords: string[]): FaqCatalogEntry {
  return { id, question, answer, keywords };
}

/** Stały wpis — dopasowanie „co to jest Scopeo?” itd. (zawsze pierwszy w tablicy eksportowanej). */
export const FAQ_INTRO_PRODUCT: FaqCatalogEntry = e(
  'faq-intro-product',
  'Czym jest Scopeo?',
  'Scopeo to platforma SaaS do śladu węglowego organizacji: łączy dane z KSeF i operacji, liczy emisje Scope 1–3 w ujęciu zgodnym z GHG Protocol, prowadzi evidence trail (powiązanie wyników z fakturą i czynnikiem) i generuje raporty m.in. w PDF oraz eksporty przydatne pod CSRD/ESRS. Nie zastępuje audytora zewnętrznego — wspiera zespół i doradcę w przygotowaniu danych.',
  [
    'co to jest scopeo',
    'czym jest scopeo',
    'co to scopeo',
    'kim jest scopeo',
    'opis scopeo',
    'wprowadzenie',
    'platforma esg',
    'co to znaczy scopeo',
  ]
);

const SCOPE3_TOPICS: Array<{ q: string; a: string; k: string[] }> = [
  {
    q: 'Czy Scopeo obejmuje Scope 3 kategorię 1 (zakupy)?',
    a: 'Tak. Linie faktur mapujemy do kategorii zgodnych z GHG Protocol; zakupy upstream są ujmowane w Scope 3, gdy metodyka i dane na to pozwalają.',
    k: ['scope 3', 'kat 1', 'zakupy', 'upstream', 'dobra'],
  },
  {
    q: 'Czy Scopeo uwzględnia Scope 3 kategorię 2 (dobra kapitałowe)?',
    a: 'Tak, przy odpowiednim mapowaniu kategorii i dostępnych danych z faktur. Evidence trail pokazuje źródło każdej kwoty.',
    k: ['scope 3', 'kat 2', 'kapitalowe', 'capex'],
  },
  {
    q: 'Jak Scopeo traktuje paliwa i energię upstream (kat. 3)?',
    a: 'Kategoria 3 obejmuje emisje związane z paliwem i energią poza Scope 1 i 2. Mapowanie zależy od opisu linii i przypisanego współczynnika.',
    k: ['kat 3', 'paliwo', 'upstream', 'energia'],
  },
  {
    q: 'Czy transport upstream (kat. 4) jest w Scopeo?',
    a: 'Tak, gdy faktury i kategorie wskazują transport lub logistykę upstream — system agreguje emisje zgodnie z przypisaną metodyką.',
    k: ['kat 4', 'transport', 'upstream', 'logistyka'],
  },
  {
    q: 'Czy odpady (kat. 5) liczą się w raporcie?',
    a: 'Tak, przy mapowaniu do kategorii odpadowych i dostępnych współczynników. Brak danych może oznaczyć flagę jakości danych.',
    k: ['kat 5', 'odpady', 'waste'],
  },
  {
    q: 'Czy podróże służbowe (kat. 6) są obsługiwane?',
    a: 'Tak, jeśli linie faktur lub polityka organizacji obejmują podróże i przypisane są odpowiednie kategorie oraz czynniki emisji.',
    k: ['kat 6', 'podroze', 'travel'],
  },
  {
    q: 'Czy Scopeo liczy dojazdy pracowników (kat. 7)?',
    a: 'Możliwe po zebraniu danych i mapowaniu — zwykle wymaga dedykowanych danych poza samymi fakturami KSeF. W onboardingu można zadeklarować zakres.',
    k: ['kat 7', 'dojazdy', 'commuting'],
  },
  {
    q: 'Czy upstream leased assets (kat. 8) jest w produkcie?',
    a: 'Zakres zależy od danych wejściowych i polityki raportowania. Scopeo koncentruje się na danych fakturowych i operacyjnych — skonsultuj szczegóły z doradcą ESG.',
    k: ['kat 8', 'leased', 'leasing'],
  },
  {
    q: 'Czy downstream transport (kat. 9) jest obsługiwany?',
    a: 'Gdy faktury i kategorie to umożliwiają, emisje są agregowane w macierzy Scope 3. Dokładność zależy od klasyfikacji linii.',
    k: ['kat 9', 'downstream', 'transport'],
  },
  {
    q: 'Czy przetwarzanie produktów (kat. 10) jest w Scopeo?',
    a: 'To złożona kategoria — Scopeo wspiera ślad na podstawie danych wejściowych. Pełna metodyka downstream często wymaga danych poza KSeF.',
    k: ['kat 10', 'processing', 'downstream'],
  },
  {
    q: 'Czy użytkowanie produktów (kat. 11) jest liczone?',
    a: 'Wymaga modeli użytkowania i danych poza fakturą. Scopeo przygotowuje fundament z faktur; rozszerzenia omów z ekspertem.',
    k: ['kat 11', 'use', 'uzytkowanie'],
  },
  {
    q: 'Czy koniec życia produktu (kat. 12) jest w zakresie?',
    a: 'Częściowo przez dane operacyjne i faktury z usług utylizacji. Pełny LCA wymaga dodatkowych źródeł.',
    k: ['kat 12', 'eol', 'utylizacja'],
  },
  {
    q: 'Czy downstream leased assets (kat. 13) są obsługiwane?',
    a: 'Zależnie od danych i polityki. Scopeo priorytetyzuje spójność evidence trail z fakturami.',
    k: ['kat 13', 'downstream', 'leasing'],
  },
  {
    q: 'Czy franczyzy (kat. 14) są w Scopeo?',
    a: 'Jeśli masz dane fakturowe przypisane do tej kategorii. W przeciwnym razie kategoria może pozostać niepokryta w macierzy.',
    k: ['kat 14', 'franczyza'],
  },
  {
    q: 'Czy inwestycje (kat. 15) są uwzględniane?',
    a: 'Przy odpowiednim mapowaniu linii kapitałowych i czynników. Złożone portfele inwestycyjne często wymagają konsultacji.',
    k: ['kat 15', 'inwestycje'],
  },
];

const OPS: Array<{ q: string; a: string; k: string[] }> = [
  {
    q: 'Jak podłączyć Scopeo do KSeF?',
    a: 'W ustawieniach dodaj token autoryzacyjny KSeF. Po weryfikacji system pobiera faktury i uruchamia przeliczenia emisji.',
    k: ['ksef', 'token', 'polaczenie', 'integracja'],
  },
  {
    q: 'Ile trwa uruchomienie Scopeo?',
    a: 'Pierwsza konfiguracja profilu i tokenu KSeF zajmuje zwykle od kilkunastu minut do ok. godziny, zależnie od wielkości danych i importów.',
    k: ['czas', 'ile', 'uruchomienie', 'onboarding'],
  },
  {
    q: 'Czy Scopeo liczy Scope 1, 2 i 3?',
    a: 'Tak. Agregujemy emisje dla Scope 1–3 z evidence trail i eksportami raportowymi zgodnymi z podejściem GHG Protocol.',
    k: ['scope', 'emisje', 'ghg'],
  },
  {
    q: 'Czy dane firmy są bezpieczne?',
    a: 'Tak — izolacja per organizacja, role i dostępy, zgodność z polityką prywatności. Szczegóły w dokumentacji DPA i regulaminie.',
    k: ['bezpieczenstwo', 'rodo', 'dane'],
  },
  {
    q: 'Od czego zależy cena?',
    a: 'Od planu subskrypcji, liczby użytkowników i konfiguracji połączeń. Szczegóły na stronie cennik.',
    k: ['cena', 'cennik', 'abonament', 'plan'],
  },
  {
    q: 'Czy mogę wyeksportować raport do PDF?',
    a: 'Tak — w panelu raportu dostępny jest eksport raportu GHG w PDF oraz inne formaty danych.',
    k: ['pdf', 'raport', 'eksport'],
  },
  {
    q: 'Czy Scopeo wspiera CSRD?',
    a: 'Scopeo eksportuje dane emisyjne w formatach przydatnych do CSRD/ESRS; część narracyjna raportu pozostaje po stronie organizacji lub doradcy.',
    k: ['csrd', 'esrs', 'raport'],
  },
  {
    q: 'Czym jest evidence trail?',
    a: 'To ślad audytowy: powiązanie kwot raportowych z fakturą, linią, czynnikiem i metodyką — ułatwia odpowiedź kontrahentowi i audytorowi.',
    k: ['evidence', 'audit', 'slad'],
  },
  {
    q: 'Czy są role użytkowników?',
    a: 'Tak — m.in. właściciel, admin, analityk, recenzent. Role ograniczają dostęp do operacji zgodnie z polityką organizacji.',
    k: ['role', 'uzytkownicy', 'uprawnienia'],
  },
  {
    q: 'Czy mogę zaimportować czynniki emisji z XLSX?',
    a: 'Tak — w module importu faktorów obsługiwane są uruchomienia importu i walidacja. Statusy widać w historii importów.',
    k: ['xlsx', 'import', 'faktory'],
  },
  {
    q: 'Co to jest Data Quality Score?',
    a: 'To syntetyczna ocena wpływu flag jakości (szacunki, braki, założenia) na wynik — pomaga priorytetyzować poprawki danych.',
    k: ['jakosc', 'quality', 'score'],
  },
  {
    q: 'Czy Scopeo blokuje zamknięcie snapshotu przy słabych danych?',
    a: 'Tak — można skonfigurować progi minimalnego wyniku jakości i pokrycia Scope 3; poniżej progu snapshot nie zostanie zamknięty.',
    k: ['snapshot', 'blokada', 'jakosc'],
  },
  {
    q: 'Czym różni się Scope 2 location-based i market-based?',
    a: 'LB opiera się na lokalnym miksu energetycznym, MB na kontraktach i atrybutach rynkowych. Scopeo może pokazywać oba ujęcia w raporcie.',
    k: ['scope 2', 'lb', 'mb', 'energia'],
  },
  {
    q: 'Czy mogę filtrować raport po roku?',
    a: 'Tak — raport i eksporty często przyjmują parametr roku obrotowego zgodnego z profilem organizacji.',
    k: ['rok', 'raport', 'filtr'],
  },
  {
    q: 'Gdzie znajdę politykę prywatności?',
    a: 'Pod adresem /polityka-prywatnosci oraz w stopce strony marketingowej.',
    k: ['prywatnosc', 'polityka', 'rodo'],
  },
  {
    q: 'Jak zgłosić żądanie RODO?',
    a: 'W panelu GDPR dostępnym dla uprawnionych ról — tam złożysz wniosek i otrzymasz potwierdzenie.',
    k: ['rodo', 'gdpr', 'wniosek'],
  },
  {
    q: 'Czy Scopeo działa w chmurze?',
    a: 'Tak — aplikacja jest hostowana jako SaaS. Dane przetwarzane są zgodnie z dokumentacją i umowami.',
    k: ['chmura', 'saas', 'hosting'],
  },
  {
    q: 'Czy jest trial?',
    a: 'Tak — informacje o okresie próbnym i warunkach znajdziesz na stronie cennik i przy rejestracji.',
    k: ['trial', 'test', 'okres'],
  },
  {
    q: 'Jak kontaktować się z supportem?',
    a: 'Przez formularz na stronie /kontakt lub adres e-mail wskazany w stopce — podaj organizację i NIP dla szybszej identyfikacji.',
    k: ['kontakt', 'support', 'pomoc'],
  },
  {
    q: 'Czy Scopeo zastępuje audytora?',
    a: 'Nie — to narzędzie do danych i obliczeń. Weryfikacja zewnętrzna pozostaje po stronie akredytowanego podmiotu.',
    k: ['audyt', 'audytor', 'assurance'],
  },
];

const MORE: Array<{ q: string; a: string; k: string[] }> = [
  { q: 'Czy mogę zaprosić członków zespołu?', a: 'Tak — administrator może zapraszać użytkowników i nadawać role zgodnie z uprawnieniami.', k: ['zaproszenie', 'zespol', 'invite'] },
  { q: 'Czy faktury są pobierane automatycznie?', a: 'Po skonfigurowaniu KSeF nowe faktury są pobierane w cyklu zależnym od integracji — szczegóły w dokumentacji.', k: ['pobieranie', 'automat', 'ksef'] },
  { q: 'Co jeśli brakuje czynnika emisji?', a: 'Linia może otrzymać flagę „missing” lub estymację — widoczne w jakości danych i raporcie.', k: ['brak', 'faktor', 'missing'] },
  { q: 'Czy mogę nadpisać kategorię linii?', a: 'Tak — w procesie review możliwa jest korekta mapowania z zachowaniem historii decyzji.', k: ['mapowanie', 'kategoria', 'review'] },
  { q: 'Czy jest log audytowy?', a: 'Tak — dostępny dla uprawnionych ról w sekcji audit log.', k: ['audit', 'log', 'historia'] },
  { q: 'Czy eksportuję dane do Excela?', a: 'Tak — dostępny eksport CSV/XLSX z poziomu raportu emisji.', k: ['excel', 'xlsx', 'csv'] },
  { q: 'Czy Scopeo obsługuje waluty obce?', a: 'Faktury zawierają walutę — przeliczenia emisji zależą od metodyki przypisanej do linii.', k: ['waluta', 'currency'] },
  { q: 'Czy mogę zobaczyć podgląd marki?', a: 'Tak — strona /marka-preview pokazuje logotyp w różnych kontekstach.', k: ['marka', 'logo', 'preview'] },
  { q: 'Czy raport GHG ma stronę formalną?', a: 'Tak — PDF zawiera sekcje metodyki, granic, niepewności i załącznik audytowy.', k: ['pdf', 'formalny', 'ghg'] },
  { q: 'Czy są limity wierszy faktur?', a: 'W obliczeniach stosowane są bezpieczne limity techniczne — przy bardzo dużych wolumenach skontaktuj się ws. Enterprise.', k: ['limit', 'wiersze', 'skala'] },
  { q: 'Czy mogę zamknąć snapshot raportu?', a: 'Tak — jeśli spełnione są progi jakości i pokrycia Scope 3 skonfigurowane w profilu.', k: ['snapshot', 'zamkniecie'] },
  { q: 'Co to jest pokrycie Scope 3?', a: 'To procent kategorii macierzy Scope 3, które mają dane w raporcie — używane jako bramka jakości.', k: ['pokrycie', 'scope 3', 'macierz'] },
  { q: 'Czy jest tryb tylko do odczytu?', a: 'Role typu VIEWER ograniczają edycję — szczegóły w ustawieniach członkostwa.', k: ['viewer', 'odczyt', 'role'] },
  { q: 'Czy mogę zmienić rok bazowy?', a: 'Tak — zmiana roku bazowego jest rejestrowana w logu rekalkulacji z uzasadnieniem.', k: ['rok bazowy', 'rekalkulacja'] },
  { q: 'Czy Scopeo wysyła powiadomienia?', a: 'Tak — część zdarzeń generuje powiadomienia w aplikacji (np. review).', k: ['powiadomienia', 'notyfikacje'] },
  { q: 'Czy mogę wygenerować CSRD JSON?', a: 'Tak — eksport CSRD JSON/CSV jest dostępny z panelu raportu.', k: ['csrd', 'json', 'eksport'] },
  { q: 'Czy jest API?', a: 'Część funkcji udostępnia endpointy API — szczegóły w dokumentacji dla zespołu wdrożeniowego.', k: ['api', 'integracja'] },
  { q: 'Czy klucze API są rotowalne?', a: 'Administrator może zarządzać kluczami API zgodnie z polityką bezpieczeństwa organizacji.', k: ['api key', 'klucz'] },
  { q: 'Czy dane są w UE?', a: 'Hosting i przetwarzanie są zgodne z deklaracją produktu — szczegóły w DPA.', k: ['ue', 'eu', 'hosting'] },
  { q: 'Czy mogę usunąć organizację?', a: 'Operacje krytyczne wymagają uprawnień właściciela i potwierdzeń — procedura w ustawieniach lub przez support.', k: ['usuniecie', 'organizacja'] },
  { q: 'Czy jest SSO?', a: 'Roadmapa zależy od planu Enterprise — zapytaj handlowiec@ lub przez kontakt.', k: ['sso', 'saml', 'enterprise'] },
  { q: 'Czy mogę dodać wiele połączeń KSeF?', a: 'Tak — możliwa jest konfiguracja wielu połączeń dla struktur z wieloma podmiotami.', k: ['ksef', 'wiele', 'polaczen'] },
  { q: 'Czy faktury są przechowywane w postaci surowej?', a: 'Przechowujemy payload potrzebny do audytu i przeliczeń — szczegóły retencji w polityce.', k: ['payload', 'faktura', 'raw'] },
  { q: 'Czy mogę oznaczyć linię jako estymowaną?', a: 'Tak — flagi jakości wynikają z klasyfikacji i reguł; wpływają na wynik i raport.', k: ['estimated', 'estymacja'] },
  { q: 'Czy jest podział Scope 2 na LB i MB w raporcie?', a: 'Tak — raport pokazuje oba ujęcia całkowitej emisji, jeśli profil to wspiera.', k: ['lb', 'mb', 'raport'] },
  { q: 'Czy mogę pobrać raport z zamkniętego snapshotu?', a: 'Tak — generowanie PDF może używać identyfikatora snapshotu, aby odtworzyć zatwierdzony stan.', k: ['snapshot', 'pdf'] },
  { q: 'Czy jest checklista w PDF?', a: 'Tak — raport GHG zawiera listę kontrolną spójną z metodyką formalną.', k: ['checklista', 'pdf'] },
  { q: 'Czy mogę zgłosić błąd mapowania?', a: 'Tak — poprzez workflow review lub kontakt z supportem z przykładem faktury.', k: ['blad', 'mapowanie'] },
  { q: 'Czy Scopeo wspiera spend-based?', a: 'Tak, tam gdzie metodyka i czynniki pozwalają na spend-based dla linii.', k: ['spend', 'metodyka'] },
  { q: 'Czy Scopeo wspiera activity-based?', a: 'Tak — przy polach aktywności i jednostkach zgodnych z czynnikiem.', k: ['activity', 'aktywnosc'] },
  { q: 'Czy są szablony kategorii?', a: 'System wykorzystuje słownik kategorii GHG — dopasowanie zależy od treści faktury i reguł.', k: ['szablon', 'kategoria'] },
  { q: 'Czy mogę filtrować faktury po dacie?', a: 'Tak — widoki faktur i raporty respektują rok obrotowy i filtry.', k: ['data', 'filtr', 'faktury'] },
  { q: 'Czy jest eksport XML ESRS?', a: 'Dostępny eksport XML zgodny z modułem CSRD — z panelu raportu.', k: ['xml', 'esrs'] },
  { q: 'Czy mogę zobaczyć historię importów?', a: 'Tak — w raporcie emisji w sekcji historii importów XLSX.', k: ['import', 'historia'] },
  { q: 'Czy są limity rate na API?', a: 'Tak — stosujemy ograniczenia aby chronić platformę; przy 429 odczekaj wskazany czas.', k: ['rate', '429', 'limit'] },
  { q: 'Czy cookie banner wpływa na analitykę?', a: 'Tak — zgody są respektowane zgodnie z polityką cookies.', k: ['cookies', 'zgody'] },
  { q: 'Czy mogę zmienić nazwę organizacji?', a: 'Tak — w profilu carbon / onboardingu; wpływa na nagłówki raportów.', k: ['nazwa', 'organizacja'] },
  { q: 'Czy NIP jest wymagany?', a: 'Zalecany dla spójności KSeF i raportów — szczegóły w onboardingu.', k: ['nip', 'tax'] },
  { q: 'Czy mogę dodać dostawców?', a: 'Tak — dostawcy są powiązani z fakturami i mogą mieć podpowiedzi kategorii.', k: ['dostawca', 'supplier'] },
  { q: 'Czy jest wersjonowanie czynników?', a: 'Tak — czynniki są powiązane ze źródłem i wersją metodyki widoczną w evidence trail.', k: ['wersja', 'faktor'] },
  { q: 'Czy mogę oznaczyć fakturę jako zreviewowaną?', a: 'Tak — w ramach workflow review zgodnego z rolą.', k: ['review', 'akceptacja'] },
  { q: 'Czy są statusy linii?', a: 'Tak — statusy mapowania i decyzji są widoczne w kolejce review.', k: ['status', 'linia'] },
  { q: 'Czy mogę wyświetlić wykres udziałów?', a: 'Tak — na stronie raportu emisji w dashboardzie.', k: ['wykres', 'dashboard'] },
  { q: 'Czy jest tryb ciemny?', a: 'Dashboard ma ciemny motyw nagłówka; marketing jest jasny.', k: ['dark', 'motyw'] },
  { q: 'Czy PDF używa czcionki z osi czasu?', a: 'PDF może korzystać z Noto Sans lub Helvetica w zależności od konfiguracji środowiska.', k: ['pdf', 'czcionka'] },
  { q: 'Czy mogę skopiować hash snapshotu?', a: 'Tak — hash SHA-256 jest w sekcji wysyłkowej raportu PDF.', k: ['hash', 'snapshot'] },
  { q: 'Czy audit-risk jest automatyczny?', a: 'Tak — przy przekroczeniu progu udziału „missing” ustawiana jest flaga jakości.', k: ['audit', 'risk', 'missing'] },
  { q: 'Czy mogę ustawić minimalny wynik jakości?', a: 'Tak — w preferencjach profilu carbon przez API lub przyszły formularz ustawień.', k: ['jakosc', 'prog'] },
  { q: 'Czy onboarding jest wieloetapowy?', a: 'Tak — kroki prowadzą przez profil i konfigurację startową.', k: ['onboarding', 'kroki'] },
  { q: 'Czy mogę zresetować hasło?', a: 'Tak — link resetu hasła na stronie logowania.', k: ['haslo', 'reset'] },
  { q: 'Czy jest weryfikacja e-mail?', a: 'Tak — zgodnie z konfiguracją konta w produkcie.', k: ['email', 'weryfikacja'] },
  { q: 'Czy mogę zmienić slug organizacji?', a: 'Ustalany przy rejestracji — zmiany skonsultuj z supportem.', k: ['slug', 'organizacja'] },
  { q: 'Czy są plany Enterprise?', a: 'Tak — kontakt handlowy przez /kontakt z opisem skali.', k: ['enterprise', 'plan'] },
  { q: 'Czy mogę zintegrować BI?', a: 'Eksporty CSV/XLSX/JSON ułatwiają import do narzędzi BI.', k: ['bi', 'eksport'] },
  { q: 'Czy Scopeo liczy biogeniczne CO2 osobno?', a: 'Zależnie od czynnika i metodyki źródła — szczegóły w opisie czynnika.', k: ['biogenic', 'co2'] },
  { q: 'Czy są jednostki GJ i MWh?', a: 'Tak — przy aktywnościach energetycznych zgodnych z jednostką czynnika.', k: ['gj', 'mwh'] },
  { q: 'Czy mogę dodać notatkę do profilu?', a: 'Profil carbon przechowuje pola opisowe zgodnie ze schematem.', k: ['notatka', 'profil'] },
  { q: 'Czy jest separacja tenantów?', a: 'Tak — dane organizacji są logicznie izolowane.', k: ['tenant', 'izolacja'] },
  { q: 'Czy mogę wyłączyć widget FAQ?', a: 'Widget jest na stronie marketingowej; w produkcie SaaS układ zależy od layoutu.', k: ['widget', 'faq'] },
  { q: 'Czy asystent FAQ zapisuje pytania?', a: 'Tak — anonimowo z hashem IP i metrykami czasu odpowiedzi, bez treści wrażliwych.', k: ['faq', 'log', 'prywatnosc'] },
  { q: 'Czy LLM jest wymagany?', a: 'Nie — odpowiedzi mogą pochodzić z katalogu intencji; LLM jest opcjonalny gdy skonfigurowano klucz.', k: ['llm', 'openai'] },
  { q: 'Czy mogę zgłosić incydent bezpieczeństwa?', a: 'Tak — przez kontakt prawny / security według polityki firmy Scopeo.', k: ['incydent', 'security'] },
  { q: 'Czy są regulaminy?', a: 'Tak — /regulamin, /polityka-prywatnosci, /dpa, /cookies.', k: ['regulamin', 'prawne'] },
  { q: 'Czy mogę zobaczyć demo produktu?', a: 'Umów demo przez /kontakt#demo lub przycisk Trial na stronie.', k: ['demo', 'trial'] },
  { q: 'Czy Scopeo wspiera wielu członków?', a: 'Tak — model memberships z rolami.', k: ['zespol', 'membership'] },
  { q: 'Czy jest migracja danych?', a: 'Import faktur i czynników zastępuje ręczne przenoszenie z Excela — pełne migracje ERP omów z konsultantem.', k: ['migracja', 'import'] },
  { q: 'Czy mogę wyłączyć marketingowe cookies?', a: 'Tak — przez panel zgód cookies w stopce.', k: ['cookies', 'marketing'] },
  { q: 'Czy jest dokumentacja API?', a: 'Dokumentacja dla zespołów technicznych udostępniana przy wdrożeniu Enterprise.', k: ['dokumentacja', 'api'] },
  { q: 'Czy są webhooks?', a: 'Roadmapa integracji — zapytaj przy kontakcie Enterprise.', k: ['webhook', 'event'] },
  { q: 'Czy mogę oznaczyć kontrahenta?', a: 'Tak — dostawcy i podpowiedzi kategorii ułatwiają powtarzalne mapowanie.', k: ['kontrahent', 'dostawca'] },
  { q: 'Czy jest historia zmian?', a: 'Tak — audit log i decyzje review zapisują kto i kiedy zmienił dane.', k: ['historia', 'zmiany'] },
  { q: 'Czy mogę filtrować po Scope?', a: 'Tak — widoki i raporty wspierają podział na Scope 1–3.', k: ['filtr', 'scope'] },
  { q: 'Czy są limity rozmiaru importu?', a: 'Import XLSX ma walidację — przy dużych plikach postępuj zgodnie z komunikatami.', k: ['import', 'limit'] },
  { q: 'Czy mogę zduplikować czynnik?', a: 'Operacje na czynnikach zależą od uprawnień — duplikacja przez eksport/import lub ręczne dodanie.', k: ['czynnik', 'duplikat'] },
  { q: 'Czy jest podgląd faktury?', a: 'Tak — w module faktur z linkami do linii i mapowania.', k: ['faktura', 'podglad'] },
  { q: 'Czy mogę wygenerować raport testowy?', a: 'Tak — skrypt developerski i środowisko testowe generują PDF próbny.', k: ['test', 'pdf'] },
  { q: 'Czy CI/CD jest publiczny?', a: 'Repozytorium klienta może mieć workflow — szczegóły u administratora IT.', k: ['ci', 'github'] },
  { q: 'Czy Vercel jest wspierany?', a: 'Tak — typowy hosting Next.js dla tego produktu.', k: ['vercel', 'hosting'] },
  { q: 'Czy Postgres jest wymagany?', a: 'Tak — Prisma i migracje zakładają PostgreSQL.', k: ['postgres', 'baza'] },
  { q: 'Czy jest backup?', a: 'Polityka backupów zależy od środowiska produkcyjnego — opis w umowie/DPA.', k: ['backup', 'dane'] },
  { q: 'Czy mogę zobaczyć SLA?', a: 'SLA dotyczy planów Enterprise — zapytaj handlowiec@.', k: ['sla', 'enterprise'] },
  { q: 'Czy jest status page?', a: 'Status publiczny zależy od wdrożenia — informacje u supportu.', k: ['status', 'uptime'] },
  { q: 'Czy mogę zgłosić feature request?', a: 'Tak — przez kontakt z opisem wartości biznesowej.', k: ['feature', 'prosba'] },
  { q: 'Czy jest roadmapa publiczna?', a: 'Fragmenty komunikujemy na stronie produktu; szczegóły dla partnerów pod NDA.', k: ['roadmapa', 'produkt'] },
  { q: 'Czy mogę użyć własnych czynników?', a: 'Tak — import własnych zestawów po walidacji.', k: ['wlasne', 'faktory'] },
  { q: 'Czy jest walidacja faktury?', a: 'Tak — parser i statusy importu pokazują błędy walidacji.', k: ['walidacja', 'parser'] },
  { q: 'Czy mogę zobaczyć macierz Scope 3?', a: 'Tak — w raporcie PDF i danych agregacji.', k: ['macierz', 'scope 3'] },
  { q: 'Czy są progi pokrycia Scope 3?', a: 'Tak — konfigurowalne progi blokady snapshotu.', k: ['prog', 'pokrycie'] },
  { q: 'Czy mogę zmienić LB/MB w raporcie?', a: 'Tak — preferencja w profilu i podgląd parametrem totalBasis.', k: ['lb', 'mb', 'raport'] },
  { q: 'Czy jest strona podglądu marki?', a: 'Tak — /marka-preview.', k: ['marka', 'logo'] },
  { q: 'Czy mogę zgłosić nadużycie?', a: 'Kontakt prawny / abuse według polityki w stopce.', k: ['naduzycie', 'abuse'] },
  { q: 'Czy jest DPA?', a: 'Tak — strona /dpa.', k: ['dpa', 'umowa'] },
  { q: 'Czy mogę wyeksportować listę dowodów?', a: 'Tak — evidence trail w PDF i eksportach danych.', k: ['dowody', 'evidence'] },
  { q: 'Czy są limity czasu sesji?', a: 'Sesja zgodna z NextAuth — wylogowanie po bezczynności zależy od konfiguracji.', k: ['sesja', 'auth'] },
  { q: 'Czy mogę wymusić MFA?', a: 'Roadmapa bezpieczeństwa — zapytaj Enterprise.', k: ['mfa', '2fa'] },
  { q: 'Czy jest IP allowlist?', a: 'Funkcje Enterprise negocjowane indywidualnie.', k: ['ip', 'allowlist'] },
  { q: 'Czy mogę zintegrować IdP?', a: 'SSO/IdP w planie Enterprise — kontakt z handlowcem.', k: ['idp', 'sso'] },
  { q: 'Czy Scopeo liczy CH₄ i N₂O?', a: 'W raporcie dominuje CO2e jako suma efektów — szczegółowe gazy zależą od czynnika.', k: ['ch4', 'n2o', 'co2e'] },
  { q: 'Czy jest wersja językowa EN?', a: 'Interfejs PL-first; EN zależnie od roadmapy — zapytaj sales.', k: ['english', 'jezyk'] },
  { q: 'Czy mogę dodać załącznik do linii?', a: 'Evidence opiera się na fakturze i czynniku — załączniki zewnętrzne omów z supportem.', k: ['zalacznik', 'dowod'] },
  { q: 'Czy jest limit użytkowników?', a: 'Zależy od planu — sprawdź cennik.', k: ['uzytkownicy', 'limit'] },
  { q: 'Czy mogę zmienić plan?', a: 'Tak — przez billing lub kontakt z obsługą wg planu.', k: ['plan', 'billing'] },
  { q: 'Czy są faktury VAT za subskrypcję?', a: 'Zgodnie z modelem billingu — szczegóły w panelu płatności.', k: ['vat', 'faktura'] },
  { q: 'Czy mogę anulować subskrypcję?', a: 'Tak — procedura w ustawieniach rozliczeń lub przez support.', k: ['anuluj', 'subskrypcja'] },
  { q: 'Czy jest okres wypowiedzenia?', a: 'Zależy od umowy — szczegóły w regulaminie i umowie.', k: ['wypowiedzenie', 'umowa'] },
  { q: 'Czy mogę dostać sandbox?', a: 'Środowisko testowe dla Enterprise — kontakt handlowy.', k: ['sandbox', 'test'] },
  { q: 'Czy jest dokumentacja onboardingu?', a: 'Tak — kroki w aplikacji oraz artykuły na /jak-dziala.', k: ['dokumentacja', 'onboarding'] },
  { q: 'Czy mogę zgłosić błąd UI?', a: 'Tak — przez kontakt z zrzutem ekranu i przeglądarką.', k: ['ui', 'blad'] },
  { q: 'Czy Scopeo wspiera KSeF 2.0?', a: 'Integracja podąża za API KSeF — aktualizacje wdrażamy zgodnie z dokumentacją MF.', k: ['ksef', 'api', 'mf'] },
  { q: 'Czy mogę zobaczyć changelog?', a: 'Komunikaty o zmianach w blogu/produkcie lub newsletterze — zapytaj support.', k: ['changelog', 'wersja'] },
  { q: 'Czy jest wsparcie telefoniczne?', a: 'Zależnie od planu — domyślnie e-mail i ticket przez kontakt.', k: ['telefon', 'support'] },
  { q: 'Czy mogę dostać szkolenie?', a: 'Tak — sesje szkoleniowe w pakiecie Enterprise.', k: ['szkolenie', 'enterprise'] },
  { q: 'Czy jest NDA?', a: 'Możliwy przy wdrożeniach Enterprise i dostępie do roadmapy.', k: ['nda', 'enterprise'] },
  { q: 'Czy mogę zintegrować Jira?', a: 'Bez natywnej integracji — webhooki/eksporty omów z konsultantem.', k: ['jira', 'integracja'] },
  { q: 'Czy Scopeo ma AI do mapowania?', a: 'Asystent FAQ może korzystać z LLM opcjonalnie; mapowanie opiera się na regułach i review.', k: ['ai', 'llm', 'mapowanie'] },
  { q: 'Czy mogę wyłączyć LLM?', a: 'Odpowiedzi działają z katalogu bez LLM — LLM jest opcjonalny.', k: ['llm', 'wylacz'] },
  { q: 'Czy jest limit znaków pytania?', a: 'API odrzuca zbyt krótkie pytania; długie są obcinane po stronie serwera w logach.', k: ['limit', 'pytanie'] },
  { q: 'Czy mogę zadać pytanie po angielsku?', a: 'Asystent odpowiada po polsku; inne języki nie są gwarantowane.', k: ['english', 'jezyk'] },
  { q: 'Czy jest moderacja treści?', a: 'Logujemy pytania bez danych osobowych w treści — nie wklejaj wrażliwych danych.', k: ['moderacja', 'prywatnosc'] },
  { q: 'Czy mogę zobaczyć top pytania w org?', a: 'Endpoint analityczny dla OWNER/ADMIN zwraca agregaty.', k: ['statystyki', 'faq'] },
  { q: 'Czy widget działa offline?', a: 'Wymaga sieci do API; katalog może odpowiadać lokalnie po rozbudowie klienta.', k: ['offline', 'siec'] },
  { q: 'Czy mogę zgłosić dostępność?', a: 'Monitoring i status zgłaszane przez support.', k: ['dostepnosc', 'status'] },
];

function buildCatalog(): FaqCatalogEntry[] {
  const out: FaqCatalogEntry[] = [];
  let n = 0;
  const push = (q: string, a: string, k: string[]) => {
    n += 1;
    out.push(e(`faq-${String(n).padStart(3, '0')}`, q, a, k));
  };
  for (const x of OPS) push(x.q, x.a, x.k);
  for (const x of SCOPE3_TOPICS) push(x.q, x.a, x.k);
  for (const x of MORE) push(x.q, x.a, x.k);
  return out;
}

const BUILT = buildCatalog();

/**
 * Maks. 100 pozycji: wprowadzenie produktu + wpisy z generatora; bez gubienia 99. z 100. wygenerowanych
 * (błąd dawnego `[intro, ...built].slice(0, 100)` przy długości `built` = 100).
 */
export const FAQ_ASSISTANT_CATALOG: FaqCatalogEntry[] =
  BUILT.length >= 100 ? [FAQ_INTRO_PRODUCT, ...BUILT.slice(0, 99)] : [FAQ_INTRO_PRODUCT, ...BUILT];
