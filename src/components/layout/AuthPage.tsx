import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { User, ArrowRight, CheckCircle2, Orbit, Sparkles, Atom, Smartphone, Loader2, KeyRound } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { PALETTE } from '../../constants/palette';

interface AuthPageProps {
  theme: 'light' | 'dark';
}

type AuthMode = 'login' | 'register';
type CourseType = 'PRODUCER' | 'ARTIST' | 'MAKER';

const AuthPage: React.FC<AuthPageProps> = ({ theme }) => {
  const navigate = useNavigate();
  const location = useLocation();

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
    { id: 'PRODUCER' as CourseType, title: 'AI数智作曲家', desc: 'AI与算法编曲', icon: Orbit, color: PALETTE.blue },
    { id: 'ARTIST' as CourseType, title: '音乐装置艺术家', desc: '声场与交互艺术', icon: Sparkles, color: PALETTE.pink },
    { id: 'MAKER' as CourseType, title: '智创乐器家', desc: '软硬件乐器开发', icon: Atom, color: PALETTE.orange },
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
        if (r && !r.success) setErrorMsg(r.message || '登录失败');
      } else {
        const r = await doRegister({ phone, code: vCode, username: name, courseType: course || undefined });
        if (r && !r.success) setErrorMsg(r.message || '注册失败');
      }
    } catch (e: any) { setErrorMsg(e.message || '操作失败'); }
    finally { setIsAuthorizing(false); }
  };

  const getVCode = async () => {
    if (phone.length !== 11) return;
    try {
      const r = await sendSmsCode(phone);
      if (r?.success) { setCountdown(60); setErrorMsg(''); }
      else setErrorMsg(r?.message || '发送失败');
    } catch (e: any) { setErrorMsg(e.message || '发送失败'); }
  };

  const inputCls = `w-full pl-11 pr-4 py-3.5 rounded-xl border text-sm font-medium outline-none transition-all
    bg-white border-slate-200 text-slate-800 placeholder:text-slate-300
    focus:border-[#5BA4F5] focus:ring-2 focus:ring-[#5BA4F5]/10`;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-[#F5F7FA]"> 

      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] rounded-2xl overflow-hidden shadow-xl border border-slate-200 bg-white h-[580px]">

        {/* ── Left panel ── */}
        <div className="relative flex flex-col justify-between p-12 overflow-hidden bg-[#F0F4FF]">

          {/* decorative blocks — 25 blocks on a 5×5 grid, 50–150px, heavy overlap */}
          {/* col positions: -5%, 18%, 38%, 58%, 78% | row positions: -5%, 18%, 38%, 58%, 78% */}
          <div className="absolute" style={{width: 130, height: 130, top:  '-5%', left:  '-5%', background: PALETTE.pink.bg,   opacity: 0.62}} />
          <div className="absolute" style={{width:  70, height:  70, top:   '2%', left:  '20%', background: PALETTE.blue.bg,   opacity: 0.58}} />
          <div className="absolute" style={{width: 110, height: 110, top:  '-4%', left:  '38%', background: PALETTE.yellow.bg, opacity: 0.60}} />
          <div className="absolute" style={{width:  60, height:  60, top:   '4%', left:  '58%', background: PALETTE.green.bg,  opacity: 0.55}} />
          <div className="absolute" style={{width: 140, height: 140, top:  '-6%', left:  '72%', background: PALETTE.blue.bg,   opacity: 0.60}} />

          <div className="absolute" style={{width:  80, height:  80, top:  '18%', left:  '-3%', background: PALETTE.orange.bg, opacity: 0.58}} />
          <div className="absolute" style={{width: 150, height: 150, top:  '14%', left:  '14%', background: PALETTE.green.bg,   opacity: 0.55}} />
          <div className="absolute" style={{width:  65, height:  65, top:  '20%', left:  '42%', background: PALETTE.blue.bg,   opacity: 0.58}} />
          <div className="absolute" style={{width: 120, height: 120, top:  '16%', left:  '56%', background: PALETTE.orange.bg, opacity: 0.57}} />
          <div className="absolute" style={{width:  55, height:  55, top:  '22%', left:  '84%', background: PALETTE.yellow.bg, opacity: 0.55}} />

          <div className="absolute" style={{width: 140, height: 140, top:  '36%', left:  '-5%', background: PALETTE.blue.bg,   opacity: 0.57}} />
          <div className="absolute" style={{width:  60, height:  60, top:  '42%', left:  '22%', background: PALETTE.green.bg,  opacity: 0.55}} />
          <div className="absolute" style={{width: 100, height: 100, top:  '38%', left:  '36%', background: PALETTE.pink.bg,   opacity: 0.58}} />
          <div className="absolute" style={{width:  75, height:  75, top:  '40%', left:  '62%', background: PALETTE.yellow.bg, opacity: 0.55}} />
          <div className="absolute" style={{width: 130, height: 130, top:  '34%', left:  '74%', background: PALETTE.green.bg,  opacity: 0.57}} />

          <div className="absolute" style={{width:  70, height:  70, top:  '58%', left:   '0%', background: PALETTE.yellow.bg, opacity: 0.58}} />
          <div className="absolute" style={{width: 120, height: 120, top:  '54%', left:  '16%', background: PALETTE.blue.bg,   opacity: 0.57}} />
          <div className="absolute" style={{width:  55, height:  55, top:  '60%', left:  '44%', background: PALETTE.orange.bg, opacity: 0.55}} />
          <div className="absolute" style={{width: 110, height: 110, top:  '56%', left:  '58%', background: PALETTE.pink.bg,   opacity: 0.57}} />
          <div className="absolute" style={{width:  65, height:  65, top:  '62%', left:  '84%', background: PALETTE.blue.bg,   opacity: 0.55}} />

          <div className="absolute" style={{width: 150, height: 150, top:  '74%', left:  '-6%', background: PALETTE.orange.bg, opacity: 0.58}} />
          <div className="absolute" style={{width:  65, height:  65, top:  '80%', left:  '20%', background: PALETTE.pink.bg,   opacity: 0.55}} />
          <div className="absolute" style={{width: 125, height: 125, top:  '76%', left:  '36%', background: PALETTE.blue.bg,   opacity: 0.57}} />
          <div className="absolute" style={{width:  70, height:  70, top:  '82%', left:  '64%', background: PALETTE.green.bg,  opacity: 0.55}} />
          <div className="absolute" style={{width: 110, height: 110, top:  '72%', left:  '76%', background: PALETTE.yellow.bg, opacity: 0.57}} />

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
              <div className="w-9 h-9 rounded-lg overflow-hidden border border-slate-200 bg-white shadow-sm">
                <img src="/samples/logo/logo.png" alt="生音科技" className="w-full h-full object-contain" />
              </div>
              <span className="text-slate-800 font-bold text-base tracking-tight">生音科技</span>
            </div>

            <h2 className="font-black text-5xl leading-[1.1] tracking-tight mb-5 text-slate-800">
              开启你的<br />
              <span style={{color: PALETTE.blue.accent}}>音乐之旅</span>
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed max-w-[240px]">
              从零基础到专业创作，AI 驱动的个性化音乐学习平台，适合所有年龄段。
            </p>
          </div>

          <div className="relative z-10 flex gap-2 flex-wrap">
            {['零基础友好', 'AI 个性化', '全年龄段'].map((tag) => (
              <span key={tag} className="px-3 py-1 rounded-full text-xs font-semibold border"
                style={{background: PALETTE.blue.bg, color: PALETTE.blue.accent, borderColor: PALETTE.blue.accent + '33'}}>
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* ── Right panel ── */}
        <div className="px-10 py-10 flex flex-col bg-white overflow-y-auto scrollbar-hide">

          {/* header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-bold tracking-tight text-slate-800">
                {mode === 'login' ? '欢迎回来' : '创建账号'}
              </h3>
              <p className="text-xs mt-1 text-slate-400">
                {mode === 'login' ? '登录以继续你的学习' : '填写信息完成注册'}
              </p>
            </div>
            <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setErrorMsg(''); }}
              className="text-xs font-semibold flex items-center gap-1 text-slate-400 hover:text-slate-800 transition-colors">
              {mode === 'login' ? '注册账号' : '返回登录'}
              <ArrowRight size={12} />
            </button>
          </div>

          {errorMsg && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-500 text-xs font-medium">
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
                  <input type="tel" placeholder="手机号" value={phone}
                    onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                    className={inputCls} />
                </div>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <KeyRound size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                    <input type="text" placeholder="验证码" value={vCode}
                      onChange={e => setVCode(e.target.value.slice(0, 6))}
                      className={inputCls} />
                  </div>
                  <button onClick={getVCode} disabled={countdown > 0 || phone.length !== 11}
                    className={`px-4 rounded-xl text-xs font-semibold whitespace-nowrap transition-all
                      ${countdown > 0 || phone.length !== 11
                        ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
                        : 'text-white hover:opacity-90'}`}
                    style={countdown > 0 || phone.length !== 11 ? {} : {background: PALETTE.blue.accent}}>
                    {countdown > 0 ? `${countdown}s` : '获取验证码'}
                  </button>
                </div>
                <button onClick={handleAction}
                  disabled={isAuthorizing || phone.length !== 11 || vCode.length < 4}
                  className="w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all mt-1 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90"
                  style={{background: isAuthorizing || phone.length !== 11 || vCode.length < 4 ? '#cbd5e1' : '#1e293b'}}>
                  {isAuthorizing ? <Loader2 size={16} className="animate-spin" /> : <><CheckCircle2 size={16} />登录</>}
                </button>
              </div>
            )}

            {/* ── REGISTER ── */}
            {mode === 'register' && (
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest mb-2.5 text-slate-400">选择学习方向</p>
                  <div className="grid grid-cols-3 gap-2">
                    {courses.map(c => (
                      <button key={c.id} onClick={() => setCourse(c.id)}
                        className="flex flex-col items-center gap-2 p-3 rounded-xl border text-center transition-all hover:scale-[1.02]"
                        style={course === c.id
                          ? { background: c.color.bg, borderColor: c.color.accent, color: c.color.accent }
                          : { background: '#F8FAFC', borderColor: '#E2E8F0', color: '#94A3B8' }}>
                        <c.icon size={18} />
                        <span className="text-[10px] font-semibold leading-tight">{c.title}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2.5">
                  <div className="relative">
                    <User size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                    <input type="text" placeholder="姓名 / 昵称" value={name}
                      onChange={e => setName(e.target.value)} className={inputCls} />
                  </div>
                  <div className="relative">
                    <Smartphone size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                    <input type="tel" placeholder="手机号" value={phone}
                      onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                      className={inputCls} />
                  </div>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <KeyRound size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                      <input type="text" placeholder="验证码" value={vCode}
                        onChange={e => setVCode(e.target.value.slice(0, 6))} className={inputCls} />
                    </div>
                    <button onClick={getVCode} disabled={countdown > 0 || phone.length !== 11}
                      className={`px-4 rounded-xl text-xs font-semibold whitespace-nowrap transition-all
                        ${countdown > 0 || phone.length !== 11
                          ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
                          : 'text-white hover:opacity-90'}`}
                      style={countdown > 0 || phone.length !== 11 ? {} : {background: PALETTE.blue.accent}}>
                      {countdown > 0 ? `${countdown}s` : '获取验证码'}
                    </button>
                  </div>
                </div>
                <button onClick={handleAction}
                  disabled={isAuthorizing || !course || !name || phone.length !== 11 || vCode.length < 4}
                  className="w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all text-white disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90"
                  style={{background: '#1e293b'}}>
                  {isAuthorizing ? <Loader2 size={16} className="animate-spin" /> : <><CheckCircle2 size={16} />完成注册</>}
                </button>
              </div>
            )}
          </div>

          {/* footer */}
          <div className="mt-auto pt-5 border-t border-slate-100 flex items-center justify-center">
            <p className="text-[10px] text-slate-300">
              登录即同意
              <span className="cursor-pointer hover:underline mx-1 text-slate-500">服务协议</span>
              及
              <span className="cursor-pointer hover:underline mx-1 text-slate-500">隐私政策</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
