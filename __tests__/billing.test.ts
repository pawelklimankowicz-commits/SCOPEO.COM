import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { Subscription } from '@prisma/client';
import { canAccessReviewWorkflow } from '@/lib/billing-features';
import { checkUserLimit, getPriceId, isTrialActive, planLimits } from '@/lib/billing';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    subscription: {
      findUnique: vi.fn(),
    },
    membership: {
      count: vi.fn(),
    },
    carbonProfile: {
      findUnique: vi.fn(),
    },
  },
}));

describe('billing helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns false for expired trial', () => {
    const sub = {
      status: 'TRIALING',
      trialEndsAt: new Date(Date.now() - 1000),
    } as Subscription;
    expect(isTrialActive(sub)).toBe(false);
  });

  it('returns disallowed when memberships reached limit', async () => {
    vi.mocked(prisma.subscription.findUnique).mockResolvedValueOnce({ userLimit: 5 } as any);
    vi.mocked(prisma.membership.count).mockResolvedValueOnce(5 as any);
    const check = await checkUserLimit('org_1');
    expect(check.allowed).toBe(false);
    expect(check.used).toBe(5);
    expect(check.limit).toBe(5);
  });

  it('exposes expected plan limits', () => {
    expect(planLimits('MIKRO')).toEqual({ ksefConnectionLimit: 1, userLimit: 1 });
    expect(planLimits('STARTER')).toEqual({ ksefConnectionLimit: 1, userLimit: 5 });
    expect(planLimits('GROWTH')).toEqual({ ksefConnectionLimit: 3, userLimit: 15 });
    expect(planLimits('SCALE')).toEqual({ ksefConnectionLimit: 10, userLimit: 999 });
  });

  it('checks review workflow plan access', () => {
    expect(canAccessReviewWorkflow('STARTER')).toBe(false);
    expect(canAccessReviewWorkflow('GROWTH')).toBe(true);
  });

  it('returns null price id for enterprise', () => {
    expect(getPriceId('ENTERPRISE', 'MONTHLY')).toBeNull();
  });
});
