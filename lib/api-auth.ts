import { checkRateLimit } from '@/lib/security';
import { validateApiKey } from '@/lib/api-keys';

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
  const limit = await checkRateLimit(`apikey:${rawKey.substring(0, 12)}`, {
    windowMs: 3_600_000,
    maxRequests: 1000,
  });
  if (!limit.ok) {
    return Response.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }
  return handler(organizationId);
}
