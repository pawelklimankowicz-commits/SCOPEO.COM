/** Ikony liniowe do sekcji strony tytułowej (kolumny wartości) — a11y: aria-hidden */
export function IconClock() {
  return (
    <svg className="mkt-lp-icon" width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function IconTarget() {
  return (
    <svg className="mkt-lp-icon" width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
    </svg>
  );
}

export function IconTrend() {
  return (
    <svg className="mkt-lp-icon" width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 16l4-4 3 3 5-5 4 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M16 7h4v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function IconTeam() {
  return (
    <svg className="mkt-lp-icon" width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M8 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM16 10a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM3 20v-1a4 4 0 0 1 4-4h1M14 20v-1a3 3 0 0 1 3-3h1"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconLeaf() {
  return (
    <svg className="mkt-lp-icon" width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 21c-4-4-6-8-6-12a6 6 0 0 1 12 0c0 2-.5 4-1.5 5.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path d="M12 21V11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
