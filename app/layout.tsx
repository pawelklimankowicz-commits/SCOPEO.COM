import './globals.css';
import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: 'Scopeo · KSeF GHG',
  description: 'Ślad węglowy z KSeF — import, mapowanie GHG, review, faktory emisji',
};
export default function RootLayout({ children }: { children: React.ReactNode }) { return <html lang="pl"><body>{children}</body></html>; }