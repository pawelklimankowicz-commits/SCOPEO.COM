import { notFound, redirect } from 'next/navigation';
import OnboardingWizardStep from '@/components/onboarding/wizard-step';
import { prisma } from '@/lib/prisma';
import { getTenantRlsContext, runWithTenantRls } from '@/lib/tenant';

export default async function OnboardingStepPage({
  params,
}: {
  params: Promise<{ step: string }>;
}) {
  const { step } = await params;
  const numericStep = Number(step);
  if (!Number.isFinite(numericStep) || numericStep < 1 || numericStep > 4) {
    notFound();
  }

  const t = await getTenantRlsContext();
  return runWithTenantRls({ userId: t.userId, organizationId: t.organizationId }, async () => {
  const { session, organizationId, membership } = t;
  const role = (session.user as any).role as string | undefined;
  if (role !== 'OWNER' && role !== 'ADMIN') {
    redirect('/dashboard');
  }

  const profile = await prisma.carbonProfile.findUnique({
    where: { organizationId },
    select: {
      companyName: true,
      taxId: true,
      reportingYear: true,
      baseYear: true,
      boundaryApproach: true,
      industry: true,
      ksefTokenMasked: true,
    },
  });

  return (
    <div>
      <h1 className="title" style={{ marginBottom: 6 }}>
        Konfiguracja organizacji
      </h1>
      <p className="app-muted" style={{ marginTop: 0 }}>
        Ustawienia krok po kroku dla {membership.organization.name}.
      </p>
      <OnboardingWizardStep
        step={numericStep}
        organizationName={membership.organization.name}
        initial={profile}
      />
    </div>
  );
  });
}
