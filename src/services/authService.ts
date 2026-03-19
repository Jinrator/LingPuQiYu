export interface AuthUser {
  id: string;
  phone: string;
  username?: string;
  avatar?: string;
  courseType?: string;
  loginMethod: 'phone' | 'wechat' | 'qq';
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
  message?: string;
}

interface StoredSession {
  user: AuthUser;
  token: string;
}

interface SessionResponse {
  success: boolean;
  user?: AuthUser;
  token?: string;
  message?: string;
}

const STORAGE_KEY = 'shenyin_auth';
const API_BASE = import.meta.env.VITE_API_BASE || '';

const buildUrl = (path: string) => `${API_BASE}${path}`;

const readStoredSession = (): StoredSession | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredSession;
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

const request = async <T>(path: string, init: RequestInit = {}): Promise<T> => {
  const headers = new Headers(init.headers || {});
  if (!headers.has('Content-Type') && init.body) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(buildUrl(path), {
    ...init,
    headers,
  });

  let data: any = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error(data?.message || `请求失败 (${response.status})`);
  }

  return data as T;
};

const authHeader = (token: string) => ({
  Authorization: `Bearer ${token}`,
});

export const authService = {
  async sendSmsCode(phone: string): Promise<SmsResult> {
    return request<SmsResult>('/api/sms/send', {
      method: 'POST',
      body: JSON.stringify({ phone, countryCode: '+86' }),
    });
  },

  async loginWithPhone(phone: string, code: string): Promise<LoginResult> {
    const result = await request<SessionResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ phone, code }),
    });

    if (result.success && result.user && result.token) {
      writeStoredSession({ user: result.user, token: result.token });
    }

    return result;
  },

  async register(data: {
    phone: string;
    code: string;
    username?: string;
    courseType?: string;
  }): Promise<LoginResult> {
    const result = await request<SessionResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (result.success && result.user && result.token) {
      writeStoredSession({ user: result.user, token: result.token });
    }

    return result;
  },

  async loginWithWechat(): Promise<LoginResult> {
    return { success: false, message: '当前方案未接入微信登录' };
  },

  async loginWithQQ(): Promise<LoginResult> {
    return { success: false, message: '当前方案未接入 QQ 登录' };
  },

  logout() {
    clearStoredSession();
  },

  async getCurrentUser(): Promise<StoredSession | null> {
    const storedSession = readStoredSession();
    if (!storedSession?.token) return null;

    try {
      const result = await request<SessionResponse>('/api/auth/me', {
        method: 'GET',
        headers: authHeader(storedSession.token),
      });

      if (!result.success || !result.user) {
        clearStoredSession();
        return null;
      }

      const nextSession = { user: result.user, token: storedSession.token };
      writeStoredSession(nextSession);
      return nextSession;
    } catch {
      clearStoredSession();
      return null;
    }
  },

  isLoggedIn(): boolean {
    return readStoredSession() !== null;
  },
};
