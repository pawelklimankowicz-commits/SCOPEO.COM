/** Stylized product UI frames — CSS-only, no external images */

function MockChrome({ title }: { title: string }) {
  return (
    <div className="mkt-mock-chrome">
      <span className="mkt-mock-dot" style={{ background: '#f87171' }} />
      <span className="mkt-mock-dot" style={{ background: '#fbbf24' }} />
      <span className="mkt-mock-dot" style={{ background: '#34d399' }} />
      <span style={{ marginLeft: 8 }}>{title}</span>
    </div>
  );
}

export function DashboardEmissionsMock() {
  return (
    <div className="mkt-mock">
      <MockChrome title="Scopeo · Dashboard emisji" />
      <div className="mkt-mock-body">
        <div className="mkt-kpi-row">
          <div className="mkt-kpi mkt-kpi--emerald">
            <label>Scope 1</label>
            <strong>48.2 t</strong>
          </div>
          <div className="mkt-kpi mkt-kpi--emerald">
            <label>Scope 2</label>
            <strong>126.7 t</strong>
          </div>
          <div className="mkt-kpi mkt-kpi--emerald">
            <label>Scope 3</label>
            <strong>412.4 t</strong>
          </div>
        </div>
        <div style={{ fontSize: '0.625rem', color: '#94a3b8', marginBottom: 6 }}>Trend miesięczny (tCO₂e)</div>
        <div className="mkt-mini-chart" />
        <div className="mkt-bar-row">
          {[42, 68, 55, 78, 62].map((h, i) => (
            <div key={i} className="mkt-bar" style={{ height: `${h}%` }} />
          ))}
        </div>
        <div
          style={{
            marginTop: 12,
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '0.625rem',
            color: '#64748b',
          }}
        >
          <span>Import KSeF: 128 faktur</span>
          <span>Ostatnia synchronizacja: dziś 06:42</span>
        </div>
      </div>
    </div>
  );
}

export function ReviewQueueMock() {
  return (
    <div className="mkt-mock">
      <MockChrome title="Workflow · Review" />
      <div className="mkt-mock-body">
        <table className="mkt-table-mini">
          <thead>
            <tr>
              <th>Linia</th>
              <th>Status</th>
              <th>Rola</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>FA/2025/0142 · energia</td>
              <td>
                <span className="mkt-badge-status mkt-badge-status--wait">In review</span>
              </td>
              <td>ESG</td>
            </tr>
            <tr>
              <td>FA/2025/0118 · transport</td>
              <td>
                <span className="mkt-badge-status mkt-badge-status--ok">Approved</span>
              </td>
              <td>Finanse</td>
            </tr>
            <tr>
              <td>FA/2025/0099 · materiały</td>
              <td>
                <span className="mkt-badge-status mkt-badge-status--over">Overridden</span>
              </td>
              <td>Admin</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function AuditTrailMock() {
  return (
    <div className="mkt-mock">
      <MockChrome title="Audit trail" />
      <div className="mkt-mock-body">
        <div className="mkt-timeline">
          <div className="mkt-tl-item">
            <span className="mkt-tl-time">10:14</span>
            <div>
              <strong style={{ color: '#0f172a' }}>a.kowalska</strong> · zmiana kategorii{' '}
              <span style={{ fontFamily: 'ui-monospace', fontSize: '0.625rem' }}>grid-mix → market-based</span>
            </div>
          </div>
          <div className="mkt-tl-item">
            <span className="mkt-tl-time">Wczoraj</span>
            <div>
              <strong style={{ color: '#0f172a' }}>system</strong> · import wsadowy KSeF (24 pozycje)
            </div>
          </div>
          <div className="mkt-tl-item">
            <span className="mkt-tl-time">12.04</span>
            <div>
              <strong style={{ color: '#0f172a' }}>m.nowak</strong> · akceptacja review · FA/2025/0118
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function DiffMock() {
  return (
    <div className="mkt-mock">
      <MockChrome title="Porównanie before / after" />
      <div className="mkt-mock-body">
        <div className="mkt-diff">
          <div className="mkt-diff-col">
            <strong>Przed</strong>
            <div style={{ fontFamily: 'ui-monospace', fontSize: '0.625rem', lineHeight: 1.5 }}>
              factorId: UK-GRID-2024
              <br />
              category: scope2_location
              <br />
              status: draft
            </div>
          </div>
          <div className="mkt-diff-col">
            <strong>Po review</strong>
            <div style={{ fontFamily: 'ui-monospace', fontSize: '0.625rem', lineHeight: 1.5 }}>
              factorId: UK-GRID-2024-mb
              <br />
              category: scope2_market
              <br />
              status: approved
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ImportOverviewMock() {
  return (
    <div className="mkt-mock">
      <MockChrome title="KSeF · Import i OCR" />
      <div className="mkt-mock-body">
        <div className="mkt-kpi-row">
          <div className="mkt-kpi">
            <label>Przetworzone</label>
            <strong>1 204</strong>
          </div>
          <div className="mkt-kpi">
            <label>Oczekujące</label>
            <strong>18</strong>
          </div>
          <div className="mkt-kpi">
            <label>Do review</label>
            <strong>6</strong>
          </div>
        </div>
        <div
          style={{
            fontSize: '0.6875rem',
            color: '#64748b',
            padding: 10,
            background: '#f8fafc',
            borderRadius: 8,
            border: '1px solid #e2e8f0',
          }}
        >
          Połączenie z API KSeF aktywne · kolejna synchronizacja za 42 min · OCR dokumentów kosztowych: włączone
        </div>
      </div>
    </div>
  );
}
