import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ViewMode } from '../types';
import ProtectedRoute from '../components/router/ProtectedRoute';
import ErrorBoundary from '../components/ui/ErrorBoundary';

/**
 * 带重试的 lazy import
 * chunk 加载失败时自动重试 2 次（指数退避），全部失败后抛出错误由 ErrorBoundary 捕获
 */
function lazyWithRetry(factory: () => Promise<{ default: React.ComponentType<any> }>, retries = 2) {
  return React.lazy(() => {
    const attempt = (remaining: number): Promise<{ default: React.ComponentType<any> }> =>
      factory().catch((err) => {
        if (remaining <= 0) throw err;
        return new Promise<{ default: React.ComponentType<any> }>((resolve) =>
          setTimeout(() => resolve(attempt(remaining - 1)), 1000 * (retries - remaining + 1)),
        );
      });
    return attempt(retries);
  });
}

const AppLayout = lazyWithRetry(() => import('../components/layout/AppLayout'));
const LandingPage = lazyWithRetry(() => import('../pages/Landing'));
const FreeLabPage = lazyWithRetry(() => import('../pages/FreeLab'));
const AdventurePage = lazyWithRetry(() => import('../pages/Adventure'));
const StagePage = lazyWithRetry(() => import('../pages/Stage'));
const ProfilePage = lazyWithRetry(() => import('../pages/Profile'));
const LoginPage = lazyWithRetry(() => import('../pages/Login'));
const NotFoundPage = lazyWithRetry(() => import('../pages/NotFound'));
const SettingsPage = lazyWithRetry(() => import('../pages/Settings'));
const AccountSettingsPage = lazyWithRetry(() => import('../pages/AccountSettings'));

import { Loader2 } from 'lucide-react';

const RouteFallback: React.FC = () => (
  <div className="h-screen w-full flex items-center justify-center bg-[#F5F7FA]">
    <Loader2 size={22} className="animate-spin text-[#5BA4F5]" />
  </div>
);

const withRouteSuspense = (element: React.ReactElement) => (
  <ErrorBoundary message="页面模块加载失败，请检查网络后重试。">
    <React.Suspense fallback={<RouteFallback />}>
      {element}
    </React.Suspense>
  </ErrorBoundary>
);

