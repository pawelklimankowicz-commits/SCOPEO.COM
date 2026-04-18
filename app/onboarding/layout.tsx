import type { ReactNode } from 'react';
import Link from 'next/link';
import { BrandLogoLockup } from '@/components/BrandLogo';
import StepIndicator from '@/components/onboarding/step-indicator';

export default function OnboardingLayout({ children }: { children: ReactNode }) {
  return (
    <main className="container app-page" style={{ maxWidth: 980, marginTop: 24, marginBottom: 36 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
          <BrandLogoLockup
            size={26}
            withWordmark
            wordmarkColor="#0f172a"
            taglineColor="#64748b"
          />
        </Link>
      </div>
      <StepIndicator />
      {children}
    </main>
  );
}
