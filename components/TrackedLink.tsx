'use client';

import type { ReactNode } from 'react';
import Link, { type LinkProps } from 'next/link';
import { trackMarketingEvent } from '@/lib/analytics-client';

type Props = Omit<LinkProps, 'onClick' | 'href'> & {
  href: string;
  /** unikalna nazwa zdarzenia, np. mkt.cta.hero_trial */
  eventName: string;
  className?: string;
  children: ReactNode;
};

/**
 * Link marketingowy: po kliknięciu wysyła zdarzenie (tylko jeśli użytkownik zaakceptował analitykę w banerze).
 */
export function TrackedLink({ href, eventName, children, className, ...rest }: Props) {
  return (
    <Link
      href={href}
      className={className}
      {...rest}
      onClick={() => {
        void trackMarketingEvent(eventName, { href: href.slice(0, 200) });
      }}
    >
      {children}
    </Link>
  );
}
