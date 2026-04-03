import type { VercelRequest, VercelResponse } from '@vercel/node';
import { AuthError, requireAuth } from '../_lib/auth.js';
import { setCorsHeaders } from '../_lib/cors.js';
import { assertRateLimits, getClientIp, RateLimitError } from '../_lib/rate-limit.js';
import { updateUserProfileById } from '../_lib/users.js';
import {
  MAX_DISPLAY_NAME_LENGTH,
  MAX_COURSE_TYPE_LENGTH,
  MAX_AVATAR_URL_LENGTH,
  sanitizeString,
  isValidUrl,
} from '../_lib/validate.js';

function readBody(req: VercelRequest): {
  displayName?: string;
  courseType?: string;
  avatarUrl?: string;
} {
  const body = (req.body ?? {}) as {
    displayName?: unknown;
    courseType?: unknown;
    avatarUrl?: unknown;
  };

  const avatarRaw = typeof body.avatarUrl === 'string' ? body.avatarUrl.trim() : undefined;

  return {
    displayName: typeof body.displayName === 'string' ? sanitizeString(body.displayName, MAX_DISPLAY_NAME_LENGTH) : undefined,
    courseType: typeof body.courseType === 'string' ? sanitizeString(body.courseType, MAX_COURSE_TYPE_LENGTH) : undefined,
    avatarUrl: avatarRaw && avatarRaw.length <= MAX_AVATAR_URL_LENGTH && isValidUrl(avatarRaw) ? avatarRaw : undefined,
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
      {
        scope: 'profile:update:user',
        identifier: auth.user.id,
        limit: 10,
        windowMs: 60 * 1000,
        message: '操作太频繁，请稍后再试',
      },
      {
        scope: 'profile:update:ip',
        identifier: ip,
        limit: 30,
        windowMs: 60 * 1000,
        message: '操作太频繁，请稍后再试',
      },
    ]);

    const { displayName, courseType, avatarUrl } = readBody(req);

    const user = await updateUserProfileById(auth.user.id, {
      displayName,
      courseType,
      avatarUrl,
    });

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

    console.error('[Profile] 更新用户资料失败:', error);
    res.status(500).json({ success: false, message: '更新失败' });
  }
}
