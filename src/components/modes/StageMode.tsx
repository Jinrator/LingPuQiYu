import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Heart, ChevronLeft, ChevronRight, SkipBack, SkipForward, Disc3, Search, X } from 'lucide-react';
import { PALETTE } from '../../constants/palette';

interface StageModeProps { theme?: 'light' | 'dark'; }
interface LyricLine { time: number; text: string; }
interface SongData {
  id: string; title: string; author: string; description: string;
  likes: number; liked: boolean; icon: string;
  accentKey: keyof typeof PALETTE; lyrics: LyricLine[];
  tag?: string;
}

const ALL_SONGS: SongData[] = [
  {
    id: '1', title: '夏日微风', author: '小乐', accentKey: 'blue', tag: '清新',
    description: '清脆的铃声，像在海边吹着凉爽的风',
    likes: 124, liked: false, icon: '🌊',
    lyrics: [
      { time: 0, text: '金色的阳光 洒在海面上' }, { time: 3, text: '微风轻轻吹 掠过我脸庞' },
      { time: 6, text: '海浪在歌唱 烦恼都忘光' }, { time: 9, text: '夏日的约定 就在这远方' },
      { time: 12, text: '啦啦啦~ 快乐的时光' },
    ],
  },
  {
    id: '2', title: '月光跳跃', author: '莎莎', accentKey: 'pink', tag: '梦幻',
    description: '灵感来自夜晚在草丛里跳跃的小兔子',
    likes: 245, liked: true, icon: '🐰',
    lyrics: [
      { time: 0, text: '月亮圆圆 挂在云端' }, { time: 3, text: '小兔跳跳 穿过森林' },
      { time: 6, text: '星光点点 闪闪发亮' }, { time: 9, text: '梦境甜甜 就要降临' },
      { time: 12, text: '蹦蹦跳~ 快乐不停' },
    ],
  },
  {
    id: '3', title: '恐龙舞步', author: '大壮', accentKey: 'green', tag: '自然',
    description: '模仿霸王龙走路的声音，震撼感十足',
    likes: 89, liked: false, icon: '🦖',
    lyrics: [
      { time: 0, text: '大地在颤抖 咚 咚 咚' }, { time: 3, text: '巨龙在跳舞 吼 吼 吼' },
      { time: 6, text: '有力的脚步 充满节奏' }, { time: 9, text: '森林的霸主 谁敢不服' },
      { time: 12, text: '看我最强的 恐龙舞步' },
    ],
  },
  {
    id: '4', title: '星空列车', author: '小星', accentKey: 'yellow', tag: '奇幻',
    description: '坐上星空列车，穿越银河系的奇妙旅程',
    likes: 312, liked: false, icon: '🚂',
    lyrics: [
      { time: 0, text: '列车出发了 驶向星空' }, { time: 3, text: '窗外的星星 闪闪发光' },
      { time: 6, text: '银河在脚下 梦想在远方' }, { time: 9, text: '每一站都有 新的希望' },
      { time: 12, text: '嘟嘟嘟~ 星空列车' },
    ],
  },
  {
    id: '5', title: '彩虹糖果', author: '甜甜', accentKey: 'orange', tag: '甜蜜',
    description: '甜甜的旋律，像吃了一颗彩虹糖',
    likes: 198, liked: true, icon: '🍬',
    lyrics: [
      { time: 0, text: '红橙黄绿蓝 彩虹的颜色' }, { time: 3, text: '每一颗糖果 都是快乐' },
      { time: 6, text: '甜蜜的味道 在嘴里融化' }, { time: 9, text: '分享给朋友 一起欢笑' },
      { time: 12, text: '啦啦啦~ 彩虹糖果' },
    ],
  },
  {
    id: '6', title: '森林精灵', author: '小叶', accentKey: 'green', tag: '自然',
    description: '森林深处传来的神秘旋律',
    likes: 156, liked: false, icon: '🧚',
    lyrics: [
      { time: 0, text: '树叶沙沙响 风在歌唱' }, { time: 3, text: '小精灵飞舞 在花丛中' },
      { time: 6, text: '露珠是琴弦 蘑菇是鼓' }, { time: 9, text: '森林音乐会 正在进行' },
      { time: 12, text: '叮叮咚~ 精灵之歌' },
    ],
  },
  {
    id: '7', title: '机器人派对', author: '阿铁', accentKey: 'blue', tag: '电子',
    description: '嘀嘀嗒嗒的电子节拍，机器人也会跳舞',
    likes: 203, liked: false, icon: '🤖',
    lyrics: [
      { time: 0, text: '嘀嘀嗒嗒 电子心跳' }, { time: 3, text: '机器人们 排好队形' },
      { time: 6, text: '灯光闪烁 舞池旋转' }, { time: 9, text: '今晚的派对 嗨到天亮' },
      { time: 12, text: '哔哔哔~ 机器人舞' },
    ],
  },
  {
    id: '8', title: '海底冒险', author: '小鱼', accentKey: 'blue', tag: '清新',
    description: '潜入深海，和鱼群一起游泳的冒险曲',
    likes: 167, liked: false, icon: '🐠',
    lyrics: [
      { time: 0, text: '蓝色的海洋 深不见底' }, { time: 3, text: '珊瑚在招手 水母在跳舞' },
      { time: 6, text: '小丑鱼带路 穿过海藻' }, { time: 9, text: '海底的宝藏 等你发现' },
      { time: 12, text: '咕噜噜~ 海底世界' },
    ],
  },
];

