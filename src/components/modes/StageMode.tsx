import React, { useState, useEffect } from 'react';
import { Play, Pause, Heart, Share2, Music2, User, X } from 'lucide-react';
import { PALETTE } from '../../constants/palette';

interface StageModeProps { theme?: 'light' | 'dark'; }
interface LyricLine { time: number; text: string; }
interface SongData {
  id: string; title: string; author: string; description: string;
  likes: number; liked: boolean; icon: string;
  accentKey: keyof typeof PALETTE; lyrics: LyricLine[];
}

const INITIAL_SONGS: SongData[] = [
  {
    id: '1', title: '夏日微风', author: '小乐', accentKey: 'blue',
    description: '这首歌用了清脆的铃声，听起来就像在海边吹着凉爽的风，带你逃离炎热的午后。',
    likes: 124, liked: false, icon: '🌊',
    lyrics: [
      { time: 0, text: '金色的阳光 洒在海面上' }, { time: 3, text: '微风轻轻吹 掠过我脸庞' },
      { time: 6, text: '海浪在歌唱 烦恼都忘光' }, { time: 9, text: '夏日的约定 就在这远方' },
      { time: 12, text: '啦啦啦~ 快乐的时光' },
    ],
  },
  {
    id: '2', title: '月光跳跃', author: '莎莎', accentKey: 'pink',
    description: '灵感来自夜晚在草丛里跳跃的小兔子，节奏非常欢快，充满了童真与想象。',
    likes: 245, liked: true, icon: '🐰',
    lyrics: [
      { time: 0, text: '月亮圆圆 挂在云端' }, { time: 3, text: '小兔跳跳 穿过森林' },
      { time: 6, text: '星光点点 闪闪发亮' }, { time: 9, text: '梦境甜甜 就要降临' },
      { time: 12, text: '蹦蹦跳~ 快乐不停' },
    ],
  },
  {
    id: '3', title: '恐龙舞步', author: '大壮', accentKey: 'green',
    description: '超酷的低音底鼓！模仿霸王龙走路的声音，每一步都踏在节拍上，震撼感十足。',
    likes: 89, liked: false, icon: '🦖',
    lyrics: [
      { time: 0, text: '大地在颤抖 咚 咚 咚' }, { time: 3, text: '巨龙在跳舞 吼 吼 吼' },
      { time: 6, text: '有力的脚步 充满节奏' }, { time: 9, text: '森林的霸主 谁敢不服' },
      { time: 12, text: '看我最强的 恐龙舞步' },
    ],
  },
];

const FILTERS = [
  { id: 'all',   label: '全部作品' },
  { id: 'blue',  label: '清新系' },
  { id: 'pink',  label: '梦幻系' },
  { id: 'green', label: '自然系' },
] as const;

type FilterId = typeof FILTERS[number]['id'];

