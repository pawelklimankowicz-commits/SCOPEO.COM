import crypto from 'crypto';

const PREFIX = 'ksef:v1';

function getTokenKey(): Buffer {
  const key = process.env.KSEF_TOKEN_ENCRYPTION_KEY?.trim();
  if (!key) {
    throw new Error('KSEF_TOKEN_ENCRYPTION_KEY is missing');
  }
  const decoded = Buffer.from(key, 'base64');
  if (decoded.length !== 32) {
    throw new Error('KSEF_TOKEN_ENCRYPTION_KEY must be base64-encoded 32-byte key');
  }
  return decoded;
}

export function encryptKsefToken(token: string): string {
  const key = getTokenKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(token, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${PREFIX}:${iv.toString('base64')}:${tag.toString('base64')}:${ciphertext.toString('base64')}`;
}

export function decryptKsefToken(payload: string): string {
  const key = getTokenKey();
  const parts = payload.split(':');
  if (parts.length !== 5 || `${parts[0]}:${parts[1]}` !== PREFIX) {
    throw new Error('Invalid encrypted KSeF token payload format');
  }
  const [, , ivB64, tagB64, ciphertextB64] = parts;
  const iv = Buffer.from(ivB64, 'base64');
  const tag = Buffer.from(tagB64, 'base64');
  const ciphertext = Buffer.from(ciphertextB64, 'base64');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
}
