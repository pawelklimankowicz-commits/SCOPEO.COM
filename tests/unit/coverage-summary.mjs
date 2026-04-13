import fs from 'node:fs';
const threshold = 70;
const summaryPath = 'coverage/coverage-summary.json';
if (!fs.existsSync(summaryPath)) {
  console.error('coverage-summary.json not found');
  process.exit(1);
}
const data = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
const total = data.total || {};
const lines = total.lines?.pct ?? 0;
const functions = total.functions?.pct ?? 0;
const branches = total.branches?.pct ?? 0;
const statements = total.statements?.pct ?? 0;
console.log(`Coverage lines=${lines}% functions=${functions}% branches=${branches}% statements=${statements}%`);
if ([lines, functions, branches, statements].some(v => v < threshold)) {
  console.error(`Coverage threshold ${threshold}% not met`);
  process.exit(1);
}
