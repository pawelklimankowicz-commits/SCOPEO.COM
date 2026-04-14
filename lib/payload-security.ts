import crypto from 'crypto';

const MAX_RAW_PAYLOAD_BYTES = 120_000;

function getCipherKey(): Buffer | null {
  const key = process.env.DATA_ENCRYPTION_KEY?.trim();
  if (!key) return null;
  const decoded = Buffer.from(key, 'base64');
  if (decoded.length !== 32) return null;
  return decoded;
}

export function isRawPayloadEncryptionConfigured(): boolean {
  return Boolean(getCipherKey());
}

export function secureRawPayload(xml: string): string {
  const capped = Buffer.from(xml, 'utf8').subarray(0, MAX_RAW_PAYLOAD_BYTES).toString('utf8');
  const key = getCipherKey();
  if (!key) {
    throw new Error('DATA_ENCRYPTION_KEY is missing or invalid (must be base64-encoded 32-byte key)');
  }
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(capped, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `enc:v1:${iv.toString('base64')}:${tag.toString('base64')}:${ciphertext.toString('base64')}`;
}

/** Inverse of `secureRawPayload` for `enc:v1:` payloads; returns input unchanged if not encrypted. */
export function restoreRawPayload(payload: string): string {
  if (!payload.startsWith('enc:v1:')) {
    return payload;
  }
  const key = getCipherKey();
  if (!key) {
    throw new Error('DATA_ENCRYPTION_KEY is missing or invalid (must be base64-encoded 32-byte key)');
  }
  const rest = payload.slice('enc:v1:'.length);
  const [ivB64, tagB64, ...ctParts] = rest.split(':');
  const ctB64 = ctParts.join(':');
  if (!ivB64 || !tagB64 || !ctB64) {
    throw new Error('Invalid encrypted payload format');
  }
  const iv = Buffer.from(ivB64, 'base64');
  const tag = Buffer.from(tagB64, 'base64');
  const ciphertext = Buffer.from(ctB64, 'base64');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
}
