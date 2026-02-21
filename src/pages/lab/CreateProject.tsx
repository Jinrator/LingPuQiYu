import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useOutletContext } from 'react-router-dom';

interface OutletContext {
  theme: 'light' | 'dark';
}

const CreateProject: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useOutletContext<OutletContext>();

  return (
    <div className="h-full flex flex-col items-center justify-center p-6">
      <div className="max-w-2xl w-full text-center">
        <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl flex items-center justify-center mb-6 mx-auto">
          <span className="text-4xl">✨</span>
        </div>
        
        <h1 className={`text-3xl font-fredoka mb-4 ${theme === 'dark' ? 'text-white' : 'text-blue-900'}`}>
          创建新项目
        </h1>
        
        <p className={`text-lg mb-8 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
          选择你想要创建的项目类型
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className={`p-6 rounded-2xl border cursor-pointer transition-all hover:scale-105 ${theme === 'dark' ? 'bg-slate-800 border-slate-700 hover:border-blue-500' : 'bg-white border-slate-200 hover:border-blue-300'}`}>
            <div className="text-3xl mb-3">🎹</div>
            <h3 className="font-bold mb-2">钢琴作品</h3>
            <p className="text-sm opacity-70">创建钢琴演奏项目</p>
          </div>
          
          <div className={`p-6 rounded-2xl border cursor-pointer transition-all hover:scale-105 ${theme === 'dark' ? 'bg-slate-800 border-slate-700 hover:border-blue-500' : 'bg-white border-slate-200 hover:border-blue-300'}`}>
            <div className="text-3xl mb-3">🥁</div>
            <h3 className="font-bold mb-2">节拍制作</h3>
            <p className="text-sm opacity-70">创建鼓点节拍项目</p>
          </div>
        </div>
        
        <div className="flex gap-4 justify-center">
          <button 
            onClick={() => navigate('/lab')}
            className="px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all"
          >
            返回实验室
          </button>
          <button 
            onClick={() => navigate(-1)}
            className={`px-6 py-3 rounded-2xl font-bold transition-all ${theme === 'dark' ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-slate-200 text-slate-800 hover:bg-slate-300'}`}
          >
            后退
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateProject;