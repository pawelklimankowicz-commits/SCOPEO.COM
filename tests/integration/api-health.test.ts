import test from 'node:test';
import assert from 'node:assert/strict';
import { GET } from '@/app/api/health/route';

test(
  'GET /api/health — DB ping',
  { skip: !process.env.DATABASE_URL },
  async () => {
    const res = await GET();
    assert.equal(res.status, 200);
    const body = (await res.json()) as { ok: boolean; db: string };
    assert.equal(body.ok, true);
    assert.equal(body.db, 'ok');
  }
);
