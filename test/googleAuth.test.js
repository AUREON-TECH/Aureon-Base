import test from 'node:test';
import assert from 'node:assert/strict';
import { verifyGoogleCredential } from '../src/googleAuth.js';

const nowSeconds = () => Math.floor(Date.now() / 1000);

function fakeResponse(body, ok = true) {
  return {
    ok,
    async json() { return body; },
  };
}

test('verifyGoogleCredential accepts a valid verified Google token for the expected client', async () => {
  const payload = await verifyGoogleCredential({
    credential: 'id-token',
    expectedClientId: 'client-123.apps.googleusercontent.com',
    fetchImpl: async () => fakeResponse({
      aud: 'client-123.apps.googleusercontent.com',
      iss: 'https://accounts.google.com',
      exp: String(nowSeconds() + 300),
      email: 'barbara@example.com',
      email_verified: 'true',
      sub: 'google-subject-123',
    }),
  });

  assert.equal(payload.email, 'barbara@example.com');
  assert.equal(payload.sub, 'google-subject-123');
});

test('verifyGoogleCredential rejects wrong audience, unverified email and expired token', async () => {
  await assert.rejects(() => verifyGoogleCredential({
    credential: 'id-token',
    expectedClientId: 'expected-client',
    fetchImpl: async () => fakeResponse({ aud: 'other-client', iss: 'https://accounts.google.com', exp: String(nowSeconds() + 300), email: 'barbara@example.com', email_verified: 'true', sub: 'sub' }),
  }), /google_token_invalid/);

  await assert.rejects(() => verifyGoogleCredential({
    credential: 'id-token',
    expectedClientId: 'expected-client',
    fetchImpl: async () => fakeResponse({ aud: 'expected-client', iss: 'https://accounts.google.com', exp: String(nowSeconds() + 300), email: 'barbara@example.com', email_verified: 'false', sub: 'sub' }),
  }), /google_token_invalid/);

  await assert.rejects(() => verifyGoogleCredential({
    credential: 'id-token',
    expectedClientId: 'expected-client',
    fetchImpl: async () => fakeResponse({ aud: 'expected-client', iss: 'https://accounts.google.com', exp: String(nowSeconds() - 1), email: 'barbara@example.com', email_verified: 'true', sub: 'sub' }),
  }), /google_token_invalid/);
});

test('verifyGoogleCredential rejects missing configuration and failed token inspection', async () => {
  await assert.rejects(() => verifyGoogleCredential({ credential: 'id-token', expectedClientId: '', fetchImpl: async () => fakeResponse({}) }), /google_auth_not_configured/);
  await assert.rejects(() => verifyGoogleCredential({ credential: '', expectedClientId: 'client', fetchImpl: async () => fakeResponse({}) }), /google_token_invalid/);
  await assert.rejects(() => verifyGoogleCredential({ credential: 'id-token', expectedClientId: 'client', fetchImpl: async () => fakeResponse({}, false) }), /google_token_invalid/);
});
