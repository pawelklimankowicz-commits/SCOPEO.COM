import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { onboardingKsefSchema } from '@/lib/schema';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }
  const role = (session.user as any).role as string | undefined;
  if (role !== 'OWNER' && role !== 'ADMIN') {
    return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = onboardingKsefSchema.parse(body);
    const baseUrl = (process.env.KSEF_API_BASE_URL?.trim() || 'https://ksef-test.mf.gov.pl/api').replace(/\/$/, '');
    const initUrl = `${baseUrl}/online/Session/InitToken`;
    const terminateUrl = `${baseUrl}/online/Session/Terminate`;

    const initResponse = await fetch(initUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        authToken: parsed.ksefToken,
        contextIdentifier: {
          type: 'onip',
          identifier: parsed.contextNip,
        },
      }),
      cache: 'no-store',
    });

    if (!initResponse.ok) {
      const reason = await initResponse.text().catch(() => '');
      return NextResponse.json(
        {
          ok: false,
          error: `KSeF zwrócił ${initResponse.status}. ${reason.slice(0, 200) || 'Sprawdź token i NIP.'}`,
        },
        { status: 400 }
      );
    }

    const payload = (await initResponse.json().catch(() => ({}))) as Record<string, any>;
    const sessionToken = payload.sessionToken?.token ?? payload.sessionToken ?? payload.token;
    if (typeof sessionToken === 'string' && sessionToken.length > 0) {
      await fetch(terminateUrl, {
        method: 'DELETE',
        headers: { SessionToken: sessionToken, Accept: 'application/json' },
        cache: 'no-store',
      }).catch(() => null);
    }

    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 400 }
    );
  }
}
