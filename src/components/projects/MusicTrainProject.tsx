
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Check, TrainFront, Play, Pause, Sparkles, Trash2, Zap, Wind, Music2, Sticker, Repeat, Ghost, CloudFog, Bot, Radio, ZapOff } from 'lucide-react';
import { audioService } from '../../services/audioService';
import { NOTES, CHORDS } from '../../utils/musicNotes';

type SectionType = 'INTRO' | 'VERSE' | 'CHORUS' | 'BRIDGE' | 'OUTRO' | 'EMPTY';

interface TrainCarConfig {
  type: SectionType;
  name: string;
  color: string;
  icon: React.ReactNode;
  desc: string;
}

const CAR_CONFIGS: Record<SectionType, TrainCarConfig> = {
  INTRO: { type: 'INTRO', name: '星际引擎', color: 'bg-indigo-600', icon: <TrainFront size={32} />, desc: '启动能量，准备出发' },
  VERSE: { type: 'VERSE', name: '故事货舱', color: 'bg-sky-500', icon: <Wind size={32} />, desc: '平稳航行，讲述故事' },
  CHORUS: { type: 'CHORUS', name: '跃迁动力', color: 'bg-orange-500', icon: <Zap size={32} />, desc: '情感爆发，全速前进' },
  BRIDGE: { type: 'BRIDGE', name: '虫洞隧道', color: 'bg-purple-600', icon: <Sparkles size={32} />, desc: '时空转折，意想不到' },
  OUTRO: { type: 'OUTRO', name: '着陆尾翼', color: 'bg-slate-700', icon: <ZapOff size={32} />, desc: '能量回收，平稳降落' },
  EMPTY: { type: 'EMPTY', name: '空余轨道', color: 'bg-transparent', icon: null, desc: '等待挂载' },
};

