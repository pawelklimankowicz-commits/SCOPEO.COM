import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {
  isRawPayloadEncryptionConfigured,
  restoreRawPayload,
  secureRawPayload,
} from '@/lib/payload-security';

const testKeyB64 = crypto.randomBytes(32).toString('base64');

function withEncryptionKey(t: { after: (fn: () => void) => void }, key: string | undefined, fn: () => void) {
  const prev = process.env.DATA_ENCRYPTION_KEY;
  t.after(() => {
    if (prev === undefined) delete process.env.DATA_ENCRYPTION_KEY;
    else process.env.DATA_ENCRYPTION_KEY = prev;
  });
  if (key === undefined) delete process.env.DATA_ENCRYPTION_KEY;
  else process.env.DATA_ENCRYPTION_KEY = key;
  fn();
}

test('restoreRawPayload round-trips secureRawPayload', (t) => {
  withEncryptionKey(t, testKeyB64, () => {
    const original = '<Faktura><test>żółć</test></Faktura>';
    const enc = secureRawPayload(original);
    assert.ok(enc.startsWith('enc:v1:'));
    assert.equal(restoreRawPayload(enc), original);
  });
});

test('restoreRawPayload returns plaintext unchanged', (t) => {
  withEncryptionKey(t, testKeyB64, () => {
    assert.equal(restoreRawPayload('<xml/>'), '<xml/>');
  });
});

test('isRawPayloadEncryptionConfigured is true with valid key', (t) => {
  withEncryptionKey(t, testKeyB64, () => {
    assert.equal(isRawPayloadEncryptionConfigured(), true);
  });
});

test('isRawPayloadEncryptionConfigured is false without key', (t) => {
  withEncryptionKey(t, undefined, () => {
    assert.equal(isRawPayloadEncryptionConfigured(), false);
  });
});
