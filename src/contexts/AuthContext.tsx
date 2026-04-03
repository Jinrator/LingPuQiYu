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
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const hydrateAuth = async () => {
      setIsLoading(true);
      try {
        const session = await authService.getCurrentUser();
        if (!isMounted) return;
        setUser(session?.user || null);
        setIsAuthenticated(!!session);
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
    try {
      const session = await authService.getCurrentUser();
      setUser(session?.user || null);
      setIsAuthenticated(!!session);
    } catch {
      // ignore
    }
  }, []);

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
