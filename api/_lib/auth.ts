import { createHmac, timingSafeEqual } from 'node:crypto';
import type { VercelRequest } from '@vercel/node';
import type { AuthTokenPayload, AuthUser } from './types.js';

const TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function getSecret(): string {
  const secret = process.env.AUTH_TOKEN_SECRET || '';
  if (!secret) {
    throw new Error('缺少 AUTH_TOKEN_SECRET');
  }
  return secret;
}

function encodeBase64Url(value: string): string {
  return Buffer.from(value).toString('base64url');
}

function decodeBase64Url(value: string): string {
  return Buffer.from(value, 'base64url').toString('utf8');
}

export function signAuthToken(user: Pick<AuthUser, 'id' | 'phone'>): string {
  const secret = getSecret();
  const now = Date.now();
  const header = encodeBase64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = encodeBase64Url(
    JSON.stringify({
      uid: user.id,
      phone: user.phone,
      iat: now,
      exp: now + TOKEN_TTL_MS,
    } satisfies AuthTokenPayload),
  );
  const signature = createHmac('sha256', secret)
    .update(`${header}.${body}`)
    .digest('base64url');

  return `${header}.${body}.${signature}`;
}

export function verifyAuthToken(token: string | null | undefined): AuthTokenPayload | null {
  const secret = getSecret();
  const [header, body, signature] = (token || '').split('.');
  if (!header || !body || !signature) {
    return null;
  }

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
    const payload = JSON.parse(decodeBase64Url(body)) as Partial<AuthTokenPayload>;
    if (
      typeof payload.uid !== 'string' ||
      typeof payload.phone !== 'string' ||
      typeof payload.iat !== 'number' ||
      typeof payload.exp !== 'number'
    ) {
      return null;
    }
    if (Date.now() > payload.exp) {
      return null;
    }
    return payload as AuthTokenPayload;
  } catch {
    return null;
  }
}

export function readBearerToken(req: Pick<VercelRequest, 'headers'>): string | null {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) {
    return null;
  }
  return header.slice('Bearer '.length).trim();
}
