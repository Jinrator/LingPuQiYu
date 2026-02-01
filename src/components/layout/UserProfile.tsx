
import React, { useState } from 'react';
import { User, Award, Music, Heart, Settings, ShieldCheck, MapPin, Sparkles, Orbit, Atom, ArrowRight, Share2, Disc, Star, LogOut, UserCircle2, X, AlertTriangle } from 'lucide-react';

interface UserProfileProps {
  theme: 'light' | 'dark';
  onLogout: () => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ theme, onLogout }) => {
  const [showExitConfirm, setShowExitConfirm] = useState<'logout' | 'switch' | null>(null);
  const isDark = theme === 'dark';

  // Mock Data
  const userData = {
    name: "未来制作人 · 小音",
    id: "PRO-9527",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=JinBot",
    level: 12,
    exp: 85,
    joinedDate: "2024-05-20",
    stats: {
      works: 8,
      likes: 1250,
      awards: 4
    }
  };

  const myCourses = [
    { id: 'PRODUCER', title: 'AI数智作曲家', progress: 75, color: 'from-blue-500 to-indigo-600', icon: Orbit },
    { id: 'ARTIST', title: '音乐装置艺术家', progress: 30, color: 'from-cyan-400 to-blue-500', icon: Sparkles },
    { id: 'MAKER', title: '智创乐器家', progress: 10, color: 'from-blue-600 to-sky-400', icon: Atom },
  ];

  const myWorks = [
    { id: '1', title: '赛博萤火虫', style: '电子', likes: 342, date: '3天前', icon: '🐝' },
    { id: '2', title: '云端漫步', style: '爵士', likes: 128, date: '1周前', icon: '☁️' },
    { id: '3', title: '齿轮华尔兹', style: '古典', likes: 56, date: '2周前', icon: '⚙️' },
  ];

  const handleConfirmExit = () => {
    onLogout();
    setShowExitConfirm(null);
  };

  return (
    <div className={`h-full overflow-y-auto scrollbar-hide animate-in fade-in slide-in-from-bottom-4 duration-700 p-8 lg:p-12 ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
      <div className="max-w-6xl mx-auto space-y-10">
        
        {/* 顶部个人名片 */}
        <div className={`relative rounded-[4rem] p-10 border transition-all duration-500 overflow-hidden shadow-sm ${isDark ? 'bg-slate-900/60 border-white/5' : 'bg-white border-blue-100'}`}>
          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-[100px] -z-10" />
          
          <div className="flex flex-col lg:flex-row items-center gap-10">
            {/* 头像区域 */}
            <div className="relative group">
              <div className="absolute inset-0 bg-blue-500 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity" />
              <div className="relative w-44 h-44 rounded-full border-4 border-white overflow-hidden bg-slate-100">
                <img src={userData.avatar} alt="Avatar" className="w-full h-full object-cover" />
              </div>
              <div className="absolute -bottom-2 right-4 bg-blue-600 text-white px-4 py-1.5 rounded-full font-black text-xs border-2 border-white">
                LV.{userData.level}
              </div>
            </div>

            {/* 文字信息 */}
            <div className="flex-1 text-center lg:text-left space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                <h2 className="text-4xl font-fredoka tracking-tight">{userData.name}</h2>
                <div className={`px-4 py-1.5 rounded-xl font-black text-[10px] uppercase tracking-widest w-fit mx-auto lg:mx-0 ${isDark ? 'bg-white/5 text-slate-400' : 'bg-blue-50 text-blue-600'}`}>
                  PRODUCER ID: {userData.id}
                </div>
              </div>
              <div className="flex items-center justify-center lg:justify-start gap-6 text-slate-500 font-medium">
                <div className="flex items-center gap-2"><MapPin size={16} /> <span>生音星系 · 021站</span></div>
                <div className="flex items-center gap-2"><ShieldCheck size={16} className="text-emerald-500" /> <span>已通过专业认证</span></div>
              </div>
              
              {/* 经验值条 */}
              <div className="w-full max-w-md mt-6 space-y-2">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <span>创作能量指数</span>
                  <span>{userData.exp}%</span>
                </div>
                <div className="h-2.5 bg-slate-800/20 rounded-full overflow-hidden p-0.5">
                  <div className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 rounded-full transition-all duration-1000" style={{ width: `${userData.exp}%` }} />
                </div>
              </div>
            </div>

            {/* 数据统计 */}
            <div className="flex gap-4 lg:gap-8 border-t lg:border-t-0 lg:border-l border-slate-100/10 pt-8 lg:pt-0 lg:pl-12">
              {[
                { label: '发布作品', val: userData.stats.works, icon: Music, color: 'text-blue-500' },
                { label: '获得点赞', val: userData.stats.likes, icon: Heart, color: 'text-pink-500' },
                { label: '荣誉勋章', val: userData.stats.awards, icon: Award, color: 'text-yellow-500' },
              ].map(stat => (
                <div key={stat.label} className="flex flex-col items-center">
                  <div className="text-2xl font-fredoka mb-1">{stat.val}</div>
                  <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-slate-500">
                    <stat.icon size={12} className={stat.color} />
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* 左侧：已报课程 */}
          <div className="lg:col-span-1 space-y-6">
            <h3 className="text-xl font-black flex items-center gap-3 ml-4">
              <Disc className="text-blue-500" /> 我的研究方向
            </h3>
            <div className="space-y-4">
              {myCourses.map(course => (
                <div key={course.id} className={`p-6 rounded-[2.5rem] border shadow-sm group transition-all hover:scale-[1.02] hover:shadow-md ${isDark ? 'bg-slate-900/40 border-white/5' : 'bg-white border-blue-100'}`}>
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${course.color} flex items-center justify-center text-white`}>
                      <course.icon size={24} />
                    </div>
                    <div>
                      <h4 className="font-black text-sm">{course.title}</h4>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Ongoing Path</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-[9px] font-black text-slate-400">
                      <span>掌握进度</span>
                      <span>{course.progress}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-800/10 rounded-full overflow-hidden">
                      <div className={`h-full bg-gradient-to-r ${course.color} rounded-full`} style={{ width: `${course.progress}%` }} />
                    </div>
                  </div>
                </div>
              ))}
              <button className={`w-full py-5 rounded-[2.2rem] border-2 border-dashed flex items-center justify-center gap-2 font-black text-xs uppercase tracking-widest transition-all ${isDark ? 'border-white/10 text-slate-600 hover:text-blue-400 hover:border-blue-500/50' : 'border-blue-100 text-blue-300 hover:text-blue-600'}`}>
                探索新方向 <ArrowRight size={14} />
              </button>
            </div>
          </div>

          {/* 右侧：发布的作品 */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between ml-4">
              <h3 className="text-xl font-black flex items-center gap-3">
                <Star className="text-yellow-400" /> 发布的创作
              </h3>
              <button className="text-[10px] font-black uppercase text-blue-500 tracking-widest">查看全部作品</button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {myWorks.map(work => (
                <div key={work.id} className={`group p-6 rounded-[3rem] border shadow-sm transition-all hover:-translate-y-2 hover:shadow-md ${isDark ? 'bg-slate-900/40 border-white/5' : 'bg-white border-blue-100'}`}>
                  <div className="flex items-center gap-6">
                    <div className={`w-24 h-24 rounded-full bg-slate-800 flex items-center justify-center text-4xl relative overflow-hidden`}>
                      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
                      {work.icon}
                      <div className="absolute inset-0 border-[6px] border-black/10 rounded-full" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <h4 className="text-xl font-black">{work.title}</h4>
                      <div className="flex items-center gap-3">
                         <span className={`px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-tighter ${isDark ? 'bg-white/5 text-slate-500' : 'bg-slate-100 text-slate-500'}`}>{work.style}</span>
                         <span className="text-[9px] font-bold text-slate-400">{work.date}</span>
                      </div>
                      <div className="flex items-center gap-6 pt-2">
                        <div className="flex items-center gap-1.5 text-pink-500 font-fredoka text-xs">
                          <Heart size={14} fill="currentColor" /> {work.likes}
                        </div>
                        <button className="text-slate-400 hover:text-blue-500 transition-colors">
                          <Share2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              <div className={`p-6 rounded-[3rem] border-4 border-dashed flex flex-col items-center justify-center text-center gap-3 transition-all cursor-pointer ${isDark ? 'border-white/5 bg-white/5 hover:bg-white/10' : 'border-blue-50 bg-blue-50/20 hover:bg-white'}`}>
                <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-500 flex items-center justify-center mb-1">
                  <Music size={24} />
                </div>
                <span className="text-sm font-black text-slate-400">开启新的创作旅程</span>
              </div>
            </div>
          </div>
        </div>

        {/* 底部设置项 */}
        <div className={`p-8 rounded-[3rem] flex flex-wrap items-center justify-center gap-8 border-t ${isDark ? 'border-white/5' : 'border-blue-50'}`}>
          <button className="flex items-center gap-2 text-xs font-black text-slate-500 hover:text-blue-500 transition-all uppercase tracking-widest">
            <Settings size={16} /> 账号设置
          </button>
          <div className="w-1 h-1 bg-slate-500 rounded-full" />
          <button 
            onClick={() => setShowExitConfirm('switch')}
            className="flex items-center gap-2 text-xs font-black text-slate-500 hover:text-blue-500 transition-all uppercase tracking-widest"
          >
            <UserCircle2 size={16} /> 切换账号
          </button>
          <div className="w-1 h-1 bg-slate-500 rounded-full" />
          <button 
            onClick={() => setShowExitConfirm('logout')}
            className="flex items-center gap-2 text-xs font-black text-slate-500 hover:text-red-500 transition-all uppercase tracking-widest"
          >
            <LogOut size={16} /> 退出登录
          </button>
        </div>

      </div>

      {/* 退出确认弹窗 */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-slate-950/60 backdrop-blur-xl animate-in fade-in duration-300">
          <div className={`w-full max-w-md rounded-[3.5rem] p-10 border shadow-lg animate-in zoom-in-95 duration-500 ${isDark ? 'bg-slate-900 border-white/10' : 'bg-white border-blue-100'}`}>
            <div className="flex flex-col items-center text-center gap-6">
              <div className={`w-20 h-20 rounded-3xl flex items-center justify-center text-3xl ${showExitConfirm === 'logout' ? 'bg-rose-500/20 text-rose-500' : 'bg-blue-500/20 text-blue-500'}`}>
                {showExitConfirm === 'logout' ? <AlertTriangle size={36} /> : <UserCircle2 size={36} />}
              </div>
              
              <div className="space-y-2">
                <h4 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-blue-950'}`}>
                  {showExitConfirm === 'logout' ? '确定要退出吗？' : '准备切换账号？'}
                </h4>
                <p className="text-slate-500 font-medium text-sm">
                  {showExitConfirm === 'logout' 
                    ? '退出后，您需要重新登录才能继续您的灵感创作之旅。' 
                    : '切换账号将安全退出当前身份，并允许您使用其他通行证。'}
                </p>
              </div>

              <div className="flex gap-4 w-full mt-4">
                <button 
                  onClick={() => setShowExitConfirm(null)}
                  className={`flex-1 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all ${isDark ? 'bg-white/5 text-slate-400 hover:bg-white/10' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                >
                  取消
                </button>
                <button 
                  onClick={handleConfirmExit}
                  className={`flex-1 py-4 rounded-2xl font-black text-sm uppercase tracking-widest text-white transition-all ${showExitConfirm === 'logout' ? 'bg-rose-600 hover:bg-rose-500' : 'bg-blue-600 hover:bg-blue-500'}`}
                >
                  确认{showExitConfirm === 'logout' ? '退出' : '切换'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;
