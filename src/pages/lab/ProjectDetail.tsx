import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useOutletContext } from 'react-router-dom';

interface OutletContext {
  theme: 'light' | 'dark';
}

const ProjectDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { theme } = useOutletContext<OutletContext>();

  return (
    <div className="h-full flex flex-col items-center justify-center p-6">
      <div className="max-w-2xl w-full text-center">
        <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center mb-6 mx-auto">
          <span className="text-4xl">🎼</span>
        </div>
        
        <h1 className={`text-3xl font-fredoka mb-4 ${theme === 'dark' ? 'text-white' : 'text-blue-900'}`}>
          项目详情
        </h1>
        
        <p className={`text-lg mb-6 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
          项目 ID: <span className="font-mono bg-blue-100 px-2 py-1 rounded text-blue-800">{id}</span>
        </p>
        
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

export default ProjectDetail;