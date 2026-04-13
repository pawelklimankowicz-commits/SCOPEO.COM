import test from 'node:test';
import assert from 'node:assert/strict';

const transitions = {
  PENDING: { ANALYST: ['IN_REVIEW'], ADMIN: ['IN_REVIEW'], OWNER: ['IN_REVIEW'] },
  IN_REVIEW: { REVIEWER: ['CHANGES_REQUESTED', 'APPROVED', 'REJECTED', 'OVERRIDDEN'], APPROVER: ['APPROVED', 'REJECTED'], ADMIN: ['APPROVED', 'REJECTED', 'OVERRIDDEN'], OWNER: ['APPROVED', 'REJECTED', 'OVERRIDDEN'] },
  CHANGES_REQUESTED: { ANALYST: ['IN_REVIEW'], ADMIN: ['IN_REVIEW'], OWNER: ['IN_REVIEW'] },
  APPROVED: { APPROVER: ['OVERRIDDEN'], ADMIN: ['OVERRIDDEN'], OWNER: ['OVERRIDDEN'] },
  REJECTED: { ANALYST: ['IN_REVIEW'], ADMIN: ['IN_REVIEW'], OWNER: ['IN_REVIEW'] },
  OVERRIDDEN: { APPROVER: ['APPROVED'], ADMIN: ['APPROVED'], OWNER: ['APPROVED'] }
};
function ensureAllowedTransition(currentStatus, nextStatus, actorRole, hasOverride=false) {
  const allowed = transitions[currentStatus]?.[actorRole] || [];
  if (!allowed.includes(nextStatus)) throw new Error('not allowed');
  if (nextStatus === 'OVERRIDDEN' && !hasOverride) throw new Error('override required');
}
function buildDiff(before, after) {
  const fields = ['status','categoryCode','factorId','comment','assigneeUserId'];
  const changes = fields.filter(f => (before?.[f] ?? null) !== (after?.[f] ?? null)).map(f => ({ field: f, before: before?.[f] ?? null, after: after?.[f] ?? null }));
  return { changed: changes.length > 0, changes };
}

test('ANALYST can move PENDING to IN_REVIEW', () => {
  assert.doesNotThrow(() => ensureAllowedTransition('PENDING', 'IN_REVIEW', 'ANALYST'));
});

test('REVIEWER cannot approve directly from PENDING', () => {
  assert.throws(() => ensureAllowedTransition('PENDING', 'APPROVED', 'REVIEWER'));
});

test('OVERRIDDEN requires changed factor or category', () => {
  assert.throws(() => ensureAllowedTransition('IN_REVIEW', 'OVERRIDDEN', 'REVIEWER', false));
  assert.doesNotThrow(() => ensureAllowedTransition('IN_REVIEW', 'OVERRIDDEN', 'REVIEWER', true));
});

test('Diff builder returns before/after field changes', () => {
  const diff = buildDiff({ status:'IN_REVIEW', factorId:'A', comment:null }, { status:'OVERRIDDEN', factorId:'B', comment:'manual fix' });
  assert.equal(diff.changed, true);
  assert.ok(diff.changes.some(c => c.field === 'status'));
  assert.ok(diff.changes.some(c => c.field === 'factorId'));
  assert.ok(diff.changes.some(c => c.field === 'comment'));
});
