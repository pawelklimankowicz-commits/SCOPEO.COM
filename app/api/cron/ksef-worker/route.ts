import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const workerUrl = new URL(
    '/api/ksef/jobs/process',
    process.env.NEXTAUTH_URL ?? 'http://localhost:3000'
  );
  const response = await fetch(workerUrl.toString(), {
    method: 'POST',
    headers: {
      'x-ksef-worker-secret': process.env.KSEF_WORKER_SECRET ?? '',
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}
