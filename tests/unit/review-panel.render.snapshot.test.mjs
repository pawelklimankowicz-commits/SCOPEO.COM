import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

function renderFieldDiffCard({ label, before, after }) {
  const changed = String(before ?? '') !== String(after ?? '');
  return `<div class="field-diff-card ${changed ? 'changed' : 'unchanged'}"><div class="label">${label}</div><div class="cols"><section><h4>Before</h4><pre>${String(before ?? '—')}</pre></section><section><h4>After</h4><pre>${String(after ?? '—')}</pre></section></div></div>`;
}

function renderReviewHistoryItem(item, selected = false) {
  return `<button class="history-item ${selected ? 'selected' : ''}"><div class="meta">${item.action}</div><div class="transition">${item.fromStatus || '-'} → ${item.toStatus || '-'}</div><div class="comment">${item.comment || 'Brak komentarza'}</div></button>`;
}

function snapshotFile(name) { return path.join(process.cwd(), 'tests/unit/__snapshots__', name); }
function assertSnapshot(name, value) {
  const file = snapshotFile(name);
  const serialized = value + '\n';
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, serialized);
    assert.ok(true);
    return;
  }
  const existing = fs.readFileSync(file, 'utf8');
  assert.equal(serialized, existing);
}

test('render snapshot: changed field diff card', () => {
  const html = renderFieldDiffCard({ label: 'factorId', before: 'F1', after: 'F2' });
  assertSnapshot('field-diff-card.snapshot.html', html);
});

test('render snapshot: selected review history item', () => {
  const html = renderReviewHistoryItem({ action: 'OVERRIDDEN', fromStatus: 'IN_REVIEW', toStatus: 'OVERRIDDEN', comment: 'manual correction' }, true);
  assertSnapshot('review-history-item.snapshot.html', html);
});
