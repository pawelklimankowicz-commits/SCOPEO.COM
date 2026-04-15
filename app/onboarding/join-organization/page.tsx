import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import JoinOrganizationClient from '@/components/onboarding/join-organization-client';

export const dynamic = 'force-dynamic';

export default async function JoinOrganizationPage({
  searchParams,
}: {
  searchParams?: Promise<{ token?: string; org?: string; role?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.email) {
    redirect('/login');
  }
  const params = searchParams ? await searchParams : undefined;
  const inviteToken = String(params?.token || '');
  if (!inviteToken) {
    redirect('/dashboard');
  }

  return (
    <main className="container app-page">
      <JoinOrganizationClient
        inviteToken={inviteToken}
        email={session.user.email}
        organizationName={String(params?.org || 'Nowa organizacja')}
        role={String(params?.role || 'VIEWER')}
      />
    </main>
  );
}