const MusicTrainProject: React.FC<{ onComplete: () => void; onBack: () => void; theme?: 'light' | 'dark' }> = ({ onComplete, onBack, theme = 'dark' }) => {
  const [track, setTrack] = useState<SectionType[]>(['INTRO', 'EMPTY', 'EMPTY', 'EMPTY', 'EMPTY', 'OUTRO']);
  const [fills, setFills] = useState<boolean[]>(new Array(5).fill(false)); 
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentCarIdx, setCurrentCarIdx] = useState(-1);
  const [isTunnelActive, setIsTunnelActive] = useState(false);
  const isDark = theme === 'dark';

  const timerRef = useRef<number | null>(null);

  // 使用统一的音符系统
  const notes = {
    C2: NOTES.C2,
    E2: NOTES.E2,
    G2: NOTES.G2,
    A2: NOTES.A2,
    A1: NOTES.A1,
    G4: NOTES.G4,
  };

  const playSegmentSound = useCallback((type: SectionType, hasFill: boolean) => {
    switch(type) {
      case 'INTRO': 
        audioService.playPianoNote(notes.C2, 1.5, 0.6);
        break; 
      case 'VERSE': 
        audioService.playPianoNote(notes.E2, 0.8, 0.4);
        break;   
      case 'CHORUS': 
        audioService.playPianoNote(notes.G2, 0.6, 0.7);
        // 添加高音装饰
        setTimeout(() => {
          audioService.playPianoNote(notes.G4, 0.4, 0.3);
        }, 100);
        break; 
      case 'BRIDGE': 
        audioService.playPianoNote(notes.A2, 2.0, 0.5);
        break;   
      case 'OUTRO': 
        audioService.playPianoNote(notes.A1, 2.5, 0.4);
        break;
    }

    if (hasFill) {
      // 添加鼓点装饰
      setTimeout(() => {
        audioService.playDrum('kick');
      }, 600);
      setTimeout(() => {
        audioService.playDrum('snare');
      }, 720);
      setTimeout(() => {
        audioService.playDrum('hihat');
      }, 840);
    }
  }, [notes]);

  useEffect(() => {
    if (isPlaying) {
      timerRef.current = window.setInterval(() => {
        setCurrentCarIdx(prev => {
          const next = (prev + 1) % track.length;
          const type = track[next];
          setIsTunnelActive(type === 'BRIDGE');
          if (type !== 'EMPTY') playSegmentSound(type, fills[next]);
          return next;
        });
      }, 1200);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setCurrentCarIdx(-1);
      setIsTunnelActive(false);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isPlaying, track, fills, playSegmentSound]);

  const placeModule = (type: SectionType) => {
    const firstEmpty = track.indexOf('EMPTY');
    if (firstEmpty !== -1) {
      const newTrack = [...track];
      newTrack[firstEmpty] = type;
      setTrack(newTrack);
    }
  };

  const clearCar = (idx: number) => {
    if (idx === 0 || idx === track.length - 1) return;
    const newTrack = [...track];
    newTrack[idx] = 'EMPTY';
    setTrack(newTrack);
  };

  return (
    <div className={`fixed inset-0 z-[200] flex flex-col transition-all duration-1000 overflow-hidden ${isTunnelActive ? 'bg-purple-950' : isDark ? 'bg-slate-950' : 'bg-blue-50'}`}>
      
      {/* 星际背景 */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className={`absolute inset-0 transition-opacity duration-1000 ${isTunnelActive ? 'opacity-40' : 'opacity-10'}`}>
           <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.3)_0%,transparent_70%)] animate-pulse" />
           {[...Array(30)].map((_, i) => (
             <div key={i} className="absolute bg-white rounded-full animate-ping" style={{ 
               width: Math.random() * 3, 
               height: Math.random() * 3, 
               top: Math.random() * 100 + '%', 
               left: Math.random() * 100 + '%' 
             }} />
           ))}
        </div>
      </div>

      <header className={`relative z-10 p-8 flex items-center justify-between transition-colors border-b backdrop-blur-xl ${isDark ? 'bg-slate-900/60 border-white/5' : 'bg-white/60 border-blue-100'}`}>
        <div className="flex items-center gap-6">
          <button onClick={onBack} className={`p-4 rounded-2xl transition-all ${isDark ? 'bg-white/5 text-slate-400 hover:text-white' : 'bg-white border border-blue-100 text-blue-600'}`}>
            <X size={24} />
          </button>
          <div>
            <h2 className={`text-2xl font-black tracking-tight ${isTunnelActive ? 'text-purple-400' : isDark ? 'text-white' : 'text-blue-950'}`}>L13 · 音乐火车组装</h2>
            <p className={`text-[10px] font-black uppercase tracking-[0.3em] mt-1 ${isTunnelActive ? 'text-purple-300' : isDark ? 'text-blue-400' : 'text-blue-600'}`}>INTERSTELLAR VOYAGE</p>
          </div>
        </div>
        
        <button 
          disabled={track.includes('EMPTY')}
          onClick={onComplete}
          className={`px-10 py-4 rounded-2xl font-black text-sm text-white transition-all ${!track.includes('EMPTY') ? 'bg-emerald-600 scale-105 hover:bg-emerald-500' : 'bg-slate-400 opacity-50 cursor-not-allowed'}`}
        >
          发车！我的大作 <Check size={18} className="ml-2 inline" />
        </button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-8 relative z-10 gap-12">
        
        {/* 车厢仓库 */}
        <div className="flex flex-col items-center gap-4">
           <h3 className={`text-xs font-black uppercase tracking-[0.4em] opacity-40 flex items-center gap-2 ${isDark ? 'text-white' : 'text-blue-900'}`}>
             <Radio size={16} /> 点击挂载核心舱
           </h3>
           <div className="flex gap-4">
              {(['VERSE', 'CHORUS', 'BRIDGE'] as SectionType[]).map(type => (
                <button 
                  key={type}
                  onClick={() => placeModule(type)}
                  className={`group px-6 py-4 rounded-[2rem] border-4 flex items-center gap-4 transition-all hover:scale-105 active:scale-95 ${CAR_CONFIGS[type].color} border-white text-white`}
                >
                   <div className="p-2 bg-white/20 rounded-xl group-hover:rotate-12 transition-transform">
                      {CAR_CONFIGS[type].icon}
                   </div>
                   <div className="text-left">
                      <div className="font-black text-sm leading-none">{CAR_CONFIGS[type].name}</div>
                      <div className="text-[8px] font-bold opacity-60 uppercase tracking-widest mt-1">Deploy</div>
                   </div>
                </button>
              ))}
           </div>
        </div>

        {/* 铁轨列车 */}
        <div className="w-full max-w-7xl flex flex-col items-center">
           
           {/* 播放助手小机器人 */}
           <div className="w-full h-20 relative">
              {currentCarIdx !== -1 && (
                <div 
                  className="absolute bottom-0 transition-all duration-1200 ease-linear flex flex-col items-center w-40"
                  style={{ left: `calc(${currentCarIdx} * (10rem + 2.5rem) + 4rem)` }}
                >
                   <div className="bg-blue-500 text-white p-2 rounded-xl animate-bounce mb-2 border-2 border-white">
                      <Bot size={24} />
                   </div>
                   <div className="w-1 h-8 bg-gradient-to-t from-transparent to-blue-500/50" />
                </div>
              )}
           </div>

           <div className="flex items-end justify-center px-10 gap-2 relative">
              {/* 激光铁轨 */}
              <div className="absolute bottom-10 left-0 right-0 h-1 bg-blue-500/20 z-0 mx-20 blur-sm" />
              <div className="absolute bottom-10 left-0 right-0 h-[1px] bg-blue-400 z-0 mx-20 opacity-50" />

              {track.map((type, idx) => {
                const car = CAR_CONFIGS[type];
                const isActive = currentCarIdx === idx;
                const isLast = idx === track.length - 1;
                const isFirst = idx === 0;

                return (
                  <React.Fragment key={idx}>
                    <div className="flex flex-col items-center gap-6 group z-10">
                       <div className="relative">
                          {/* 只有车头有装饰 */}
                          {isFirst && (
                            <div className="absolute -top-10 left-1/2 -translate-x-1/2">
                               <div className={`w-8 h-10 bg-slate-800 rounded-t-lg transition-all relative ${isActive ? 'animate-bounce' : ''}`}>
                                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex flex-col gap-1 items-center">
                                     {isActive && [1,2,3].map(i => (
                                       <div key={i} className="w-2 h-2 bg-white rounded-full animate-ping" style={{ animationDelay: `${i*0.2}s` }} />
                                     ))}
                                  </div>
                               </div>
                            </div>
                          )}

                          <button 
                            onClick={() => clearCar(idx)}
                            className={`
                              relative w-40 h-44 transition-all duration-500 flex flex-col items-center justify-center gap-4 border-4
                              ${car.type === 'EMPTY' ? 'bg-white/5 border-dashed border-slate-500/40 rounded-[2rem]' : `${car.color} border-white scale-100`}
                              ${isFirst ? 'rounded-l-[4rem] rounded-r-[1.5rem] w-48 bg-indigo-700' : ''}
                              ${isLast ? 'rounded-r-[4rem] rounded-l-[1.5rem] w-48 bg-slate-800' : ''}
                              ${!isFirst && !isLast && car.type !== 'EMPTY' ? 'rounded-[1.5rem]' : ''}
                              ${isActive ? 'scale-110 ring-8 ring-blue-500/20 z-20' : ''}
                            `}
                          >
                             <div className={`transition-all duration-500 ${isActive ? 'rotate-12 scale-110' : ''} text-white`}>
                                {car.icon}
                             </div>
                             <div className="text-center text-white">
                                <div className="text-[10px] font-black uppercase tracking-widest">{car.name}</div>
                                {car.type !== 'EMPTY' && <div className="text-[8px] opacity-40 mt-1 uppercase">Sectors Active</div>}
                             </div>

                             {/* 车轮：离子推进器造型 */}
                             <div className={`absolute -bottom-3 left-8 w-6 h-6 rounded-full bg-slate-900 border-2 border-white flex items-center justify-center`}>
                                <div className={`w-2 h-2 rounded-full transition-all ${isActive ? 'bg-blue-400 animate-pulse' : 'bg-slate-700'}`} />
                             </div>
                             <div className={`absolute -bottom-3 right-8 w-6 h-6 rounded-full bg-slate-900 border-2 border-white flex items-center justify-center`}>
                                <div className={`w-2 h-2 rounded-full transition-all ${isActive ? 'bg-blue-400 animate-pulse' : 'bg-slate-700'}`} />
                             </div>
                             
                             {/* 尾部喷火 */}
                             {isLast && isActive && (
                               <div className="absolute -right-10 top-1/2 -translate-y-1/2 flex gap-1">
                                  {[1,2].map(i => <div key={i} className="w-8 h-2 bg-rose-500/50 blur-sm animate-pulse" />)}
                               </div>
                             )}

                             {!isFirst && !isLast && type !== 'EMPTY' && (
                               <div className="absolute -top-3 -right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <div className="bg-rose-500 text-white p-2 rounded-full border-2 border-white"><Trash2 size={14} /></div>
                               </div>
                             )}
                          </button>
                       </div>
                       <span className={`text-[9px] font-black uppercase tracking-[0.4em] transition-all ${isActive ? 'text-blue-500 opacity-100' : 'opacity-20'}`}>
                         {isFirst ? 'IGNITION' : isLast ? 'LANDING' : `SEC ${idx}`}
                       </span>
                    </div>

                    {!isLast && (
                      <div className="h-44 flex items-center px-1">
                         <div className="w-10 h-1 bg-blue-500/10 relative">
                            <button 
                              onClick={() => {
                                const newFills = [...fills];
                                newFills[idx] = !newFills[idx];
                                setFills(newFills);
                                initAudio();
                              }}
                              className={`
                                absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-2xl flex items-center justify-center transition-all border-2
                                ${fills[idx] ? 'bg-yellow-400 text-white border-white rotate-[-12deg] scale-110' : 'bg-slate-200 border-slate-300 text-slate-400 hover:bg-slate-300'}
                              `}
                            >
                               <Sticker size={20} className={fills[idx] ? 'animate-pulse' : ''} />
                            </button>
                         </div>
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
           </div>
        </div>

        {/* 播放/暂停控制 */}
        <button 
          onClick={() => { initAudio(); setIsPlaying(!isPlaying); }}
          className={`w-24 h-24 rounded-[3rem] flex items-center justify-center transition-all border-4 ${isPlaying ? 'bg-rose-500 border-rose-400' : 'bg-blue-600 border-blue-400'} text-white ring-8 ring-blue-500/10 z-20 active:scale-95`}
        >
           {isPlaying ? <Pause size={40} fill="currentColor" /> : <Play size={40} fill="currentColor" className="ml-2" />}
        </button>

        {/* 底部信息提示 */}
        <div className={`p-8 rounded-[3rem] border-4 border-dashed transition-all flex items-center gap-6 max-w-2xl ${isTunnelActive ? 'bg-purple-900/40 border-purple-400/40' : 'bg-white/5 border-white/10'}`}>
           <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white ${isTunnelActive ? 'bg-purple-600' : 'bg-indigo-600'}`}>
              <Radio size={24} />
           </div>
           <div className="flex-1">
              <h5 className={`font-black text-sm mb-1 ${isDark ? 'text-white' : 'text-blue-900'}`}>任务指南</h5>
              <p className={`text-xs font-medium leading-relaxed ${isDark || isTunnelActive ? 'text-slate-400' : 'text-slate-600'}`}>
                {isTunnelActive 
                  ? "检测到强烈引力波动！秘密隧道中声音会发生奇妙的形变。记得在出口处挂载“Fusion Core”衔接后续推力！" 
                  : "挂载中间舱段，确保动力衔接。点击缝隙处的贴纸可以添加转场鼓点。"}
              </p>
           </div>
        </div>

      </main>

      <footer className={`h-14 flex items-center justify-center transition-colors border-t ${isDark ? 'bg-black/40 border-white/5' : 'bg-white border-blue-100'}`}>
         <div className="flex items-center gap-3 opacity-30">
            <Music2 size={14} />
            <p className="text-[9px] font-black uppercase tracking-[0.8em]">Voyage Sequencer v5.2 · Synthesis: Pulse/Sawtooth/Sine</p>
         </div>
      </footer>
    </div>
  );
};

export default MusicTrainProject;
