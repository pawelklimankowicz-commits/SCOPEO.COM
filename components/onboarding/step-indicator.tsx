'use client';

import { useMemo } from 'react';
import { usePathname } from 'next/navigation';

const STEPS = [
  { step: 1, label: 'Profil organizacji' },
  { step: 2, label: 'Branza i granice' },
  { step: 3, label: 'Polaczenie KSeF' },
  { step: 4, label: 'Zespol' },
];

function parseStep(pathname: string): number {
  const match = pathname.match(/\/onboarding\/step\/(\d+)/);
  const step = Number(match?.[1] ?? '1');
  if (!Number.isFinite(step)) return 1;
  return Math.min(4, Math.max(1, Math.floor(step)));
}

export default function StepIndicator() {
  const pathname = usePathname();
  const currentStep = useMemo(() => parseStep(pathname), [pathname]);
  const progressPercent = (currentStep / 4) * 100;

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ marginBottom: 8, color: '#64748b', fontSize: 13 }}>Krok {currentStep}/4</div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
        {STEPS.map((item) => {
          const isDone = item.step < currentStep;
          const isActive = item.step === currentStep;
          return (
            <div
              key={item.step}
              style={{
                flex: 1,
                borderRadius: 8,
                border: `1px solid ${isDone || isActive ? '#16a34a' : '#334155'}`,
                background: isDone ? '#052e16' : isActive ? '#14532d' : '#0f172a',
                color: isDone || isActive ? '#bbf7d0' : '#94a3b8',
                padding: '8px 10px',
                fontSize: 12,
              }}
            >
              {isDone ? '✓ ' : ''}
              {item.label}
            </div>
          );
        })}
      </div>
      <div style={{ width: '100%', height: 8, background: '#1e293b', borderRadius: 999 }}>
        <div
          style={{
            width: `${progressPercent}%`,
            height: '100%',
            background: '#16a34a',
            borderRadius: 999,
            transition: 'width 220ms ease',
          }}
        />
      </div>
    </div>
  );
}
