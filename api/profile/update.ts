import type { VercelRequest, VercelResponse } from '@vercel/node';
import { AuthError, requireAuth } from '../_lib/auth.js';
import { setCorsHeaders } from '../_lib/cors.js';
import { assertRateLimits, getClientIp, RateLimitError } from '../_lib/rate-limit.js';
import { updateUserProfileById } from '../_lib/users.js';
import {
  MAX_DISPLAY_NAME_LENGTH,
  MAX_COURSE_TYPE_LENGTH,
  sanitizeString,
} from '../_lib/validate.js';

/** 压缩后头像 data URL 最大长度（~100KB base64 足够 256x256 JPEG） */
const MAX_AVATAR_DATA_URL_LENGTH = 150_000;
const AVATAR_ALLOWED_TYPES = ['image/jpeg', 'image/png'];

interface ParsedBody {
  displayName?: string;
  courseType?: string;
  avatarImage?: string;
  avatarContentType?: string;
}

function readBody(req: VercelRequest): ParsedBody {
  const body = (req.body ?? {}) as Record<string, unknown>;
  return {
    displayName: typeof body.displayName === 'string' ? sanitizeString(body.displayName, MAX_DISPLAY_NAME_LENGTH) : undefined,
    courseType: typeof body.courseType === 'string' ? sanitizeString(body.courseType, MAX_COURSE_TYPE_LENGTH) : undefined,
    avatarImage: typeof body.avatarImage === 'string' ? body.avatarImage : undefined,
    avatarContentType: typeof body.avatarContentType === 'string' ? body.avatarContentType : undefined,
  };
}

/** Validate base64 image and return a data URL to store directly in DB */
function buildAvatarDataUrl(base64Data: string, contentType: string): string {
  if (!AVATAR_ALLOWED_TYPES.includes(contentType)) {
    throw new Error('仅支持 JPG / PNG 格式');
  }
  const dataUrl = `data:${contentType};base64,${base64Data}`;
  if (dataUrl.length > MAX_AVATAR_DATA_URL_LENGTH) {
    throw new Error('头像图片过大，请选择更小的图片');
  }
  return dataUrl;
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

    const { displayName, courseType, avatarImage, avatarContentType } = readBody(req);

    // Build data URL from base64 image if provided
    let avatarUrl: string | undefined;
    if (avatarImage && avatarContentType) {
      avatarUrl = buildAvatarDataUrl(avatarImage, avatarContentType);
    }

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
    res.status(500).json({ success: false, message: (error as Error).message || '更新失败' });
  }
}
