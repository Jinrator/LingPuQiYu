
import React, { useState, useEffect } from 'react';
import { User, Phone, ArrowRight, CheckCircle2, Orbit, Sparkles, Atom, Smartphone, ShieldCheck, MessageCircle, Loader2, Lock, QrCode, KeyRound, ArrowLeftRight } from 'lucide-react';

interface AuthPageProps {
  onLogin: () => void;
  theme: 'light' | 'dark';
}

type AuthMode = 'login' | 'register';
type LoginMethod = 'wechat' | 'phone';
type CourseType = 'PRODUCER' | 'ARTIST' | 'MAKER';

const AuthPage: React.FC<AuthPageProps> = ({ onLogin, theme }) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('phone'); // 默认改为手机登录
  const [course, setCourse] = useState<CourseType | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [vCode, setVCode] = useState('');
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const isDark = theme === 'dark';

  const courses = [
    { id: 'PRODUCER' as CourseType, title: 'AI数智作曲家', desc: 'AI与算法编曲', icon: Orbit, color: 'from-blue-500 to-indigo-600' },
    { id: 'ARTIST' as CourseType, title: '音乐装置艺术家', desc: '声场与交互艺术', icon: Sparkles, color: 'from-cyan-400 to-blue-500' },
    { id: 'MAKER' as CourseType, title: '智创乐器家', desc: '软硬件乐器开发', icon: Atom, color: 'from-blue-600 to-sky-400' },
  ];

  useEffect(() => {
    let timer: number;
    if (countdown > 0) {
      timer = window.setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const handleAction = () => {
    setIsAuthorizing(true);
    setTimeout(() => {
      setIsAuthorizing(false);
      onLogin();
    }, 1200);
  };

  const getVCode = () => {
    if (phone.length === 11) {
      setCountdown(60);
      // 模拟发送验证码
    }
  };

  return (
    <div className={`fixed inset-0 z-[200] flex items-center justify-center p-4 transition-colors duration-1000 ${isDark ? 'bg-[#000b1a]' : 'bg-[#f0f4f8]'}`}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-[-15%] right-[-5%] w-[60%] h-[60%] rounded-full blur-[140px] transition-all duration-1000 ${isDark ? 'bg-blue-600/15' : 'bg-blue-200/50'}`}></div>
        <div className={`absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full blur-[120px] transition-all duration-1000 ${isDark ? 'bg-indigo-500/10' : 'bg-sky-100/60'}`}></div>
      </div>

      <div className={`w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 rounded-[3.5rem] overflow-hidden shadow-[0_40px_100px_-20px_rgba(0,0,0,0.2)] border transition-all duration-700 ${isDark ? 'bg-slate-900/90 border-white/5' : 'bg-white/95 border-blue-100/50 backdrop-blur-xl'}`}>
        <div className="relative p-12 flex flex-col justify-between bg-gradient-to-br from-[#0052cc] via-[#0072ff] to-[#00b4ff] text-white overflow-hidden">
          <div className="relative z-10">
             <div className="w-16 h-16 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center mb-8 border border-white/30 transform rotate-[-5deg] shadow-xl">
                <svg viewBox="0 0 100 100" className="w-10 h-10 text-white fill-current">
                  <path d="M20,40 Q20,20 50,20 Q80,20 80,40 L80,50 Q80,60 70,60 L40,60 L40,45 L65,45 L65,50 L35,50 L35,70 Q35,85 65,85 Q95,85 95,60" fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round"/>
                </svg>
             </div>
             <h2 className="text-5xl font-fredoka mb-4 tracking-tight drop-shadow-lg">生音科技</h2>
             <div className="space-y-4">
                <p className="text-blue-50 text-xl font-bold leading-relaxed opacity-95">
                  每一个孩子都可以在音乐中快乐成长，<br/>成为自己人生的的建筑师。
                </p>
                <p className="text-blue-100/60 text-sm font-medium leading-relaxed">
                  多端同步灵感，开启你的星系实验室。
                </p>
             </div>
          </div>

          <div className="relative z-10 mt-12 pt-8 border-t border-white/10">
             <div className="flex -space-x-2 mb-4">
                {[1,2,3,4].map(i => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-[#0072ff] bg-slate-200 overflow-hidden shadow-md transform hover:-translate-y-1 transition-transform">
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i + 60}`} alt="avatar" />
                  </div>
                ))}
             </div>
             <div className="flex items-center gap-2 text-blue-100/60 text-[10px] font-black uppercase tracking-widest">
                <CheckCircle2 size={14} className="text-emerald-300" />
                <span>12,500+ 位音乐人已入驻</span>
             </div>
          </div>

          <div className="absolute top-[-20%] left-[-20%] w-80 h-80 bg-white/5 rounded-full blur-[80px]"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-48 h-48 bg-cyan-400/20 rounded-full blur-[60px]"></div>
        </div>

       
        <div className="p-10 flex flex-col justify-center relative bg-white/40 overflow-y-auto max-h-[85vh] scrollbar-hide">
          <div className="mb-6 flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <h3 className={`text-3xl font-fredoka tracking-tight transition-colors ${isDark ? 'text-white' : 'text-blue-950'}`}>
                {mode === 'login' ? '授权登录' : '申请入驻'}
              </h3>
              <button 
                onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                className="text-blue-600 font-black text-[11px] hover:text-blue-700 transition-colors flex items-center gap-1.5 group uppercase tracking-wider"
              >
                {mode === 'login' ? '去申请' : '已有通行证'}
                <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          <div className="space-y-6 relative z-10">
            {mode === 'login' && (
              <div className="space-y-6 animate-in fade-in duration-500">
                
                <div className={`flex p-1.5 rounded-2xl transition-colors ${isDark ? 'bg-white/5' : 'bg-slate-100/50'}`}>
                  <button 
                    onClick={() => setLoginMethod('phone')}
                    className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${loginMethod === 'phone' ? 'bg-white text-blue-600 shadow-md' : 'text-slate-400'}`}
                  >
                    <Smartphone size={14} />
                    手机登录
                  </button>
                  <button 
                    onClick={() => setLoginMethod('wechat')}
                    className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${loginMethod === 'wechat' ? 'bg-white text-blue-600 shadow-md' : 'text-slate-400'}`}
                  >
                    <MessageCircle size={14} fill={loginMethod === 'wechat' ? "currentColor" : "none"} />
                    微信扫码
                  </button>
                </div>

                {loginMethod === 'wechat' ? (
                  <div className="flex flex-col items-center gap-6 py-4 animate-in zoom-in-95 duration-300">
                    <div className={`relative w-48 h-48 p-4 rounded-[2.5rem] border-4 flex items-center justify-center bg-white shadow-2xl overflow-hidden group transition-all hover:scale-105 ${isDark ? 'border-white/10' : 'border-blue-50'}`}>
                      <QrCode size={140} className="text-slate-800" />
                     
                      <div className="absolute top-0 left-0 w-full h-1 bg-blue-500/40 shadow-[0_0_15px_rgba(59,130,246,0.8)] animate-[scan_3s_linear_infinite]" />
                      <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <p className={`text-[10px] font-black uppercase tracking-[0.3em] text-center ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                      请使用微信“扫一扫”<br/>安全登录实验室
                    </p>
                    <div className={`w-full h-[1px] ${isDark ? 'bg-white/5' : 'bg-slate-100'}`} />
                    <button 
                      onClick={handleAction}
                      className="text-[11px] font-black text-blue-600 hover:text-blue-500 flex items-center gap-2 uppercase tracking-widest"
                    >
                      <ArrowLeftRight size={12} />
                      或使用微信一键登录
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4 py-2 animate-in slide-in-from-left-4 duration-300">
                    <div className="relative group">
                      <div className={`absolute left-5 top-1/2 -translate-y-1/2 transition-colors ${isDark ? 'text-slate-600 group-focus-within:text-blue-500' : 'text-slate-300 group-focus-within:text-blue-600'}`}>
                        <Smartphone size={18} />
                      </div>
                      <input 
                        type="tel"
                        placeholder="请输入手机号"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                        className={`w-full pl-12 pr-6 py-4 rounded-2xl border transition-all outline-none font-bold text-sm
                          ${isDark ? 'bg-white/5 border-white/10 text-white focus:ring-4 ring-blue-500/20' : 'bg-slate-50 border-slate-100 text-blue-950 focus:bg-white focus:ring-4 ring-blue-500/10 focus:border-blue-200'}`}
                      />
                    </div>
                    <div className="relative group flex gap-3">
                      <div className="relative flex-1">
                        <div className={`absolute left-5 top-1/2 -translate-y-1/2 transition-colors ${isDark ? 'text-slate-600 group-focus-within:text-blue-500' : 'text-slate-300 group-focus-within:text-blue-600'}`}>
                          <KeyRound size={18} />
                        </div>
                        <input 
                          type="text"
                          placeholder="动态验证码"
                          value={vCode}
                          onChange={(e) => setVCode(e.target.value.slice(0, 6))}
                          className={`w-full pl-12 pr-6 py-4 rounded-2xl border transition-all outline-none font-bold text-sm
                            ${isDark ? 'bg-white/5 border-white/10 text-white focus:ring-4 ring-blue-500/20' : 'bg-slate-50 border-slate-100 text-blue-950 focus:bg-white focus:ring-4 ring-blue-500/10 focus:border-blue-200'}`}
                        />
                      </div>
                      <button 
                        disabled={countdown > 0 || phone.length !== 11}
                        onClick={getVCode}
                        className={`px-6 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${countdown > 0 || phone.length !== 11 ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-blue-600 text-white shadow-lg hover:bg-blue-500 active:scale-95'}`}
                      >
                        {countdown > 0 ? `${countdown}s` : '获取验证码'}
                      </button>
                    </div>
                    <button
                      onClick={handleAction}
                      disabled={isAuthorizing || phone.length !== 11 || vCode.length < 4}
                      className={`
                        group relative w-full py-5 bg-[#07C160] text-white rounded-[1.8rem] font-black text-lg mt-4
                        hover:scale-[1.01] active:scale-95 transition-all shadow-lg 
                        flex items-center justify-center gap-3 overflow-hidden
                        ${isAuthorizing || phone.length !== 11 || vCode.length < 4 ? 'opacity-50 cursor-not-allowed grayscale' : ''}
                      `}
                    >
                      {isAuthorizing ? <Loader2 size={22} className="animate-spin" /> : <><CheckCircle2 size={20} /> 进入实验室</>}
                    </button>
                  </div>
                )}
              </div>
            )}

            {mode === 'register' && (
              <div className="animate-in slide-in-from-top-4 duration-500 space-y-6">
                <div className="space-y-4">
                  <label className={`block text-[9px] font-black uppercase tracking-[0.3em] ml-2 ${isDark ? 'text-slate-600' : 'text-blue-400/70'}`}>
                    实验室研究方向 (单选)
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {courses.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setCourse(c.id)}
                        className={`flex flex-col items-center p-4 rounded-3xl border-2 transition-all group text-center
                          ${course === c.id 
                            ? 'border-blue-500 bg-blue-600/5 shadow-lg ring-4 ring-blue-500/10' 
                            : isDark ? 'border-white/5 bg-white/5 hover:border-white/20' : 'border-slate-100 bg-slate-50/50 hover:border-blue-100 hover:bg-white'}`}
                      >
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${c.color} flex items-center justify-center text-white shadow-md mb-2 group-hover:rotate-6 transition-transform`}>
                          <c.icon size={20} />
                        </div>
                        <span className={`font-black text-[10px] leading-tight ${isDark ? 'text-white' : 'text-blue-900'}`}>{c.title}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="relative group animate-in slide-in-from-top-3 duration-500">
                    <div className={`absolute left-5 top-1/2 -translate-y-1/2 transition-colors ${isDark ? 'text-slate-600 group-focus-within:text-blue-500' : 'text-slate-300 group-focus-within:text-blue-600'}`}>
                      <User size={18} />
                    </div>
                    <input 
                      type="text" 
                      placeholder="实验室代号 / 真实姓名"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className={`w-full pl-12 pr-6 py-4 rounded-2xl border transition-all outline-none font-bold text-sm
                        ${isDark ? 'bg-white/5 border-white/10 text-white focus:ring-4 ring-blue-500/20' : 'bg-slate-50 border-slate-100 text-blue-950 focus:bg-white focus:ring-4 ring-blue-500/10 focus:border-blue-200'}`}
                    />
                  </div>

                  <div className="relative group animate-in slide-in-from-top-3 duration-500">
                    <div className={`absolute left-5 top-1/2 -translate-y-1/2 transition-colors ${isDark ? 'text-slate-600 group-focus-within:text-blue-500' : 'text-slate-300 group-focus-within:text-blue-600'}`}>
                      <Smartphone size={18} />
                    </div>
                    <input 
                      type="tel"
                      placeholder="绑定移动通讯号"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                      className={`w-full pl-12 pr-6 py-4 rounded-2xl border transition-all outline-none font-bold text-sm
                        ${isDark ? 'bg-white/5 border-white/10 text-white focus:ring-4 ring-blue-500/20' : 'bg-slate-50 border-slate-100 text-blue-950 focus:bg-white focus:ring-4 ring-blue-500/10 focus:border-blue-200'}`}
                    />
                  </div>
                </div>

                <button
                  onClick={handleAction}
                  disabled={isAuthorizing || (!course || !name || phone.length !== 11)}
                  className={`
                    group relative w-full py-5 bg-[#07C160] text-white rounded-[1.8rem] font-black text-lg 
                    hover:scale-[1.01] active:scale-95 transition-all shadow-lg 
                    flex items-center justify-center gap-3 overflow-hidden
                    ${isAuthorizing || (!course || !name || phone.length !== 11) ? 'opacity-50 cursor-not-allowed grayscale' : ''}
                  `}
                >
                  {isAuthorizing ? <Loader2 size={22} className="animate-spin" /> : <><CheckCircle2 size={20} /> 完成申请并入驻</>}
                </button>
              </div>
            )}
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100/50 flex flex-col items-center gap-4">
             <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-slate-400">
                <ShieldCheck size={12} className="text-[#07C160]" />
                <span>国密级安全加密连接</span>
             </div>
             <p className={`text-[9px] text-center font-medium leading-relaxed max-w-[240px] ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
               登录即表示你同意 
               <span className="text-blue-500 cursor-pointer hover:underline mx-1">服务协议</span> 
               和 
               <span className="text-blue-500 cursor-pointer hover:underline mx-1">隐私政策</span>
             </p>
          </div>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes scan {
          0% { top: 0; }
          50% { top: 100%; }
          100% { top: 0; }
        }
      `}} />
    </div>
  );
};

export default AuthPage;
