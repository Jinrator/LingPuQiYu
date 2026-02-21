import React from 'react';

interface ExitConfirmationProps {
  show: boolean;
  theme: 'light' | 'dark';
  onHide: () => void;
}

const ExitConfirmation: React.FC<ExitConfirmationProps> = ({ show, theme, onHide }) => {
  if (!show) return null;

  return (
    <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-[150] px-6 py-4 rounded-2xl border backdrop-blur-xl transition-all duration-300 ${theme === 'dark' ? 'bg-slate-800/90 border-slate-600 text-white' : 'bg-white/90 border-slate-200 text-slate-800'}`}>
      <div className="flex items-center gap-3">
        <span className="text-2xl">👋</span>
        <div>
          <div className="font-bold text-sm">确定要离开生音科技吗？</div>
          <div className="text-xs opacity-70 mt-1">再次点击后退按钮即可离开</div>
        </div>
        <button 
          onClick={onHide}
          className={`ml-2 w-6 h-6 rounded-full flex items-center justify-center text-xs hover:bg-black/10 transition-colors ${theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-black/10'}`}
        >
          ×
        </button>
      </div>
    </div>
  );
};

export default ExitConfirmation;