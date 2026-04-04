import { fetchWithTimeout } from '../utils/fetchWithTimeout';

export interface AuthUser {
  id: string;
  phone: string;
  username?: string;
  displayName?: string;
  avatar?: string;
  courseType?: string;
  loginMethod: 'phone' | 'wechat' | 'qq';
  hasPassword: boolean;
  createdAt: number;
}

interface SmsResult {
  success: boolean;
  message: string;
}

interface LoginResult {
  success: boolean;
  user?: AuthUser;
  token?: string;
  refreshToken?: string;
  message?: string;
  code?: string;
}

interface StoredSession {
  user: AuthUser;
  token: string;
  refreshToken: string;
}

export interface UpdateProfilePayload {
  displayName?: string;
  courseType?: string;
  avatarUrl?: string;
}

const STORAGE_KEY = 'shenyin_auth';
const API_BASE = import.meta.env.VITE_API_BASE || '';

const buildUrl = (path: string) => `${API_BASE}${path}`;

// ── Session 存储 ──

const readStoredSession = (): StoredSession | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // 兼容旧格式（没有 refreshToken 的）
    if (!parsed.token) return null;
    return parsed as StoredSession;
  } catch {
    return null;
  }
};

const writeStoredSession = (session: StoredSession) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
};

const clearStoredSession = () => {
  localStorage.removeItem(STORAGE_KEY);
};

// ── 请求工具 ──

class ApiRequestError extends Error {
  code?: string;
  status?: number;

  constructor(message: string, options?: { code?: string; status?: number }) {
    super(message);
    this.name = 'ApiRequestError';
    this.code = options?.code;
    this.status = options?.status;
  }
}

let refreshPromise: Promise<boolean> | null = null;

async function tryRefreshToken(): Promise<boolean> {
  const session = readStoredSession();
  if (!session?.refreshToken) return false;

  try {
    const response = await fetchWithTimeout(buildUrl('/api/auth/refresh'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: session.refreshToken }),
      timeoutMs: 10_000,
      maxRetries: 1,
    });

    if (!response.ok) {
      clearStoredSession();
      return false;
    }

    const data = await response.json();
    if (data.success && data.token && data.refreshToken) {
      writeStoredSession({
        user: session.user,
        token: data.token,
        refreshToken: data.refreshToken,
      });
      return true;
    }

    clearStoredSession();
    return false;
  } catch {
    return false;
  }
}

