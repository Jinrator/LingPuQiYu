import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService, AuthUser } from '../services/authService';

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  sendSmsCode: (phone: string) => Promise<any>;
  loginWithPhone: (phone: string, code: string) => Promise<any>;
  loginWithPassword: (phone: string, password: string) => Promise<any>;
  register: (data: { phone: string; code: string; username?: string; displayName?: string; courseType?: string; password?: string }) => Promise<any>;
  loginWithWechat: () => Promise<any>;
  loginWithQQ: () => Promise<any>;
  logout: () => void;
  setPassword: (data: { oldPassword?: string; newPassword: string }) => Promise<any>;
  setUsername: (username: string) => Promise<any>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 先从 localStorage 乐观恢复，避免等待网络请求阻塞 UI
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const raw = localStorage.getItem('shenyin_auth');
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed?.user || null;
    } catch { return null; }
  });
  const [isLoading, setIsLoading] = useState(() => {
    // 如果本地有 session，直接标记为非 loading，让 UI 立即渲染
    try {
      const raw = localStorage.getItem('shenyin_auth');
      if (!raw) return true;
      const parsed = JSON.parse(raw);
      return !parsed?.token;
    } catch { return true; }
  });
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    try {
      const raw = localStorage.getItem('shenyin_auth');
      if (!raw) return false;
      const parsed = JSON.parse(raw);
      return !!parsed?.token;
    } catch { return false; }
  });

  useEffect(() => {
    let isMounted = true;

    const hydrateAuth = async () => {
      try {
        const session = await authService.getCurrentUser();
        if (!isMounted) return;
        if (session) {
          setUser(session.user);
          setIsAuthenticated(true);
        } else {
          // 服务端验证失败，清除乐观状态
          setUser(null);
          setIsAuthenticated(false);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void hydrateAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const sendSmsCode = useCallback(async (phone: string) => {
    return authService.sendSmsCode(phone);
  }, []);

  const loginWithPhone = useCallback(async (phone: string, code: string) => {
    setIsLoading(true);
    try {
      const result = await authService.loginWithPhone(phone, code);
      if (result.success && result.user) {
        setUser(result.user);
        setIsAuthenticated(true);
      }
      return result;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loginWithPassword = useCallback(async (phone: string, password: string) => {
    setIsLoading(true);
    try {
      const result = await authService.loginWithPassword(phone, password);
      if (result.success && result.user) {
        setUser(result.user);
        setIsAuthenticated(true);
      }
      return result;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (data: { phone: string; code: string; username?: string; displayName?: string; courseType?: string; password?: string }) => {
    setIsLoading(true);
    try {
      const result = await authService.register(data);
      if (result.success && result.user) {
        setUser(result.user);
        setIsAuthenticated(true);
      }
      return result;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loginWithWechat = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await authService.loginWithWechat();
      if (result.success && result.user) {
        setUser(result.user);
        setIsAuthenticated(true);
      }
      return result;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loginWithQQ = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await authService.loginWithQQ();
      if (result.success && result.user) {
        setUser(result.user);
        setIsAuthenticated(true);
      }
      return result;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    void authService.logout();
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  const setPasswordFn = useCallback(async (data: { oldPassword?: string; newPassword: string }) => {
    return authService.setPassword(data);
  }, []);

  const setUsernameFn = useCallback(async (username: string) => {
    const result = await authService.setUsername(username);
    if (result.success && result.user) {
      setUser(result.user);
    }
    return result;
  }, []);

  const refreshUser = useCallback(async () => {
    // 如果 hydrateAuth 正在进行中，不重复请求
    if (isLoading) return;
    try {
      const session = await authService.getCurrentUser();
      setUser(session?.user || null);
      setIsAuthenticated(!!session);
    } catch {
      // ignore
    }
  }, [isLoading]);

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated, sendSmsCode, loginWithPhone, loginWithPassword, register, loginWithWechat, loginWithQQ, logout, setPassword: setPasswordFn, setUsername: setUsernameFn, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
