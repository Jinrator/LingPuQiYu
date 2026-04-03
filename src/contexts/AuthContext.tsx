import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService, AuthUser } from '../services/authService';

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  sendSmsCode: (phone: string) => Promise<any>;
  loginWithPhone: (phone: string, code: string) => Promise<any>;
  register: (data: { phone: string; code: string; username?: string; courseType?: string }) => Promise<any>;
  loginWithWechat: () => Promise<any>;
  loginWithQQ: () => Promise<any>;
  logout: () => void;
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

  const register = useCallback(async (data: { phone: string; code: string; username?: string; courseType?: string }) => {
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

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated, sendSmsCode, loginWithPhone, register, loginWithWechat, loginWithQQ, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