const BANNER_ITEMS = [
  { id: '1', title: '本周新歌榜', subtitle: '最受欢迎的新作品', colorKey: 'blue' as keyof typeof PALETTE, icon: '🏆' },
  { id: '2', title: '编辑精选集', subtitle: '老师推荐的优秀作品', colorKey: 'pink' as keyof typeof PALETTE, icon: '⭐' },
  { id: '3', title: '创作挑战赛', subtitle: '用三个音符写一首歌', colorKey: 'orange' as keyof typeof PALETTE, icon: '🎯' },
];

const PLAYLISTS = [
  { id: 'chill', name: '放松时刻', icon: '☁️', colorKey: 'blue' as keyof typeof PALETTE, count: 12 },
  { id: 'energy', name: '活力满满', icon: '⚡', colorKey: 'orange' as keyof typeof PALETTE, count: 8 },
  { id: 'dream', name: '梦幻之旅', icon: '🌙', colorKey: 'pink' as keyof typeof PALETTE, count: 15 },
  { id: 'nature', name: '自然之声', icon: '🌿', colorKey: 'green' as keyof typeof PALETTE, count: 10 },
  { id: 'party', name: '派对时间', icon: '🎉', colorKey: 'yellow' as keyof typeof PALETTE, count: 6 },
];

