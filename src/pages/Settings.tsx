import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Globe, Type, Check, Lock, AtSign, Eye, EyeOff, Loader2, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useSettings, Language, FontSize } from '../contexts/SettingsContext';
import { useAuth } from '../hooks/useAuth';
import { PALETTE } from '../constants/palette';

const LANGUAGES: { id: Language; flag: string }[] = [
  { id: 'zh-CN', flag: '🇨🇳' },
  { id: 'zh-TW', flag: '🇲🇴/🇭🇰' },
  { id: 'en',    flag: '🇺🇸/🇬🇧' },
];

const FONT_SIZES: { id: FontSize; preview: string }[] = [
  { id: 'small', preview: 'Aa' },
  { id: 'default', preview: 'Aa' },
  { id: 'large', preview: 'Aa' },
];

const fontSizePreviewClass: Record<FontSize, string> = {
  small: 'text-base',
  default: 'text-lg',
  large: 'text-xl',
};

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const { language, fontSize, setLanguage, setFontSize, t } = useSettings();
  const { user, setPassword, setUsername: doSetUsername, refreshUser } = useAuth();

  // Password state
  const [showPwForm, setShowPwForm] = useState(false);
  const [oldPw, setOldPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showOldPw, setShowOldPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  // Username state
  const [showUnForm, setShowUnForm] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [unLoading, setUnLoading] = useState(false);
  const [unMsg, setUnMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const inputCls = `w-full pl-11 pr-10 py-3 rounded-xl text-sm font-medium outline-none transition-all
    bg-white border border-slate-200 text-slate-800 placeholder:text-slate-300
    focus:border-[#5BA4F5] focus:ring-2 focus:ring-[#5BA4F5]/10`;

  const handlePasswordSubmit = async () => {
    setPwMsg(null);
    if (newPw.length < 8) { setPwMsg({ type: 'error', text: '密码至少 8 位' }); return; }
    if (newPw !== confirmPw) { setPwMsg({ type: 'error', text: t('profile.passwordMismatch') }); return; }
    setPwLoading(true);
    try {
      const r = await setPassword({ oldPassword: user?.hasPassword ? oldPw : undefined, newPassword: newPw });
      if (r.success) {
        setPwMsg({ type: 'success', text: t('profile.passwordSuccess') });
        setOldPw(''); setNewPw(''); setConfirmPw('');
        await refreshUser();
        setTimeout(() => { setShowPwForm(false); setPwMsg(null); }, 1500);
      } else {
        setPwMsg({ type: 'error', text: r.message || '操作失败' });
      }
    } catch (e: any) { setPwMsg({ type: 'error', text: e.message || '操作失败' }); }
    finally { setPwLoading(false); }
  };

  const handleUsernameSubmit = async () => {
    setUnMsg(null);
    if (!newUsername || !/^[a-zA-Z0-9_]{3,30}$/.test(newUsername)) {
      setUnMsg({ type: 'error', text: t('auth.usernameInvalid') }); return;
    }
    setUnLoading(true);
    try {
      const r = await doSetUsername(newUsername.toLowerCase());
      if (r.success) {
        setUnMsg({ type: 'success', text: t('profile.passwordSuccess') });
        setTimeout(() => { setShowUnForm(false); setUnMsg(null); }, 1500);
      } else {
        setUnMsg({ type: 'error', text: r.code === 'USERNAME_TAKEN' ? t('auth.usernameTaken') : (r.message || '操作失败') });
      }
    } catch (e: any) {
      setUnMsg({ type: 'error', text: e?.code === 'USERNAME_TAKEN' ? t('auth.usernameTaken') : (e.message || '操作失败') });
    } finally { setUnLoading(false); }
  };

  return (
    <div className="h-full overflow-y-auto bg-[#F5F7FA] scrollbar-hide">
      <div className="max-w-2xl mx-auto px-4 sm:px-8 py-6 sm:py-12 space-y-5 sm:space-y-8 pb-20 md:pb-12">

        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-xl flex items-center justify-center bg-white text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all shadow-[0_1px_4px_rgba(0,0,0,0.02)]"
          >
            <ArrowLeft size={16} />
          </button>
          <h1 className="text-xl font-bold tracking-tight text-slate-800">{t('settings.title')}</h1>
        </div>

        {/* Account Security */}
        <div className="bg-white rounded-2xl p-5 sm:p-8 shadow-[0_1px_6px_rgba(0,0,0,0.03)] space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-slate-100">
              <ShieldCheck size={16} className="text-slate-500" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">{t('profile.security')}</p>
              <p className="text-xs font-medium text-slate-400">{t('auth.setupUsernameDesc')}</p>
            </div>
          </div>

          {/* Username row */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: PALETTE.blue.bg }}>
                  <AtSign size={14} style={{ color: PALETTE.blue.accent }} />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800">{t('auth.username')}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {user?.username
                      ? <span className="font-semibold" style={{ color: PALETTE.blue.accent }}>@{user.username}</span>
                      : <span className="font-semibold" style={{ color: PALETTE.orange.accent }}>{t('profile.passwordNotSet')}</span>
                    }
                  </p>
                </div>
              </div>
              {!user?.username && !showUnForm && (
                <button
                  onClick={() => { setShowUnForm(true); setUnMsg(null); setNewUsername(''); }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold transition-all hover:scale-[1.02] active:scale-95 text-white hover:opacity-90"
                  style={{ background: PALETTE.orange.accent }}
                >
                  {t('auth.setupUsername')}
                </button>
              )}
            </div>

            {/* Username inline form */}
            {showUnForm && !user?.username && (
              <div className="space-y-3 pt-1">
                {unMsg && (
                  <div className={`px-4 py-2 rounded-xl text-xs font-medium ${unMsg.type === 'error' ? 'bg-red-50 text-red-500' : 'text-white'}`}
                    style={unMsg.type === 'success' ? { background: PALETTE.green.accent } : undefined}>
                    {unMsg.type === 'success' && <CheckCircle2 size={12} className="inline mr-1 -mt-0.5" />}
                    {unMsg.text}
                  </div>
                )}
                <div className="relative">
                  <AtSign size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                  <input type="text" placeholder={t('auth.usernamePlaceholder')} value={newUsername}
                    onChange={e => setNewUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 30).toLowerCase())}
                    className={inputCls} />
                </div>
                <p className="text-xs text-slate-300 px-1">{t('auth.usernameOnce')}</p>
                <div className="flex gap-2">
                  <button onClick={() => setShowUnForm(false)}
                    className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all">
                    {t('profile.cancel')}
                  </button>
                  <button onClick={handleUsernameSubmit}
                    disabled={unLoading || !newUsername || newUsername.length < 3}
                    className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-white transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                    style={{ background: PALETTE.blue.accent }}>
                    {unLoading ? <Loader2 size={13} className="animate-spin" /> : t('profile.save')}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="h-px bg-slate-100" />

          {/* Password row */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: PALETTE.blue.bg }}>
                  <Lock size={14} style={{ color: PALETTE.blue.accent }} />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800">{t('auth.password')}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    <span className="font-semibold" style={{ color: user?.hasPassword ? PALETTE.green.accent : PALETTE.orange.accent }}>
                      {user?.hasPassword ? t('profile.passwordSet') : t('profile.passwordNotSet')}
                    </span>
                  </p>
                </div>
              </div>
              {!showPwForm && (
                <button
                  onClick={() => { setShowPwForm(true); setPwMsg(null); setOldPw(''); setNewPw(''); setConfirmPw(''); }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold transition-all hover:scale-[1.02] active:scale-95 border border-slate-200 text-slate-600 hover:bg-slate-50 bg-white"
                >
                  {user?.hasPassword ? t('profile.changePassword') : t('profile.setPassword')}
                </button>
              )}
            </div>

            {/* Password inline form */}
            {showPwForm && (
              <div className="space-y-3 pt-1">
                {pwMsg && (
                  <div className={`px-4 py-2 rounded-xl text-xs font-medium ${pwMsg.type === 'error' ? 'bg-red-50 text-red-500' : 'text-white'}`}
                    style={pwMsg.type === 'success' ? { background: PALETTE.green.accent } : undefined}>
                    {pwMsg.type === 'success' && <CheckCircle2 size={12} className="inline mr-1 -mt-0.5" />}
                    {pwMsg.text}
                  </div>
                )}
                {user?.hasPassword && (
                  <div className="relative">
                    <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                    <input type={showOldPw ? 'text' : 'password'} placeholder={t('profile.currentPassword')} value={oldPw}
                      onChange={e => setOldPw(e.target.value)} className={inputCls} />
                    <button type="button" onClick={() => setShowOldPw(!showOldPw)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors">
                      {showOldPw ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                )}
                <div className="relative">
                  <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                  <input type={showNewPw ? 'text' : 'password'} placeholder={t('profile.newPassword')} value={newPw}
                    onChange={e => setNewPw(e.target.value)} className={inputCls} />
                  <button type="button" onClick={() => setShowNewPw(!showNewPw)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors">
                    {showNewPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                <div className="relative">
                  <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                  <input type="password" placeholder={t('profile.confirmPassword')} value={confirmPw}
                    onChange={e => setConfirmPw(e.target.value)} className={inputCls} />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setShowPwForm(false)}
                    className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all">
                    {t('profile.cancel')}
                  </button>
                  <button onClick={handlePasswordSubmit}
                    disabled={pwLoading || newPw.length < 8 || !confirmPw}
                    className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-white transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                    style={{ background: PALETTE.blue.accent }}>
                    {pwLoading ? <Loader2 size={13} className="animate-spin" /> : t('profile.save')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Language */}
        <div className="bg-white rounded-2xl p-5 sm:p-8 shadow-[0_1px_6px_rgba(0,0,0,0.03)] space-y-4 sm:space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-slate-100">
              <Globe size={16} className="text-slate-500" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">{t('settings.language')}</p>
              <p className="text-xs font-medium text-slate-400">{t('settings.language.desc')}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
            {LANGUAGES.map(lang => {
              const active = language === lang.id;
              return (
                <button
                  key={lang.id}
                  onClick={() => setLanguage(lang.id)}
                  className="relative flex flex-col items-center gap-2 p-3 sm:p-4 rounded-xl text-center transition-all hover:scale-[1.02] active:scale-95"
                  style={active
                    ? { background: '#F1F5F9', color: '#1E293B' }
                    : { background: '#F8FAFC', color: '#94A3B8' }
                  }
                >
                  <span className="text-xl sm:text-2xl">{lang.flag}</span>
                  <span className="text-xs font-semibold">{t(`settings.lang.${lang.id}`)}</span>
                  {active && (
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center bg-slate-800">
                      <Check size={12} className="text-white" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Font Size */}
        <div className="bg-white rounded-2xl p-5 sm:p-8 shadow-[0_1px_6px_rgba(0,0,0,0.03)] space-y-4 sm:space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-slate-100">
              <Type size={16} className="text-slate-500" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">{t('settings.fontSize')}</p>
              <p className="text-xs font-medium text-slate-400">{t('settings.fontSize.desc')}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
            {FONT_SIZES.map(fs => {
              const active = fontSize === fs.id;
              return (
                <button
                  key={fs.id}
                  onClick={() => setFontSize(fs.id)}
                  className="relative flex flex-col items-center gap-2 p-3 sm:p-4 rounded-xl text-center transition-all hover:scale-[1.02] active:scale-95"
                  style={active
                    ? { background: '#F1F5F9', color: '#1E293B' }
                    : { background: '#F8FAFC', color: '#94A3B8' }
                  }
                >
                  <span className={`font-bold ${fontSizePreviewClass[fs.id]}`}>{fs.preview}</span>
                  <span className="text-xs font-semibold">{t(`settings.fontSize.${fs.id}`)}</span>
                  {active && (
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center bg-slate-800">
                      <Check size={12} className="text-white" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Auto-save hint */}
        <p className="text-center text-xs font-semibold text-slate-300">{t('settings.saved')}</p>
      </div>
    </div>
  );
};

export default Settings;