const StageMode: React.FC<StageModeProps> = () => {
  const [songs, setSongs] = useState<SongData[]>(INITIAL_SONGS);
  const [activeSong, setActiveSong] = useState<SongData | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [activeFilter, setActiveFilter] = useState<FilterId>('all');
  const duration = 15;

  useEffect(() => {
    if (!isPlaying || !activeSong) return;
    const interval = setInterval(() => {
      setCurrentTime(prev => (prev >= duration ? 0 : prev + 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [isPlaying, activeSong]);

  const toggleLike = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSongs(prev => prev.map(s =>
      s.id === id ? { ...s, liked: !s.liked, likes: s.liked ? s.likes - 1 : s.likes + 1 } : s
    ));
  };

  const handlePlay = (song: SongData) => {
    if (activeSong?.id === song.id) { setIsPlaying(p => !p); }
    else { setActiveSong(song); setIsPlaying(true); setCurrentTime(0); }
  };

  const getCurrentLyric = () => {
    if (!activeSong) return '';
    const line = [...activeSong.lyrics].reverse().find(l => currentTime >= l.time);
    return line ? line.text : activeSong.lyrics[0].text;
  };

  const filtered = activeFilter === 'all'
    ? songs
    : songs.filter(s => s.accentKey === activeFilter);

  const [featured, ...rest] = filtered;

  return (
    <div className="bg-[#F5F7FA]">
      <div className="max-w-7xl mx-auto px-6 pb-36">

        {/* ── Hero ── */}
        <div className="pt-8 pb-4">
          <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: PALETTE.pink.accent }}>
            Stage · 作品发布会
          </p>
          <h1 className="text-5xl font-black leading-[1.1] tracking-tight text-slate-800 mb-2">
            发布你的<br />
            <span style={{ color: PALETTE.pink.accent }}>第一首单曲</span>
          </h1>
          <p className="text-sm font-medium text-slate-400 max-w-sm leading-relaxed">
            把你的音乐分享给所有人
          </p>
        </div>

        {/* ── Filter tabs ── */}
        <div className="flex items-center gap-2 py-3">
          {FILTERS.map(f => {
            const active = activeFilter === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setActiveFilter(f.id)}
                className="px-4 py-2 rounded-full text-xs font-semibold transition-all"
                style={active
                  ? { background: '#1e293b', color: '#fff' }
                  : { background: 'white', color: '#94A3B8' }
                }
              >
                {f.label}
              </button>
            );
          })}
          <div className="flex-1" />
          <span className="text-xs font-semibold text-slate-300">{filtered.length} 首作品</span>
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-24">
            <Music2 size={32} className="text-slate-200 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-400">暂无相关作品</p>
          </div>
        )}

        {/* ── Featured card ── */}
        {featured && (
          <div className="mb-6">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-3">编辑精选</p>
            <div
              className="group bg-white rounded-2xl overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.04)] cursor-pointer transition-all hover:shadow-[0_4px_20px_rgba(0,0,0,0.07)] hover:-translate-y-0.5"
              onClick={() => handlePlay(featured)}
            >
              <div className="grid grid-cols-[2fr_3fr]">
                {/* Cover */}
                <div
                  className="relative flex items-center justify-center text-7xl min-h-[160px]"
                  style={{ background: PALETTE[featured.accentKey].bg }}
                >
                  <span className={activeSong?.id === featured.id && isPlaying ? 'animate-pulse' : ''}>{featured.icon}</span>
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-white/40 backdrop-blur-sm transition-opacity">
                    {activeSong?.id === featured.id && isPlaying
                      ? <Pause size={36} style={{ color: PALETTE[featured.accentKey].accent }} />
                      : <Play size={36} style={{ color: PALETTE[featured.accentKey].accent }} />
                    }
                  </div>
                  <span
                    className="absolute top-3 left-3 text-[10px] font-semibold uppercase tracking-widest px-2.5 py-1 rounded-full"
                    style={{ background: 'white', color: PALETTE[featured.accentKey].accent }}
                  >
                    精选
                  </span>
                  {activeSong?.id === featured.id && (
                    <div
                      className="absolute bottom-0 left-0 right-0 h-0.5 transition-all duration-1000"
                      style={{ background: PALETTE[featured.accentKey].accent, width: `${(currentTime / duration) * 100}%` }}
                    />
                  )}
                </div>
                {/* Info */}
                <div className="p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <User size={11} className="text-slate-300" />
                      <span className="text-xs font-semibold text-slate-400">{featured.author}</span>
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-800 mb-2">{featured.title}</h2>
                    <p className="text-sm font-medium text-slate-400 leading-relaxed">{featured.description}</p>
                  </div>
                  <div className="flex items-center justify-between mt-4">
                    <button
                      onClick={e => toggleLike(featured.id, e)}
                      className="flex items-center gap-2 text-xs font-semibold transition-all hover:scale-105"
                      style={{ color: songs.find(s => s.id === featured.id)?.liked ? PALETTE.pink.accent : '#CBD5E1' }}
                    >
                      <Heart size={15} fill={songs.find(s => s.id === featured.id)?.liked ? 'currentColor' : 'none'} />
                      {songs.find(s => s.id === featured.id)?.likes}
                    </button>
                    <button
                      onClick={e => e.stopPropagation()}
                      className="p-2 rounded-xl bg-slate-50 text-slate-300 hover:text-slate-500 transition-all"
                    >
                      <Share2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Rest grid ── */}
        {rest.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-3">更多作品</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {rest.map(song => {
                const color = PALETTE[song.accentKey];
                const isActive = activeSong?.id === song.id;
                const likedSong = songs.find(s => s.id === song.id)!;
                return (
                  <div
                    key={song.id}
                    className="group bg-white rounded-2xl overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.03)] cursor-pointer transition-all hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] hover:-translate-y-0.5"
                    onClick={() => handlePlay(song)}
                  >
                    {/* Cover */}
                    <div
                      className="relative flex items-center justify-center text-5xl aspect-[4/2]"
                      style={{ background: isActive ? color.bg : color.bg + 'cc' }}
                    >
                      <span className={isActive && isPlaying ? 'animate-pulse' : ''}>{song.icon}</span>
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-white/40 backdrop-blur-sm transition-opacity">
                        {isActive && isPlaying
                          ? <Pause size={28} style={{ color: color.accent }} />
                          : <Play size={28} style={{ color: color.accent }} />
                        }
                      </div>
                      <span
                        className="absolute top-2.5 left-2.5 text-[9px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded-full"
                        style={{ background: 'white', color: color.accent }}
                      >
                        {song.accentKey === 'blue' ? '清新' : song.accentKey === 'pink' ? '梦幻' : '自然'}
                      </span>
                      {isActive && (
                        <div
                          className="absolute bottom-0 left-0 h-0.5 transition-all duration-1000"
                          style={{ width: `${(currentTime / duration) * 100}%`, background: color.accent }}
                        />
                      )}
                    </div>
                    {/* Info */}
                    <div className="p-4">
                      <div className="flex items-center gap-1.5 mb-1">
                        <User size={10} className="text-slate-300" />
                        <span className="text-[10px] font-semibold text-slate-400">{song.author}</span>
                      </div>
                      <h3 className="text-base font-bold tracking-tight text-slate-800 mb-1">{song.title}</h3>
                      <p className="text-xs font-medium text-slate-400 leading-relaxed line-clamp-2 mb-3">{song.description}</p>
                      <div className="flex items-center justify-between">
                        <button
                          onClick={e => toggleLike(song.id, e)}
                          className="flex items-center gap-1.5 text-xs font-semibold transition-all hover:scale-105"
                          style={{ color: likedSong.liked ? PALETTE.pink.accent : '#CBD5E1' }}
                        >
                          <Heart size={13} fill={likedSong.liked ? 'currentColor' : 'none'} />
                          {likedSong.likes}
                        </button>
                        <button
                          onClick={e => e.stopPropagation()}
                          className="p-1.5 rounded-lg bg-slate-50 text-slate-300 hover:text-slate-500 transition-all"
                        >
                          <Share2 size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Mini player ── */}
      {activeSong && (
        <div className="fixed bottom-0 left-[72px] right-0 z-[110] p-4">
          <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] overflow-hidden">
            <div className="h-0.5 bg-slate-100">
              <div
                className="h-full transition-all duration-1000"
                style={{ width: `${(currentTime / duration) * 100}%`, background: PALETTE[activeSong.accentKey].accent }}
              />
            </div>
            <div className="px-5 py-3.5 flex items-center gap-4">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                style={{ background: PALETTE[activeSong.accentKey].bg }}
              >
                {activeSong.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-800 truncate">{activeSong.title}</p>
                <p className="text-[10px] font-semibold truncate" style={{ color: PALETTE[activeSong.accentKey].accent }}>
                  {getCurrentLyric()}
                </p>
              </div>
              <button
                onClick={() => setIsPlaying(p => !p)}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-white transition-all hover:opacity-90 active:scale-95 flex-shrink-0"
                style={{ background: '#1e293b' }}
              >
                {isPlaying ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
              </button>
              <button
                onClick={() => { setActiveSong(null); setIsPlaying(false); }}
                className="p-2 rounded-xl bg-slate-50 text-slate-400 hover:text-slate-600 transition-all flex-shrink-0"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StageMode;
