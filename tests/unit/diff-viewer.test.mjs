import test from 'node:test';
import assert from 'node:assert/strict';

function buildDiff(before, after) {
  const fields = ['status','categoryCode','factorId','comment','assigneeUserId'];
  const changes = fields.filter(f => (before?.[f] ?? null) !== (after?.[f] ?? null)).map(f => ({ field: f, before: before?.[f] ?? null, after: after?.[f] ?? null }));
  return { changed: changes.length > 0, changes };
}

test('Diff viewer model returns only changed fields', () => {
  const diff = buildDiff({ status:'IN_REVIEW', categoryCode:'scope2_electricity', factorId:'F1', comment:null, assigneeUserId:'U1' }, { status:'OVERRIDDEN', categoryCode:'scope2_electricity', factorId:'F2', comment:'manual correction', assigneeUserId:'U1' });
  assert.equal(diff.changed, true);
  assert.equal(diff.changes.length, 3);
  assert.deepEqual(diff.changes.map(c => c.field), ['status','factorId','comment']);
});
