import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['__tests__/**/*.test.ts'],
    env: {
      DATABASE_URL: 'postgresql://scopeo:scopeo@localhost:5432/scopeo_test',
      DATABASE_RLS_RELAXED: '1',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['lib/**/*.ts'],
      exclude: ['lib/prisma.ts', 'lib/logger.ts'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
