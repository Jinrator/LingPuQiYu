import React from 'react';
import { useNavigate } from 'react-router-dom';

const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="h-full flex flex-col items-center justify-center text-center p-6">
      <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-[2.5rem] flex items-center justify-center mb-8 border border-white/20">
        <span className="text-6xl">🎵</span>
      </div>
      <h1 className="text-4xl font-fredoka mb-4 text-blue-900">页面未找到</h1>
      <p className="text-slate-600 mb-8 max-w-md">
        抱歉，您访问的页面不存在。让我们回到音乐的世界吧！
      </p>
      <button 
        onClick={() => navigate('/lab')}
        className="px-8 py-3 bg-blue-600 text-white rounded-2xl font-black text-lg hover:bg-blue-700 transition-all active:scale-95"
      >
        返回实验室
      </button>
    </div>
  );
};

export default NotFoundPage;