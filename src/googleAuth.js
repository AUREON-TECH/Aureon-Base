const GOOGLE_TOKENINFO_URL = 'https://oauth2.googleapis.com/tokeninfo';
const validIssuers = new Set(['accounts.google.com', 'https://accounts.google.com']);

function fail(code) {
  const error = new Error(code);
  error.code = code;
  return error;
}

export async function verifyGoogleCredential({ credential, expectedClientId, fetchImpl = fetch }) {
  const clientId = String(expectedClientId || '').trim();
  const token = String(credential || '').trim();
  if (!clientId) throw fail('google_auth_not_configured');
  if (!token || token.length > 8192) throw fail('google_token_invalid');

  let response;
  try {
    response = await fetchImpl(`${GOOGLE_TOKENINFO_URL}?id_token=${encodeURIComponent(token)}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
  } catch {
    throw fail('google_token_invalid');
  }

  if (!response?.ok) throw fail('google_token_invalid');
  const payload = await response.json().catch(() => null);
  if (!payload || typeof payload !== 'object') throw fail('google_token_invalid');

  const audience = String(payload.aud || '');
  const issuer = String(payload.iss || '');
  const email = String(payload.email || '').trim().toLowerCase();
  const subject = String(payload.sub || '').trim();
  const expiresAt = Number(payload.exp || 0);
  const emailVerified = payload.email_verified === true || payload.email_verified === 'true';

  if (
    audience !== clientId ||
    !validIssuers.has(issuer) ||
    !email ||
    !subject ||
    !emailVerified ||
    !Number.isFinite(expiresAt) ||
    expiresAt <= Math.floor(Date.now() / 1000)
  ) {
    throw fail('google_token_invalid');
  }

  return { email, sub: subject };
}
