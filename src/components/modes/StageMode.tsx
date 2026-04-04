import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Play, Pause, Heart, ChevronLeft, ChevronRight, SkipBack, SkipForward, Disc3, Search, X, Volume2, VolumeX, Music } from 'lucide-react';
import { PALETTE } from '../../constants/palette';
import { useSettings } from '../../contexts/SettingsContext';
import PageDecoration from '../ui/PageDecoration';
import { readID3, type ID3Meta } from '../../utils/id3';

// ID3 元数据缓存，避免重复 fetch 512KB/首
const id3Cache = new Map<string, ID3Meta>();

interface StageModeProps { theme?: 'light' | 'dark'; }
interface SongData {
  id: string; title: string; author: string; description: string;
  likes: number; liked: boolean; icon: string;
  accentKey: keyof typeof PALETTE;
  tag?: string;
  src: string; // audio file path
  coverUrl?: string; // album art blob URL from ID3
}

const SONG_META = [
  { id: '1', accentKey: 'blue' as const, icon: '🏮', likes: 124, liked: false, src: '/music/Lighthouse Glow.mp3' },
  { id: '2', accentKey: 'pink' as const, icon: '🌙', likes: 245, liked: true, src: '/music/Still in Silence.mp3' },
  { id: '3', accentKey: 'green' as const, icon: '🌾', likes: 89, liked: false, src: '/music/Whispering Horizon.mp3' },
  { id: '4', accentKey: 'yellow' as const, icon: '🎋', likes: 312, liked: false, src: '/music/Whispers in the Bamboo Grove.mp3' },
  { id: '5', accentKey: 'orange' as const, icon: '🦢', likes: 198, liked: true, src: '/music/《咏鹅》.mp3' },
  { id: '6', accentKey: 'green' as const, icon: '🌃', likes: 156, liked: false, src: '/music/《静夜思》.mp3' },
  { id: '7', accentKey: 'blue' as const, icon: '💧', likes: 203, liked: false, src: '/music/水滴.mp3' },
];

const BANNER_META = [
  { id: '1', titleKey: 'stage.banner1.title', subtitleKey: 'stage.banner1.subtitle', colorKey: 'blue' as const, icon: '🏆' },
  { id: '2', titleKey: 'stage.banner2.title', subtitleKey: 'stage.banner2.subtitle', colorKey: 'pink' as const, icon: '⭐' },
  { id: '3', titleKey: 'stage.banner3.title', subtitleKey: 'stage.banner3.subtitle', colorKey: 'orange' as const, icon: '🎯' },
];

const PLAYLIST_META = [
  { id: 'chill', nameKey: 'stage.pl.chill', icon: '☁️', colorKey: 'blue' as const, count: 3 },
  { id: 'energy', nameKey: 'stage.pl.energy', icon: '⚡', colorKey: 'orange' as const, count: 2 },
  { id: 'dream', nameKey: 'stage.pl.dream', icon: '🌙', colorKey: 'pink' as const, count: 4 },
  { id: 'nature', nameKey: 'stage.pl.nature', icon: '🌿', colorKey: 'green' as const, count: 3 },
  { id: 'party', nameKey: 'stage.pl.party', icon: '🎉', colorKey: 'yellow' as const, count: 2 },
];

const RANK_COLORS = ['#1E293B', '#475569', '#94A3B8'];

function buildSongs(t: (k: string) => string): SongData[] {
  return SONG_META.map(m => ({
    ...m,
    title: t(`stage.song.${m.id}.title`),
    author: t(`stage.song.${m.id}.author`),
    description: t(`stage.song.${m.id}.desc`),
    tag: t(`stage.song.${m.id}.tag`),
  }));
}

