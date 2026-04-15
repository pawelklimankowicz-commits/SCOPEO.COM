'use strict';
/* Wymaga jawnego DATABASE_URL przed uruchomieniem CLI Prisma. */
const { spawnSync } = require('child_process');

if (!(process.env.DATABASE_URL || '').trim()) {
  console.error('DATABASE_URL is required');
  process.exit(1);
}

const args = process.argv.slice(2);
const result = spawnSync('npx', ['prisma', ...args], {
  stdio: 'inherit',
  shell: true,
  env: process.env,
});
process.exit(result.status === null ? 1 : result.status);
