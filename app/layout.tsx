import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import CookieConsentBanner from '@/components/marketing/CookieConsentBanner';

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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl" className={inter.variable}>
      <body className={inter.className}>
        {children}
        <CookieConsentBanner />
      </body>
    </html>
  );
}
