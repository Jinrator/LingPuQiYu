# React Router 迁移方案

> **状态：✅ 已启用** — 项目已从 ViewMode 状态管理迁移到 React Router DOM v7，支持嵌套路由、路由守卫和懒加载。

## 1. 问题描述

### 原有架构的问题

项目最初使用自定义的 ViewMode 状态管理来控制页面切换：

1. **URL 不同步**：所有页面共享同一个 URL，无法支持深度链接
2. **浏览器导航异常**：后退/前进按钮需要复杂的 `popstate` 事件拦截
3. **刷新丢失状态**：刷新页面可能回到默认视图
4. **不支持嵌套路由**：只能在同级页面间跳转

### 业务影响

- 用户无法分享特定页面的链接
- 浏览器后退按钮行为不符合预期
- 开发和维护成本高

## 2. 解决方案

### 核心思路

从状态驱动的页面切换迁移到 URL 驱动的路由系统：

```
原有架构：ViewMode State → 条件渲染 → 页面显示
新架构：  URL → React Router → 页面组件 → 状态同步
```

### 技术选型

- React Router DOM v7（`react-router-dom@^7.13.0`）
- `createBrowserRouter` + 嵌套路由
- `React.lazy` + `Suspense` 懒加载
- `ProtectedRoute` 路由守卫

## 3. 关键代码实现

### 3.1 路由配置（`src/router/index.tsx`）

```tsx
import { createBrowserRouter, Navigate } from 'react-router-dom';
import ProtectedRoute from '../components/router/ProtectedRoute';

const AppLayout = React.lazy(() => import('../components/layout/AppLayout'));
const FreeLabPage = React.lazy(() => import('../pages/FreeLab'));
const AdventurePage = React.lazy(() => import('../pages/Adventure'));
const StagePage = React.lazy(() => import('../pages/Stage'));
const ProfilePage = React.lazy(() => import('../pages/Profile'));
const LoginPage = React.lazy(() => import('../pages/Login'));
const SettingsPage = React.lazy(() => import('../pages/Settings'));
const NotFoundPage = React.lazy(() => import('../pages/NotFound'));

export const routes = [
  {
    path: '/',
    element: withRouteSuspense(<AppLayout />),
    children: [
      { path: '', element: <Navigate to="/lab" replace /> },
      { path: 'login', element: withRouteSuspense(<LoginPage />) },
      {
        path: 'lab',
        element: <ProtectedRoute>{withRouteSuspense(<FreeLabPage />)}</ProtectedRoute>,
      },
      {
        path: 'adventure',
        element: <ProtectedRoute>{withRouteSuspense(<AdventurePage />)}</ProtectedRoute>,
      },
      // ... stage, profile, settings
      { path: '*', element: withRouteSuspense(<NotFoundPage />) },
    ],
  },
];

export const router = createBrowserRouter(routes);
```

### 3.2 路由守卫（`src/components/router/ProtectedRoute.tsx`）

```tsx
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
```

### 3.3 主布局（`src/components/layout/AppLayout.tsx`）

AppLayout 作为根路由组件，负责：
- 根据 `isAuthenticated` 和 `isLoading` 状态决定渲染登录页还是主界面
- 未认证时重定向到 `/login`，已认证时从 `/login` 重定向到 `/lab`
- 渲染桌面端浮岛导航栏 + 移动端顶部栏/底部导航栏
- 通过 `<Outlet />` 渲染子路由

```tsx
const AppLayout: React.FC = () => {
  const { isAuthenticated, isLoading, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const currentView = getViewModeFromPath(location.pathname);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated && location.pathname !== '/login') {
      navigate('/login', { replace: true });
    } else if (isAuthenticated && location.pathname === '/login') {
      navigate('/lab', { replace: true });
    }
  }, [isAuthenticated, isLoading, location.pathname, navigate]);

  // 已认证：渲染导航 + <Outlet />
  // 未认证：只渲染 <Outlet /> (登录页)
};
```

### 3.4 路径工具（`src/hooks/useAppRouter.ts`）

```typescript
// 根据路径获取主视图模式（忽略子路径）
export const getViewModeFromPath = (pathname: string): ViewMode => {
  const segments = pathname.split('/').filter(Boolean);
  const mainPath = segments.length > 0 ? `/${segments[0]}` : '/lab';
  return pathToViewMode[mainPath] || ViewMode.FREE_LAB;
};

// ViewMode 到路径的映射
export const viewModeToPath: Record<ViewMode, string> = {
  [ViewMode.FREE_LAB]: '/lab',
  [ViewMode.ADVENTURE]: '/adventure',
  [ViewMode.STAGE]: '/stage',
  [ViewMode.USER_PROFILE]: '/profile',
};
```

### 3.5 应用入口（`src/index.tsx`）

```tsx
import { RouterProvider } from 'react-router-dom';
import { router } from './router';

root.render(
  <React.StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>
);
```

## 4. 页面目录结构

```
src/pages/
├── FreeLab.tsx       # /lab
├── Adventure.tsx     # /adventure
├── Stage.tsx         # /stage
├── Profile.tsx       # /profile
├── Login.tsx         # /login
├── Settings.tsx      # /settings
└── NotFound.tsx      # 404
```

## 5. 测试验证

| 测试场景 | 预期结果 |
|---------|---------|
| 直接访问 `/lab` | 已登录显示页面，未登录重定向到 `/login` |
| 未登录访问受保护页面 | 重定向到登录页 |
| 登录成功后 | 自动跳转到 `/lab` |
| 浏览器后退按钮 | 返回上一个页面 |
| 刷新深层页面 | 保持在当前页面 |
| 访问不存在的路径 | 显示 404 页面 |

## 6. 涉及文件

| 文件 | 说明 |
|------|------|
| `src/router/index.tsx` | 路由配置（createBrowserRouter） |
| `src/components/router/ProtectedRoute.tsx` | 路由守卫 |
| `src/components/layout/AppLayout.tsx` | 主布局（导航 + Outlet） |
| `src/hooks/useAppRouter.ts` | 路径工具（ViewMode ↔ path） |
| `src/pages/*.tsx` | 页面组件 |
| `src/index.tsx` | 应用入口（RouterProvider） |
| `package.json` | `react-router-dom@^7.13.0` |

---

**迁移完成日期**：2026-02-21
**负责人**：开发团队
**影响范围**：全应用路由系统
**迁移状态**：✅ 已完成并验证
