'use client';
import { useState } from 'react';
const SAMPLE_XML = `<Faktura><Podmiot1><Nazwa>Mix Supplier Sp z o.o.</Nazwa><NIP>5250000010</NIP></Podmiot1><Fa><P_1>2026-03-10</P_1><P_2>FV/10/03/2026</P_2><KodWaluty>PLN</KodWaluty><P_13_1>18400</P_13_1><P_15>22632</P_15></Fa><FaWiersze><FaWiersz><P_7>Energia elektryczna biuro</P_7><P_8A>8000</P_8A><P_8B>kWh</P_8B><P_11>9600</P_11></FaWiersz><FaWiersz><P_7>Usługi kurierskie InPost</P_7><P_11>1200</P_11></FaWiersz><FaWiersz><P_7>Hotel delegacja Warszawa</P_7><P_11>900</P_11></FaWiersz></FaWiersze></Faktura>`;
export default function DashboardActionsV9() {
  const [xml, setXml] = useState(SAMPLE_XML); const [ksefReferenceNumber, setKsefReferenceNumber] = useState(''); const [queuedJobId, setQueuedJobId] = useState(''); const [importResult, setImportResult] = useState(''); const [calcResult, setCalcResult] = useState(''); const [factorResult, setFactorResult] = useState('');
  const importXml = async () => { const res = await fetch('/api/ksef/import', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ xml }) }); setImportResult(JSON.stringify(await res.json(), null, 2)); };
  const importFromKsefApi = async () => { const res = await fetch('/api/ksef/import', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ ksefReferenceNumber }) }); const data = await res.json(); if (data?.jobId) setQueuedJobId(data.jobId); setImportResult(JSON.stringify(data, null, 2)); };
  const checkJobStatus = async () => { if (!queuedJobId.trim()) return; const res = await fetch(`/api/ksef/jobs/${queuedJobId}`); setImportResult(JSON.stringify(await res.json(), null, 2)); };
  const calculate = async (persistSnapshot: boolean) => {
    const qs = new URLSearchParams(window.location.search);
    const reportYear = Number(qs.get('year'));
    const body: Record<string, unknown> = {};
    if (Number.isFinite(reportYear)) body.reportYear = reportYear;
    if (persistSnapshot) body.persistSnapshot = true;
    const res = await fetch('/api/emissions/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    setCalcResult(JSON.stringify(await res.json(), null, 2));
  };
  const importFactors = async () => { const res = await fetch('/api/factors/import', { method:'POST' }); setFactorResult(JSON.stringify(await res.json(), null, 2)); };
  return <div className="grid grid-2"><div className="card section"><h3>CI-ready import i testowane parsery</h3><button className="btn btn-primary" onClick={importFactors}>Importuj faktory zewnętrzne</button>{factorResult ? <pre className="code" style={{marginTop:16}}>{factorResult}</pre> : null}<h3 style={{marginTop:22}}>Import XML KSeF</h3><textarea value={xml} onChange={(e)=>setXml(e.target.value)} /><button className="btn btn-primary" onClick={importXml} style={{marginTop:14}}>Importuj XML</button><h3 style={{marginTop:22}}>Import z API KSeF (kolejka async)</h3><input value={ksefReferenceNumber} onChange={(e)=>setKsefReferenceNumber(e.target.value)} placeholder="Numer referencyjny KSeF" /><button className="btn btn-primary" onClick={importFromKsefApi} style={{marginTop:14}} disabled={!ksefReferenceNumber.trim()}>Kolejkuj import z KSeF API</button><div style={{ display:'flex', gap:8, marginTop:10 }}><input value={queuedJobId} onChange={(e)=>setQueuedJobId(e.target.value)} placeholder="ID joba KSeF" /><button className="btn btn-secondary" onClick={checkJobStatus} disabled={!queuedJobId.trim()}>Sprawdź status joba</button></div>{importResult ? <pre className="code" style={{marginTop:16}}>{importResult}</pre> : null}</div><div className="card section"><h3>Kalkulator emisji</h3><p className="small" style={{ marginBottom: 12, color: '#b0bee6' }}>„Przelicz” tylko liczy wynik. „Zapisz snapshot” zapisuje w bazie (sekcja „Ostatnia kalkulacja” na dashboardzie) — identyczny wynik jak poprzedni nie tworzy duplikatu.</p><div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}><button className="btn btn-primary" onClick={() => calculate(false)}>Przelicz emisje</button><button className="btn btn-secondary" onClick={() => calculate(true)}>Przelicz i zapisz snapshot</button></div>{calcResult ? <pre className="code" style={{marginTop:16}}>{calcResult}</pre> : null}</div></div>;
}