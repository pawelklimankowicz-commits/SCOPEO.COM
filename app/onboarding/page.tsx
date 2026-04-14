import Link from 'next/link';
import { requireTenantMembership } from '@/lib/tenant';
import { prisma } from '@/lib/prisma';
import OnboardingV6Form from '@/components/OnboardingV6Form';

export default async function OnboardingPage() {
  const { organizationId, membership } = await requireTenantMembership();
  const profile = await prisma.carbonProfile.findUnique({ where: { organizationId } });

  return (
    <main className="container app-page">
      <div className="nav" style={{ marginBottom: 20 }}>
        <Link href="/dashboard" className="badge" style={{ textDecoration: 'none' }}>
          ← Dashboard
        </Link>
      </div>

      <span className="badge">{membership.organization.slug}</span>
      <h1 className="title">Onboarding organizacji</h1>
      <p className="subtitle app-intro">
        Ten krok odpowiada za profil raportowania GHG: granice organizacji, rok bazowy, token integracji
        KSeF (przechowywany zaszyfrowany i maskowany) oraz zakres tematów (np. delegacje w scope 3). Po zapisie możesz
        importować faktury XML i faktory emisji w panelu głównym.
      </p>

      <ol
        className="app-muted"
        style={{
          margin: '20px 0 8px',
          paddingLeft: 22,
          lineHeight: 1.7,
          maxWidth: 800,
          fontSize: 14,
        }}
      >
        <li>Token KSeF — wklej rzeczywisty lub testowy (min. 10 znaków).</li>
        <li>Rok raportowania i rok bazowy — zgodnie z polityką raportu ESG.</li>
        <li>Podejście do granic — operational control / financial control / equity share.</li>
      </ol>

      <OnboardingV6Form initial={profile ?? undefined} />
    </main>
  );
}
