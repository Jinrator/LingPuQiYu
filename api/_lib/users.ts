import { randomUUID } from 'node:crypto';
import { getSupabaseAdmin, getUsersTableName } from './supabase.js';
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

function normalizeLoginMethod(value: string | null | undefined): LoginMethod {
  if (value === 'wechat' || value === 'qq' || value === 'phone') {
    return value;
  }
  return 'phone';
}

function mapUserRow(row: AppUserRow): AuthUser {
  return {
    id: row.id,
    phone: row.phone,
    username: row.username || undefined,
    avatar: row.avatar_url || undefined,
    courseType: row.course_type || undefined,
    loginMethod: normalizeLoginMethod(row.login_method),
    createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
  };
}

export async function findUserRowByPhone(phone: string): Promise<AppUserRow | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from(getUsersTableName())
    .select('*')
    .eq('phone', phone)
    .maybeSingle();

  if (error) {
    throw error;
  }
  return (data as AppUserRow | null) || null;
}

export async function findUserByPhone(phone: string): Promise<AuthUser | null> {
  const row = await findUserRowByPhone(phone);
  return row ? mapUserRow(row) : null;
}

export async function findUserById(id: string): Promise<AuthUser | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from(getUsersTableName())
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    throw error;
  }
  return data ? mapUserRow(data as AppUserRow) : null;
}

export async function createUserProfile({
  phone,
  username,
  courseType,
}: CreateUserProfileInput): Promise<AuthUser> {
  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();
  const payload = {
    id: `user_${randomUUID().replace(/-/g, '')}`,
    phone,
    username: username || null,
    avatar_url: null,
    course_type: courseType || null,
    login_method: 'phone',
    created_at: now,
    updated_at: now,
  } satisfies AppUserRow;

  const { data, error } = await supabase
    .from(getUsersTableName())
    .insert(payload)
    .select()
    .single();

  if (error) {
    throw error;
  }
  return mapUserRow(data as AppUserRow);
}

export async function updateUserProfile(
  existingRow: Pick<AppUserRow, 'id'>,
  { username, courseType }: UpdateUserProfileInput,
): Promise<AuthUser> {
  const supabase = getSupabaseAdmin();
  const updates: Partial<Pick<AppUserRow, 'username' | 'course_type' | 'updated_at'>> = {
    updated_at: new Date().toISOString(),
  };

  if (username !== undefined) {
    updates.username = username || null;
  }
  if (courseType !== undefined) {
    updates.course_type = courseType || null;
  }

  const { data, error } = await supabase
    .from(getUsersTableName())
    .update(updates)
    .eq('id', existingRow.id)
    .select()
    .single();

  if (error) {
    throw error;
  }
  return mapUserRow(data as AppUserRow);
}
