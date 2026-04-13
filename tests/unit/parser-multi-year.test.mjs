import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

function loadJson(name) { return JSON.parse(fs.readFileSync(path.join(process.cwd(), 'tests/fixtures', name), 'utf8')); }
function normalizeText(v) { return String(v ?? '').trim(); }
function findHeaderRow(rows, required) { for (let i=0;i<Math.min(rows.length,80);i++) { const row = rows[i].map(normalizeText); if (required.every(col => row.includes(col))) return i; } return -1; }
function parseEpaTables(rows) { const tables = {}; rows.forEach((r, i) => { const v = normalizeText(r[1]); if (/^Table\s+\d+$/i.test(v)) tables[v] = i; }); return tables; }

test('UK 2024 fixture has year-specific factor column', () => {
  const rows = loadJson('uk-flat-file-2024-sample.json');
  const idx = findHeaderRow(rows, ['GHG Conversion Factor 2024']);
  assert.equal(idx, 1);
});

test('UK 2025 fixture has year-specific factor column after meta rows', () => {
  const rows = loadJson('uk-flat-file-2025-sample.json');
  const idx = findHeaderRow(rows, ['GHG Conversion Factor 2025']);
  assert.equal(idx, 2);
});

test('EPA 2024 and 2025 fixtures expose different tables and values', () => {
  const rows2024 = loadJson('epa-hub-2024-sample.json');
  const rows2025 = loadJson('epa-hub-2025-sample.json');
  const t2024 = parseEpaTables(rows2024);
  const t2025 = parseEpaTables(rows2025);
  assert.equal(t2024['Table 9'], undefined);
  assert.ok(t2025['Table 9'] !== undefined);
  assert.notEqual(rows2024[5][4], rows2025[5][4]);
});