const StageMode: React.FC<StageModeProps> = () => {
  const [songs, setSongs] = useState<SongData[]>(ALL_SONGS);
  const [activeSong, setActiveSong] = useState<SongData | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [showFullPlayer, setShowFullPlayer] = useState(false);
  const [bannerIndex, setBannerIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const bannerRef = useRef<HTMLDivElement>(null);
  const duration = 15;

  // Auto-rotate banner
  useEffect(() => {
    const timer = setInterval(() => {
      setBannerIndex(prev => (prev + 1) % BANNER_ITEMS.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  // Playback timer
  useEffect(() => {
    if (!isPlaying || !activeSong) return;
    const interval = setInterval(() => {
      setCurrentTime(prev => (prev >= duration ? 0 : prev + 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [isPlaying, activeSong]);

  const toggleLike = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSongs(prev => prev.map(s =>
      s.id === id ? { ...s, liked: !s.liked, likes: s.liked ? s.likes - 1 : s.likes + 1 } : s
    ));
    if (activeSong?.id === id) {
      setActiveSong(prev => prev ? { ...prev, liked: !prev.liked, likes: prev.liked ? prev.likes - 1 : prev.likes + 1 } : null);
    }
  };

  const handlePlay = (song: SongData) => {
    if (activeSong?.id === song.id) { setIsPlaying(p => !p); }
    else { setActiveSong(song); setIsPlaying(true); setCurrentTime(0); }
  };

  const playNext = () => {
    if (!activeSong) return;
    const idx = songs.findIndex(s => s.id === activeSong.id);
    const next = songs[(idx + 1) % songs.length];
    setActiveSong(next); setIsPlaying(true); setCurrentTime(0);
  };

  const playPrev = () => {
    if (!activeSong) return;
    const idx = songs.findIndex(s => s.id === activeSong.id);
    const prev = songs[(idx - 1 + songs.length) % songs.length];
    setActiveSong(prev); setIsPlaying(true); setCurrentTime(0);
  };

  const getCurrentLyric = () => {
    if (!activeSong) return '';
    const line = [...activeSong.lyrics].reverse().find(l => currentTime >= l.time);
    return line ? line.text : activeSong.lyrics[0].text;
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  const hotSongs = [...songs].sort((a, b) => b.likes - a.likes).slice(0, 5);
  const newSongs = songs.slice(0, 4);
  const likedSong = (id: string) => songs.find(s => s.id === id)!;

  return (
    <div className="bg-[#F5F7FA]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-36">

        {/* ── Search ── */}
        <div className="relative pt-4 sm:pt-6 pb-3">
          <div className="relative z-20">
            <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="搜索歌曲、作者..."
              className="w-full pl-11 pr-10 py-3 rounded-xl border text-sm font-medium outline-none transition-all bg-white border-slate-200 text-slate-800 placeholder:text-slate-300 focus:border-[#5BA4F5] focus:ring-2 focus:ring-[#5BA4F5]/10"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-all"
              >
                <X size={14} />
              </button>
            )}
          </div>
          {/* Search results — floating overlay */}
          {searchQuery.trim() && (() => {
            const q = searchQuery.trim().toLowerCase();
            const results = songs.filter(s =>
              s.title.toLowerCase().includes(q) ||
              s.author.toLowerCase().includes(q) ||
              (s.tag && s.tag.toLowerCase().includes(q)) ||
              s.description.toLowerCase().includes(q)
            );
            return (
              <div className="absolute left-0 right-0 z-30 px-4 sm:px-6 mt-2">
                {results.length > 0 ? (
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.08)] overflow-hidden max-h-[320px] overflow-y-auto">
                    {results.map((song, idx) => {
                      const color = PALETTE[song.accentKey];
                      const isActive = activeSong?.id === song.id;
                      const ls = likedSong(song.id);
                      return (
                        <div
                          key={song.id}
                          onClick={() => { handlePlay(song); setSearchQuery(''); }}
                          className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-all hover:bg-slate-50 ${idx < results.length - 1 ? 'border-b border-slate-50' : ''}`}
                          style={isActive ? { background: color.bg + '66' } : {}}
                        >
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0"
                            style={{ background: color.bg }}
                          >
                            {isActive && isPlaying
                              ? <Disc3 size={14} className="animate-spin" style={{ color: color.accent, animationDuration: '3s' }} />
                              : <span>{song.icon}</span>
                            }
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-800 truncate">{song.title}</p>
                            <p className="text-[10px] font-medium text-slate-400 truncate">{song.author} · {song.description}</p>
                          </div>
                          {song.tag && (
                            <span
                              className="hidden sm:inline text-[9px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                              style={{ background: color.bg, color: color.accent }}
                            >
                              {song.tag}
                            </span>
                          )}
                          <button
                            onClick={e => toggleLike(song.id, e)}
                            className="flex-shrink-0 transition-all hover:scale-110"
                            style={{ color: ls.liked ? PALETTE.pink.accent : '#E2E8F0' }}
                          >
                            <Heart size={13} fill={ls.liked ? 'currentColor' : 'none'} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.08)] text-center py-8">
                    <Search size={20} className="text-slate-200 mx-auto mb-2" />
                    <p className="text-xs font-medium text-slate-400">没有找到 "{searchQuery}" 相关的作品</p>
                  </div>
                )}
              </div>
            );
          })()}
        </div>

        {/* ── Banner carousel ── */}
        <div className="pb-3">
          <div className="overflow-hidden rounded-2xl" ref={bannerRef}>
            <div
              className="flex transition-transform duration-500"
              style={{ transform: `translateX(-${bannerIndex * 100}%)` }}
            >
              {BANNER_ITEMS.map(item => {
                const color = PALETTE[item.colorKey];
                return (
                  <div
                    key={item.id}
                    className="w-full flex-shrink-0 p-6 sm:p-8 relative overflow-hidden"
                    style={{ background: color.bg }}
                  >
                    <div className="relative z-10">
                      <span className="text-3xl sm:text-4xl mb-3 block">{item.icon}</span>
                      <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-800 mb-1">{item.title}</h2>
                      <p className="text-sm font-medium text-slate-500">{item.subtitle}</p>
                    </div>
                    <div className="absolute top-[-20px] right-[-20px] w-32 h-32 rounded-3xl rotate-12 opacity-40" style={{ background: color.accent + '22' }} />
                    <div className="absolute bottom-[-10px] right-[40px] w-20 h-20 rounded-2xl rotate-6 opacity-30" style={{ background: color.accent + '33' }} />
                  </div>
                );
              })}
            </div>
          </div>
          {/* Controls below banner */}
          <div className="flex items-center justify-center gap-3 mt-2">
            <button
              onClick={() => setBannerIndex(prev => (prev - 1 + BANNER_ITEMS.length) % BANNER_ITEMS.length)}
              className="w-7 h-7 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-all"
            >
              <ChevronLeft size={14} />
            </button>
            <div className="flex gap-1.5">
              {BANNER_ITEMS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setBannerIndex(i)}
                  className="w-1.5 h-1.5 rounded-full transition-all"
                  style={{ background: i === bannerIndex ? '#1e293b' : '#CBD5E1' }}
                />
              ))}
            </div>
            <button
              onClick={() => setBannerIndex(prev => (prev + 1) % BANNER_ITEMS.length)}
              className="w-7 h-7 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-all"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* ── Playlists row ── */}
        <div className="mb-4">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-3">推荐歌单</p>
          <div className="flex gap-2.5 overflow-x-auto scrollbar-hide pb-1">
            {PLAYLISTS.map(pl => {
              const color = PALETTE[pl.colorKey];
              return (
                <div
                  key={pl.id}
                  className="flex-shrink-0 w-28 bg-white rounded-xl border border-slate-100 p-3 text-center transition-all hover:shadow-[0_2px_12px_rgba(0,0,0,0.05)] hover:-translate-y-0.5 cursor-pointer"
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mx-auto mb-2"
                    style={{ background: color.bg }}
                  >
                    {pl.icon}
                  </div>
                  <p className="text-xs font-bold text-slate-700 truncate">{pl.name}</p>
                  <p className="text-[10px] font-medium text-slate-400">{pl.count}首</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Hot chart ── */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">热门排行</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            {hotSongs.map((song, idx) => {
              const color = PALETTE[song.accentKey];
              const isActive = activeSong?.id === song.id;
              const ls = likedSong(song.id);
              return (
                <div
                  key={song.id}
                  onClick={() => handlePlay(song)}
                  className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-all hover:bg-slate-50 ${idx < hotSongs.length - 1 ? 'border-b border-slate-50' : ''}`}
                  style={isActive ? { background: color.bg + '66' } : {}}
                >
                  <span className={`w-5 flex-shrink-0 text-center text-xs font-black ${idx < 3 ? '' : 'text-slate-300'}`} style={idx < 3 ? { color: color.accent } : {}}>
                    {idx + 1}
                  </span>
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
                    style={{ background: color.bg }}
                  >
                    {isActive && isPlaying
                      ? <Disc3 size={16} className="animate-spin" style={{ color: color.accent, animationDuration: '3s' }} />
                      : <span>{song.icon}</span>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">{song.title}</p>
                    <p className="text-[10px] font-medium text-slate-400 truncate">{song.author}</p>
                  </div>
                  {/* Fixed-width tag column for alignment */}
                  <div className="hidden sm:flex w-10 flex-shrink-0 justify-end">
                    {song.tag && (
                      <span
                        className="text-[9px] font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: color.bg, color: color.accent }}
                      >
                        {song.tag}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={e => toggleLike(song.id, e)}
                    className="flex-shrink-0 transition-all hover:scale-110"
                    style={{ color: ls.liked ? PALETTE.pink.accent : '#E2E8F0' }}
                  >
                    <Heart size={14} fill={ls.liked ? 'currentColor' : 'none'} />
                  </button>
                  <span className="text-[10px] font-semibold text-slate-300 w-8 text-right flex-shrink-0">{ls.likes}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── New releases grid ── */}
        <div className="mb-4">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-3">最新发布</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {newSongs.map(song => {
              const color = PALETTE[song.accentKey];
              const isActive = activeSong?.id === song.id;
              return (
                <div
                  key={song.id}
                  onClick={() => handlePlay(song)}
                  className="group bg-white rounded-xl border border-slate-100 overflow-hidden cursor-pointer transition-all hover:shadow-[0_2px_12px_rgba(0,0,0,0.05)] hover:-translate-y-0.5"
                >
                  <div
                    className="relative flex items-center justify-center text-3xl aspect-square"
                    style={{ background: color.bg }}
                  >
                    <span className={isActive && isPlaying ? 'animate-pulse' : ''}>{song.icon}</span>
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-white/40 backdrop-blur-sm transition-opacity">
                      {isActive && isPlaying
                        ? <Pause size={24} style={{ color: color.accent }} />
                        : <Play size={24} style={{ color: color.accent }} />
                      }
                    </div>
                    {isActive && (
                      <div className="absolute bottom-0 left-0 h-0.5 transition-all duration-1000" style={{ width: `${(currentTime / duration) * 100}%`, background: color.accent }} />
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-xs font-bold text-slate-800 truncate">{song.title}</p>
                    <p className="text-[10px] font-medium text-slate-400 truncate">{song.author}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* ── Mini player bar ── */}
      {activeSong && !showFullPlayer && (
        <div className="fixed bottom-16 md:bottom-0 left-0 right-0 z-[110] px-3 sm:px-4 pb-2">
          <div
            className="max-w-2xl mx-auto bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] overflow-hidden cursor-pointer"
            onClick={() => setShowFullPlayer(true)}
          >
            <div className="h-0.5 bg-slate-100">
              <div
                className="h-full transition-all duration-1000"
                style={{ width: `${(currentTime / duration) * 100}%`, background: PALETTE[activeSong.accentKey].accent }}
              />
            </div>
            <div className="px-4 py-3 flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                style={{ background: PALETTE[activeSong.accentKey].bg }}
              >
                {isPlaying
                  ? <Disc3 size={16} className="animate-spin" style={{ color: PALETTE[activeSong.accentKey].accent, animationDuration: '3s' }} />
                  : activeSong.icon
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-800 truncate">{activeSong.title}</p>
                <p className="text-[10px] font-semibold truncate" style={{ color: PALETTE[activeSong.accentKey].accent }}>
                  {getCurrentLyric()}
                </p>
              </div>
              <button
                onClick={e => { e.stopPropagation(); setIsPlaying(p => !p); }}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-white transition-all hover:opacity-90 active:scale-95 flex-shrink-0"
                style={{ background: '#1e293b' }}
              >
                {isPlaying ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
              </button>
              <button
                onClick={e => { e.stopPropagation(); playNext(); }}
                className="p-2 text-slate-300 hover:text-slate-500 transition-all flex-shrink-0"
              >
                <SkipForward size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Full-screen player ── */}
      {activeSong && showFullPlayer && (
        <div className="fixed inset-0 z-[120] bg-white flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4">
            <button
              onClick={() => setShowFullPlayer(false)}
              className="p-2 rounded-xl bg-slate-50 text-slate-400 hover:text-slate-600 transition-all"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="text-center">
              <p className="text-xs font-bold text-slate-800">{activeSong.title}</p>
              <p className="text-[10px] font-medium text-slate-400">{activeSong.author}</p>
            </div>
            <button
              onClick={e => toggleLike(activeSong.id, e)}
              className="p-2 rounded-xl bg-slate-50 transition-all"
              style={{ color: likedSong(activeSong.id).liked ? PALETTE.pink.accent : '#CBD5E1' }}
            >
              <Heart size={16} fill={likedSong(activeSong.id).liked ? 'currentColor' : 'none'} />
            </button>
          </div>

          {/* Cover art */}
          <div className="flex-1 flex flex-col items-center justify-center px-8">
            <div
              className={`w-48 h-48 sm:w-56 sm:h-56 rounded-2xl flex items-center justify-center text-7xl sm:text-8xl shadow-[0_8px_40px_rgba(0,0,0,0.06)] transition-all duration-1000 ${isPlaying ? 'scale-100' : 'scale-95'}`}
              style={{ background: PALETTE[activeSong.accentKey].bg }}
            >
              <span className={isPlaying ? 'animate-pulse' : ''}>{activeSong.icon}</span>
            </div>

            {/* Lyrics */}
            <div className="mt-8 text-center h-16">
              <p className="text-lg font-bold text-slate-800 transition-all duration-500">
                {getCurrentLyric()}
              </p>
              <p className="text-xs font-medium text-slate-400 mt-1">{activeSong.description}</p>
            </div>
          </div>

          {/* Controls */}
          <div className="px-8 pb-10 sm:pb-12">
            {/* Progress bar */}
            <div className="mb-4">
              <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-1000"
                  style={{ width: `${(currentTime / duration) * 100}%`, background: PALETTE[activeSong.accentKey].accent }}
                />
              </div>
              <div className="flex justify-between mt-1.5">
                <span className="text-[10px] font-semibold text-slate-300">{formatTime(currentTime)}</span>
                <span className="text-[10px] font-semibold text-slate-300">{formatTime(duration)}</span>
              </div>
            </div>

            {/* Playback buttons */}
            <div className="flex items-center justify-center gap-8">
              <button
                onClick={playPrev}
                className="p-3 rounded-xl text-slate-400 hover:text-slate-600 transition-all active:scale-95"
              >
                <SkipBack size={20} />
              </button>
              <button
                onClick={() => setIsPlaying(p => !p)}
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-white transition-all hover:opacity-90 active:scale-95"
                style={{ background: '#1e293b' }}
              >
                {isPlaying ? <Pause size={22} /> : <Play size={22} className="ml-1" />}
              </button>
              <button
                onClick={playNext}
                className="p-3 rounded-xl text-slate-400 hover:text-slate-600 transition-all active:scale-95"
              >
                <SkipForward size={20} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StageMode;
