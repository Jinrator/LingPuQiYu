import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { User, ArrowRight, CheckCircle2, Orbit, Sparkles, Atom, Smartphone, Loader2, KeyRound, Globe, Music, Music2, Music3, Headphones, Mic2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { PALETTE } from '../../constants/palette';
import { useSettings, Language } from '../../contexts/SettingsContext';

interface AuthPageProps {
  theme: 'light' | 'dark';
}

type AuthMode = 'login' | 'register';
type CourseType = 'PRODUCER' | 'ARTIST' | 'MAKER';

const AuthPage: React.FC<AuthPageProps> = ({ theme }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, language, setLanguage } = useSettings();

  const { loginWithPhone: doLoginWithPhone, sendSmsCode, register: doRegister, isAuthenticated } = useAuth();

  const [mode, setMode] = useState<AuthMode>('login');
  const [course, setCourse] = useState<CourseType | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [vCode, setVCode] = useState('');
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');

  const courses = [
    { id: 'PRODUCER' as CourseType, titleKey: 'auth.course.producer', descKey: 'auth.course.producerDesc', icon: Orbit, color: PALETTE.blue },
    { id: 'ARTIST' as CourseType, titleKey: 'auth.course.artist', descKey: 'auth.course.artistDesc', icon: Sparkles, color: PALETTE.pink },
    { id: 'MAKER' as CourseType, titleKey: 'auth.course.maker', descKey: 'auth.course.makerDesc', icon: Atom, color: PALETTE.orange },
  ];

  useEffect(() => {
    if (isAuthenticated) {
      const from = (location.state as any)?.from?.pathname || '/lab';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location.state]);

  useEffect(() => {
    let timer: number;
    if (countdown > 0) timer = window.setInterval(() => setCountdown(p => p - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleAction = async () => {
    setIsAuthorizing(true); setErrorMsg('');
    try {
      if (mode === 'login') {
        const r = await doLoginWithPhone(phone, vCode);
        if (r && !r.success) setErrorMsg(r.message || t('auth.loginFail'));
      } else {
        const r = await doRegister({ phone, code: vCode, username: name, courseType: course || undefined });
        if (r && !r.success) setErrorMsg(r.message || t('auth.registerFail'));
      }
    } catch (e: any) { setErrorMsg(e.message || t('auth.actionFail')); }
    finally { setIsAuthorizing(false); }
  };

  const getVCode = async () => {
    if (phone.length !== 11) return;
    try {
      const r = await sendSmsCode(phone);
      if (r?.success) { setCountdown(60); setErrorMsg(''); }
      else setErrorMsg(r?.message || t('auth.sendFail'));
    } catch (e: any) { setErrorMsg(e.message || t('auth.sendFail')); }
  };

  const inputCls = `w-full pl-11 pr-4 py-3.5 rounded-xl text-sm font-medium outline-none transition-all
    bg-white text-slate-800 placeholder:text-slate-300 shadow-[0_1px_4px_rgba(0,0,0,0.02)]
    focus:ring-2 focus:ring-[#5BA4F5]/10`;

  const LANG_OPTIONS: { id: Language; label: string }[] = [
    { id: 'zh-CN', label: '简体' },
    { id: 'zh-TW', label: '繁體' },
    { id: 'en',    label: 'EN' },
  ];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-[#F5F7FA]"> 

      {/* Language switcher — top right */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-10 flex items-center gap-1.5">
        <Globe size={14} className="text-slate-300" />
        {LANG_OPTIONS.map(l => (
          <button
            key={l.id}
            onClick={() => setLanguage(l.id)}
            className="px-2.5 py-1 rounded-full text-xs font-semibold transition-all"
            style={language === l.id
              ? { background: PALETTE.blue.bg, color: PALETTE.blue.accent }
              : { color: '#94A3B8' }
            }
          >
            {l.label}
          </button>
        ))}
      </div>

      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] rounded-2xl overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.04)] bg-white lg:h-[580px] max-h-[90vh]">

        {/* ── Left panel (hidden on mobile) ── */}
        <div className="relative hidden lg:flex flex-col justify-between p-12 overflow-hidden bg-[#F0F4FF]">

          {/* decorative music icons */}
          <Music  size={90}  className="absolute" style={{ top: '-2%', right: '-4%', color: PALETTE.blue.accent,   opacity: 0.10, transform: 'rotate(12deg)' }} />
          <Music2 size={44}  className="absolute" style={{ top: '5%',  right: '30%', color: PALETTE.pink.accent,   opacity: 0.08, transform: 'rotate(-15deg)' }} />
          <Headphones size={56} className="absolute" style={{ top: '18%', right: '8%',  color: PALETTE.yellow.accent, opacity: 0.07, transform: 'rotate(8deg)' }} />
          <Music3 size={36}  className="absolute" style={{ top: '35%', left: '-2%',  color: PALETTE.green.accent,  opacity: 0.08, transform: 'rotate(-10deg)' }} />
          <Mic2   size={32}  className="absolute" style={{ top: '50%', right: '5%',  color: PALETTE.orange.accent, opacity: 0.07, transform: 'rotate(20deg)' }} />
          <Music  size={48}  className="absolute" style={{ top: '65%', left: '5%',   color: PALETTE.blue.accent,   opacity: 0.06, transform: 'rotate(25deg)' }} />
          <Music2 size={28}  className="absolute" style={{ top: '78%', right: '20%', color: PALETTE.pink.accent,   opacity: 0.07, transform: 'rotate(-18deg)' }} />
          <Headphones size={40} className="absolute" style={{ top: '85%', left: '25%',  color: PALETTE.green.accent,  opacity: 0.06, transform: 'rotate(6deg)' }} />

          {/* floating stat bubbles */}
          {/* <div className="absolute top-20 right-[160px] flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-slate-200 shadow-sm text-slate-600 text-xs font-semibold z-10">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            12,500+ 位音乐人
          </div>
          <div className="absolute bottom-32 right-[140px] flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-slate-200 shadow-sm text-slate-600 text-xs font-semibold z-10">
            <span className="w-1.5 h-1.5 rounded-full" style={{background: PALETTE.blue.accent}} />
            4.9 · 120K 评价
          </div> */}

          {/* brand */}
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-14">
              <div className="w-9 h-9 rounded-lg overflow-hidden bg-white shadow-sm">
                <img src="/logo/logo.png" alt="MelodyVerse" className="w-full h-full object-contain" />
              </div>
              <span className="text-slate-800 font-bold text-base tracking-tight">{t('app.brand')}</span>
            </div>

            <h2 className="font-black text-5xl leading-[1.1] tracking-tight mb-5 text-slate-800">
              {t('auth.heroTitle')}<br />
              <span style={{color: PALETTE.blue.accent}}>{t('auth.heroAccent')}</span>
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed max-w-[240px]">
              {t('auth.heroDesc')}
            </p>
          </div>

          <div className="relative z-10 flex gap-2 flex-wrap">
            {[t('auth.tagBeginner'), t('auth.tagAI'), t('auth.tagAllAge')].map((tag) => (
              <span key={tag} className="px-3 py-1 rounded-full text-xs font-semibold"
                style={{background: PALETTE.blue.bg, color: PALETTE.blue.accent}}>
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* ── Right panel ── */}
        <div className="px-5 py-6 sm:px-10 sm:py-10 flex flex-col bg-white overflow-y-auto scrollbar-hide">

          {/* header */}
          <div className="flex items-center justify-between mb-6 sm:mb-8">
            <div>
              <h3 className="text-lg sm:text-xl font-bold tracking-tight text-slate-800">
                {mode === 'login' ? t('auth.welcome') : t('auth.createAccount')}
              </h3>
              <p className="text-sm sm:text-xs mt-1 text-slate-400">
                {mode === 'login' ? t('auth.loginSub') : t('auth.registerSub')}
              </p>
            </div>
            <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setErrorMsg(''); }}
              className="text-xs font-semibold flex items-center gap-1 text-slate-400 hover:text-slate-800 transition-colors">
              {mode === 'login' ? t('auth.goRegister') : t('auth.goLogin')}
              <ArrowRight size={12} />
            </button>
          </div>

          {errorMsg && (
            <div className="mb-3 sm:mb-4 px-4 py-2.5 sm:py-3 rounded-xl bg-red-50 text-red-500 text-sm sm:text-xs font-medium">
              {errorMsg}
            </div>
          )}

          <div className="flex flex-col">

            {/* ── LOGIN ── */}
            {mode === 'login' && (
              <div className="space-y-3">
                <div className="h-[10px]" />
                <div className="relative">
                  <Smartphone size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                  <input type="tel" placeholder={t('auth.phone')} value={phone}
                    onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                    className={inputCls} />
                </div>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <KeyRound size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                    <input type="text" placeholder={t('auth.code')} value={vCode}
                      onChange={e => setVCode(e.target.value.slice(0, 6))}
                      className={inputCls} />
                  </div>
                  <button onClick={getVCode} disabled={countdown > 0 || phone.length !== 11}
                    className={`px-4 rounded-xl text-xs font-semibold whitespace-nowrap transition-all
                      ${countdown > 0 || phone.length !== 11
                        ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
                        : 'text-white hover:opacity-90'}`}
                    style={countdown > 0 || phone.length !== 11 ? {} : {background: PALETTE.blue.accent}}>
                    {countdown > 0 ? `${countdown}s` : t('auth.getCode')}
                  </button>
                </div>
                <button onClick={handleAction}
                  disabled={isAuthorizing || phone.length !== 11 || vCode.length < 4}
                  className="w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all mt-1 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90"
                  style={{background: isAuthorizing || phone.length !== 11 || vCode.length < 4 ? '#cbd5e1' : '#1e293b'}}>
                  {isAuthorizing ? <Loader2 size={16} className="animate-spin" /> : <><CheckCircle2 size={16} />{t('auth.login')}</>}
                </button>
              </div>
            )}

            {/* ── REGISTER ── */}
            {mode === 'register' && (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-bold tracking-tight text-slate-700 mb-2.5">{t('auth.selectDirection')}</p>
                  <div className="grid grid-cols-3 gap-2">
                    {courses.map(c => (
                      <button key={c.id} onClick={() => setCourse(c.id)}
                        className="flex flex-col items-center gap-2 p-3 rounded-xl text-center transition-all hover:scale-[1.02]"
                        style={course === c.id
                          ? { background: c.color.bg, color: c.color.accent }
                          : { background: '#F8FAFC', color: '#94A3B8' }}>
                        <c.icon size={18} />
                        <span className="text-[10px] font-semibold leading-tight">{t(c.titleKey)}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2.5">
                  <div className="relative">
                    <User size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                    <input type="text" placeholder={t('auth.namePlace')} value={name}
                      onChange={e => setName(e.target.value)} className={inputCls} />
                  </div>
                  <div className="relative">
                    <Smartphone size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                    <input type="tel" placeholder={t('auth.phone')} value={phone}
                      onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                      className={inputCls} />
                  </div>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <KeyRound size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                      <input type="text" placeholder={t('auth.code')} value={vCode}
                        onChange={e => setVCode(e.target.value.slice(0, 6))} className={inputCls} />
                    </div>
                    <button onClick={getVCode} disabled={countdown > 0 || phone.length !== 11}
                      className={`px-4 rounded-xl text-xs font-semibold whitespace-nowrap transition-all
                        ${countdown > 0 || phone.length !== 11
                          ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
                          : 'text-white hover:opacity-90'}`}
                      style={countdown > 0 || phone.length !== 11 ? {} : {background: PALETTE.blue.accent}}>
                      {countdown > 0 ? `${countdown}s` : t('auth.getCode')}
                    </button>
                  </div>
                </div>
                <button onClick={handleAction}
                  disabled={isAuthorizing || !course || !name || phone.length !== 11 || vCode.length < 4}
                  className="w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all text-white disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90"
                  style={{background: '#1e293b'}}>
                  {isAuthorizing ? <Loader2 size={16} className="animate-spin" /> : <><CheckCircle2 size={16} />{t('auth.finishRegister')}</>}
                </button>
              </div>
            )}
          </div>

          {/* footer */}
          <div className="mt-auto pt-4 sm:pt-5 flex items-center justify-center">
            <p className="text-xs sm:text-[10px] text-slate-300">
              {t('auth.agree')}
              <span className="cursor-pointer hover:underline mx-1 text-slate-500">{t('auth.terms')}</span>
              {t('auth.and')}
              <span className="cursor-pointer hover:underline mx-1 text-slate-500">{t('auth.privacy')}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
