import React from 'react';
import { useOutletContext, Outlet, useLocation, useNavigate } from 'react-router-dom';
import FreeLab from '../components/modes/FreeLab';

interface OutletContext {
  theme: 'light' | 'dark';
}

const FreeLabPage: React.FC = () => {
  const { theme } = useOutletContext<OutletContext>();
  const location = useLocation();
  const navigate = useNavigate();

  // 如果是子路由，显示子路由内容
  if (location.pathname !== '/lab') {
    return (
      <div className="h-full">
        <Outlet context={{ theme }} />
      </div>
    );
  }

  // 主实验室页面，添加一些导航链接作为示例
  return (
    <div className="h-full relative">
      <FreeLab theme={theme} />
      
      {/* 示例：添加一些快速导航按钮 */}
      <div className="absolute top-4 right-4 flex gap-2">
        <button 
          onClick={() => navigate('/lab/create')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${theme === 'dark' ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-blue-100 text-blue-800 hover:bg-blue-200'}`}
        >
          创建项目
        </button>
        <button 
          onClick={() => navigate('/lab/project/demo-123')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${theme === 'dark' ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-blue-100 text-blue-800 hover:bg-blue-200'}`}
        >
          示例项目
        </button>
      </div>
    </div>
  );
};

export default FreeLabPage;