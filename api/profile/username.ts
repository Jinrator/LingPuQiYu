import type { VercelRequest, VercelResponse } from '@vercel/node';
import { AuthError, requireAuth } from '../_lib/auth.js';
import { setCorsHeaders } from '../_lib/cors.js';
import { assertRateLimits, getClientIp, RateLimitError } from '../_lib/rate-limit.js';
import { findUserRowById, isUsernameTaken } from '../_lib/users.js';
import { getSupabaseAdmin, APP_USERS_TABLE } from '../_lib/supabase.js';
import { validateUsername } from '../_lib/validate.js';
import type { AppUserRow, AuthUser } from '../_lib/types.js';

function readBody(req: VercelRequest): { username: string } {
  const body = (req.body ?? {}) as { username?: unknown };
  return {
    username: typeof body.username === 'string' ? body.username.trim().toLowerCase() : '',
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (setCorsHeaders(req, res)) return;

  if (req.method !== 'POST') {
    res.status(405).json({ success: false, message: 'Method not allowed' });
    return;
  }

  try {
    const auth = await requireAuth(req);
    const ip = getClientIp(req);

    assertRateLimits([
      { scope: 'profile:username:user', identifier: auth.user.id, limit: 5, windowMs: 10 * 60 * 1000, message: '操作太频繁，请稍后再试' },
      { scope: 'profile:username:ip', identifier: ip, limit: 10, windowMs: 10 * 60 * 1000, message: '操作太频繁，请稍后再试' },
    ]);

    const { username } = readBody(req);
    if (!username) {
      res.status(400).json({ success: false, message: '请输入用户名' });
      return;
    }

    const check = validateUsername(username);
    if (!check.valid) {
      res.status(400).json({ success: false, message: check.message });
      return;
    }

    // 已有 username 的用户不允许修改
    const row = await findUserRowById(auth.user.id);
    if (!row) {
      res.status(404).json({ success: false, message: '用户不存在' });
      return;
    }
    if (row.username) {
      res.status(400).json({ success: false, message: '用户名已设置，不可修改' });
      return;
    }

    if (await isUsernameTaken(username)) {
      res.status(409).json({ success: false, code: 'USERNAME_TAKEN', message: '该用户名已被使用' });
      return;
    }

    const { data, error } = await getSupabaseAdmin()
      .from(APP_USERS_TABLE)
      .update({ username, updated_at: new Date().toISOString() })
      .eq('id', auth.user.id)
      .select('*')
      .single();

    if (error) throw error;

    const updated = data as AppUserRow;
    const user: AuthUser = {
      id: updated.id,
      phone: updated.phone,
      username: updated.username ?? undefined,
      displayName: updated.display_name ?? undefined,
      avatar: updated.avatar_url ?? undefined,
      courseType: updated.course_type ?? undefined,
      loginMethod: (updated.login_method as AuthUser['loginMethod']) || 'phone',
      hasPassword: !!updated.password_hash,
      createdAt: new Date(updated.created_at).getTime(),
    };

    res.json({ success: true, user });
  } catch (error) {
    if (error instanceof AuthError) {
      res.status(error.status).json({ success: false, message: error.message });
      return;
    }
    if (error instanceof RateLimitError) {
      res.status(error.status).json({ success: false, message: error.message });
      return;
    }
    console.error('[Profile] 设置用户名失败:', error);
    res.status(500).json({ success: false, message: '操作失败' });
  }
}
