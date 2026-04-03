/** 输入长度限制 */
export const MAX_USERNAME_LENGTH = 30;
export const MIN_USERNAME_LENGTH = 3;
export const MAX_DISPLAY_NAME_LENGTH = 30;
export const MAX_COURSE_TYPE_LENGTH = 50;
export const MAX_AVATAR_URL_LENGTH = 500;
export const MAX_CHAT_MESSAGE_LENGTH = 2000;
export const MAX_CHAT_MESSAGES_COUNT = 50;
export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_LENGTH = 72;

/** username 只允许字母、数字、下划线，3-30 位 */
const USERNAME_RE = /^[a-zA-Z0-9_]{3,30}$/;

export function validateUsername(value: string): { valid: boolean; message?: string } {
  if (value.length < MIN_USERNAME_LENGTH) {
    return { valid: false, message: `用户名至少 ${MIN_USERNAME_LENGTH} 个字符` };
  }
  if (value.length > MAX_USERNAME_LENGTH) {
    return { valid: false, message: `用户名不能超过 ${MAX_USERNAME_LENGTH} 个字符` };
  }
  if (!USERNAME_RE.test(value)) {
    return { valid: false, message: '用户名只能包含字母、数字和下划线' };
  }
  return { valid: true };
}

export function validatePassword(password: string): { valid: boolean; message?: string } {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return { valid: false, message: `密码至少 ${MIN_PASSWORD_LENGTH} 位` };
  }
  if (password.length > MAX_PASSWORD_LENGTH) {
    return { valid: false, message: `密码不能超过 ${MAX_PASSWORD_LENGTH} 位` };
  }
  return { valid: true };
}

export function sanitizeString(value: string, maxLength: number): string {
  return value.slice(0, maxLength).trim();
}

export function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}
