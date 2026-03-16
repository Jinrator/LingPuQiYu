import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ViewMode } from '../types';
import ProtectedRoute from '../components/router/ProtectedRoute';

const AppLayout = React.lazy(() => import('../components/layout/AppLayout'));
const FreeLabPage = React.lazy(() => import('../pages/FreeLab'));
const AdventurePage = React.lazy(() => import('../pages/Adventure'));
const StagePage = React.lazy(() => import('../pages/Stage'));
const ProfilePage = React.lazy(() => import('../pages/Profile'));
const LoginPage = React.lazy(() => import('../pages/Login'));
const NotFoundPage = React.lazy(() => import('../pages/NotFound'));
const SettingsPage = React.lazy(() => import('../pages/Settings'));

const RouteFallback: React.FC = () => (
  <div className="h-screen w-full flex items-center justify-center bg-[#F5F7FA]">
    <p className="text-sm font-medium text-slate-400">Loading...</p>
  </div>
);

const withRouteSuspense = (element: React.ReactElement) => (
  <React.Suspense fallback={<RouteFallback />}>
    {element}
  </React.Suspense>
);

// 路由配置 - 支持多层级嵌套
export const routes = [
  {
    path: '/',
    element: withRouteSuspense(<AppLayout />),
    children: [
      {
        path: '',
        element: <Navigate to="/lab" replace />
      },
      {
        path: 'login',
        element: withRouteSuspense(<LoginPage />)
      },
      {
        path: 'lab',
        element: (
          <ProtectedRoute>
            {withRouteSuspense(<FreeLabPage />)}
          </ProtectedRoute>
        ),
        children: []
      },
      {
        path: 'adventure',
        element: (
          <ProtectedRoute>
            {withRouteSuspense(<AdventurePage />)}
          </ProtectedRoute>
        ),
        children: [
          // 冒险模式子页面
          {
            path: 'level/:levelId',
            element: (
              <ProtectedRoute>
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-6xl mb-4">🏆</div>
                    <h2 className="text-2xl font-bold mb-2">关卡 {window.location.pathname.split('/').pop()}</h2>
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
                    <h2 className="text-2xl font-bold mb-2">世界 {window.location.pathname.split('/').pop()}</h2>
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
                        <h2 className="text-2xl font-bold mb-2">舞台 {window.location.pathname.split('/').pop()}</h2>
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
        element: (
          <ProtectedRoute>
            {withRouteSuspense(<StagePage />)}
          </ProtectedRoute>
        ),
        children: [
          // 舞台模式子页面
          {
            path: 'performance/:id',
            element: (
              <ProtectedRoute>
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-6xl mb-4">🎪</div>
                    <h2 className="text-2xl font-bold mb-2">演出 {window.location.pathname.split('/').pop()}</h2>
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
        element: (
          <ProtectedRoute>
            {withRouteSuspense(<ProfilePage />)}
          </ProtectedRoute>
        ),
        children: [
          // 用户档案子页面
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
        element: (
          <ProtectedRoute>
            {withRouteSuspense(<SettingsPage />)}
          </ProtectedRoute>
        )
      },
      {
        path: '*',
        element: withRouteSuspense(<NotFoundPage />)
      }
    ]
  }
];

// 扩展的路径到 ViewMode 映射，支持多层级
export const pathToViewMode: Record<string, ViewMode> = {
  '/lab': ViewMode.FREE_LAB,
  '/adventure': ViewMode.ADVENTURE,
  '/stage': ViewMode.STAGE,
  '/profile': ViewMode.USER_PROFILE
};

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
  [ViewMode.USER_PROFILE]: '/profile'
};

export const router = createBrowserRouter(routes);