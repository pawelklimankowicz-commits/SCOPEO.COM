'use client';
import { useState } from 'react';
import FieldDiffCard from './FieldDiffCard';
function parseDiff(value: unknown) {
  if (!value) return { changed: false, changes: [] };
  if (typeof value === 'object') return value as any;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return { changed: false, changes: [] };
    }
  }
  return { changed: false, changes: [] };
}
export default function ReviewPanel({ lines, factors, history }: { lines: any[]; factors: any[]; history: any[] }) {
  const [result, setResult] = useState('');
  const [selected, setSelected] = useState<any | null>(history[0] || null);
  async function update(lineId: string, status: string, overrideCategoryCode?: string, overrideFactorId?: string) {
    const res = await fetch('/api/review/update', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ lineId, status, overrideCategoryCode: overrideCategoryCode || null, overrideFactorId: overrideFactorId || null, comment: 'updated in review panel' }) });
    setResult(JSON.stringify(await res.json(), null, 2));
    window.location.reload();
  }
  const diff = selected ? parseDiff(selected.diffJson) : { changed:false, changes:[] };
  return <div className="card section" style={{ marginTop: 24 }}><h2>Workflow review + side-by-side diff viewer</h2><table><thead><tr><th>Opis</th><th>Status</th><th>Mapowanie</th><th>Override faktor</th><th>Akcje</th></tr></thead><tbody>{lines.map((line)=> <tr key={line.id}><td>{line.description}</td><td>{line.mappingDecision?.status || 'PENDING'}</td><td>{line.overrideCategoryCode || line.categoryCode} / {line.overrideFactorId || line.emissionFactor?.code || '-'}</td><td><select defaultValue=""><option value="">-- wybierz faktor --</option>{factors.map((f:any)=><option key={f.id} value={f.id}>{f.code} [{f.region}]</option>)}</select></td><td style={{display:'flex',gap:8,flexWrap:'wrap'}}><button className="btn btn-secondary" onClick={()=>update(line.id, 'IN_REVIEW')}>Send to review</button><button className="btn btn-secondary" onClick={()=>update(line.id, 'CHANGES_REQUESTED')}>Changes requested</button><button className="btn btn-secondary" onClick={()=>update(line.id, 'APPROVED')}>Approve</button><button className="btn btn-secondary" onClick={()=>update(line.id, 'REJECTED')}>Reject</button><button className="btn btn-primary" onClick={(e)=>{ const select = (e.currentTarget.parentElement?.previousElementSibling?.querySelector('select') as HTMLSelectElement | null); update(line.id, 'OVERRIDDEN', line.categoryCode, select?.value || undefined); }}>Override</button></td></tr>)}</tbody></table><div className="grid grid-2" style={{ marginTop: 24, alignItems: 'start' }}><div><h3>Historia zmian</h3><div className="grid" style={{ gap: 12 }}>{history.map((h:any)=><button key={h.id} className="card section" style={{ textAlign:'left', padding:16, border: selected?.id === h.id ? '1px solid #6ea8ff' : '1px solid #27345f', background: selected?.id === h.id ? 'rgba(110,168,255,.08)' : '#101932' }} onClick={()=>setSelected(h)}><div className="small">{new Date(h.createdAt).toLocaleString()} · {h.action}</div><div style={{marginTop:8,fontWeight:700}}>{h.fromStatus || '-'} → {h.toStatus || '-'}</div><div className="small" style={{marginTop:8}}>{h.comment || 'Brak komentarza'}</div></button>)}</div></div><div><h3>Porównanie before / after</h3>{selected ? <div className="grid" style={{ gap: 12 }}>{diff.changes.length ? diff.changes.map((c:any, idx:number)=><FieldDiffCard key={idx} label={c.field} before={c.before} after={c.after} />) : <div className="small">Brak zmian w wybranym zdarzeniu.</div>}</div> : <div className="small">Wybierz zdarzenie z historii.</div>}</div></div>{result ? <pre className="code" style={{marginTop:16}}>{result}</pre> : null}</div>;
}