import Link from 'next/link';
import { requireTenantMembership } from '@/lib/tenant';
import { prisma } from '@/lib/prisma';
import { signOut } from '@/lib/auth';
import DashboardActionsV9 from '@/components/DashboardActionsV9';
import ReviewPanel from '@/components/ReviewPanel';
async function logoutAction() { 'use server'; await signOut({ redirectTo: '/login' }); }
export default async function DashboardPage() {
  const { session, organizationId, membership } = await requireTenantMembership();
  const profile = await prisma.carbonProfile.findUnique({ where: { organizationId } });
  const org = await prisma.organization.findUnique({ where: { id: organizationId } });
  const invoices = await prisma.invoice.findMany({ where: { organizationId }, include: { supplier: true, lines: { include: { emissionFactor: { include: { emissionSource: true } }, mappingDecision: true } } }, orderBy: { issueDate: 'desc' } });
  const lines = invoices.flatMap(i => i.lines);
  const factors = await prisma.emissionFactor.findMany({ where: { organizationId }, include: { emissionSource: true }, orderBy: [{ regionPriority: 'asc' }, { year: 'desc' }] });
  const sources = await prisma.emissionSource.findMany({ where: { organizationId }, orderBy: { code: 'asc' } });
  const importRuns = await prisma.factorImportRun.findMany({ where: { organizationId }, orderBy: { createdAt: 'desc' }, take: 20 });
  const history = await prisma.reviewEvent.findMany({ where: { organizationId }, orderBy: { createdAt: 'desc' }, take: 50 });
  const latestCalculation = await prisma.emissionCalculation.findFirst({ where: { organizationId }, orderBy: { createdAt: 'desc' } });
  return <main className="container"><div className="nav"><div><span className="badge">{membership.organization.slug}</span><h1 className="title" style={{ marginBottom: 8 }}>Dashboard tenantu v9</h1><div className="subtitle">Zalogowany jako {(session.user as any).email} · rola: {(session.user as any).role} · region: {org?.regionCode || 'PL'}</div></div><div style={{ display: 'flex', gap: 12 }}><Link className="btn btn-secondary" href="/onboarding">Onboarding</Link><form action={logoutAction}><button className="btn btn-secondary" type="submit">Wyloguj</button></form></div></div><div className="grid grid-3"><div className="kpi"><div className="small">Profil emisji</div><h3>{profile ? 'Skonfigurowany' : 'Brak'}</h3></div><div className="kpi"><div className="small">Import runs</div><h3>{importRuns.length}</h3></div><div className="kpi"><div className="small">Review events</div><h3>{history.length}</h3></div></div><div style={{ marginTop: 24 }}><DashboardActionsV9 organizationId={organizationId} /></div><div className="card section" style={{ marginTop: 24 }}><h2>Źródła i wersje</h2><table><thead><tr><th>Kod</th><th>Wydawca</th><th>Wersja</th><th>Region</th><th>Notatka</th></tr></thead><tbody>{sources.map((s)=><tr key={s.id}><td>{s.code}</td><td>{s.publisher}</td><td>{s.version}</td><td>{s.region ?? '-'}</td><td>{s.notes ?? '-'}</td></tr>)}</tbody></table></div><div className="card section" style={{ marginTop: 24 }}><h2>Walidacja i historia importów XLSX</h2><table><thead><tr><th>Źródło</th><th>Status</th><th>Zaimportowano</th><th>Błędy / walidacja</th></tr></thead><tbody>{importRuns.map((r)=><tr key={r.id}><td>{r.sourceCode}</td><td>{r.status}</td><td>{r.importedCount}</td><td><div className="small" style={{maxWidth:520,whiteSpace:'pre-wrap'}}>{r.errorMessage || r.validationJson}</div></td></tr>)}</tbody></table></div><ReviewPanel lines={lines} factors={factors} history={history} /><div className="card section" style={{ marginTop: 24 }}><h2>Ostatnia kalkulacja</h2><pre className="code">{latestCalculation ? latestCalculation.summaryJson : 'Brak kalkulacji'}</pre></div></main>;
}