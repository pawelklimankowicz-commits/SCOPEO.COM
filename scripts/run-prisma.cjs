'use strict';
/* Odpowiednik lib/patch-database-url.ts — ustawia DATABASE_URL przed uruchomieniem CLI Prisma. */
const { spawnSync } = require('child_process');

function looksLikePostgresUrl(s) {
  return /^postgres(ql)?:\/\//i.test(String(s).trim());
}

if (!(process.env.DATABASE_URL || '').trim()) {
  const legacy = (
    process.env['ADRES URL BAZY DANYCH'] ||
    process.env.ADRES_URL_BAZY_DANYCH ||
    ''
  ).trim();
  if (legacy) {
    process.env.DATABASE_URL = legacy;
  } else {
    const matches = [];
    for (const value of Object.values(process.env)) {
      const v = String(value || '').trim();
      if (v && looksLikePostgresUrl(v)) matches.push(v);
    }
    const unique = [...new Set(matches)];
    if (unique.length === 1) process.env.DATABASE_URL = unique[0];
  }
}

const args = process.argv.slice(2);
const result = spawnSync('npx', ['prisma', ...args], {
  stdio: 'inherit',
  shell: true,
  env: process.env,
});
process.exit(result.status === null ? 1 : result.status);
