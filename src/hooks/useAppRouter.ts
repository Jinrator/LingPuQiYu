import { useNavigate, useLocation } from 'react-router-dom';
import { ViewMode } from '../types';
import { viewModeToPath, getViewModeFromPath } from '../router';

export const useAppRouter = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // 获取当前视图模式（支持多层级）
  const currentView = getViewModeFromPath(location.pathname);

  // 导航到指定视图
  const navigateToView = (view: ViewMode) => {
    const path = viewModeToPath[view];
    navigate(path);
  };

  // 导航到指定路径
  const navigateToPath = (path: string) => {
    navigate(path);
  };

  // 后退
  const goBack = () => {
    navigate(-1);
  };

  // 前进
  const goForward = () => {
    navigate(1);
  };

  // 替换当前路由
  const replace = (path: string) => {
    navigate(path, { replace: true });
  };

  // 获取路径层级信息
  const getPathSegments = () => {
    return location.pathname.split('/').filter(Boolean);
  };

  // 获取父级路径
  const getParentPath = () => {
    const segments = getPathSegments();
    if (segments.length <= 1) return '/';
    return '/' + segments.slice(0, -1).join('/');
  };

  // 导航到父级路径
  const goToParent = () => {
    const parentPath = getParentPath();
    navigate(parentPath);
  };

  return {
    currentView,
    currentPath: location.pathname,
    navigateToView,
    navigateToPath,
    goBack,
    goForward,
    replace,
    location,
    getPathSegments,
    getParentPath,
    goToParent
  };
};

export default useAppRouter;