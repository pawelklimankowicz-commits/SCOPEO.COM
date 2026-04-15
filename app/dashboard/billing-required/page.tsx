import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getSubscription } from '@/lib/billing';

export default async function BillingRequiredPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const organizationId = (session.user as any).organizationId as string;
  const sub = await getSubscription(organizationId);
  if (sub && (sub.status === 'ACTIVE' || sub.status === 'TRIALING')) {
    redirect('/dashboard');
  }

  return (
    <div className="container app-page">
      <h1 className="title">Twoj trial wygasl</h1>
      <p className="subtitle app-intro" style={{ maxWidth: 760 }}>
        Aby kontynuowac korzystanie ze Scopeo, wybierz plan subskrypcji.
      </p>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 18 }}>
        <Link className="btn btn-primary" href="/dashboard/settings/billing">
          Wybierz plan
        </Link>
        <Link className="btn btn-secondary" href="/kontakt">
          Masz pytania? Skontaktuj sie z nami
        </Link>
      </div>
    </div>
  );
}
