import { createClient } from '@supabase/supabase-js';

const APP_USERS_TABLE = 'app_users';

export function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL || '';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  if (!url || !serviceRoleKey) {
    throw new Error('Supabase 未配置，请在服务端设置 SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY');
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export function getUsersTableName() {
  return APP_USERS_TABLE;
}
