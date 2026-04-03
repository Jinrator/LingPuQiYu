import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import type { VercelRequest } from '@vercel/node';
import { findUserById } from './users.js';
import { getSupabaseAdmin } from './supabase.js';
import type { AuthTokenPayload, AuthUser, RefreshTokenRow } from './types.js';

const ACCESS_TOKEN_TTL_MS = 15 * 60 * 1000; // 15 分钟
const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 天
const REFRESH_TOKENS_TABLE = 'refresh_tokens';

// ── 密钥 ──

function getSecret(): string {
  const secret = process.env.AUTH_TOKEN_SECRET;
  if (!secret) {
    throw new Error('缺少 AUTH_TOKEN_SECRET');
  }
  return secret;
}

// ── Base64URL ──

function encodeBase64Url(value: string): string {
  return Buffer.from(value).toString('base64url');
}

function decodeBase64Url(value: string): string {
  return Buffer.from(value, 'base64url').toString('utf8');
}

// ── Access Token（短期） ──

export function signAccessToken(user: Pick<AuthUser, 'id' | 'phone'>): string {
  const secret = getSecret();
  const now = Date.now();
  const header = encodeBase64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = encodeBase64Url(
    JSON.stringify({
      uid: user.id,
      phone: user.phone,
      iat: now,
      exp: now + ACCESS_TOKEN_TTL_MS,
    } satisfies AuthTokenPayload),
  );
  const signature = createHmac('sha256', secret)
    .update(`${header}.${body}`)
    .digest('base64url');

  return `${header}.${body}.${signature}`;
}

export function verifyAccessToken(token: string | null | undefined): AuthTokenPayload | null {
  const secret = getSecret();
  const parts = (token ?? '').split('.');
  if (parts.length !== 3) return null;
  const [header, body, signature] = parts;

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
    if (Date.now() > payload.exp) return null;
    return payload as AuthTokenPayload;
  } catch {
    return null;
  }
}

// ── Refresh Token（长期，存数据库） ──

function hashToken(token: string): string {
  return createHmac('sha256', getSecret()).update(token).digest('hex');
}

export async function createRefreshToken(userId: string): Promise<string> {
  const raw = randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS).toISOString();

  const { error } = await getSupabaseAdmin()
    .from(REFRESH_TOKENS_TABLE)
    .insert({
      user_id: userId,
      token_hash: hashToken(raw),
      expires_at: expiresAt,
      revoked: false,
    });

  if (error) throw error;
  return raw;
}

export async function verifyRefreshToken(raw: string): Promise<RefreshTokenRow> {
  const hash = hashToken(raw);

  const { data, error } = await getSupabaseAdmin()
    .from(REFRESH_TOKENS_TABLE)
    .select('*')
    .eq('token_hash', hash)
    .eq('revoked', false)
    .single();

  if (error || !data) {
    throw new AuthError('Refresh token 无效');
  }

  const row = data as RefreshTokenRow;
  if (new Date(row.expires_at).getTime() < Date.now()) {
    throw new AuthError('Refresh token 已过期');
  }

  return row;
}

export async function revokeRefreshToken(raw: string): Promise<void> {
  const hash = hashToken(raw);
  await getSupabaseAdmin()
    .from(REFRESH_TOKENS_TABLE)
    .update({ revoked: true })
    .eq('token_hash', hash);
}

export async function revokeAllUserTokens(userId: string): Promise<void> {
  await getSupabaseAdmin()
    .from(REFRESH_TOKENS_TABLE)
    .update({ revoked: true })
    .eq('user_id', userId)
    .eq('revoked', false);
}

// ── Token 对（access + refresh） ──

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export async function issueTokenPair(user: Pick<AuthUser, 'id' | 'phone'>): Promise<TokenPair> {
  const accessToken = signAccessToken(user);
  const refreshToken = await createRefreshToken(user.id);
  return { accessToken, refreshToken };
}

// ── Bearer 读取 & 鉴权中间件 ──

export function readBearerToken(req: Pick<VercelRequest, 'headers'>): string | null {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return null;
  return header.slice('Bearer '.length).trim();
}

export interface AuthContext {
  token: string;
  payload: AuthTokenPayload;
  user: AuthUser;
}

export class AuthError extends Error {
  status: number;
  code?: string;

  constructor(message: string, code?: string) {
    super(message);
    this.name = 'AuthError';
    this.status = 401;
    this.code = code;
  }
}

export async function requireAuth(
  req: Pick<VercelRequest, 'headers'>,
): Promise<AuthContext> {
  const token = readBearerToken(req);
  if (!token) {
    throw new AuthError('缺少登录凭证', 'NO_TOKEN');
  }

  const payload = verifyAccessToken(token);
  if (!payload) {
    throw new AuthError('登录状态已失效', 'TOKEN_EXPIRED');
  }

  const user = await findUserById(payload.uid);
  if (!user || user.phone !== payload.phone) {
    throw new AuthError('用户不存在或已失效', 'USER_INVALID');
  }

  return { token, payload, user };
}
