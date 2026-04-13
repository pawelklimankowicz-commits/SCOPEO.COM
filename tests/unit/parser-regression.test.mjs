import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

function loadJson(name) { return JSON.parse(fs.readFileSync(path.join(process.cwd(), 'tests/fixtures', name), 'utf8')); }
function normalizeText(v) { return String(v ?? '').trim(); }
function findHeaderRow(rows, required) { for (let i=0;i<Math.min(rows.length,80);i++) { const row = rows[i].map(normalizeText); if (required.every(col => row.includes(col))) return i; } return -1; }
function parseEpaTables(rows) { const tables = {}; rows.forEach((r, i) => { const v = normalizeText(r[1]); if (/^Table\s+\d+$/i.test(v)) tables[v] = i; }); return tables; }

test('UK regression fixture fails when header is missing', () => {
  const rows = loadJson('uk-flat-file-missing-header.json');
  const idx = findHeaderRow(rows, ['ID','Scope','Level 1','UOM','GHG Conversion Factor 2025']);
  assert.equal(idx, -1);
});

test('UK regression fixture keeps valid row when one factor value is empty', () => {
  const rows = loadJson('uk-flat-file-missing-value.json');
  const idx = findHeaderRow(rows, ['ID','Scope','Level 1','UOM','GHG Conversion Factor 2025']);
  assert.equal(idx, 0);
  const dataRows = rows.slice(idx + 1);
  const valid = dataRows.filter(r => String(r[9] ?? '').trim() !== '');
  assert.equal(valid.length, 1);
});

test('EPA regression fixture detects missing business tables', () => {
  const rows = loadJson('epa-hub-missing-table.json');
  const tables = parseEpaTables(rows);
  assert.ok(tables['Table 2'] !== undefined);
  assert.equal(tables['Table 10'], undefined);
});

test('EPA regression fixture identifies invalid numeric row', () => {
  const rows = loadJson('epa-hub-invalid-row.json');
  const value = rows[2][3];
  assert.equal(Number.isFinite(Number(value)), false);
});
