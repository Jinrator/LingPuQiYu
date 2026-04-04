import React, { useState } from 'react';
import {
  User, Award, Music, Heart, ShieldCheck, MapPin,
  Sparkles, Orbit, Atom, ArrowRight, Share2, Disc, Star,
  LogOut, UserCircle2, AlertTriangle, Loader2, CheckCircle2, AtSign
} from 'lucide-react';
import { PALETTE } from '../../constants/palette';
import { useSettings } from '../../contexts/SettingsContext';
import { useAuth } from '../../hooks/useAuth';

interface UserProfileProps {
  theme?: 'light' | 'dark';
  onLogout: () => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ onLogout }) => {
  const [showExitConfirm, setShowExitConfirm] = useState<'logout' | 'switch' | null>(null);
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [unLoading, setUnLoading] = useState(false);
  const [unMsg, setUnMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const { t } = useSettings();
  const { user, setUsername: doSetUsername, isAuthenticated } = useAuth();
  const displayAvatar = user?.avatar || `/api/avatar?seed=${encodeURIComponent(user?.id || 'JinBot')}`;
  const displayName = user?.displayName || user?.username || (user?.phone ? `用户 ${user.phone.slice(-4)}` : t('profile.userName'));
  const displayId = user?.username ? `@${user.username}` : (user?.id || 'PRO-9527');

  const userData = {
    name: displayName,
    id: displayId,
    avatar: displayAvatar,
    level: 12,
    exp: 85,
    stats: { works: 8, likes: 1250, awards: 4 },
  };

  const myCourses = [
    { id: 'PRODUCER', titleKey: 'profile.course.producer', progress: 75, palette: PALETTE.blue,   icon: Orbit    },
    { id: 'ARTIST',   titleKey: 'profile.course.artist',   progress: 30, palette: PALETTE.pink,   icon: Sparkles },
    { id: 'MAKER',    titleKey: 'profile.course.maker',    progress: 10, palette: PALETTE.orange, icon: Atom     },
  ].map((course) => ({
    ...course,
    progress: user?.courseType === course.id ? 100 : course.progress,
  }));

  const myWorks = [
    { id: '1', titleKey: 'profile.work.1.title', styleKey: 'profile.work.1.style', likes: 342, dateKey: 'profile.work.1.date', icon: '🐝' },
    { id: '2', titleKey: 'profile.work.2.title', styleKey: 'profile.work.2.style', likes: 128, dateKey: 'profile.work.2.date', icon: '☁️' },
    { id: '3', titleKey: 'profile.work.3.title', styleKey: 'profile.work.3.style', likes: 56,  dateKey: 'profile.work.3.date', icon: '⚙️' },
  ];

  const handleUsernameSubmit = async () => {
    setUnMsg(null);
    if (!newUsername || newUsername.length < 3) {
      setUnMsg({ type: 'error', text: t('auth.usernameInvalid') });
      return;
    }
    if (!/^[a-zA-Z0-9_]{3,30}$/.test(newUsername)) {
      setUnMsg({ type: 'error', text: t('auth.usernameInvalid') });
      return;
    }
    setUnLoading(true);
    try {
      const r = await doSetUsername(newUsername.toLowerCase());
      if (r.success) {
        setUnMsg({ type: 'success', text: t('profile.passwordSuccess') });
        setTimeout(() => setShowUsernameModal(false), 1200);
      } else {
        if (r.code === 'USERNAME_TAKEN') setUnMsg({ type: 'error', text: t('auth.usernameTaken') });
        else setUnMsg({ type: 'error', text: r.message || '操作失败' });
      }
    } catch (e: any) {
      if (e?.code === 'USERNAME_TAKEN') setUnMsg({ type: 'error', text: t('auth.usernameTaken') });
      else setUnMsg({ type: 'error', text: e.message || '操作失败' });
    } finally {
      setUnLoading(false);
    }
  };

  const inputCls = `w-full pl-11 pr-10 py-3 rounded-xl text-sm font-medium outline-none transition-all
    bg-white border border-slate-200 text-slate-800 placeholder:text-slate-300
    focus:border-[#5BA4F5] focus:ring-2 focus:ring-[#5BA4F5]/10`;

  return (
    <div className="h-full overflow-y-auto bg-[#F5F7FA] scrollbar-hide">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6 sm:py-12 space-y-5 sm:space-y-8 pb-20 md:pb-12">

        {/* Profile card */}
        <div className="bg-white rounded-2xl p-4 sm:p-8 shadow-[0_1px_6px_rgba(0,0,0,0.03)]">
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-8">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.03)]">
                <img src={userData.avatar} alt="Avatar" className="w-full h-full object-cover" />
              </div>
              <span
                className="absolute -bottom-2 -right-2 text-[10px] font-semibold px-2 py-0.5 rounded-full text-white"
                style={{ background: PALETTE.blue.accent }}
              >
                LV.{userData.level}
              </span>
            </div>

            {/* Info */}
            <div className="flex-1 text-center sm:text-left space-y-2.5 sm:space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-800">{userData.name}</h2>
                <span
                  className="text-[10px] font-semibold uppercase tracking-widest px-3 py-1 rounded-full w-fit mx-auto sm:mx-0"
                  style={{ background: PALETTE.blue.bg, color: PALETTE.blue.accent }}
                >
                  {userData.id}
                </span>
              </div>
              <div className="flex items-center justify-center sm:justify-start gap-4 text-xs font-medium text-slate-400">
                <span className="flex items-center gap-1.5"><MapPin size={13} /> {t('profile.location')}</span>
                <span className="flex items-center gap-1.5"><ShieldCheck size={13} style={{ color: PALETTE.green.accent }} /> {t('profile.certified')}</span>
              </div>
              {/* XP bar */}
              <div className="max-w-xs space-y-1">
                <div className="flex justify-between text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                  <span>{t('profile.energy')}</span><span>{userData.exp}%</span>
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
            <div className="flex gap-5 sm:gap-6 pt-3 sm:pt-0 sm:pl-8">
              <div className="hidden sm:block w-px bg-slate-100 self-stretch" />
              {[
                { label: t('profile.works'), val: userData.stats.works,  icon: Music, palette: PALETTE.blue  },
                { label: t('profile.likes'), val: userData.stats.likes,  icon: Heart, palette: PALETTE.blue  },
                { label: t('profile.awards'), val: userData.stats.awards, icon: Award, palette: PALETTE.blue },
              ].map(s => (
                <div key={s.label} className="flex flex-col items-center gap-0.5 sm:gap-1">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-0.5 sm:mb-1" style={{ background: s.palette.bg }}>
                    <s.icon size={15} style={{ color: s.palette.accent }} />
                  </div>
                  <span className="text-lg sm:text-xl font-bold text-slate-800">{s.val}</span>
                  <span className="text-[10px] font-semibold text-slate-400">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5 sm:gap-6">
          {/* Courses */}
          <div className="space-y-3 sm:space-y-4">
            <h3 className="text-lg sm:text-xl font-bold tracking-tight text-slate-800 flex items-center gap-2">
              <Disc size={18} style={{ color: PALETTE.blue.accent }} /> {t('profile.directions')}
            </h3>
            <div className="space-y-2.5 sm:space-y-3">
              {myCourses.map(c => (
                <div key={c.id} className="bg-white rounded-2xl p-4 sm:p-5 shadow-[0_1px_4px_rgba(0,0,0,0.02)] transition-all hover:shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:-translate-y-0.5">
                  <div className="flex items-center gap-3 mb-3 sm:mb-4">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: c.palette.bg }}>
                      <c.icon size={16} style={{ color: c.palette.accent }} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">{t(c.titleKey)}</p>
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">{t('profile.ongoing')}</p>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] font-semibold text-slate-400">
                      <span>{t('profile.mastery')}</span><span>{c.progress}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${c.progress}%`, background: c.palette.accent }} />
                    </div>
                  </div>
                </div>
              ))}
              <button className="w-full py-3 rounded-xl bg-[#F8FAFC] flex items-center justify-center gap-2 text-xs font-semibold text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all">
                {t('profile.explore')} <ArrowRight size={14} />
              </button>
            </div>
          </div>

          {/* Works */}
          <div className="lg:col-span-2 space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg sm:text-xl font-bold tracking-tight text-slate-800 flex items-center gap-2">
                <Star size={18} style={{ color: PALETTE.blue.accent }} /> {t('profile.published')}
              </h3>
              <button className="text-xs font-semibold" style={{ color: PALETTE.blue.accent }}>{t('profile.viewAll')}</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {myWorks.map(w => (
                <div key={w.id} className="bg-white rounded-2xl p-4 sm:p-5 shadow-[0_1px_4px_rgba(0,0,0,0.02)] transition-all hover:shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:-translate-y-0.5 flex items-center gap-3 sm:gap-4">
                  <div
                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center text-xl sm:text-2xl flex-shrink-0"
                    style={{ background: PALETTE.blue.bg }}
                  >
                    {w.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">{t(w.titleKey)}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: PALETTE.blue.bg, color: PALETTE.blue.accent }}
                      >
                        {t(w.styleKey)}
                      </span>
                      <span className="text-[10px] text-slate-400">{t(w.dateKey)}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: PALETTE.blue.accent }}>
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
                {t('profile.newJourney')}
              </button>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex flex-wrap items-center justify-center gap-6 py-4 mt-2">
          {[
            { label: t('profile.switchAccount'), icon: UserCircle2, action: () => setShowExitConfirm('switch') },
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
            <LogOut size={14} /> {t('profile.logout')}
          </button>
        </div>
      </div>

      {/* Username setup modal */}
      {(showUsernameModal || (isAuthenticated && !user?.username)) && (
        <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center p-4 sm:p-6 bg-slate-900/40 backdrop-blur-sm">
          <div className="w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.06)] p-6 sm:p-8 flex flex-col gap-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: PALETTE.blue.bg }}>
                <AtSign size={18} style={{ color: PALETTE.blue.accent }} />
              </div>
              <div>
                <h4 className="text-lg font-bold tracking-tight text-slate-800">{t('auth.setupUsername')}</h4>
                <p className="text-xs text-slate-400 mt-0.5">{t('auth.setupUsernameDesc')}</p>
              </div>
            </div>

            {unMsg && (
              <div className={`px-4 py-2.5 rounded-xl text-sm font-medium ${unMsg.type === 'error' ? 'bg-red-50 text-red-500' : 'text-white'}`}
                style={unMsg.type === 'success' ? { background: PALETTE.green.accent } : undefined}>
                {unMsg.type === 'success' && <CheckCircle2 size={14} className="inline mr-1.5 -mt-0.5" />}
                {unMsg.text}
              </div>
            )}

            <div className="space-y-2">
              <div className="relative">
                <AtSign size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                <input type="text" placeholder={t('auth.usernamePlaceholder')} value={newUsername}
                  onChange={e => setNewUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 30).toLowerCase())}
                  className={inputCls} />
              </div>
              <p className="text-xs text-slate-300 px-1">{t('auth.usernameOnce')}</p>
            </div>

            <button onClick={handleUsernameSubmit}
              disabled={unLoading || !newUsername || newUsername.length < 3}
              className="w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all text-white hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: PALETTE.blue.accent }}>
              {unLoading ? <Loader2 size={16} className="animate-spin" /> : <><CheckCircle2 size={16} />{t('profile.save')}</>}
            </button>
          </div>
        </div>
      )}

      {/* Exit confirm modal */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-6 sm:p-8 flex flex-col items-center text-center gap-5 sm:gap-6">
            <div
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center"
              style={showExitConfirm === 'logout'
                ? { background: '#FFF0E8' }
                : { background: PALETTE.blue.bg }}
            >
              {showExitConfirm === 'logout'
                ? <AlertTriangle size={22} style={{ color: PALETTE.orange.accent }} />
                : <UserCircle2 size={22} style={{ color: PALETTE.blue.accent }} />
              }
            </div>
            <div>
              <h4 className="text-lg sm:text-xl font-bold tracking-tight text-slate-800 mb-1.5 sm:mb-2">
                {showExitConfirm === 'logout' ? t('profile.confirmLogout') : t('profile.confirmSwitch')}
              </h4>
              <p className="text-sm font-medium text-slate-400">
                {showExitConfirm === 'logout'
                  ? t('profile.logoutDesc')
                  : t('profile.switchDesc')}
              </p>
            </div>
            <div className="flex gap-3 w-full">
              <button
                onClick={() => setShowExitConfirm(null)}
                className="flex-1 py-3 rounded-xl text-xs font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all"
              >
                {t('profile.cancel')}
              </button>
              <button
                onClick={() => { onLogout(); setShowExitConfirm(null); }}
                className="flex-1 py-3 rounded-xl text-xs font-semibold text-white transition-all hover:opacity-90"
                style={{ background: showExitConfirm === 'logout' ? PALETTE.orange.accent : PALETTE.blue.accent }}
              >
                {showExitConfirm === 'logout' ? t('profile.confirmLogoutBtn') : t('profile.confirmSwitchBtn')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;
