import { describe, expect, it } from 'vitest';
import {
  isApiSessionBillingExempt,
  isJwtSubscriptionBlocking,
  isSubscriptionProductAccessAllowed,
} from '@/lib/billing-access';

describe('billing-access', () => {
  it('isJwtSubscriptionBlocking: ACTIVE and in-trial TRIALING pass', () => {
    expect(isJwtSubscriptionBlocking('ACTIVE', null)).toBe(false);
    const future = new Date(Date.now() + 86_400_000).toISOString();
    expect(isJwtSubscriptionBlocking('TRIALING', future)).toBe(false);
  });

  it('isJwtSubscriptionBlocking: CANCELED, PAST_DUE, expired trial', () => {
    expect(isJwtSubscriptionBlocking('CANCELED', null)).toBe(true);
    expect(isJwtSubscriptionBlocking('PAST_DUE', null)).toBe(true);
    const past = new Date(Date.now() - 86_400_000).toISOString();
    expect(isJwtSubscriptionBlocking('TRIALING', past)).toBe(true);
  });

  it('isSubscriptionProductAccessAllowed matches ACTIVE / TRIALING', () => {
    expect(isSubscriptionProductAccessAllowed({ status: 'ACTIVE', trialEndsAt: null })).toBe(true);
    const future = new Date(Date.now() + 86_400_000);
    expect(isSubscriptionProductAccessAllowed({ status: 'TRIALING', trialEndsAt: future })).toBe(true);
    const past = new Date(Date.now() - 86_400_000);
    expect(isSubscriptionProductAccessAllowed({ status: 'TRIALING', trialEndsAt: past })).toBe(false);
    expect(isSubscriptionProductAccessAllowed({ status: 'CANCELED', trialEndsAt: null })).toBe(false);
  });

  it('isApiSessionBillingExempt covers billing and public routes', () => {
    expect(isApiSessionBillingExempt('/api/billing/checkout')).toBe(true);
    expect(isApiSessionBillingExempt('/api/auth/register')).toBe(true);
    expect(isApiSessionBillingExempt('/api/organizations')).toBe(true);
    expect(isApiSessionBillingExempt('/api/emissions')).toBe(false);
  });
});
