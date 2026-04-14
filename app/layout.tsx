import './globals.css';
import type { Metadata } from 'next';
import { connection } from 'next/server';
import { Inter } from 'next/font/google';
import { CookieConsent } from '@/components/CookieConsent';
import { auth } from '@/lib/auth';
import { COOKIE_CONSENT_VERSION } from '@/lib/cookie-consent';
import { prisma } from '@/lib/prisma';

const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Scopeo — ślad węglowy z danych KSeF',
    template: '%s · Scopeo',
  },
  description:
    'Carbon accounting B2B: import z KSeF, Scope 1–3, workflow review i audit trail — zamiast rozproszonego Excela.',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  await connection();

  const session = await auth();
  let serverAnalyticsCookies: boolean | null = null;
  if (session?.user?.id) {
    const row = await prisma.userConsent.findUnique({
      where: { userId: session.user.id },
    });
    if (row?.consentVersion === COOKIE_CONSENT_VERSION) {
      serverAnalyticsCookies = row.analyticsCookies;
    }
  }

  return (
    <html lang="pl" className={inter.variable}>
      <body className={inter.className}>
        {children}
        <CookieConsent
          isLoggedIn={Boolean(session?.user?.id)}
          serverAnalyticsCookies={serverAnalyticsCookies}
        />
      </body>
    </html>
  );
}
