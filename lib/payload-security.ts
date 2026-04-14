import crypto from 'crypto';

const MAX_RAW_PAYLOAD_BYTES = 120_000;

function getCipherKey(): Buffer | null {
  const key = process.env.DATA_ENCRYPTION_KEY?.trim();
  if (!key) return null;
  const decoded = Buffer.from(key, 'base64');
  if (decoded.length !== 32) return null;
  return decoded;
}

export function secureRawPayload(xml: string): string {
  const capped = Buffer.from(xml, 'utf8').subarray(0, MAX_RAW_PAYLOAD_BYTES).toString('utf8');
  const key = getCipherKey();
  if (!key) {
    return capped;
  }
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(capped, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `enc:v1:${iv.toString('base64')}:${tag.toString('base64')}:${ciphertext.toString('base64')}`;
}
