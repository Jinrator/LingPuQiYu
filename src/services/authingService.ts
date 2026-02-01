// Authing 认证服务 - 使用 Authing v5 SDK + REST API

import { Authing } from '@authing/web';

// Authing 实例
let authingInstance: Authing | null = null;

// 防止并发调用的标志
let isGettingUser = false;
let userPromise: Promise<any> | null = null;

// Authing 配置
const getAuthingConfig = () => {
  const appId = import.meta.env.VITE_AUTHING_APP_ID as string;
  const appHost = import.meta.env.VITE_AUTHING_APP_HOST as string;
  
  const config = {
    appId,
    domain: appHost,
    redirectUri: window.location.origin,
  };
  
  console.log('🔧 Authing 配置:', config);
  return config;
};

// 获取或创建 Authing 实例
const getAuthing = () => {
  if (!authingInstance) {
    const config = getAuthingConfig();
    authingInstance = new Authing({
      appId: config.appId,
      domain: config.domain,
      redirectUri: config.redirectUri,
    } as any);
    console.log('✅ Authing SDK 初始化成功');
  }
  return authingInstance;
};

export const authingService = {
  /**
   * 初始化 Authing
   */
  init() {
    try {
      getAuthing();
      return true;
    } catch (error) {
      console.error('❌ Authing 初始化失败:', error);
      return false;
    }
  },

  /**
   * 获取当前登录用户
   */
  async getCurrentUser() {
    // 如果正在获取用户信息，返回同一个 Promise
    if (isGettingUser && userPromise) {
      console.log('⏳ 等待现有的用户信息请求...');
      return userPromise;
    }

    try {
      isGettingUser = true;
      
      userPromise = (async () => {
        const authing = getAuthing();
        const loginState = await authing.getLoginState();
        console.log('👤 登录状态:', loginState);
        return loginState;
      })();

      const result = await userPromise;
      return result;
    } catch (error) {
      console.error('获取用户信息失败:', error);
      return null;
    } finally {
      isGettingUser = false;
      // 延迟清除 promise，避免快速连续调用
      setTimeout(() => {
        userPromise = null;
      }, 1000);
    }
  },

  /**
   * 微信登录
   */
  async loginWithWechat() {
    try {
      const authing = getAuthing();
      console.log('🚀 发起微信登录...');
      await authing.loginWithRedirect({
        connection: 'wechat:pc',
      } as any);
    } catch (error) {
      console.error('微信登录失败:', error);
      throw error;
    }
  },

  /**
   * QQ 登录
   */
  async loginWithQQ() {
    try {
      const authing = getAuthing();
      console.log('🚀 发起QQ登录...');
      await authing.loginWithRedirect({
        connection: 'qq',
      } as any);
    } catch (error) {
      console.error('QQ登录失败:', error);
      throw error;
    }
  },

  /**
   * 发送短信验证码
   */
  async sendSmsCode(phone: string) {
    try {
      const config = getAuthingConfig();
      console.log('📱 发送验证码到:', phone);
      
      // 使用 Authing REST API 发送验证码
      const response = await fetch(`${config.domain}/api/v3/send-sms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-authing-app-id': config.appId,
        },
        body: JSON.stringify({
          phoneNumber: phone,
          phoneCountryCode: '+86',
          channel: 'CHANNEL_LOGIN',
        }),
      });
      
      const result = await response.json();
      console.log('📱 发送验证码响应:', result);
      
      if (response.ok && result.statusCode === 200) {
        console.log('✅ 验证码发送成功');
        return { success: true, message: '验证码已发送' };
      } else {
        console.error('❌ 发送验证码失败:', result);
        return { 
          success: false, 
          message: result.message || '发送失败'
        };
      }
    } catch (error: any) {
      console.error('❌ 发送验证码失败:', error);
      return { 
        success: false, 
        message: error.message || '发送失败'
      };
    }
  },

  /**
   * 手机号验证码登录
   * 注意: 由于 Authing 应用配置需要 client_secret，
   * 对于 SPA 应用，建议在 Authing 控制台将 token_endpoint_auth_method 设置为 'none'
   * 或者使用托管登录页面
   */
  async loginWithPhone(phone: string, code: string) {
    try {
      const config = getAuthingConfig();
      console.log('🔐 手机号登录:', phone);
      
      // 对于需要 client_secret 的应用，我们需要使用授权码流程
      // 这里提供一个临时解决方案：使用 Authing 的公开 API
      const response = await fetch(`${config.domain}/api/v3/signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-authing-app-id': config.appId,
          // 对于公开客户端，添加这个标识
          'x-authing-request-from': 'sdk-web',
        },
        body: JSON.stringify({
          connection: 'PASSCODE',
          passCodePayload: {
            phone: phone,  // 使用 phone 而不是 phoneNumber
            phoneCountryCode: '+86',
            passCode: code,
          },
          options: {
            scope: 'openid profile email phone',
            // 标识这是公开客户端
            clientId: config.appId,
            autoRegister: true,
          },
        }),
      });
      
      const result = await response.json();
      console.log('🔐 登录响应:', result);
      
      if (response.ok && result.statusCode === 200) {
        console.log('✅ 登录成功:', result.data);
        // 保存 token 和用户信息
        if (result.data?.access_token) {
          localStorage.setItem('authing_token', result.data.access_token);
        }
        if (result.data?.id_token) {
          localStorage.setItem('authing_id_token', result.data.id_token);
        }
        if (result.data?.refresh_token) {
          localStorage.setItem('authing_refresh_token', result.data.refresh_token);
        }
        return result.data;
      } else {
        console.error('❌ 手机号登录失败:', result);
        
        // 根据不同的错误码给出友好提示
        if (result.statusCode === 499 && result.apiCode === 2001) {
          // 验证码相关错误，直接使用 Authing 返回的错误信息
          throw new Error(result.message || '验证码错误');
        }
        
        if (result.statusCode === 400) {
          // 参数错误
          throw new Error(result.message || '请求参数错误');
        }
        
        if (result.statusCode === 499) {
          // 其他 499 错误（如配置问题）
          throw new Error(
            '登录配置错误：请在 Authing 控制台 → 应用配置 → 高级配置 → 授权配置 中，' +
            '将 "token_endpoint_auth_method" 设置为 "none"'
          );
        }
        
        if (result.statusCode === 403 && result.apiCode === 1576) {
          throw new Error('无权限登录此应用，请联系管理员');
        }
        
        throw new Error(result.message || '登录失败，请稍后重试');
      }
    } catch (error: any) {
      console.error('❌ 手机号登录失败:', error);
      throw new Error(error.message || '登录失败');
    }
  },

  /**
   * 用户注册（使用手机号验证码）
   */
  async register(data: {
    phone: string;
    code: string;
    username?: string;
    profile?: any;
  }) {
    try {
      const config = getAuthingConfig();
      console.log('📝 注册用户:', data.phone);
      
      // 使用 Authing REST API 注册 - 使用正确的 v3 API
      const response = await fetch(`${config.domain}/api/v3/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-authing-app-id': config.appId,
        },
        body: JSON.stringify({
          connection: 'PASSCODE',
          passCodePayload: {
            phoneNumber: data.phone,
            phoneCountryCode: '+86',
            passCode: data.code,
          },
          profile: {
            username: data.username,
            ...data.profile,
          },
        }),
      });
      
      const result = await response.json();
      console.log('📝 注册响应:', result);
      
      if (response.ok && result.statusCode === 200) {
        console.log('✅ 注册成功:', result.data);
        // 保存 token 和用户信息
        if (result.data?.access_token) {
          localStorage.setItem('authing_token', result.data.access_token);
        }
        if (result.data?.id_token) {
          localStorage.setItem('authing_id_token', result.data.id_token);
        }
        return result.data;
      } else {
        console.error('❌ 注册失败:', result);
        throw new Error(result.message || '注册失败');
      }
    } catch (error: any) {
      console.error('❌ 注册失败:', error);
      throw new Error(error.message || '注册失败');
    }
  },

  /**
   * 登出
   */
  async logout() {
    try {
      const authing = getAuthing();
      localStorage.removeItem('authing_token');
      await authing.logoutWithRedirect();
    } catch (error) {
      console.error('登出失败:', error);
      localStorage.removeItem('authing_token');
    }
  },

  /**
   * 获取用户 Token
   */
  async getAccessToken() {
    try {
      const token = localStorage.getItem('authing_token');
      if (token) return token;
      
      const authing = getAuthing();
      const loginState = await authing.getLoginState();
      return loginState?.accessToken || null;
    } catch (error) {
      console.error('获取Token失败:', error);
      return null;
    }
  },

  /**
   * 检查登录状态
   */
  async checkLoginStatus() {
    try {
      const token = localStorage.getItem('authing_token');
      if (token) return true;
      
      const authing = getAuthing();
      const loginState = await authing.getLoginState();
      return !!loginState;
    } catch (error) {
      console.error('检查登录状态失败:', error);
      return false;
    }
  },
};
