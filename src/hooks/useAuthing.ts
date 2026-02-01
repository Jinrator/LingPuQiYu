// Authing React Hook

import { useState, useEffect } from 'react';
import { authingService } from '../services/authingService';

export const useAuthing = () => {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // 初始化
  useEffect(() => {
    let isMounted = true;
    
    const initAuth = async () => {
      authingService.init();
      
      // 检查是否已登录
      const currentUser = await authingService.getCurrentUser();
      
      // 只在组件仍然挂载时更新状态
      if (isMounted && currentUser) {
        setUser(currentUser);
        setIsAuthenticated(true);
      }
    };
    
    initAuth();
    
    // 清理函数
    return () => {
      isMounted = false;
    };
  }, []);

  // 微信登录
  const loginWithWechat = async () => {
    try {
      setIsLoading(true);
      await authingService.loginWithWechat();
    } catch (error) {
      console.error('微信登录失败:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // QQ登录
  const loginWithQQ = async () => {
    try {
      setIsLoading(true);
      await authingService.loginWithQQ();
    } catch (error) {
      console.error('QQ登录失败:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // 手机号登录
  const loginWithPhone = async (phone: string, code: string) => {
    try {
      setIsLoading(true);
      const user = await authingService.loginWithPhone(phone, code);
      setUser(user);
      setIsAuthenticated(true);
      return { success: true };
    } catch (error: any) {
      return { success: false, message: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  // 发送验证码
  const sendSmsCode = async (phone: string) => {
    return authingService.sendSmsCode(phone);
  };

  // 注册
  const register = async (data: {
    phone: string;
    code: string;
    username?: string;
    profile?: any;
  }) => {
    try {
      setIsLoading(true);
      const user = await authingService.register(data);
      setUser(user);
      setIsAuthenticated(true);
      return { success: true };
    } catch (error: any) {
      return { success: false, message: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  // 登出
  const logout = async () => {
    try {
      await authingService.logout();
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('登出失败:', error);
    }
  };

  return {
    user,
    isLoading,
    isAuthenticated,
    loginWithWechat,
    loginWithQQ,
    loginWithPhone,
    sendSmsCode,
    register,
    logout
  };
};
