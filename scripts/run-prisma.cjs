'use strict';
/* Jedna logika z lib/patch-database-url.ts: mapa polskiej nazwy zmiennej → DATABASE_URL dla CLI Prisma. */
const { spawnSync } = require('child_process');

const legacy = (
  process.env['ADRES URL BAZY DANYCH'] ||
  process.env.ADRES_URL_BAZY_DANYCH ||
  ''
).trim();
if (legacy && !(process.env.DATABASE_URL || '').trim()) {
  process.env.DATABASE_URL = legacy;
}

const args = process.argv.slice(2);
const result = spawnSync('npx', ['prisma', ...args], {
  stdio: 'inherit',
  shell: true,
  env: process.env,
});
process.exit(result.status === null ? 1 : result.status);
