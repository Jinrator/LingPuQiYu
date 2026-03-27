import type { VercelRequest, VercelResponse } from '@vercel/node';
import { AuthError, requireAuth } from '../_lib/auth.js';
import { updateUserProfileById } from '../_lib/users.js';

function readBody(req: VercelRequest): {
  username?: string;
  courseType?: string;
  avatarUrl?: string;
} {
  const body = (req.body ?? {}) as {
    username?: unknown;
    courseType?: unknown;
    avatarUrl?: unknown;
  };

  return {
    username: typeof body.username === 'string' ? body.username.trim() : undefined,
    courseType: typeof body.courseType === 'string' ? body.courseType.trim() : undefined,
    avatarUrl: typeof body.avatarUrl === 'string' ? body.avatarUrl.trim() : undefined,
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ success: false, message: 'Method not allowed' });
    return;
  }

  try {
    const auth = await requireAuth(req);
    const { username, courseType, avatarUrl } = readBody(req);

    const user = await updateUserProfileById(auth.user.id, {
      username,
      courseType,
      avatarUrl,
    });

    res.json({ success: true, user });
  } catch (error) {
    if (error instanceof AuthError) {
      res.status(error.status).json({ success: false, message: error.message });
      return;
    }

    console.error(
      '[Profile] 更新用户资料失败:',
      error instanceof Error ? error.message : 'unknown error',
    );
    res.status(500).json({ success: false, message: '更新失败，请稍后重试' });
  }
}
