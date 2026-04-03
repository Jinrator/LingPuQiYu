/** 输入长度限制 */
export const MAX_USERNAME_LENGTH = 30;
export const MAX_COURSE_TYPE_LENGTH = 50;
export const MAX_AVATAR_URL_LENGTH = 500;
export const MAX_CHAT_MESSAGE_LENGTH = 2000;
export const MAX_CHAT_MESSAGES_COUNT = 50;

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
