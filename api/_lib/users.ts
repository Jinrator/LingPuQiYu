import { randomUUID } from 'node:crypto';
import { getSupabaseAdmin, APP_USERS_TABLE } from './supabase.js';
import type { AppUserRow, AuthUser, LoginMethod } from './types.js';

interface CreateUserProfileInput {
  phone: string;
  username?: string;
  displayName?: string;
  courseType?: string;
  passwordHash?: string;
}

interface UpdateUserProfileInput {
  displayName?: string;
  courseType?: string;
}

interface UpdateOwnProfileInput {
  displayName?: string;
  courseType?: string;
  avatarUrl?: string;
}

function normalizeLoginMethod(value: string | null | undefined): LoginMethod {
  if (value === 'wechat' || value === 'qq' || value === 'phone') {
    return value;
  }
  return 'phone';
}

function mapUserRow(row: AppUserRow): AuthUser {
  if (!row.created_at) {
    throw new Error(`用户 ${row.id} 缺少 created_at 字段`);
  }
  return {
    id: row.id,
    phone: row.phone,
    username: row.username ?? undefined,
    displayName: row.display_name ?? undefined,
    avatar: row.avatar_url ?? undefined,
    courseType: row.course_type ?? undefined,
    loginMethod: normalizeLoginMethod(row.login_method),
    hasPassword: !!row.password_hash,
    createdAt: new Date(row.created_at).getTime(),
  };
}

export async function findUserRowByPhone(phone: string): Promise<AppUserRow | null> {
  const { data, error } = await getSupabaseAdmin()
    .from(APP_USERS_TABLE)
    .select('*')
    .eq('phone', phone)
    .maybeSingle();

  if (error) throw error;
  return data as AppUserRow | null;
}

export async function findUserByPhone(phone: string): Promise<AuthUser | null> {
  const row = await findUserRowByPhone(phone);
  return row ? mapUserRow(row) : null;
}

export async function findUserById(id: string): Promise<AuthUser | null> {
  const { data, error } = await getSupabaseAdmin()
    .from(APP_USERS_TABLE)
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data ? mapUserRow(data as AppUserRow) : null;
}

export async function createUserProfile({
  phone,
  username,
  displayName,
  courseType,
  passwordHash,
}: CreateUserProfileInput): Promise<AuthUser> {
  const now = new Date().toISOString();
  const payload: AppUserRow = {
    id: `user_${randomUUID().replace(/-/g, '')}`,
    phone,
    username: username ?? null,
    display_name: displayName ?? null,
    avatar_url: null,
    course_type: courseType ?? null,
    login_method: 'phone',
    password_hash: passwordHash ?? null,
    created_at: now,
    updated_at: now,
  };

  const { data, error } = await getSupabaseAdmin()
    .from(APP_USERS_TABLE)
    .insert(payload)
    .select()
    .single();

  if (error) throw error;
  return mapUserRow(data as AppUserRow);
}

export async function updateUserProfile(
  existingRow: Pick<AppUserRow, 'id'>,
  { displayName, courseType }: UpdateUserProfileInput,
): Promise<AuthUser> {
  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (displayName !== undefined) updates.display_name = displayName;
  if (courseType !== undefined) updates.course_type = courseType;

  const { data, error } = await getSupabaseAdmin()
    .from(APP_USERS_TABLE)
    .update(updates)
    .eq('id', existingRow.id)
    .select()
    .single();

  if (error) throw error;
  return mapUserRow(data as AppUserRow);
}

export async function updateUserProfileById(
  userId: string,
  { displayName, courseType, avatarUrl }: UpdateOwnProfileInput,
): Promise<AuthUser> {
  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (displayName !== undefined) updates.display_name = displayName;
  if (courseType !== undefined) updates.course_type = courseType;
  if (avatarUrl !== undefined) updates.avatar_url = avatarUrl;

  const { data, error } = await getSupabaseAdmin()
    .from(APP_USERS_TABLE)
    .update(updates)
    .eq('id', userId)
    .select('*')
    .single();

  if (error) throw error;
  return mapUserRow(data as AppUserRow);
}

export async function updateUserPasswordHash(
  userId: string,
  passwordHash: string,
): Promise<void> {
  const { error } = await getSupabaseAdmin()
    .from(APP_USERS_TABLE)
    .update({ password_hash: passwordHash, updated_at: new Date().toISOString() })
    .eq('id', userId);

  if (error) throw error;
}

export async function findUserRowById(id: string): Promise<AppUserRow | null> {
  const { data, error } = await getSupabaseAdmin()
    .from(APP_USERS_TABLE)
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data as AppUserRow | null;
}

export async function findUserRowByUsername(username: string): Promise<AppUserRow | null> {
  const { data, error } = await getSupabaseAdmin()
    .from(APP_USERS_TABLE)
    .select('*')
    .eq('username', username)
    .maybeSingle();

  if (error) throw error;
  return data as AppUserRow | null;
}

export async function isUsernameTaken(username: string): Promise<boolean> {
  const row = await findUserRowByUsername(username);
  return row !== null;
}
