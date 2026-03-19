import { createHmac, timingSafeEqual } from 'crypto';

const TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function getSecret() {
  const secret = process.env.AUTH_TOKEN_SECRET || '';
  if (!secret) {
    throw new Error('缺少 AUTH_TOKEN_SECRET');
  }
  return secret;
}

function encodeBase64Url(value) {
  return Buffer.from(value).toString('base64url');
}

function decodeBase64Url(value) {
  return Buffer.from(value, 'base64url').toString('utf8');
}

export function signAuthToken(user) {
  const secret = getSecret();
  const now = Date.now();
  const header = encodeBase64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = encodeBase64Url(JSON.stringify({
    uid: user.id,
    phone: user.phone,
    iat: now,
    exp: now + TOKEN_TTL_MS,
  }));
  const signature = createHmac('sha256', secret)
    .update(`${header}.${body}`)
    .digest('base64url');

  return `${header}.${body}.${signature}`;
}

export function verifyAuthToken(token) {
  const secret = getSecret();
  const [header, body, signature] = (token || '').split('.');
  if (!header || !body || !signature) return null;

  const expected = createHmac('sha256', secret)
    .update(`${header}.${body}`)
    .digest('base64url');

  if (
    expected.length !== signature.length ||
    !timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(decodeBase64Url(body));
    if (payload.exp && Date.now() > payload.exp) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export function readBearerToken(req) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return null;
  return header.slice('Bearer '.length).trim();
}
