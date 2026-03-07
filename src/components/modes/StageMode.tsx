import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Play, Pause, Heart, ChevronLeft, ChevronRight, SkipBack, SkipForward, Disc3, Search, X } from 'lucide-react';
import { PALETTE } from '../../constants/palette';
import { useSettings } from '../../contexts/SettingsContext';
import PageDecoration from '../ui/PageDecoration';

interface StageModeProps { theme?: 'light' | 'dark'; }
interface LyricLine { time: number; text: string; }
interface SongData {
  id: string; title: string; author: string; description: string;
  likes: number; liked: boolean; icon: string;
  accentKey: keyof typeof PALETTE; lyrics: LyricLine[];
  tag?: string;
}

const SONG_META = [
  { id: '1', accentKey: 'blue' as const, icon: '🌊', likes: 124, liked: false },
  { id: '2', accentKey: 'pink' as const, icon: '🐰', likes: 245, liked: true },
  { id: '3', accentKey: 'green' as const, icon: '🦖', likes: 89, liked: false },
  { id: '4', accentKey: 'yellow' as const, icon: '🚂', likes: 312, liked: false },
  { id: '5', accentKey: 'orange' as const, icon: '🍬', likes: 198, liked: true },
  { id: '6', accentKey: 'green' as const, icon: '🧚', likes: 156, liked: false },
  { id: '7', accentKey: 'blue' as const, icon: '🤖', likes: 203, liked: false },
  { id: '8', accentKey: 'blue' as const, icon: '🐠', likes: 167, liked: false },
];

const BANNER_META = [
  { id: '1', titleKey: 'stage.banner1.title', subtitleKey: 'stage.banner1.subtitle', colorKey: 'blue' as const, icon: '🏆' },
  { id: '2', titleKey: 'stage.banner2.title', subtitleKey: 'stage.banner2.subtitle', colorKey: 'pink' as const, icon: '⭐' },
  { id: '3', titleKey: 'stage.banner3.title', subtitleKey: 'stage.banner3.subtitle', colorKey: 'orange' as const, icon: '🎯' },
];

const PLAYLIST_META = [
  { id: 'chill', nameKey: 'stage.pl.chill', icon: '☁️', colorKey: 'blue' as const, count: 12 },
  { id: 'energy', nameKey: 'stage.pl.energy', icon: '⚡', colorKey: 'orange' as const, count: 8 },
  { id: 'dream', nameKey: 'stage.pl.dream', icon: '🌙', colorKey: 'pink' as const, count: 15 },
  { id: 'nature', nameKey: 'stage.pl.nature', icon: '🌿', colorKey: 'green' as const, count: 10 },
  { id: 'party', nameKey: 'stage.pl.party', icon: '🎉', colorKey: 'yellow' as const, count: 6 },
];

// Top3 rank badge grays: #1 darkest → #3 lightest
const RANK_COLORS = ['#1E293B', '#475569', '#94A3B8'];

function buildSongs(t: (k: string) => string): SongData[] {
  return SONG_META.map(m => ({
    ...m,
    title: t(`stage.song.${m.id}.title`),
    author: t(`stage.song.${m.id}.author`),
    description: t(`stage.song.${m.id}.desc`),
    tag: t(`stage.song.${m.id}.tag`),
    lyrics: [0, 3, 6, 9, 12].map((time, i) => ({
      time,
      text: t(`stage.song.${m.id}.ly${i + 1}`),
    })),
  }));
}

