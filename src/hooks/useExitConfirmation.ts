import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

export const useExitConfirmation = () => {
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const location = useLocation();

  useEffect(() => {
    let isFirstBackAtRoot = true;

    const handlePopState = (event: PopStateEvent) => {
      // 只在根路径或入口页面时处理
      if (location.pathname === '/lab' || location.pathname === '/') {
        if (isFirstBackAtRoot) {
          // 第一次尝试退出，显示确认提示
          event.preventDefault();
          setShowExitConfirm(true);
          isFirstBackAtRoot = false;
          
          // 3秒后自动隐藏提示
          setTimeout(() => {
            setShowExitConfirm(false);
            isFirstBackAtRoot = true;
          }, 3000);
        }
        // 第二次尝试退出，允许离开
      }
    };

    window.addEventListener('popstate', handlePopState);
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [location.pathname]);

  return {
    showExitConfirm,
    hideExitConfirm: () => setShowExitConfirm(false)
  };
};