const StageMode: React.FC<StageModeProps> = () => {
  const { t } = useSettings();

  const allSongs = useMemo(() => buildSongs(t), [t]);
  const [songs, setSongs] = useState<SongData[]>(allSongs);
  const [activeSong, setActiveSong] = useState<SongData | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [showFullPlayer, setShowFullPlayer] = useState(false);
  const [bannerIndex, setBannerIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const bannerRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  // Initialize audio element once
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'metadata';
    audioRef.current = audio;

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };
    const onLoadedMetadata = () => setDuration(audio.duration);
    const onEnded = () => playNext();
    const onError = () => { setIsPlaying(false); };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
      audio.pause();
      audio.src = '';
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Sync i18n changes — preserve runtime fields (likes, liked, coverUrl, ID3 overrides)
  useEffect(() => {
    setSongs(prev => {
      const next = buildSongs(t);
      return next.map(s => {
        const old = prev.find(o => o.id === s.id);
        if (!old) return s;
        return {
          ...s,
          likes: old.likes,
          liked: old.liked,
          coverUrl: old.coverUrl,
          // Keep ID3-overridden title/author if they differ from i18n defaults
          title: old.coverUrl ? old.title : s.title,
          author: old.coverUrl ? old.author : s.author,
        };
      });
    });
    if (activeSong) {
      setActiveSong(prev => {
        if (!prev) return null;
        const fresh = buildSongs(t).find(s => s.id === prev.id);
        if (!fresh) return prev;
        return {
          ...fresh,
          likes: prev.likes,
          liked: prev.liked,
          coverUrl: prev.coverUrl,
          title: prev.coverUrl ? prev.title : fresh.title,
          author: prev.coverUrl ? prev.author : fresh.author,
        };
      });
    }
  }, [t]); // eslint-disable-line react-hooks/exhaustive-deps

  // Banner auto-rotate
  useEffect(() => {
    const timer = setInterval(() => {
      setBannerIndex(prev => (prev + 1) % BANNER_META.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  // Load ID3 metadata (cover art, title, artist) from MP3 files — deferred & sequential to avoid blocking render
  useEffect(() => {
    let cancelled = false;
    const blobUrls: string[] = [];

    async function loadMeta() {
      // Defer heavy work until after initial paint
      await new Promise<void>(resolve => {
        if ('requestIdleCallback' in window) {
          (window as any).requestIdleCallback(() => resolve());
        } else {
          setTimeout(resolve, 200);
        }
      });
      if (cancelled) return;

      // Load sequentially to avoid 7 concurrent 512KB fetches
      for (let i = 0; i < SONG_META.length; i++) {
        if (cancelled) return;

        // 使用缓存避免重复 fetch
        let meta = id3Cache.get(SONG_META[i].src);
        if (!meta) {
          meta = await readID3(SONG_META[i].src);
          if (meta) id3Cache.set(SONG_META[i].src, meta);
        }
        if (cancelled) return;
        if (!meta || (!meta.title && !meta.artist && !meta.coverUrl)) continue;

        if (meta.coverUrl) blobUrls.push(meta.coverUrl);

        setSongs(prev => prev.map((song, idx) => {
          if (idx !== i) return song;
          const updated = { ...song };
          if (meta.title) updated.title = meta.title;
          if (meta.artist) updated.author = meta.artist;
          if (meta.coverUrl) updated.coverUrl = meta.coverUrl;
          return updated;
        }));

        setActiveSong(prev => {
          if (!prev || prev.id !== SONG_META[i].id) return prev;
          const updated = { ...prev };
          if (meta.title) updated.title = meta.title;
          if (meta.artist) updated.author = meta.artist;
          if (meta.coverUrl) updated.coverUrl = meta.coverUrl;
          return updated;
        });
      }
    }

    loadMeta();
    return () => {
      cancelled = true;
      // 不 revoke 缓存中的 blob URL，它们会被复用
    };
  }, []);

  const toggleLike = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSongs(prev => prev.map(s =>
      s.id === id ? { ...s, liked: !s.liked, likes: s.liked ? s.likes - 1 : s.likes + 1 } : s
    ));
    if (activeSong?.id === id) {
      setActiveSong(prev => prev ? { ...prev, liked: !prev.liked, likes: prev.liked ? prev.likes - 1 : prev.likes + 1 } : null);
    }
  };

  const handlePlay = useCallback((song: SongData) => {
    const audio = audioRef.current;
    if (!audio) return;

    if (activeSong?.id === song.id) {
      if (isPlaying) { audio.pause(); setIsPlaying(false); }
      else { audio.play().then(() => setIsPlaying(true)).catch(() => {}); }
    } else {
      audio.pause();
      audio.src = song.src;
      audio.load();
      audio.play().then(() => {
        setActiveSong(song);
        setIsPlaying(true);
        setCurrentTime(0);
      }).catch(() => {
        setActiveSong(song);
        setIsPlaying(false);
        setCurrentTime(0);
      });
    }
  }, [activeSong, isPlaying]);

  const playNext = useCallback(() => {
    if (!activeSong) return;
    const idx = songs.findIndex(s => s.id === activeSong.id);
    const next = songs[(idx + 1) % songs.length];
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.src = next.src;
    audio.load();
    audio.play().then(() => {
      setActiveSong(next);
      setIsPlaying(true);
      setCurrentTime(0);
    }).catch(() => {
      setActiveSong(next);
      setIsPlaying(false);
    });
  }, [activeSong, songs]);

  const playPrev = useCallback(() => {
    if (!activeSong) return;
    const audio = audioRef.current;
    if (!audio) return;
    // If more than 3s in, restart current song
    if (audio.currentTime > 3) {
      audio.currentTime = 0;
      setCurrentTime(0);
      return;
    }
    const idx = songs.findIndex(s => s.id === activeSong.id);
    const prev = songs[(idx - 1 + songs.length) % songs.length];
    audio.pause();
    audio.src = prev.src;
    audio.load();
    audio.play().then(() => {
      setActiveSong(prev);
      setIsPlaying(true);
      setCurrentTime(0);
    }).catch(() => {
      setActiveSong(prev);
      setIsPlaying(false);
    });
  }, [activeSong, songs]);

  const togglePlayPause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !activeSong) return;
    if (isPlaying) { audio.pause(); setIsPlaying(false); }
    else { audio.play().then(() => setIsPlaying(true)).catch(() => {}); }
  }, [isPlaying, activeSong]);

  const seekTo = useCallback((fraction: number) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const time = fraction * duration;
    audio.currentTime = time;
    setCurrentTime(time);
  }, [duration]);

  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const fraction = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    seekTo(fraction);
  }, [seekTo]);

  const formatTime = (s: number) => {
    if (!isFinite(s) || s < 0) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${String(sec).padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const hotSongs = [...songs].sort((a, b) => b.likes - a.likes).slice(0, 5);
  const newSongs = songs.slice(0, 4);
  const likedSong = (id: string) => songs.find(s => s.id === id)!;

  // Cover art renderer — shows album art from ID3 or falls back to Music icon
  const CoverArt = ({ song, size = 'sm', spinning = false }: { song: SongData; size?: 'sm' | 'md' | 'lg' | 'xl'; spinning?: boolean }) => {
    const sizeMap = { sm: 'w-8 h-8 rounded-lg', md: 'w-9 h-9 rounded-lg', lg: 'w-10 h-10 sm:w-12 sm:h-12 rounded-xl', xl: 'w-44 h-44 sm:w-56 sm:h-56 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)]' };
    const iconSize = { sm: 14, md: 16, lg: 18, xl: 48 };
    if (spinning) {
      return (
        <div className={`${sizeMap[size]} flex items-center justify-center flex-shrink-0 bg-slate-50 overflow-hidden`}>
          <Disc3 size={iconSize[size]} className="animate-spin text-slate-500" style={{ animationDuration: '3s' }} />
        </div>
      );
    }
    if (song.coverUrl) {
      return (
        <div className={`${sizeMap[size]} flex-shrink-0 overflow-hidden`}>
          <img src={song.coverUrl} alt={song.title} className="w-full h-full object-cover" />
        </div>
      );
    }
    return (
      <div className={`${sizeMap[size]} flex items-center justify-center flex-shrink-0 bg-slate-50`}>
        <Music size={iconSize[size]} className="text-slate-300" />
      </div>
    );
  };

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
                          <CoverArt song={song} size="sm" spinning={isActive && isPlaying} />
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
                  <CoverArt song={song} size="md" spinning={isActive && isPlaying} />
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
                  <div className="relative aspect-square bg-slate-50 overflow-hidden">
                    {song.coverUrl ? (
                      <img src={song.coverUrl} alt={song.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Music size={32} className="text-slate-300" />
                      </div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-white/40 backdrop-blur-sm transition-opacity">
                      {isActive && isPlaying
                        ? <Pause size={24} className="text-slate-700" />
                        : <Play size={24} className="text-slate-700" />
                      }
                    </div>
                    {isActive && (
                      <div className="absolute bottom-0 left-0 h-0.5 bg-slate-800 transition-all duration-300" style={{ width: `${progress}%` }} />
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
                className="h-full bg-slate-800 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="px-3 sm:px-4 py-2.5 sm:py-3 flex items-center gap-2.5 sm:gap-3">
              <CoverArt song={activeSong} size="md" spinning={isPlaying} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-800 truncate">{activeSong.title}</p>
                <p className="text-xs sm:text-[10px] font-semibold text-slate-500 truncate">
                  {activeSong.author} · {activeSong.description}
                </p>
              </div>
              <button
                onClick={e => { e.stopPropagation(); togglePlayPause(); }}
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
            <CoverArt song={activeSong} size="xl" spinning={false} />
            <div className="mt-6 sm:mt-8 text-center h-16">
              <p className="text-base sm:text-lg font-bold text-slate-800 transition-all duration-500">
                {activeSong.description}
              </p>
            </div>
          </div>

          <div className="px-6 sm:px-8 pb-8 sm:pb-12">
            {/* Progress bar - clickable */}
            <div className="mb-4">
              <div
                ref={progressRef}
                className="h-1.5 bg-slate-100 rounded-full overflow-hidden cursor-pointer relative group"
                onClick={handleProgressClick}
              >
                <div
                  className="h-full rounded-full bg-slate-800 transition-[width] duration-300 relative"
                  style={{ width: `${progress}%` }}
                >
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-slate-800 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
              <div className="flex justify-between mt-1.5">
                <span className="text-[10px] font-semibold text-slate-300">{formatTime(currentTime)}</span>
                <span className="text-[10px] font-semibold text-slate-300">{formatTime(duration)}</span>
              </div>
            </div>

            {/* Volume control */}
            <div className="flex items-center justify-center gap-2 mb-4">
              <button
                onClick={() => setIsMuted(m => !m)}
                className="p-1.5 text-slate-400 hover:text-slate-600 transition-all"
              >
                {isMuted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={isMuted ? 0 : volume}
                onChange={e => { setVolume(parseFloat(e.target.value)); setIsMuted(false); }}
                className="w-24 h-1 accent-slate-800 cursor-pointer"
              />
            </div>

            {/* Playback controls */}
            <div className="flex items-center justify-center gap-8">
              <button onClick={playPrev} className="p-3 rounded-xl text-slate-400 hover:text-slate-600 transition-all active:scale-95">
                <SkipBack size={20} />
              </button>
              <button
                onClick={togglePlayPause}
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
