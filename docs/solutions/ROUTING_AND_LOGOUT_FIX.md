# 路由状态修复 & 退出登录功能完善方案

> **状态：✅ 已启用** — AuthContext 作为全局认证状态单一数据源，退出登录同时清除内存状态和 localStorage。

## 1. 问题描述

### 用户现象

- **路由状态丢失**：登录后刷新页面被踢回登录页，即使 localStorage 中仍有有效登录信息
- **退出登录不彻底**：点击退出后 localStorage 中的认证数据未被清除，刷新页面后出现"幽灵登录"
- **退出入口不便**：退出按钮仅存在于"我的档案"页面深处

### 业务影响

- 用户每次刷新都需要重新登录
- 退出后数据残留，存在安全隐患
- 退出操作路径过深

## 2. 根本原因分析

### 问题 1：双重认证状态不同步

`App.tsx` 使用独立的 `isLoggedIn` state，与 `useAuth()` hook 的 `isAuthenticated` 完全脱节：

```tsx
// App.tsx — 独立状态，刷新后重置为 false
const [isLoggedIn, setIsLoggedIn] = useState(false);

// AuthPage.tsx — 通过 useAuth() 读取 localStorage
const { isAuthenticated } = useAuth();
```

### 问题 2：多实例 Hook 状态隔离

`useAuth()` 在 `App.tsx` 和 `AuthPage.tsx` 中各自调用，创建了两个独立的状态实例，互不影响。

### 问题 3：退出登录未清除持久化数据

```tsx
const handleLogout = () => {
  setIsLoggedIn(false);  // ✅ 内存状态清除
  // ❌ 没有调用 authService.logout() 清除 localStorage
};
```

## 3. 解决方案

### 核心思路

1. 创建 `AuthContext` 作为全局认证状态的单一数据源
2. `App.tsx` 直接读取 context 中的 `isAuthenticated`，不再维护独立的 `isLoggedIn`
3. `handleLogout` 调用 `authService.logout()` 清除 localStorage 并吊销服务端 refresh token

### 架构变更

```
修复前：
  App.tsx (isLoggedIn state)  ←→  AuthPage (onLogin callback)
  useAuth() 实例 A                useAuth() 实例 B
  状态不同步 ❌

修复后：
  AuthProvider (全局 Context)
    ├── AppLayout.tsx  →  useAuth() → 读取共享状态 ✅
    └── AuthPage.tsx   →  useAuth() → 读取共享状态 ✅
```

## 4. 关键代码实现

### 4.1 `src/contexts/AuthContext.tsx`

```tsx
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // 初始化：调用 /api/auth/me 验证 session 有效性
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
        if (isMounted) setIsLoading(false);
      }
    };
    void hydrateAuth();
    return () => { isMounted = false; };
  }, []);

  const logout = useCallback(() => {
    authService.logout();  // 清除 localStorage + 吊销服务端 refresh token
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  // ... loginWithPhone, loginWithPassword, register, sendSmsCode 等方法
};
```

注意：初始化时 `isLoading` 默认为 `true`，确保在验证完成前不会闪烁登录页。`getCurrentUser()` 内部会调用 `/api/auth/me` 验证 token 有效性，如果 access token 过期会自动触发 refresh。

### 4.2 `src/components/layout/AppLayout.tsx` — 使用共享 auth 状态

```tsx
const AppLayout: React.FC = () => {
  const { isAuthenticated, isLoading, logout, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated && location.pathname !== '/login') {
      navigate('/login', { replace: true });
    } else if (isAuthenticated && location.pathname === '/login') {
      navigate('/lab', { replace: true });
    }
  }, [isAuthenticated, isLoading, location.pathname, navigate]);

  const handleLogout = () => {
    logout();                                    // 清除 localStorage + context 状态
    sessionStorage.removeItem(AUDIO_INIT_KEY);   // 清除音频初始化标记
    navigate('/login', { replace: true });
  };
  // ...
};
```

### 4.3 `authService.logout()` — 完整清除

```typescript
async logout() {
  const session = readStoredSession();
  if (session?.token && session?.refreshToken) {
    try {
      await fetch(buildUrl('/api/auth/logout'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.token}`,
        },
        body: JSON.stringify({ refreshToken: session.refreshToken }),
      });
    } catch {
      // 即使服务端吊销失败，本地也要清除
    }
  }
  clearStoredSession();  // localStorage.removeItem('shenyin_auth')
},
```

## 5. 测试验证

### 登录持久化

1. 手机号验证码登录成功
2. 刷新页面（F5 / Cmd+R）
3. ✅ 应直接进入主界面，不闪烁登录页

### 退出登录

1. 在应用内任意页面
2. 进入"我的档案"页面点击"退出登录"
3. ✅ 应立即跳转到登录页
4. 打开 DevTools → Application → Local Storage
5. ✅ `shenyin_auth` 键应已被删除
6. 刷新页面 → ✅ 应停留在登录页

## 6. 涉及文件

| 文件 | 说明 |
|------|------|
| `src/contexts/AuthContext.tsx` | 认证 Context（单一数据源） |
| `src/components/layout/AppLayout.tsx` | 主布局（使用共享 auth 状态 + 退出逻辑） |
| `src/services/authService.ts` | 认证服务（logout 清除 localStorage + 吊销 token） |
| `src/hooks/useAuth.ts` | Auth Hook（re-export from AuthContext） |

---

**修复日期**：2026-02-13
**修复人员**：Andy, Claude Opus 4.6
**问题严重程度**：高（核心功能 + 安全隐患）
**修复状态**：✅ 已完成并验证
