import type { ReactNode } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import LogoutButton from '@/components/LogoutButton';
import WorkspaceSwitcher from '@/components/workspace-switcher';
import AuthSessionProvider from '@/components/AuthSessionProvider';
import NotificationBell from '@/components/notification-bell';
import { requireTenantMembership } from '@/lib/tenant';
import { prisma } from '@/lib/prisma';

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const { session, membership } = await requireTenantMembership();
  const role = (session.user as any).role as string;
  const organization = await prisma.organization.findUnique({
    where: { id: membership.organizationId },
    select: { onboardingCompletedAt: true },
  });
  if (role === 'OWNER' && !organization?.onboardingCompletedAt) {
    redirect('/onboarding/step/1');
  }

  const navLinks = [
    { href: '/dashboard', label: 'Przeglad' },
    { href: '/dashboard/invoices', label: 'Faktury' },
    { href: '/dashboard/review', label: 'Review' },
    { href: '/dashboard/report', label: 'Raport emisji' },
    { href: '/dashboard/settings', label: 'Ustawienia' },
    ...(role === 'OWNER' || role === 'ADMIN' ? [{ href: '/dashboard/audit', label: 'Audit log' }] : []),
    ...(role === 'OWNER' || role === 'ADMIN' ? [{ href: '/dashboard/gdpr', label: 'GDPR' }] : []),
  ];

  return (
    <AuthSessionProvider>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <header
          style={{
            background: '#0f172a',
            borderBottom: '1px solid #1e293b',
            padding: '12px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <span style={{ color: '#16a34a', fontWeight: 700, fontSize: 18 }}>Scopeo</span>
            <span style={{ color: '#475569', fontSize: 13 }}>{membership.organization.name}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <WorkspaceSwitcher />
            <NotificationBell />
            <span style={{ color: '#64748b', fontSize: 12 }}>
              {(session.user as any).email} · {role}
            </span>
            <LogoutButton />
          </div>
        </header>

        <div style={{ display: 'flex', flex: 1 }}>
          <nav
            style={{
              width: 200,
              background: '#0f172a',
              borderRight: '1px solid #1e293b',
              padding: '24px 0',
            }}
          >
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  display: 'block',
                  padding: '10px 24px',
                  color: '#94a3b8',
                  textDecoration: 'none',
                  fontSize: 14,
                }}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <main style={{ flex: 1, padding: 32, overflowY: 'auto' }}>
            {children}
            <footer
              style={{
                marginTop: 28,
                paddingTop: 16,
                borderTop: '1px solid #1e293b',
                display: 'flex',
                gap: 14,
                flexWrap: 'wrap',
                fontSize: 13,
              }}
            >
              <Link href="/regulamin" style={{ color: '#94a3b8' }}>
                Regulamin
              </Link>
              <Link href="/polityka-prywatnosci" style={{ color: '#94a3b8' }}>
                Polityka prywatnosci
              </Link>
              <Link href="/cookies" style={{ color: '#94a3b8' }}>
                Cookies
              </Link>
              <Link href="/dpa" style={{ color: '#94a3b8' }}>
                DPA
              </Link>
            </footer>
          </main>
        </div>
      </div>
    </AuthSessionProvider>
  );
}
