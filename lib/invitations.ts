import crypto from 'crypto';

export function createInvitationToken() {
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  return { token, tokenHash };
}

export function hashInvitationToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}
