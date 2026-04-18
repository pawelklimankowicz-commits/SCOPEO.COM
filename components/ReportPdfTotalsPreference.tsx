'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

type Basis = 'LB' | 'MB';

export function ReportPdfTotalsPreference(props: {
  initialBasis: Basis;
  canEdit: boolean;
  yearQuery: string;
  snapshotMinQualityScore: number;
  snapshotMinScope3CoveragePct: number;
  auditRiskMissingPctHigh: number;
}) {
  const router = useRouter();
  const [basis, setBasis] = useState<Basis>(props.initialBasis);
  const [pending, setPending] = useState(false);

  async function save(next: Basis) {
    if (!props.canEdit || next === basis) return;
    setPending(true);
    try {
      const res = await fetch('/api/carbon-profile/report-preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportTotalDisplayBasis: next }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error((j as { error?: string }).error ?? 'Zapis nie powiodl sie');
      }
      setBasis(next);
      router.refresh();
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : 'Blad zapisu');
    } finally {
      setPending(false);
    }
  }

  const y = props.yearQuery ? `&year=${encodeURIComponent(props.yearQuery)}` : '';

  return (
    <div className="card section" style={{ marginTop: 16 }}>
      <h2 style={{ marginTop: 0 }}>Raport GHG (PDF)</h2>
      <p className="app-muted" style={{ marginTop: 0, fontSize: 14 }}>
        Wybierz, która suma całkowita (Scope 1+2+3) jest traktowana jako główna w eksporcie PDF — obie wartości są
        zawsze drukowane na stronie 1 raportu.
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', marginTop: 12 }}>
        <span style={{ fontSize: 14, color: '#94a3b8' }}>Pokazuj total wg:</span>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 14, cursor: 'pointer' }}>
          <input
            type="radio"
            name="total-basis"
            checked={basis === 'LB'}
            disabled={!props.canEdit || pending}
            onChange={() => void save('LB')}
          />
          LB (location-based)
        </label>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 14, cursor: 'pointer' }}>
          <input
            type="radio"
            name="total-basis"
            checked={basis === 'MB'}
            disabled={!props.canEdit || pending}
            onChange={() => void save('MB')}
          />
          MB (market-based)
        </label>
        {pending ? <span style={{ fontSize: 13, color: '#64748b' }}>Zapisywanie…</span> : null}
      </div>
      <p className="app-muted" style={{ marginTop: 14, fontSize: 13, lineHeight: 1.5 }}>
        Progi zamknięcia snapshotu (API / profil): minimalny Data Quality Score ≥{' '}
        {props.snapshotMinQualityScore.toFixed(0)}, minimalne pokrycie macierzy Scope 3 ≥{' '}
        {props.snapshotMinScope3CoveragePct.toFixed(0)}%, flaga „audit-risk high” gdy udział „missing” w emisji całkowitej
        {'>'} {props.auditRiskMissingPctHigh.toFixed(0)}%.
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 14 }}>
        <a className="btn btn-secondary" href={`/api/emissions/report?totalBasis=LB${y}`}>
          Pobierz PDF (podgląd LB)
        </a>
        <a className="btn btn-secondary" href={`/api/emissions/report?totalBasis=MB${y}`}>
          Pobierz PDF (podgląd MB)
        </a>
        <a className="btn btn-secondary" href={`/api/emissions/report${props.yearQuery ? `?year=${encodeURIComponent(props.yearQuery)}` : ''}`}>
          Pobierz PDF (wg ustawienia: {basis})
        </a>
      </div>
    </div>
  );
}
