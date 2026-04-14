import { NextResponse } from 'next/server';
import { getKsefCronInnerFetchTimeoutMs } from '@/lib/ksef-worker-config';

function isFetchAbort(error: unknown): boolean {
  return (
    (error instanceof Error && error.name === 'AbortError') ||
    (typeof error === 'object' &&
      error !== null &&
      'name' in error &&
      (error as { name: string }).name === 'AbortError')
  );
}

export const runtime = 'nodejs';
/** Must cover await fetch(process) + inner work; align with `vercel.json` / platform limits. */
export const maxDuration = 60;

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const workerUrl = new URL(
    '/api/ksef/jobs/process',
    process.env.NEXTAUTH_URL ?? 'http://localhost:3000'
  );

  const timeoutMs = getKsefCronInnerFetchTimeoutMs();
  const controller = new AbortController();
  const kill = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetch(workerUrl.toString(), {
      method: 'POST',
      headers: {
        'x-ksef-worker-secret': process.env.KSEF_WORKER_SECRET ?? '',
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    });
  } catch (error) {
    clearTimeout(kill);
    if (isFetchAbort(error)) {
      return NextResponse.json(
        {
          ok: false,
          error: `Inner worker fetch exceeded ${timeoutMs}ms (KSEF_CRON_INNER_FETCH_TIMEOUT_MS)`,
        },
        { status: 504 }
      );
    }
    throw error;
  } finally {
    clearTimeout(kill);
  }

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Inner worker returned non-JSON body' },
      { status: 502 }
    );
  }
  return NextResponse.json(data, { status: response.status });
}
