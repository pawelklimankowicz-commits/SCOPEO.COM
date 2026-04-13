import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

function buildDiff(before, after) {
  const fields = ['status','categoryCode','factorId','comment','assigneeUserId'];
  const changes = fields.filter(f => (before?.[f] ?? null) !== (after?.[f] ?? null)).map(f => ({ field: f, before: before?.[f] ?? null, after: after?.[f] ?? null }));
  return { changed: changes.length > 0, changes };
}
function snapshotFile(name) { return path.join(process.cwd(), 'tests/unit/__snapshots__', name); }
function ensureDir() { fs.mkdirSync(path.join(process.cwd(), 'tests/unit/__snapshots__'), { recursive: true }); }
function assertSnapshot(name, value) {
  ensureDir();
  const file = snapshotFile(name);
  const serialized = JSON.stringify(value, null, 2) + '\n';
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, serialized);
    assert.ok(true);
    return;
  }
  const existing = fs.readFileSync(file, 'utf8');
  assert.equal(serialized, existing);
}

test('snapshot: diff with override change', () => {
  const diff = buildDiff({ status:'IN_REVIEW', categoryCode:'scope2_electricity', factorId:'F1', comment:null, assigneeUserId:'U1' }, { status:'OVERRIDDEN', categoryCode:'scope2_electricity', factorId:'F2', comment:'manual correction', assigneeUserId:'U1' });
  assertSnapshot('diff-override.snapshot.json', diff);
});

test('snapshot: diff with approval only', () => {
  const diff = buildDiff({ status:'IN_REVIEW', categoryCode:'scope3_cat6_business_travel', factorId:'T1', comment:null, assigneeUserId:'U2' }, { status:'APPROVED', categoryCode:'scope3_cat6_business_travel', factorId:'T1', comment:'approved by reviewer', assigneeUserId:'U2' });
  assertSnapshot('diff-approval.snapshot.json', diff);
});
