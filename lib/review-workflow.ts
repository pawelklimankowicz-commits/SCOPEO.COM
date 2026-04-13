export type Role = 'OWNER' | 'ADMIN' | 'ANALYST' | 'REVIEWER' | 'APPROVER' | 'VIEWER';
export type ReviewStatus = 'PENDING' | 'IN_REVIEW' | 'CHANGES_REQUESTED' | 'APPROVED' | 'REJECTED' | 'OVERRIDDEN';

export type ReviewTransitionInput = { currentStatus: ReviewStatus; nextStatus: ReviewStatus; actorRole: Role; hasOverride?: boolean };

const transitions: Record<ReviewStatus, Partial<Record<Role, ReviewStatus[]>>> = {
  PENDING: { ANALYST: ['IN_REVIEW'], ADMIN: ['IN_REVIEW'], OWNER: ['IN_REVIEW'] },
  IN_REVIEW: { REVIEWER: ['CHANGES_REQUESTED', 'APPROVED', 'REJECTED', 'OVERRIDDEN'], APPROVER: ['APPROVED', 'REJECTED'], ADMIN: ['APPROVED', 'REJECTED', 'OVERRIDDEN'], OWNER: ['APPROVED', 'REJECTED', 'OVERRIDDEN'] },
  CHANGES_REQUESTED: { ANALYST: ['IN_REVIEW'], ADMIN: ['IN_REVIEW'], OWNER: ['IN_REVIEW'] },
  APPROVED: { APPROVER: ['OVERRIDDEN'], ADMIN: ['OVERRIDDEN'], OWNER: ['OVERRIDDEN'] },
  REJECTED: { ANALYST: ['IN_REVIEW'], ADMIN: ['IN_REVIEW'], OWNER: ['IN_REVIEW'] },
  OVERRIDDEN: { APPROVER: ['APPROVED'], ADMIN: ['APPROVED'], OWNER: ['APPROVED'] },
};

export function ensureAllowedTransition(input: ReviewTransitionInput) {
  const allowed = transitions[input.currentStatus]?.[input.actorRole] || [];
  if (!allowed.includes(input.nextStatus)) throw new Error(`Transition ${input.currentStatus} -> ${input.nextStatus} is not allowed for role ${input.actorRole}`);
  if (input.nextStatus === 'OVERRIDDEN' && !input.hasOverride) throw new Error('Override transition requires changed factor or category');
  return true;
}

export function reviewActionFromStatus(nextStatus: ReviewStatus) {
  if (nextStatus === 'IN_REVIEW') return 'SENT_TO_REVIEW';
  if (nextStatus === 'CHANGES_REQUESTED') return 'CHANGES_REQUESTED';
  if (nextStatus === 'APPROVED') return 'APPROVED';
  if (nextStatus === 'REJECTED') return 'REJECTED';
  if (nextStatus === 'OVERRIDDEN') return 'OVERRIDDEN';
  return 'COMMENTED';
}

export function buildDiff(before: any, after: any) {
  const fields = ['status','categoryCode','factorId','comment','assigneeUserId'];
  const changes = fields.filter(f => (before?.[f] ?? null) !== (after?.[f] ?? null)).map(f => ({ field: f, before: before?.[f] ?? null, after: after?.[f] ?? null }));
  return { changed: changes.length > 0, changes };
}
