import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // 如果正在验证且本地没有 session，显示 spinner
  // 如果本地有 session（isAuthenticated 乐观为 true），直接渲染子组件
  if (isLoading && !isAuthenticated) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#F5F7FA]">
        <Loader2 size={22} className="animate-spin text-[#5BA4F5]" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