// 路由配置 - 支持多层级嵌套
export const routes = [
  // Landing page — public, no AppLayout wrapper
  {
    path: '/',
    element: withRouteSuspense(<LandingPage />),
  },
  // Login — public, no AppLayout wrapper
  {
    path: '/login',
    element: withRouteSuspense(<LoginPage />),
  },
  // App routes — wrapped in AppLayout, all protected
  {
    path: '/app',
    element: withRouteSuspense(<AppLayout />),
    children: [
      { path: '', element: <Navigate to="/app/lab" replace /> },
      {
        path: 'lab',
        element: <ProtectedRoute>{withRouteSuspense(<FreeLabPage />)}</ProtectedRoute>,
      },
      {
        path: 'adventure',
        element: <ProtectedRoute>{withRouteSuspense(<AdventurePage />)}</ProtectedRoute>,
        children: [
          {
            path: 'level/:levelId',
            element: (
              <ProtectedRoute>
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-6xl mb-4">🏆</div>
                    <h2 className="text-2xl font-bold mb-2">关卡</h2>
                    <p className="text-slate-600">冒险关卡详情页面</p>
                  </div>
                </div>
              </ProtectedRoute>
            )
          },
          {
            path: 'world/:worldId',
            element: (
              <ProtectedRoute>
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-6xl mb-4">🌍</div>
                    <h2 className="text-2xl font-bold mb-2">世界</h2>
                    <p className="text-slate-600">世界地图页面</p>
                  </div>
                </div>
              </ProtectedRoute>
            ),
            children: [
              {
                path: 'stage/:stageId',
                element: (
                  <ProtectedRoute>
                    <div className="h-full flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-6xl mb-4">🎭</div>
                        <h2 className="text-2xl font-bold mb-2">舞台</h2>
                        <p className="text-slate-600">三级嵌套页面示例</p>
                      </div>
                    </div>
                  </ProtectedRoute>
                )
              }
            ]
          }
        ]
      },
      {
        path: 'stage',
        element: <ProtectedRoute>{withRouteSuspense(<StagePage />)}</ProtectedRoute>,
        children: [
          {
            path: 'performance/:id',
            element: (
              <ProtectedRoute>
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-6xl mb-4">🎪</div>
                    <h2 className="text-2xl font-bold mb-2">演出</h2>
                    <p className="text-slate-600">演出详情页面</p>
                  </div>
                </div>
              </ProtectedRoute>
            )
          },
          {
            path: 'rehearsal',
            element: (
              <ProtectedRoute>
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-6xl mb-4">🎬</div>
                    <h2 className="text-2xl font-bold mb-2">排练模式</h2>
                    <p className="text-slate-600">排练页面</p>
                  </div>
                </div>
              </ProtectedRoute>
            )
          }
        ]
      },
      {
        path: 'profile',
        element: <ProtectedRoute>{withRouteSuspense(<ProfilePage />)}</ProtectedRoute>,
        children: [
          {
            path: 'settings',
            element: (
              <ProtectedRoute>
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-6xl mb-4">⚙️</div>
                    <h2 className="text-2xl font-bold mb-2">用户设置</h2>
                    <p className="text-slate-600">设置页面</p>
                  </div>
                </div>
              </ProtectedRoute>
            ),
            children: [
              {
                path: 'account',
                element: (
                  <ProtectedRoute>
                    <div className="h-full flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-6xl mb-4">👤</div>
                        <h2 className="text-2xl font-bold mb-2">账户设置</h2>
                        <p className="text-slate-600">三级嵌套：账户管理</p>
                      </div>
                    </div>
                  </ProtectedRoute>
                )
              },
              {
                path: 'privacy',
                element: (
                  <ProtectedRoute>
                    <div className="h-full flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-6xl mb-4">🔒</div>
                        <h2 className="text-2xl font-bold mb-2">隐私设置</h2>
                        <p className="text-slate-600">三级嵌套：隐私管理</p>
                      </div>
                    </div>
                  </ProtectedRoute>
                )
              }
            ]
          },
          {
            path: 'achievements',
            element: (
              <ProtectedRoute>
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-6xl mb-4">🏅</div>
                    <h2 className="text-2xl font-bold mb-2">成就系统</h2>
                    <p className="text-slate-600">成就页面</p>
                  </div>
                </div>
              </ProtectedRoute>
            )
          },
          {
            path: 'history',
            element: (
              <ProtectedRoute>
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-6xl mb-4">📚</div>
                    <h2 className="text-2xl font-bold mb-2">学习历史</h2>
                    <p className="text-slate-600">历史记录页面</p>
                  </div>
                </div>
              </ProtectedRoute>
            )
          }
        ]
      },
      {
        path: 'settings',
        element: <ProtectedRoute>{withRouteSuspense(<SettingsPage />)}</ProtectedRoute>,
      },
      {
        path: 'settings/account',
        element: <ProtectedRoute>{withRouteSuspense(<AccountSettingsPage />)}</ProtectedRoute>,
      },
      {
        path: '*',
        element: withRouteSuspense(<NotFoundPage />)
      }
    ]
  },
  // Global 404
  {
    path: '*',
    element: withRouteSuspense(<NotFoundPage />)
  }
];

// 扩展的路径到 ViewMode 映射，支持多层级
export const pathToViewMode: Record<string, ViewMode> = {
  '/app/lab': ViewMode.FREE_LAB,
  '/app/adventure': ViewMode.ADVENTURE,
  '/app/stage': ViewMode.STAGE,
  '/app/profile': ViewMode.USER_PROFILE
};

// 根据路径获取主视图模式（忽略子路径）
export const getViewModeFromPath = (pathname: string): ViewMode => {
  const segments = pathname.split('/').filter(Boolean);
  // segments[0] is 'app', segments[1] is the actual page
  const mainPath = segments.length >= 2 ? `/${segments[0]}/${segments[1]}` : '/app/lab';
  return pathToViewMode[mainPath] || ViewMode.FREE_LAB;
};

// ViewMode 到路径的映射
export const viewModeToPath: Record<ViewMode, string> = {
  [ViewMode.FREE_LAB]: '/app/lab',
  [ViewMode.ADVENTURE]: '/app/adventure',
  [ViewMode.STAGE]: '/app/stage',
  [ViewMode.USER_PROFILE]: '/app/profile'
};

export const router = createBrowserRouter(routes);
