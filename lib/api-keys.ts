import { createHash, randomBytes } from 'crypto';
import { prisma } from '@/lib/prisma';

export function generateApiKey(): { raw: string; hash: string; prefix: string } {
  const raw = `scp_${randomBytes(32).toString('hex')}`;
  const hash = createHash('sha256').update(raw).digest('hex');
  const prefix = raw.substring(0, 8);
  return { raw, hash, prefix };
}

export function hashApiKey(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

export async function validateApiKey(rawKey: string): Promise<{
  valid: boolean;
  organizationId?: string;
  scopes?: string[];
  keyId?: string;
}> {
  const hash = hashApiKey(rawKey);
  const key = await prisma.apiKey.findUnique({
    where: { keyHash: hash },
    select: { id: true, organizationId: true, scopes: true, revokedAt: true, expiresAt: true },
  });
  if (!key || key.revokedAt || (key.expiresAt && key.expiresAt < new Date())) {
    return { valid: false };
  }
  await prisma.apiKey.update({ where: { id: key.id }, data: { lastUsedAt: new Date() } });
  return { valid: true, organizationId: key.organizationId, scopes: key.scopes, keyId: key.id };
}
