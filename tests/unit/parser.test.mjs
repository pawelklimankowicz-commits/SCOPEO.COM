import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

function loadJson(name) { return JSON.parse(fs.readFileSync(path.join(process.cwd(), 'tests/fixtures', name), 'utf8')); }
function normalizeText(v) { return String(v ?? '').trim(); }
function findHeaderRow(rows, required) { for (let i=0;i<Math.min(rows.length,80);i++) { const row = rows[i].map(normalizeText); if (required.every(col => row.includes(col))) return i; } return -1; }
function parseUkRows(rows) {
  const required = ['ID','Scope','Level 1','Level 2','Level 3','Level 4','Column Text','UOM','GHG/Unit','GHG Conversion Factor 2025'];
  const idx = findHeaderRow(rows, required);
  assert.notEqual(idx, -1);
  const headers = rows[idx];
  return rows.slice(idx+1).map(r => Object.fromEntries(headers.map((h,i)=>[h,r[i] ?? '']))).filter(r => r.ID);
}
function parseEpaTables(rows) {
  const tables = {};
  rows.forEach((r, i) => { const v = normalizeText(r[1]); if (/^Table\s+\d+$/i.test(v)) tables[v] = i; });
  return tables;
}

test('UK fixture header detection works', () => {
  const rows = loadJson('uk-flat-file-sample.json');
  const idx = findHeaderRow(rows, ['ID','Scope','Level 1','UOM','GHG Conversion Factor 2025']);
  assert.equal(idx, 2);
});

test('UK fixture parsing returns expected categories', () => {
  const rows = loadJson('uk-flat-file-sample.json');
  const parsed = parseUkRows(rows);
  assert.equal(parsed.length, 3);
  assert.equal(parsed[0].ID, 'ELECTRICITY-GRID');
  assert.equal(parsed[1]['Level 1'], 'Business travel');
});

test('EPA fixture table detection works', () => {
  const rows = loadJson('epa-hub-sample.json');
  const tables = parseEpaTables(rows);
  assert.equal(tables['Table 2'], 0);
  assert.equal(tables['Table 6'], 3);
  assert.equal(tables['Table 10'], 12);
});

test('EPA fixture contains business travel and waste sample rows', () => {
  const rows = loadJson('epa-hub-sample.json');
  assert.ok(rows.some(r => r[2] === 'Paper'));
  assert.ok(rows.some(r => r[2] === 'Short-haul air'));
});
