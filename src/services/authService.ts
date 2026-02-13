// 自定义认证服务 - 阿里云短信验证码 + 预留微信/QQ OAuth 接口
// TODO: 当前为测试模式，不接数据库，使用 localStorage 模拟
// TODO: 上线时将 TEST_MODE 改为 false，前端会调用后端 API（server/index.js）

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

// TODO: 上线时改为 false，走真实阿里云 API
const TEST_MODE = false;
const TEST_CODE = '888888';
const STORAGE_KEY = 'shenyin_auth';
const USERS_KEY = 'shenyin_users';

/**
 * 发送阿里云短信验证码
 * TODO: 后端接口示例: POST /api/sms/send { phone: string }
 */
const sendAliyunSms = async (phone: string): Promise<SmsResult> => {
  if (TEST_MODE) {
    console.log(`[SMS] 测试模式 -> ${phone}, 验证码: ${TEST_CODE}`);
    return { success: true, message: `验证码已发送（测试码: ${TEST_CODE}）` };
  }

  try {
    const API_BASE = import.meta.env.VITE_API_BASE || '';
    const res = await fetch(`${API_BASE}/api/sms/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, countryCode: '+86' }),
    });
    const data = await res.json();
    if (data.success) {
      return { success: true, message: '验证码已发送' };
    }
    return { success: false, message: data.message || '发送失败' };
  } catch (err: any) {
    return { success: false, message: err.message || '网络错误' };
  }
};

/** 校验验证码 */
const verifySmsCode = async (phone: string, code: string): Promise<boolean> => {
  if (TEST_MODE) {
    return code === TEST_CODE;
  }

  // TODO: 真实环境调用后端校验接口
  try {
    const API_BASE = import.meta.env.VITE_API_BASE || '';
    const res = await fetch(`${API_BASE}/api/sms/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, code }),
    });
    const data = await res.json();
    return data.success === true;
  } catch {
    return false;
  }
};

// TODO: 上线替换为数据库读写

const getStoredUsers = (): Record<string, AuthUser> => {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || '{}');
  } catch {
    return {};
  }
};

const saveUser = (user: AuthUser) => {
  const users = getStoredUsers();
  users[user.phone] = user;
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

const generateToken = () =>
  `token_${Date.now()}_${Math.random().toString(36).slice(2)}`;

const generateUserId = () =>
  `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

/**
 * 微信 OAuth 登录
 * TODO: 上线时需要:
 *  1. 微信开放平台注册应用，获取 AppID + AppSecret
 *  2. 后端实现 /api/auth/wechat 返回授权跳转 URL
 *  3. 后端实现 /api/auth/wechat/callback 处理回调，换取用户信息
 *  4. AppID 和 Secret 全部放后端，前端只做跳转
 */
const loginWithWechatOAuth = async (): Promise<LoginResult> => {
  if (TEST_MODE) {
    console.log('[Auth] 微信登录 - 测试模式模拟');
    const user: AuthUser = {
      id: generateUserId(),
      phone: '',
      username: '微信用户',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wechat',
      loginMethod: 'wechat',
      createdAt: Date.now(),
    };
    const token = generateToken();
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ user, token }));
    return { success: true, user, token };
  }

  // TODO: 真实环境 - 请求后端获取微信授权 URL，然后跳转
  // const API_BASE = import.meta.env.VITE_API_BASE || '';
  // const res = await fetch(`${API_BASE}/api/auth/wechat`);
  // const { url } = await res.json();
  // window.location.href = url;
  return { success: false, message: '微信登录尚未配置' };
};

/**
 * QQ OAuth 登录
 * TODO: 上线时需要:
 *  1. QQ 互联平台注册应用，获取 AppID + AppKey
 *  2. 后端实现 /api/auth/qq 返回授权跳转 URL
 *  3. 后端实现 /api/auth/qq/callback 处理回调，换取用户信息
 *  4. AppID 和 Key 全部放后端，前端只做跳转
 */
const loginWithQQOAuth = async (): Promise<LoginResult> => {
  if (TEST_MODE) {
    console.log('[Auth] QQ登录 - 测试模式模拟');
    const user: AuthUser = {
      id: generateUserId(),
      phone: '',
      username: 'QQ用户',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=qq',
      loginMethod: 'qq',
      createdAt: Date.now(),
    };
    const token = generateToken();
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ user, token }));
    return { success: true, user, token };
  }

  // TODO: 真实环境 - 请求后端获取 QQ 授权 URL，然后跳转
  // const API_BASE = import.meta.env.VITE_API_BASE || '';
  // const res = await fetch(`${API_BASE}/api/auth/qq`);
  // const { url } = await res.json();
  // window.location.href = url;
  return { success: false, message: 'QQ登录尚未配置' };
};

export const authService = {
  /** 发送短信验证码 */
  sendSmsCode: sendAliyunSms,

  /** 手机号验证码登录（自动注册） */
  async loginWithPhone(phone: string, code: string): Promise<LoginResult> {
    const valid = await verifySmsCode(phone, code);
    if (!valid) {
      return { success: false, message: '验证码错误' };
    }

    const users = getStoredUsers();
    let user = users[phone];
    if (!user) {
      user = {
        id: generateUserId(),
        phone,
        loginMethod: 'phone',
        createdAt: Date.now(),
      };
      saveUser(user);
    }

    const token = generateToken();
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ user, token }));
    console.log('[Auth] 手机号登录成功', phone);
    return { success: true, user, token };
  },

  /** 注册（手机号验证码 + 额外信息） */
  async register(data: {
    phone: string;
    code: string;
    username?: string;
    courseType?: string;
  }): Promise<LoginResult> {
    const valid = await verifySmsCode(data.phone, data.code);
    if (!valid) {
      return { success: false, message: '验证码错误' };
    }

    const user: AuthUser = {
      id: generateUserId(),
      phone: data.phone,
      username: data.username,
      courseType: data.courseType,
      loginMethod: 'phone',
      createdAt: Date.now(),
    };
    saveUser(user);

    const token = generateToken();
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ user, token }));
    console.log('[Auth] 注册成功', data.phone);
    return { success: true, user, token };
  },

  /** 微信登录 */
  loginWithWechat: loginWithWechatOAuth,

  /** QQ 登录 */
  loginWithQQ: loginWithQQOAuth,

  /** 登出 */
  logout() {
    localStorage.removeItem(STORAGE_KEY);
    console.log('[Auth] 已登出');
  },

  /** 获取当前登录用户 */
  getCurrentUser(): { user: AuthUser; token: string } | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  /** 检查登录状态 */
  isLoggedIn(): boolean {
    return this.getCurrentUser() !== null;
  },
};