// 防止并发刷新
function refreshTokenOnce(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = tryRefreshToken().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

const request = async <T>(path: string, init: RequestInit = {}, retry = true): Promise<T> => {
  const headers = new Headers(init.headers || {});
  if (!headers.has('Content-Type') && init.body) {
    headers.set('Content-Type', 'application/json');
  }

  // 自动附加 access token
  const session = readStoredSession();
  if (session?.token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${session.token}`);
  }

  const response = await fetchWithTimeout(buildUrl(path), {
    ...init,
    headers,
    timeoutMs: 15_000,
    maxRetries: 2,
  });

  let data: any = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  // 401 且有 refresh token → 尝试刷新后重试一次
  if (response.status === 401 && retry) {
    const refreshed = await refreshTokenOnce();
    if (refreshed) {
      return request<T>(path, init, false);
    }
    clearStoredSession();
  }

  if (!response.ok) {
    throw new ApiRequestError(data?.message || `请求失败 (${response.status})`, {
      code: data?.code,
      status: response.status,
    });
  }

  return data as T;
};

// ── Avatar compression ──

function compressAvatar(
  file: File,
  maxSize: number,
  quality: number,
): Promise<{ base64: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      // Crop to square, centered
      const side = Math.min(img.width, img.height);
      const sx = (img.width - side) / 2;
      const sy = (img.height - side) / 2;
      canvas.width = maxSize;
      canvas.height = maxSize;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('Canvas not supported')); return; }
      ctx.drawImage(img, sx, sy, side, side, 0, 0, maxSize, maxSize);
      const dataUrl = canvas.toDataURL('image/jpeg', quality);
      // Strip "data:image/jpeg;base64," prefix
      const base64 = dataUrl.split(',')[1];
      resolve({ base64 });
    };
    img.onerror = () => reject(new Error('图片加载失败'));
    img.src = URL.createObjectURL(file);
  });
}

// ── Auth Service ──

export const authService = {
  async checkAvailability(data: { username?: string; phone?: string }): Promise<{
    success: boolean;
    usernameAvailable?: boolean;
    usernameMessage?: string;
    phoneAvailable?: boolean;
    phoneMessage?: string;
  }> {
    try {
      return await request('/api/auth/check-availability', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch {
      return { success: false };
    }
  },

  async sendSmsCode(phone: string): Promise<SmsResult> {
    return request<SmsResult>('/api/sms/send', {
      method: 'POST',
      body: JSON.stringify({ phone, countryCode: '+86' }),
    });
  },

  async loginWithPhone(phone: string, code: string): Promise<LoginResult> {
    const result = await request<LoginResult>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ phone, code, mode: 'sms' }),
    });

    if (result.success && result.user && result.token && result.refreshToken) {
      writeStoredSession({
        user: result.user,
        token: result.token,
        refreshToken: result.refreshToken,
      });
    }

    return result;
  },

  async loginWithPassword(phone: string, password: string): Promise<LoginResult> {
    const result = await request<LoginResult>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ account: phone, password, mode: 'password' }),
    });

    if (result.success && result.user && result.token && result.refreshToken) {
      writeStoredSession({
        user: result.user,
        token: result.token,
        refreshToken: result.refreshToken,
      });
    }

    return result;
  },

  async register(data: {
    phone: string;
    code: string;
    username?: string;
    displayName?: string;
    courseType?: string;
    password?: string;
  }): Promise<LoginResult> {
    const result = await request<LoginResult>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (result.success && result.user && result.token && result.refreshToken) {
      writeStoredSession({
        user: result.user,
        token: result.token,
        refreshToken: result.refreshToken,
      });
    }

    return result;
  },

  async loginWithWechat(): Promise<LoginResult> {
    return { success: false, message: '当前方案未接入微信登录' };
  },

  async loginWithQQ(): Promise<LoginResult> {
    return { success: false, message: '当前方案未接入 QQ 登录' };
  },

  async logout() {
    const session = readStoredSession();
    if (session?.token && session?.refreshToken) {
      try {
        await fetchWithTimeout(buildUrl('/api/auth/logout'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.token}`,
          },
          body: JSON.stringify({ refreshToken: session.refreshToken }),
          timeoutMs: 5_000,
          noRetry: true,
        });
      } catch {
        // 即使服务端吊销失败，本地也要清除
      }
    }
    clearStoredSession();
  },

  getAccessToken(): string | null {
    return readStoredSession()?.token ?? null;
  },

  async getCurrentUser(): Promise<{ user: AuthUser; token: string } | null> {
    const session = readStoredSession();
    if (!session?.token) return null;

    try {
      const result = await request<{ success: boolean; user?: AuthUser }>('/api/auth/me', {
        method: 'GET',
      });

      if (!result.success || !result.user) {
        clearStoredSession();
        return null;
      }

      // 用最新的 token（可能已被 refresh 更新）
      const current = readStoredSession();
      if (current) {
        const updated = { ...current, user: result.user };
        writeStoredSession(updated);
        return { user: result.user, token: updated.token };
      }

      return null;
    } catch {
      clearStoredSession();
      return null;
    }
  },

  async updateProfile(payload: UpdateProfilePayload): Promise<AuthUser> {
    const result = await request<{ success: boolean; user?: AuthUser; message?: string }>(
      '/api/profile/update',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
    );

    if (!result.success || !result.user) {
      throw new Error(result.message || '更新资料失败');
    }

    const session = readStoredSession();
    if (session) {
      writeStoredSession({ ...session, user: result.user });
    }

    return result.user;
  },

  async uploadAvatar(file: File): Promise<AuthUser> {
    // Compress to 256x256 JPEG on client to keep payload small
    const compressed = await compressAvatar(file, 256, 0.85);

    const result = await request<{ success: boolean; user?: AuthUser; message?: string }>(
      '/api/profile/update',
      {
        method: 'POST',
        body: JSON.stringify({ avatarImage: compressed.base64, avatarContentType: 'image/jpeg' }),
      },
    );

    if (!result.success || !result.user) {
      throw new Error(result.message || '头像上传失败');
    }

    const session = readStoredSession();
    if (session) {
      writeStoredSession({ ...session, user: result.user });
    }

    return result.user;
  },

  async setUsername(username: string): Promise<{ success: boolean; user?: AuthUser; message?: string; code?: string }> {
    const result = await request<{ success: boolean; user?: AuthUser; message?: string; code?: string }>(
      '/api/profile/username',
      { method: 'POST', body: JSON.stringify({ username }) },
    );
    if (result.success && result.user) {
      const session = readStoredSession();
      if (session) {
        writeStoredSession({ ...session, user: result.user });
      }
    }
    return result;
  },

  async setPassword(data: { oldPassword?: string; newPassword: string }): Promise<{ success: boolean; message?: string }> {
    const result = await request<{ success: boolean; message?: string }>(
      '/api/profile/password',
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
    );
    return result;
  },

  isLoggedIn(): boolean {
    return readStoredSession() !== null;
  },
};
