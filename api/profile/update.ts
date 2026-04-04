import type { VercelRequest, VercelResponse } from '@vercel/node';
import { AuthError, requireAuth } from '../_lib/auth.js';
import { setCorsHeaders } from '../_lib/cors.js';
import { assertRateLimits, getClientIp, RateLimitError } from '../_lib/rate-limit.js';
import { updateUserProfileById } from '../_lib/users.js';
import { getSupabaseAdmin } from '../_lib/supabase.js';
import {
  MAX_DISPLAY_NAME_LENGTH,
  MAX_COURSE_TYPE_LENGTH,
  MAX_AVATAR_URL_LENGTH,
  sanitizeString,
  isValidUrl,
} from '../_lib/validate.js';

const AVATAR_BUCKET = 'avatars';
const AVATAR_MAX_SIZE = 2 * 1024 * 1024; // 2 MB
const AVATAR_ALLOWED_TYPES = ['image/jpeg', 'image/png'];

interface ParsedBody {
  displayName?: string;
  courseType?: string;
  avatarUrl?: string;
  // base64 avatar upload fields
  avatarImage?: string;
  avatarContentType?: string;
}

function readBody(req: VercelRequest): ParsedBody {
  const body = (req.body ?? {}) as Record<string, unknown>;

  const avatarRaw = typeof body.avatarUrl === 'string' ? body.avatarUrl.trim() : undefined;

  return {
    displayName: typeof body.displayName === 'string' ? sanitizeString(body.displayName, MAX_DISPLAY_NAME_LENGTH) : undefined,
    courseType: typeof body.courseType === 'string' ? sanitizeString(body.courseType, MAX_COURSE_TYPE_LENGTH) : undefined,
    avatarUrl: avatarRaw && avatarRaw.length <= MAX_AVATAR_URL_LENGTH && isValidUrl(avatarRaw) ? avatarRaw : undefined,
    avatarImage: typeof body.avatarImage === 'string' ? body.avatarImage : undefined,
    avatarContentType: typeof body.avatarContentType === 'string' ? body.avatarContentType : undefined,
  };
}

/** Upload base64 image to Supabase Storage, return public URL */
async function uploadAvatarImage(
  userId: string,
  base64Data: string,
  contentType: string,
): Promise<string> {
  if (!AVATAR_ALLOWED_TYPES.includes(contentType)) {
    throw new Error('仅支持 JPG / PNG 格式');
  }

  const buffer = Buffer.from(base64Data, 'base64');
  if (buffer.length > AVATAR_MAX_SIZE) {
    throw new Error('图片不能超过 2MB');
  }

  const ext = contentType === 'image/jpeg' ? 'jpg' : 'png';
  const filePath = `${userId}/avatar_${Date.now()}.${ext}`;
  const supabase = getSupabaseAdmin();

  const { error: uploadError } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(filePath, buffer, { contentType, upsert: true });

  if (uploadError) {
    console.error('[Avatar] 上传失败:', uploadError);
    throw new Error('头像上传失败');
  }

  const { data: urlData } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(filePath);
  return urlData.publicUrl;
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

    const { displayName, courseType, avatarUrl, avatarImage, avatarContentType } = readBody(req);

    // If base64 image provided, upload and get URL
    let finalAvatarUrl = avatarUrl;
    if (avatarImage && avatarContentType) {
      finalAvatarUrl = await uploadAvatarImage(auth.user.id, avatarImage, avatarContentType);
    }

    const user = await updateUserProfileById(auth.user.id, {
      displayName,
      courseType,
      avatarUrl: finalAvatarUrl,
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
