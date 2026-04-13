import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Scopeo · KSeF GHG',
  description:
    'Zarządzaj śladem węglowym firmy z dokładnością KSeF — carbon accounting, import, Scope 1–3',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl" className={inter.variable}>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
