export default function HeroMockup() {
  return (
    <div className="hero-mockup" aria-hidden>
      <div className="hero-mockup-chrome">
        <span className="hero-mockup-dots">
          <span /><span /><span />
        </span>
        <span className="hero-mockup-title">Dashboard · Emisje</span>
      </div>
      <div className="hero-mockup-body">
        <aside className="hero-mockup-sidebar">
          <div className="hero-mockup-logo">S</div>
          <ul>
            <li className="active">Zasoby</li>
            <li>Emisje</li>
            <li>Workflow</li>
            <li>Scope</li>
          </ul>
        </aside>
        <div className="hero-mockup-main">
          <div className="hero-mockup-scopes">
            <div className="hero-scope hero-scope-1">
              <small>Scope 1</small>
              <strong>48.2 t</strong>
            </div>
            <div className="hero-scope hero-scope-2">
              <small>Scope 2</small>
              <strong>126.7 t</strong>
            </div>
            <div className="hero-scope hero-scope-3">
              <small>Scope 3</small>
              <strong>412.4 t</strong>
            </div>
          </div>
          <div className="hero-mockup-chart">
            <div className="hero-chart-line" />
            <span className="hero-chart-label">Emission trend</span>
          </div>
          <div className="hero-mockup-bars">
            <i style={{ height: '42%' }} />
            <i style={{ height: '68%' }} />
            <i style={{ height: '55%' }} />
            <i style={{ height: '78%' }} />
            <i style={{ height: '62%' }} />
          </div>
        </div>
      </div>
    </div>
  );
}
