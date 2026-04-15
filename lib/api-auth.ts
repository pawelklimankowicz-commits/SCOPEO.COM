import { checkRateLimit } from '@/lib/security';
import { validateApiKey } from '@/lib/api-keys';
import { canAccessApi } from '@/lib/billing-features';
import { getSubscription } from '@/lib/billing';

export async function withApiKey(
  req: Request,
  requiredScope: string,
  handler: (organizationId: string) => Promise<Response>
): Promise<Response> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer scp_')) {
    return Response.json({ error: 'Missing or invalid API key' }, { status: 401 });
  }
  const rawKey = authHeader.replace('Bearer ', '');
  const { valid, organizationId, scopes } = await validateApiKey(rawKey);
  if (!valid || !organizationId) {
    return Response.json({ error: 'Invalid or expired API key' }, { status: 401 });
  }
  if (!scopes?.includes(requiredScope)) {
    return Response.json({ error: `Missing scope: ${requiredScope}` }, { status: 403 });
  }

  const sub = await getSubscription(organizationId);
  if (!sub || !canAccessApi(sub.plan)) {
    return Response.json(
      { error: 'Public API requires Growth plan or higher. Upgrade at /dashboard/settings/billing' },
      { status: 403 }
    );
  }

  const limit = await checkRateLimit(`apikey-org:${organizationId}`, {
    windowMs: 3_600_000,
    maxRequests: 1000,
  });
  if (!limit.ok) {
    return Response.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }
  return handler(organizationId);
}
