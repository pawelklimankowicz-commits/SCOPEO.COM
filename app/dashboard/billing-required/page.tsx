import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getSubscription, isTrialActive } from '@/lib/billing';

export default async function BillingRequiredPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const organizationId = (session.user as any).organizationId as string;
  const sub = await getSubscription(organizationId);
  if (sub && (sub.status === 'ACTIVE' || isTrialActive(sub))) {
    redirect('/dashboard');
  }

  const isTrialExpired = sub != null && sub.status === 'TRIALING' && !isTrialActive(sub);

  return (
    <div className="container app-page">
      <h1 className="title">{isTrialExpired ? 'Twój trial wygasł' : 'Subskrypcja nieaktywna'}</h1>
      <p className="subtitle app-intro" style={{ maxWidth: 760 }}>
        {isTrialExpired
          ? 'Twój 7-dniowy bezpłatny trial dobiegł końca. Wybierz plan, aby kontynuować korzystanie ze Scopeo.'
          : 'Aby kontynuować korzystanie ze Scopeo, wybierz plan subskrypcji.'}
      </p>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 18 }}>
        <Link className="btn btn-primary" href="/dashboard/settings/billing">
          Wybierz plan
        </Link>
        <Link className="btn btn-secondary" href="/kontakt">
          Masz pytania? Skontaktuj się z nami
        </Link>
      </div>
    </div>
  );
}