const StageMode: React.FC<StageModeProps> = () => {
  const { t } = useSettings();

  const allSongs = useMemo(() => buildSongs(t), [t]);
  const [songs, setSongs] = useState<SongData[]>(allSongs);
  const [activeSong, setActiveSong] = useState<SongData | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [showFullPlayer, setShowFullPlayer] = useState(false);
  const [bannerIndex, setBannerIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const bannerRef = useRef<HTMLDivElement>(null);
  const duration = 15;

  useEffect(() => {
    setSongs(prev => {
      const next = buildSongs(t);
      return next.map(s => {
        const old = prev.find(o => o.id === s.id);
        return old ? { ...s, likes: old.likes, liked: old.liked } : s;
      });
    });
    if (activeSong) {
      const updated = buildSongs(t).find(s => s.id === activeSong.id);
      if (updated) setActiveSong(prev => prev ? { ...updated, likes: prev.likes, liked: prev.liked } : null);
    }
  }, [t]);

  useEffect(() => {
    const timer = setInterval(() => {
      setBannerIndex(prev => (prev + 1) % BANNER_META.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

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
    <div className="relative bg-[#F5F7FA] overflow-hidden">
      <PageDecoration />
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pb-36">

        {/* ── Search ── */}
        <div className="relative pt-4 sm:pt-6 pb-2 sm:pb-3">
          <div className="relative z-20">
            <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={t('stage.search')}
              className="w-full pl-11 pr-10 py-2.5 sm:py-3 rounded-xl text-sm font-medium outline-none transition-all bg-white text-slate-800 placeholder:text-slate-300 focus:ring-2 focus:ring-slate-200 shadow-[0_1px_4px_rgba(0,0,0,0.02)]"
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

          {/* Search results */}
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
                  <div className="bg-white rounded-2xl shadow-[0_4px_16px_rgba(0,0,0,0.05)] overflow-hidden max-h-[320px] overflow-y-auto">
                    {results.map(song => {
                      const isActive = activeSong?.id === song.id;
                      const ls = likedSong(song.id);
                      return (
                        <div
                          key={song.id}
                          onClick={() => { handlePlay(song); setSearchQuery(''); }}
                          className="flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-all hover:bg-slate-50"
                          style={isActive ? { background: '#F1F5F9' } : {}}
                        >
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0 bg-slate-100">
                            {isActive && isPlaying
                              ? <Disc3 size={14} className="animate-spin text-slate-500" style={{ animationDuration: '3s' }} />
                              : <span>{song.icon}</span>
                            }
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-800 truncate">{song.title}</p>
                            <p className="text-[10px] font-medium text-slate-400 truncate">{song.author} · {song.description}</p>
                          </div>
                          {song.tag && (
                            <span className="hidden sm:inline text-[9px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 bg-slate-100 text-slate-500">
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
                  <div className="bg-white rounded-2xl shadow-[0_4px_16px_rgba(0,0,0,0.05)] text-center py-8">
                    <Search size={20} className="text-slate-200 mx-auto mb-2" />
                    <p className="text-xs font-medium text-slate-400">{t('stage.noResults')} "{searchQuery}" {t('stage.relatedWorks')}</p>
                  </div>
                )}
              </div>
            );
          })()}
        </div>

        {/* ── Banner carousel ── */}
        <div className="pb-2.5 sm:pb-3">
          <div className="overflow-hidden rounded-2xl" ref={bannerRef}>
            <div
              className="flex transition-transform duration-500"
              style={{ transform: `translateX(-${bannerIndex * 100}%)` }}
            >
              {BANNER_META.map(item => (
                <div
                  key={item.id}
                  className="w-full flex-shrink-0 p-6 sm:p-10 relative overflow-hidden bg-[#F1F5F9]"
                >
                  <div className="relative z-10">
                    <span className="text-3xl sm:text-5xl mb-2 sm:mb-3 block">{item.icon}</span>
                    <h2 className="text-xl sm:text-3xl font-black tracking-tight text-slate-800 mb-0.5 sm:mb-1">{t(item.titleKey)}</h2>
                    <p className="text-sm font-medium text-slate-500">{t(item.subtitleKey)}</p>
                  </div>
                  <div className="absolute top-[-30px] right-[-30px] w-44 h-44 rounded-3xl rotate-12 opacity-[0.06] bg-slate-400" />
                  <div className="absolute bottom-[-16px] right-[30px] w-28 h-28 rounded-2xl rotate-6 opacity-[0.04] bg-slate-400" />
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-center gap-3 mt-2">
            <button
              onClick={() => setBannerIndex(prev => (prev - 1 + BANNER_META.length) % BANNER_META.length)}
              className="w-7 h-7 rounded-xl bg-white flex items-center justify-center text-slate-400 hover:text-slate-600 transition-all shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
            >
              <ChevronLeft size={14} />
            </button>
            <div className="flex gap-1.5">
              {BANNER_META.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setBannerIndex(i)}
                  className="w-1.5 h-1.5 rounded-full transition-all"
                  style={{ background: i === bannerIndex ? '#1e293b' : '#CBD5E1' }}
                />
              ))}
            </div>
            <button
              onClick={() => setBannerIndex(prev => (prev + 1) % BANNER_META.length)}
              className="w-7 h-7 rounded-xl bg-white flex items-center justify-center text-slate-400 hover:text-slate-600 transition-all shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* ── Playlists row ── */}
        <div className="mb-3.5 sm:mb-4">
          <p className="text-sm font-bold tracking-tight text-slate-700 mb-2.5 sm:mb-3">{t('stage.playlists')}</p>
          <div className="flex gap-2 sm:gap-2.5 overflow-x-auto scrollbar-hide pb-1">
            {PLAYLIST_META.map(pl => (
              <div
                key={pl.id}
                className="flex-shrink-0 w-24 sm:w-28 rounded-xl p-2.5 sm:p-3 text-center transition-all hover:-translate-y-0.5 cursor-pointer bg-white shadow-[0_1px_4px_rgba(0,0,0,0.02)] hover:shadow-[0_1px_6px_rgba(0,0,0,0.03)]"
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-xl sm:text-2xl mx-auto mb-1.5 sm:mb-2 bg-slate-50">
                  {pl.icon}
                </div>
                <p className="text-xs font-bold text-slate-700 truncate">{t(pl.nameKey)}</p>
                <p className="text-[10px] font-semibold text-slate-400">{pl.count}{t('stage.songs')}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Hot chart ── */}
        <div className="mb-3.5 sm:mb-4">
          <div className="flex items-center justify-between mb-2.5 sm:mb-3">
            <p className="text-sm font-bold tracking-tight text-slate-700">{t('stage.hotChart')}</p>
          </div>
          <div className="rounded-2xl overflow-hidden space-y-1.5">
            {hotSongs.map((song, idx) => {
              const isActive = activeSong?.id === song.id;
              const ls = likedSong(song.id);
              const isTop3 = idx < 3;
              return (
                <div
                  key={song.id}
                  onClick={() => handlePlay(song)}
                  className="flex items-center gap-2.5 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 cursor-pointer transition-all rounded-xl bg-white shadow-[0_1px_4px_rgba(0,0,0,0.02)]"
                  style={isActive ? { background: '#F1F5F9' } : {}}
                >
                  <span
                    className="w-6 h-6 flex-shrink-0 rounded-lg flex items-center justify-center text-[10px] font-black"
                    style={isTop3
                      ? { background: RANK_COLORS[idx], color: 'white' }
                      : { background: '#F1F5F9', color: '#94A3B8' }
                    }
                  >
                    {idx + 1}
                  </span>
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center text-lg flex-shrink-0 bg-slate-50">
                    {isActive && isPlaying
                      ? <Disc3 size={16} className="animate-spin text-slate-500" style={{ animationDuration: '3s' }} />
                      : <span>{song.icon}</span>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">{song.title}</p>
                    <p className="text-[10px] font-medium text-slate-400 truncate">{song.author}</p>
                  </div>
                  <div className="hidden sm:flex w-10 flex-shrink-0 justify-end">
                    {song.tag && (
                      <span
                        className="text-[9px] font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: PALETTE[song.accentKey].bg, color: PALETTE[song.accentKey].accent }}
                      >
                        {song.tag}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={e => toggleLike(song.id, e)}
                    className="flex-shrink-0 transition-all hover:scale-110"
                    style={{ color: ls.liked ? PALETTE.pink.accent : '#CBD5E1' }}
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
        <div className="mb-3.5 sm:mb-4">
          <p className="text-sm font-bold tracking-tight text-slate-700 mb-2.5 sm:mb-3">{t('stage.newReleases')}</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5">
            {newSongs.map(song => {
              const isActive = activeSong?.id === song.id;
              return (
                <div
                  key={song.id}
                  onClick={() => handlePlay(song)}
                  className="group bg-white rounded-xl overflow-hidden cursor-pointer transition-all hover:-translate-y-0.5 shadow-[0_1px_4px_rgba(0,0,0,0.02)] hover:shadow-[0_1px_6px_rgba(0,0,0,0.03)]"
                >
                  <div className="relative flex items-center justify-center text-3xl aspect-square bg-slate-50">
                    <span className={isActive && isPlaying ? 'animate-pulse' : ''}>{song.icon}</span>
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-white/40 backdrop-blur-sm transition-opacity">
                      {isActive && isPlaying
                        ? <Pause size={24} className="text-slate-700" />
                        : <Play size={24} className="text-slate-700" />
                      }
                    </div>
                    {isActive && (
                      <div className="absolute bottom-0 left-0 h-0.5 bg-slate-800 transition-all duration-1000" style={{ width: `${(currentTime / duration) * 100}%` }} />
                    )}
                  </div>
                  <div className="p-2.5 sm:p-3">
                    <p className="text-xs font-bold text-slate-800 truncate">{song.title}</p>
                    <p className="text-[10px] font-semibold text-slate-400 truncate">{song.author}</p>
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
            className="max-w-2xl mx-auto bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.04)] overflow-hidden cursor-pointer"
            onClick={() => setShowFullPlayer(true)}
          >
            <div className="h-0.5 bg-slate-100">
              <div
                className="h-full bg-slate-800 transition-all duration-1000"
                style={{ width: `${(currentTime / duration) * 100}%` }}
              />
            </div>
            <div className="px-3 sm:px-4 py-2.5 sm:py-3 flex items-center gap-2.5 sm:gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0 bg-slate-50">
                {isPlaying
                  ? <Disc3 size={16} className="animate-spin text-slate-500" style={{ animationDuration: '3s' }} />
                  : activeSong.icon
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-800 truncate">{activeSong.title}</p>
                <p className="text-xs sm:text-[10px] font-semibold text-slate-500 truncate">
                  {getCurrentLyric()}
                </p>
              </div>
              <button
                onClick={e => { e.stopPropagation(); setIsPlaying(p => !p); }}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-white transition-all hover:opacity-90 active:scale-95 flex-shrink-0 bg-[#1e293b]"
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
          <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4">
            <button
              onClick={() => setShowFullPlayer(false)}
              className="p-2 rounded-xl bg-slate-50 text-slate-400 hover:text-slate-600 transition-all"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="text-center">
              <p className="text-sm font-bold text-slate-800">{activeSong.title}</p>
              <p className="text-xs font-medium text-slate-400">{activeSong.author}</p>
            </div>
            <button
              onClick={e => toggleLike(activeSong.id, e)}
              className="p-2 rounded-xl bg-slate-50 transition-all"
              style={{ color: likedSong(activeSong.id).liked ? PALETTE.pink.accent : '#CBD5E1' }}
            >
              <Heart size={16} fill={likedSong(activeSong.id).liked ? 'currentColor' : 'none'} />
            </button>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center px-6 sm:px-8">
            <div
              className={`w-44 h-44 sm:w-56 sm:h-56 rounded-2xl flex items-center justify-center text-6xl sm:text-8xl bg-slate-50 shadow-[0_4px_20px_rgba(0,0,0,0.03)] transition-all duration-1000 ${isPlaying ? 'scale-100' : 'scale-95'}`}
            >
              <span className={isPlaying ? 'animate-pulse' : ''}>{activeSong.icon}</span>
            </div>
            <div className="mt-6 sm:mt-8 text-center h-16">
              <p className="text-base sm:text-lg font-bold text-slate-800 transition-all duration-500">
                {getCurrentLyric()}
              </p>
              <p className="text-xs font-medium text-slate-400 mt-1">{activeSong.description}</p>
            </div>
          </div>

          <div className="px-6 sm:px-8 pb-8 sm:pb-12">
            <div className="mb-4">
              <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-slate-800 transition-all duration-1000"
                  style={{ width: `${(currentTime / duration) * 100}%` }}
                />
              </div>
              <div className="flex justify-between mt-1.5">
                <span className="text-[10px] font-semibold text-slate-300">{formatTime(currentTime)}</span>
                <span className="text-[10px] font-semibold text-slate-300">{formatTime(duration)}</span>
              </div>
            </div>
            <div className="flex items-center justify-center gap-8">
              <button onClick={playPrev} className="p-3 rounded-xl text-slate-400 hover:text-slate-600 transition-all active:scale-95">
                <SkipBack size={20} />
              </button>
              <button
                onClick={() => setIsPlaying(p => !p)}
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-white transition-all hover:opacity-90 active:scale-95 bg-[#1e293b]"
              >
                {isPlaying ? <Pause size={22} /> : <Play size={22} className="ml-1" />}
              </button>
              <button onClick={playNext} className="p-3 rounded-xl text-slate-400 hover:text-slate-600 transition-all active:scale-95">
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
