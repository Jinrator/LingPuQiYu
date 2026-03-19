import { randomUUID } from 'crypto';
import { getSupabaseAdmin, getUsersTableName } from './supabase.js';

function mapUserRow(row) {
  return {
    id: row.id,
    phone: row.phone,
    username: row.username || undefined,
    avatar: row.avatar_url || undefined,
    courseType: row.course_type || undefined,
    loginMethod: row.login_method || 'phone',
    createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
  };
}

export async function findUserRowByPhone(phone) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from(getUsersTableName())
    .select('*')
    .eq('phone', phone)
    .maybeSingle();

  if (error) throw error;
  return data || null;
}

export async function findUserByPhone(phone) {
  const row = await findUserRowByPhone(phone);
  return row ? mapUserRow(row) : null;
}

export async function findUserById(id) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from(getUsersTableName())
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data ? mapUserRow(data) : null;
}

export async function createUserProfile({ phone, username, courseType }) {
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
  };

  const { data, error } = await supabase
    .from(getUsersTableName())
    .insert(payload)
    .select()
    .single();

  if (error) throw error;
  return mapUserRow(data);
}

export async function updateUserProfile(existingRow, { username, courseType }) {
  const supabase = getSupabaseAdmin();
  const updates = {
    updated_at: new Date().toISOString(),
  };

  if (username !== undefined) updates.username = username || null;
  if (courseType !== undefined) updates.course_type = courseType || null;

  const { data, error } = await supabase
    .from(getUsersTableName())
    .update(updates)
    .eq('id', existingRow.id)
    .select()
    .single();

  if (error) throw error;
  return mapUserRow(data);
}
