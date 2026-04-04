import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { User, ArrowRight, CheckCircle2, Orbit, Sparkles, Atom, Smartphone, Loader2, KeyRound, Globe, Lock, Eye, EyeOff, AtSign, AlertCircle, Check } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { PALETTE } from '../../constants/palette';
import { useSettings, Language } from '../../contexts/SettingsContext';
import { authService } from '../../services/authService';

interface AuthPageProps {
  theme: 'light' | 'dark';
}

type AuthMode = 'login' | 'register';
type LoginMethod = 'password' | 'sms';
type CourseType = 'PRODUCER' | 'ARTIST' | 'MAKER';

const AuthPage: React.FC<AuthPageProps> = ({ theme }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, language, setLanguage } = useSettings();

  const { loginWithPhone: doLoginWithPhone, loginWithPassword: doLoginWithPassword, sendSmsCode, register: doRegister, isAuthenticated } = useAuth();

  const [mode, setMode] = useState<AuthMode>('login');
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('password');
  const [course, setCourse] = useState<CourseType | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [account, setAccount] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [vCode, setVCode] = useState('');
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');

  // ── Real-time availability state ──
  type FieldStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid';
  const [usernameStatus, setUsernameStatus] = useState<FieldStatus>('idle');
  const [usernameHint, setUsernameHint] = useState('');
  const [phoneStatus, setPhoneStatus] = useState<FieldStatus>('idle');
  const [phoneHint, setPhoneHint] = useState('');
  const usernameTimer = useRef<number | null>(null);
  const phoneTimer = useRef<number | null>(null);
  const usernameAbort = useRef<AbortController | null>(null);
  const phoneAbort = useRef<AbortController | null>(null);

  const checkUsername = useCallback((value: string) => {
    if (usernameTimer.current) clearTimeout(usernameTimer.current);
    usernameAbort.current?.abort();
    if (!value || value.length < 3) {
      setUsernameStatus(value ? 'invalid' : 'idle');
      setUsernameHint(value ? t('auth.usernameShort') : '');
      return;
    }
    if (!/^[a-zA-Z0-9_]{3,30}$/.test(value)) {
      setUsernameStatus('invalid');
      setUsernameHint(t('auth.usernameInvalid'));
      return;
    }
    setUsernameStatus('checking');
    setUsernameHint(t('auth.usernameChecking'));
    const controller = new AbortController();
    usernameAbort.current = controller;
    usernameTimer.current = window.setTimeout(async () => {
      try {
        const r = await authService.checkAvailability({ username: value });
        if (controller.signal.aborted) return;
        if (r.usernameAvailable === true) {
          setUsernameStatus('available');
          setUsernameHint(t('auth.usernameAvailable'));
        } else if (r.usernameAvailable === false) {
          setUsernameStatus('taken');
          setUsernameHint(r.usernameMessage || t('auth.usernameTaken'));
        }
      } catch {
        // 请求被取消或失败，忽略
      }
    }, 500);
  }, [t]);

  const checkPhone = useCallback((value: string) => {
    if (phoneTimer.current) clearTimeout(phoneTimer.current);
    phoneAbort.current?.abort();
    if (mode !== 'register') { setPhoneStatus('idle'); setPhoneHint(''); return; }
    if (value.length < 11) { setPhoneStatus('idle'); setPhoneHint(''); return; }
    if (!/^1\d{10}$/.test(value)) { setPhoneStatus('invalid'); setPhoneHint(t('auth.usernameInvalid')); return; }
    setPhoneStatus('checking');
    setPhoneHint(t('auth.phoneChecking'));
    const controller = new AbortController();
    phoneAbort.current = controller;
    phoneTimer.current = window.setTimeout(async () => {
      try {
        const r = await authService.checkAvailability({ phone: value });
        if (controller.signal.aborted) return;
        if (r.phoneAvailable === true) {
          setPhoneStatus('available');
          setPhoneHint(t('auth.phoneAvailable'));
        } else if (r.phoneAvailable === false) {
          setPhoneStatus('taken');
          setPhoneHint(r.phoneMessage || t('auth.phoneTaken'));
        }
      } catch {
        // 请求被取消或失败，忽略
      }
    }, 500);
  }, [t, mode]);

  // Clean up timers
  useEffect(() => {
    return () => {
      if (usernameTimer.current) clearTimeout(usernameTimer.current);
      if (phoneTimer.current) clearTimeout(phoneTimer.current);
      usernameAbort.current?.abort();
      phoneAbort.current?.abort();
    };
  }, []);

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
        if (loginMethod === 'password') {
          const r = await doLoginWithPassword(account, password);
          if (r && !r.success) {
            if (r.code === 'NO_PASSWORD') {
              setLoginMethod('sms');
              setErrorMsg(t('auth.noPassword'));
            } else {
              setErrorMsg(r.message || t('auth.loginFail'));
            }
          }
        } else {
          const r = await doLoginWithPhone(phone, vCode);
          if (r && !r.success) setErrorMsg(r.message || t('auth.loginFail'));
        }
      } else {
        if (!username || !/^[a-zA-Z0-9_]{3,30}$/.test(username)) {
          setErrorMsg(t('auth.usernameInvalid'));
          setIsAuthorizing(false);
          return;
        }
        const r = await doRegister({ phone, code: vCode, username, displayName: displayName || undefined, courseType: course || undefined, password: regPassword || undefined });
        if (r && !r.success) {
          if (r.code === 'USERNAME_TAKEN') {
            setErrorMsg(t('auth.usernameTaken'));
            setUsernameStatus('taken');
            setUsernameHint(t('auth.usernameTaken'));
          } else if (r.code === 'PHONE_TAKEN') {
            setErrorMsg(t('auth.phoneTaken'));
            setPhoneStatus('taken');
            setPhoneHint(t('auth.phoneTaken'));
          } else {
            setErrorMsg(r.message || t('auth.registerFail'));
          }
        }
      }
    } catch (e: any) {
      if (e?.code === 'USER_NOT_FOUND') {
        setMode('register');
        setErrorMsg(t('auth.notRegisteredRedirect'));
      } else if (e?.code === 'NO_PASSWORD') {
        setLoginMethod('sms');
        setErrorMsg(t('auth.noPassword'));
      } else if (e?.code === 'USERNAME_TAKEN') {
        setErrorMsg(t('auth.usernameTaken'));
        setUsernameStatus('taken');
        setUsernameHint(t('auth.usernameTaken'));
      } else if (e?.code === 'PHONE_TAKEN') {
        setErrorMsg(t('auth.phoneTaken'));
        setPhoneStatus('taken');
        setPhoneHint(t('auth.phoneTaken'));
      } else {
        setErrorMsg(e.message || t('auth.actionFail'));
      }
    }
    finally { setIsAuthorizing(false); }
  };

  const getVCode = async () => {
    if (phone.length !== 11) return;
    // 立即开始倒计时，不等后端
    setCountdown(60);
    setErrorMsg('');
    try {
      const r = await sendSmsCode(phone);
      if (!r?.success) {
        setCountdown(0); // 失败回滚
        setErrorMsg(r?.message || t('auth.sendFail'));
      }
    } catch (e: any) {
      setCountdown(0);
      setErrorMsg(e.message || t('auth.sendFail'));
    }
  };

  const loginDisabled = mode === 'login'
    ? loginMethod === 'password'
      ? (isAuthorizing || !account || password.length < 8)
      : (isAuthorizing || phone.length !== 11 || vCode.length < 4)
    : (isAuthorizing || !course || !username || username.length < 3 || !displayName || phone.length !== 11 || vCode.length < 4 || usernameStatus === 'taken' || usernameStatus === 'invalid' || phoneStatus === 'taken');

  const inputCls = `w-full pl-11 pr-4 py-3.5 rounded-xl text-sm font-medium outline-none transition-all
    bg-white text-slate-800 placeholder:text-slate-300 shadow-[0_1px_4px_rgba(0,0,0,0.02)]
    focus:ring-2 focus:ring-[#5BA4F5]/10`;

  const passwordInputCls = `w-full pl-11 pr-10 py-3.5 rounded-xl text-sm font-medium outline-none transition-all
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

          {/* decorative blocks */}
          <div className="absolute" style={{width: 130, height: 130, top: '-5%', left: '-5%', background: PALETTE.pink.bg, opacity: 0.62}} />
          <div className="absolute" style={{width: 70, height: 70, top: '2%', left: '20%', background: PALETTE.blue.bg, opacity: 0.58}} />
          <div className="absolute" style={{width: 110, height: 110, top: '-4%', left: '38%', background: PALETTE.yellow.bg, opacity: 0.60}} />
          <div className="absolute" style={{width: 60, height: 60, top: '4%', left: '58%', background: PALETTE.green.bg, opacity: 0.55}} />
          <div className="absolute" style={{width: 140, height: 140, top: '-6%', left: '72%', background: PALETTE.blue.bg, opacity: 0.60}} />

          <div className="absolute" style={{width: 80, height: 80, top: '18%', left: '-3%', background: PALETTE.orange.bg, opacity: 0.58}} />
          <div className="absolute" style={{width: 150, height: 150, top: '14%', left: '14%', background: PALETTE.green.bg, opacity: 0.55}} />
          <div className="absolute" style={{width: 65, height: 65, top: '20%', left: '42%', background: PALETTE.blue.bg, opacity: 0.58}} />
          <div className="absolute" style={{width: 120, height: 120, top: '16%', left: '56%', background: PALETTE.orange.bg, opacity: 0.57}} />
          <div className="absolute" style={{width: 55, height: 55, top: '22%', left: '84%', background: PALETTE.yellow.bg, opacity: 0.55}} />

          <div className="absolute" style={{width: 140, height: 140, top: '36%', left: '-5%', background: PALETTE.blue.bg, opacity: 0.57}} />
          <div className="absolute" style={{width: 60, height: 60, top: '42%', left: '22%', background: PALETTE.green.bg, opacity: 0.55}} />
          <div className="absolute" style={{width: 100, height: 100, top: '38%', left: '36%', background: PALETTE.pink.bg, opacity: 0.58}} />
          <div className="absolute" style={{width: 75, height: 75, top: '40%', left: '62%', background: PALETTE.yellow.bg, opacity: 0.55}} />
          <div className="absolute" style={{width: 130, height: 130, top: '34%', left: '74%', background: PALETTE.green.bg, opacity: 0.57}} />

          <div className="absolute" style={{width: 70, height: 70, top: '58%', left: '0%', background: PALETTE.yellow.bg, opacity: 0.58}} />
          <div className="absolute" style={{width: 120, height: 120, top: '54%', left: '16%', background: PALETTE.blue.bg, opacity: 0.57}} />
          <div className="absolute" style={{width: 55, height: 55, top: '60%', left: '44%', background: PALETTE.orange.bg, opacity: 0.55}} />
          <div className="absolute" style={{width: 110, height: 110, top: '56%', left: '58%', background: PALETTE.pink.bg, opacity: 0.57}} />
          <div className="absolute" style={{width: 65, height: 65, top: '62%', left: '84%', background: PALETTE.blue.bg, opacity: 0.55}} />

          <div className="absolute" style={{width: 150, height: 150, top: '74%', left: '-6%', background: PALETTE.orange.bg, opacity: 0.58}} />
          <div className="absolute" style={{width: 65, height: 65, top: '80%', left: '20%', background: PALETTE.pink.bg, opacity: 0.55}} />
          <div className="absolute" style={{width: 125, height: 125, top: '76%', left: '36%', background: PALETTE.blue.bg, opacity: 0.57}} />
          <div className="absolute" style={{width: 70, height: 70, top: '82%', left: '64%', background: PALETTE.green.bg, opacity: 0.55}} />
          <div className="absolute" style={{width: 110, height: 110, top: '72%', left: '76%', background: PALETTE.yellow.bg, opacity: 0.57}} />

          {/* brand */}
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-14">
              <div className="w-9 h-9 rounded-lg overflow-hidden border border-slate-200 bg-white shadow-sm">
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
              <span key={tag} className="px-3 py-1 rounded-full text-xs font-semibold border"
                style={{background: PALETTE.blue.bg, color: PALETTE.blue.accent, borderColor: `${PALETTE.blue.accent}33`}}>
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
            <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setErrorMsg(''); setUsernameStatus('idle'); setUsernameHint(''); setPhoneStatus('idle'); setPhoneHint(''); }}
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
                {/* Login method tabs */}
                <div className="flex gap-1 p-1 rounded-xl bg-[#F8FAFC]">
                  {(['password', 'sms'] as LoginMethod[]).map(m => (
                    <button key={m}
                      onClick={() => { setLoginMethod(m); setErrorMsg(''); }}
                      className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all"
                      style={loginMethod === m
                        ? { background: '#FFFFFF', color: PALETTE.blue.accent, boxShadow: '0 1px 4px rgba(0,0,0,0.02)' }
                        : { color: '#94A3B8' }
                      }
                    >
                      {m === 'password' ? t('auth.passwordLogin') : t('auth.smsLogin')}
                    </button>
                  ))}
                </div>

                {loginMethod === 'password' ? (
                  <>
                    <div className="relative">
                      <AtSign size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                      <input type="text" placeholder={t('auth.account')} value={account}
                        onChange={e => setAccount(e.target.value.trim())}
                        className={inputCls} />
                    </div>
                    <div className="relative">
                      <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                      <input type={showPassword ? 'text' : 'password'} placeholder={t('auth.password')} value={password}
                        onChange={e => setPassword(e.target.value)}
                        className={passwordInputCls} />
                      <button type="button" onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors">
                        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </>
                ) : (
                  <>
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
                  </>
                )}

                <button onClick={handleAction}
                  disabled={loginDisabled}
                  className="w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all mt-1 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90"
                  style={{background: loginDisabled ? '#cbd5e1' : '#1e293b'}}>
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
                    <AtSign size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                    <input type="text" placeholder={t('auth.usernamePlaceholder')} value={username}
                      onChange={e => { const v = e.target.value.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 30).toLowerCase(); setUsername(v); checkUsername(v); }}
                      className={`${inputCls} ${usernameStatus === 'taken' || usernameStatus === 'invalid' ? 'border-red-300 focus:border-red-400 focus:ring-red-400/10' : usernameStatus === 'available' ? 'border-emerald-300 focus:border-emerald-400 focus:ring-emerald-400/10' : ''}`} />
                    {usernameStatus === 'checking' && <Loader2 size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 animate-spin" />}
                    {usernameStatus === 'available' && <Check size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500" />}
                    {(usernameStatus === 'taken' || usernameStatus === 'invalid') && <AlertCircle size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-red-400" />}
                  </div>
                  {usernameHint && (
                    <p className={`text-xs font-medium -mt-1 ml-1 ${usernameStatus === 'available' ? 'text-emerald-500' : usernameStatus === 'checking' ? 'text-slate-400' : 'text-red-400'}`}>
                      {usernameHint}
                    </p>
                  )}
                  <div className="relative">
                    <User size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                    <input type="text" placeholder={t('auth.displayNamePlace')} value={displayName}
                      onChange={e => setDisplayName(e.target.value)} className={inputCls} />
                  </div>
                  <div className="relative">
                    <Smartphone size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                    <input type="tel" placeholder={t('auth.phone')} value={phone}
                      onChange={e => { const v = e.target.value.replace(/\D/g, '').slice(0, 11); setPhone(v); checkPhone(v); }}
                      className={`${inputCls} ${phoneStatus === 'taken' ? 'border-red-300 focus:border-red-400 focus:ring-red-400/10' : phoneStatus === 'available' ? 'border-emerald-300 focus:border-emerald-400 focus:ring-emerald-400/10' : ''}`} />
                    {phoneStatus === 'checking' && <Loader2 size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 animate-spin" />}
                    {phoneStatus === 'available' && <Check size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500" />}
                    {phoneStatus === 'taken' && <AlertCircle size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-red-400" />}
                  </div>
                  {phoneHint && (
                    <p className={`text-xs font-medium -mt-1 ml-1 ${phoneStatus === 'available' ? 'text-emerald-500' : phoneStatus === 'checking' ? 'text-slate-400' : 'text-red-400'}`}>
                      {phoneHint}
                    </p>
                  )}
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
                  {/* Optional password for registration */}
                  <div className="relative">
                    <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                    <input type={showRegPassword ? 'text' : 'password'} placeholder={t('auth.setPasswordOptional')} value={regPassword}
                      onChange={e => setRegPassword(e.target.value)}
                      className={passwordInputCls} />
                    <button type="button" onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors">
                      {showRegPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
                <button onClick={handleAction}
                  disabled={isAuthorizing || !course || !username || username.length < 3 || !displayName || phone.length !== 11 || vCode.length < 4 || usernameStatus === 'taken' || usernameStatus === 'invalid' || phoneStatus === 'taken'}
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
