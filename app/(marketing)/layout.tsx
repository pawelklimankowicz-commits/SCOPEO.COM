import '../marketing.css';
import { DM_Sans } from 'next/font/google';
import SiteFooter from '@/components/marketing/SiteFooter';
import SiteHeader from '@/components/marketing/SiteHeader';

const dmSans = DM_Sans({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-mkt-display',
  display: 'swap',
});

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`mkt-wrap ${dmSans.variable}`}>
      <SiteHeader />
      <main>{children}</main>
      <SiteFooter />
    </div>
  );
}
