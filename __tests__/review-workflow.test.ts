import { describe, it, expect } from 'vitest';
import { ensureAllowedTransition } from '@/lib/review-workflow';

describe('ensureAllowedTransition', () => {
  it('ANALYST może otworzyć review z PENDING', () => {
    expect(() =>
      ensureAllowedTransition({
        currentStatus: 'PENDING',
        nextStatus: 'IN_REVIEW',
        actorRole: 'ANALYST',
      })
    ).not.toThrow();
  });

  it('VIEWER nie może zmieniać statusu', () => {
    expect(() =>
      ensureAllowedTransition({
        currentStatus: 'PENDING',
        nextStatus: 'IN_REVIEW',
        actorRole: 'VIEWER',
      })
    ).toThrow();
  });

  it('REVIEWER może APPROVE z IN_REVIEW', () => {
    expect(() =>
      ensureAllowedTransition({
        currentStatus: 'IN_REVIEW',
        nextStatus: 'APPROVED',
        actorRole: 'REVIEWER',
      })
    ).not.toThrow();
  });

  it('OVERRIDDEN wymaga zmiany faktora lub kategorii', () => {
    expect(() =>
      ensureAllowedTransition({
        currentStatus: 'IN_REVIEW',
        nextStatus: 'OVERRIDDEN',
        actorRole: 'REVIEWER',
        hasOverride: false,
      })
    ).toThrow(/override/i);
    expect(() =>
      ensureAllowedTransition({
        currentStatus: 'IN_REVIEW',
        nextStatus: 'OVERRIDDEN',
        actorRole: 'REVIEWER',
        hasOverride: true,
      })
    ).not.toThrow();
  });
});
