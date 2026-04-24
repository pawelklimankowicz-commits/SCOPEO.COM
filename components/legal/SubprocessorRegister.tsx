import { SUBPROCESSOR_REGISTER_UPDATED, subprocessorRows } from '@/content/subprocessors';

export function SubprocessorRegister() {
  return (
    <div className="mkt-subprocessor-register">
      <h2 id="wykaz-subprocesorow" style={{ marginTop: 40 }}>
        Wykaz subprocesorów
      </h2>
      <p>
        Poniższa lista jest przewidywalnym wykazem podmiotów przetwarzających wspierających świadczenie Usługi
        Scopeo (załącznik do DPA, zgodnie z informacjami w § 8 i § 14 dokumentu). O planowanym dodaniu lub
        zastąpieniu subprocesora informujemy z odpowiednim wyprzedzeniem, umożliwiając zgłoszenie uzasadnionego
        sprzeciwu, o ile wynika to z umowy z Klientem.
      </p>
      <p style={{ fontSize: '0.8125rem', color: '#64748b' }}>
        Ostatnia aktualizacja wykazu: {SUBPROCESSOR_REGISTER_UPDATED}
      </p>
      <div className="mkt-table-scroll">
        <table className="mkt-table-mini mkt-subprocessor-table">
          <caption className="sr-only">Wykaz subprocesorów — podmiot, rola, lokalizacja i transfery</caption>
          <thead>
            <tr>
              <th scope="col">Subprocesor</th>
              <th scope="col">Rola w Usłudze</th>
              <th scope="col">Miejsce przetwarzania / transfer</th>
            </tr>
          </thead>
          <tbody>
            {subprocessorRows.map((row) => (
              <tr key={row.entity}>
                <td>{row.entity}</td>
                <td>{row.role}</td>
                <td>{row.locationTransfer}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p style={{ fontSize: '0.8125rem', color: '#64748b', marginTop: 16 }}>
        Szczegółowy zakres danych przekazywanych poszczególnym podmiotom zależy od konfiguracji konta, aktywnych
        modułów i sposobu korzystania z platformy. Uzupełnieniem pozostają:{' '}
        <a href="/polityka-prywatnosci" className="mkt-link">
          Polityka prywatności
        </a>{' '}
        (m.in. podmioty trzecie i transfery) oraz indywidualna umowa z Klientem.
      </p>
    </div>
  );
}
