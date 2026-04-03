import { randomUUID } from 'node:crypto';
import { getSupabaseAdmin, APP_USERS_TABLE } from './supabase.js';
import type { AppUserRow, AuthUser, LoginMethod } from './types.js';

interface CreateUserProfileInput {
  phone: string;
  username?: string;
  courseType?: string;
}

interface UpdateUserProfileInput {
  username?: string;
  courseType?: string;
}

interface UpdateOwnProfileInput {
  username?: string;
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
    avatar: row.avatar_url ?? undefined,
    courseType: row.course_type ?? undefined,
    loginMethod: normalizeLoginMethod(row.login_method),
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
  courseType,
}: CreateUserProfileInput): Promise<AuthUser> {
  const now = new Date().toISOString();
  const payload: AppUserRow = {
    id: `user_${randomUUID().replace(/-/g, '')}`,
    phone,
    username: username ?? null,
    avatar_url: null,
    course_type: courseType ?? null,
    login_method: 'phone',
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
  { username, courseType }: UpdateUserProfileInput,
): Promise<AuthUser> {
  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (username !== undefined) updates.username = username;
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
  { username, courseType, avatarUrl }: UpdateOwnProfileInput,
): Promise<AuthUser> {
  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (username !== undefined) updates.username = username;
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
