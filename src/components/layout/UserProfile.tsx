import React, { useState } from 'react';
import {
  User, Award, Music, Heart, Settings, ShieldCheck, MapPin,
  Sparkles, Orbit, Atom, ArrowRight, Share2, Disc, Star,
  LogOut, UserCircle2, AlertTriangle
} from 'lucide-react';
import { PALETTE } from '../../constants/palette';

interface UserProfileProps {
  theme?: 'light' | 'dark';
  onLogout: () => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ onLogout }) => {
  const [showExitConfirm, setShowExitConfirm] = useState<'logout' | 'switch' | null>(null);

  const userData = {
    name: '未来制作人 · 小音',
    id: 'PRO-9527',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=JinBot',
    level: 12,
    exp: 85,
    stats: { works: 8, likes: 1250, awards: 4 },
  };

  const myCourses = [
    { id: 'PRODUCER', title: 'AI数智作曲家',    progress: 75, palette: PALETTE.blue,   icon: Orbit    },
    { id: 'ARTIST',   title: '音乐装置艺术家',  progress: 30, palette: PALETTE.pink,   icon: Sparkles },
    { id: 'MAKER',    title: '智创乐器家',      progress: 10, palette: PALETTE.orange, icon: Atom     },
  ];

  const myWorks = [
    { id: '1', title: '赛博萤火虫', style: '电子', likes: 342, date: '3天前',  icon: '🐝' },
    { id: '2', title: '云端漫步',   style: '爵士', likes: 128, date: '1周前',  icon: '☁️' },
    { id: '3', title: '齿轮华尔兹', style: '古典', likes: 56,  date: '2周前',  icon: '⚙️' },
  ];

  return (
    <div className="h-full overflow-y-auto bg-[#F5F7FA] scrollbar-hide">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 sm:py-12 space-y-6 sm:space-y-8 pb-20 md:pb-12">

        {/* Profile card */}
        <div className="bg-white rounded-2xl p-5 sm:p-8 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
          <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
                <img src={userData.avatar} alt="Avatar" className="w-full h-full object-cover" />
              </div>
              <span
                className="absolute -bottom-2 -right-2 text-[10px] font-semibold px-2 py-0.5 rounded-full border text-white"
                style={{ background: PALETTE.blue.accent, borderColor: 'white' }}
              >
                LV.{userData.level}
              </span>
            </div>

            {/* Info */}
            <div className="flex-1 text-center sm:text-left space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <h2 className="text-xl font-bold tracking-tight text-slate-800">{userData.name}</h2>
                <span
                  className="text-[10px] font-semibold uppercase tracking-widest px-3 py-1 rounded-full border w-fit mx-auto sm:mx-0"
                  style={{ background: PALETTE.blue.bg, color: PALETTE.blue.accent, borderColor: PALETTE.blue.accent + '33' }}
                >
                  {userData.id}
                </span>
              </div>
              <div className="flex items-center justify-center sm:justify-start gap-4 text-xs font-medium text-slate-400">
                <span className="flex items-center gap-1.5"><MapPin size={13} /> 生音星系 · 021站</span>
                <span className="flex items-center gap-1.5"><ShieldCheck size={13} style={{ color: PALETTE.green.accent }} /> 已通过专业认证</span>
              </div>
              {/* XP bar */}
              <div className="max-w-xs space-y-1">
                <div className="flex justify-between text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                  <span>创作能量</span><span>{userData.exp}%</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${userData.exp}%`, background: PALETTE.blue.accent }}
                  />
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="flex gap-6 pt-4 sm:pt-0 sm:pl-8">
              <div className="hidden sm:block w-px bg-slate-100 self-stretch" />
              {[
                { label: '发布作品', val: userData.stats.works,  icon: Music, palette: PALETTE.blue  },
                { label: '获得点赞', val: userData.stats.likes,  icon: Heart, palette: PALETTE.pink  },
                { label: '荣誉勋章', val: userData.stats.awards, icon: Award, palette: PALETTE.yellow },
              ].map(s => (
                <div key={s.label} className="flex flex-col items-center gap-1">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-1" style={{ background: s.palette.bg }}>
                    <s.icon size={15} style={{ color: s.palette.accent }} />
                  </div>
                  <span className="text-xl font-bold text-slate-800">{s.val}</span>
                  <span className="text-[10px] font-semibold text-slate-400">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Courses */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold tracking-tight text-slate-800 flex items-center gap-2">
              <Disc size={18} style={{ color: PALETTE.blue.accent }} /> 我的研究方向
            </h3>
            <div className="space-y-3">
              {myCourses.map(c => (
                <div key={c.id} className="bg-white rounded-2xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.03)] transition-all hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] hover:-translate-y-0.5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: c.palette.bg }}>
                      <c.icon size={16} style={{ color: c.palette.accent }} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">{c.title}</p>
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Ongoing</p>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] font-semibold text-slate-400">
                      <span>掌握进度</span><span>{c.progress}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${c.progress}%`, background: c.palette.accent }} />
                    </div>
                  </div>
                </div>
              ))}
              <button className="w-full py-3 rounded-xl bg-[#F8FAFC] flex items-center justify-center gap-2 text-xs font-semibold text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all">
                探索新方向 <ArrowRight size={14} />
              </button>
            </div>
          </div>

          {/* Works */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold tracking-tight text-slate-800 flex items-center gap-2">
                <Star size={18} style={{ color: PALETTE.yellow.accent }} /> 发布的创作
              </h3>
              <button className="text-xs font-semibold" style={{ color: PALETTE.blue.accent }}>查看全部</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {myWorks.map(w => (
                <div key={w.id} className="bg-white rounded-2xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.03)] transition-all hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 flex items-center gap-4">
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                    style={{ background: PALETTE.blue.bg }}
                  >
                    {w.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">{w.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full border"
                        style={{ background: PALETTE.orange.bg, color: PALETTE.orange.accent, borderColor: PALETTE.orange.accent + '33' }}
                      >
                        {w.style}
                      </span>
                      <span className="text-[10px] text-slate-400">{w.date}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: PALETTE.pink.accent }}>
                        <Heart size={12} fill="currentColor" /> {w.likes}
                      </span>
                      <button className="text-slate-300 hover:text-slate-500 transition-colors">
                        <Share2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              <button className="bg-[#F8FAFC] rounded-2xl p-5 flex flex-col items-center justify-center gap-2 text-xs font-semibold text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all min-h-[88px]">
                <Music size={18} className="text-slate-300" />
                开启新的创作旅程
              </button>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex flex-wrap items-center justify-center gap-6 py-4 mt-2">
          {[
            { label: '账号设置', icon: Settings, action: () => {} },
            { label: '切换账号', icon: UserCircle2, action: () => setShowExitConfirm('switch') },
          ].map(item => (
            <button
              key={item.label}
              onClick={item.action}
              className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-slate-600 transition-all"
            >
              <item.icon size={14} /> {item.label}
            </button>
          ))}
          <div className="w-1 h-1 rounded-full bg-slate-200" />
          <button
            onClick={() => setShowExitConfirm('logout')}
            className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-red-500 transition-all"
          >
            <LogOut size={14} /> 退出登录
          </button>
        </div>
      </div>

      {/* Exit confirm modal */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.08)] p-8 flex flex-col items-center text-center gap-6">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={showExitConfirm === 'logout'
                ? { background: '#FFF0E8' }
                : { background: PALETTE.blue.bg }}
            >
              {showExitConfirm === 'logout'
                ? <AlertTriangle size={24} style={{ color: PALETTE.orange.accent }} />
                : <UserCircle2 size={24} style={{ color: PALETTE.blue.accent }} />
              }
            </div>
            <div>
              <h4 className="text-xl font-bold tracking-tight text-slate-800 mb-2">
                {showExitConfirm === 'logout' ? '确定要退出吗？' : '准备切换账号？'}
              </h4>
              <p className="text-sm font-medium text-slate-400">
                {showExitConfirm === 'logout'
                  ? '退出后需要重新登录才能继续创作之旅。'
                  : '切换账号将安全退出当前身份。'}
              </p>
            </div>
            <div className="flex gap-3 w-full">
              <button
                onClick={() => setShowExitConfirm(null)}
                className="flex-1 py-3 rounded-xl text-xs font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all"
              >
                取消
              </button>
              <button
                onClick={() => { onLogout(); setShowExitConfirm(null); }}
                className="flex-1 py-3 rounded-xl text-xs font-semibold text-white transition-all hover:opacity-90"
                style={{ background: showExitConfirm === 'logout' ? PALETTE.orange.accent : PALETTE.blue.accent }}
              >
                确认{showExitConfirm === 'logout' ? '退出' : '切换'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;
