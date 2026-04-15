import type { SubscriptionPlan } from '@prisma/client';

export function canAccessScope3(plan: SubscriptionPlan): boolean {
  return ['STARTER', 'GROWTH', 'SCALE', 'ENTERPRISE'].includes(plan);
}

export function canAccessCsrdExport(plan: SubscriptionPlan): boolean {
  return ['STARTER', 'GROWTH', 'SCALE', 'ENTERPRISE'].includes(plan);
}

export function canAccessReviewWorkflow(plan: SubscriptionPlan): boolean {
  return ['GROWTH', 'SCALE', 'ENTERPRISE'].includes(plan);
}

export function canAccessApi(plan: SubscriptionPlan): boolean {
  return ['GROWTH', 'SCALE', 'ENTERPRISE'].includes(plan);
}

export function canAccessWhiteLabel(plan: SubscriptionPlan): boolean {
  return ['SCALE', 'ENTERPRISE'].includes(plan);
}
