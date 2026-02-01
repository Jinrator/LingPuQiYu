
import React, { useState, useEffect } from 'react';
import { Play, User, Heart, MessageCircle, Star, Send, Share2, Award, Pause, SkipBack, SkipForward, Volume2, X, Info, Music2, Search } from 'lucide-react';

interface LyricLine {
  time: number;
  text: string;
}

interface SongData {
  id: string;
  title: string;
  author: string;
  description: string;
  color: string;
  likes: number;
  comments: string[];
  isFavorite: boolean;
  liked: boolean;
  coverStyle: string;
  icon: string;
  lyrics: LyricLine[];
}

const INITIAL_SONGS: SongData[] = [
  { 
    id: '1', 
    title: '夏日微风', 
    author: '小乐', 
    description: '这首歌用了清脆的铃声，听起来就像在海边吹着凉爽的风，带你逃离炎热的午后。', 
    color: 'bg-pink-500', 
    likes: 124, 
    comments: ['旋律很好听！', '很有夏天的感觉'], 
    isFavorite: false, 
    liked: false, 
    coverStyle: 'rounded-full', 
    icon: '🌊',
    lyrics: [
      { time: 0, text: "金色的阳光 洒在海面上" },
      { time: 3, text: "微风轻轻吹 掠过我脸庞" },
      { time: 6, text: "海浪在歌唱 烦恼都忘光" },
      { time: 9, text: "夏日的约定 就在这远方" },
      { time: 12, text: "啦啦啦~ 快乐的时光" }
    ]
  },
  { 
    id: '2', 
    title: '月光跳跃', 
    author: '莎莎', 
    description: '灵感来自夜晚在草丛里跳跃的小兔子，节奏非常欢快，充满了童真与想象。', 
    color: 'bg-blue-500', 
    likes: 245, 
    comments: ['节奏感很棒'], 
    isFavorite: true, 
    liked: true, 
    coverStyle: 'rounded-3xl', 
    icon: '🐰',
    lyrics: [
      { time: 0, text: "月亮圆圆 挂在云端" },
      { time: 3, text: "小兔跳跳 穿过森林" },
      { time: 6, text: "星光点点 闪闪发亮" },
      { time: 9, text: "梦境甜甜 就要降临" },
      { time: 12, text: "蹦蹦跳~ 快乐不停" }
    ]
  },
  { 
    id: '3', 
    title: '恐龙舞步', 
    author: '大壮', 
    description: '超酷的低音底鼓！模仿霸王龙走路的声音，每一步都踏在节拍上，震撼感十足。', 
    color: 'bg-green-500', 
    likes: 89, 
    comments: ['很有创意！'], 
    isFavorite: false, 
    liked: false, 
    coverStyle: 'rounded-xl rotate-3', 
    icon: '🦖',
    lyrics: [
      { time: 0, text: "大地在颤抖 咚 咚 咚" },
      { time: 3, text: "巨龙在跳舞 吼 吼 吼" },
      { time: 6, text: "有力的脚步 充满节奏" },
      { time: 9, text: "森林的霸主 谁敢不服" },
      { time: 12, text: "看我最强的 恐龙舞步" }
    ]
  },
];

interface StageModeProps {
  theme?: 'light' | 'dark';
}

const StageMode: React.FC<StageModeProps> = ({ theme = 'dark' }) => {
  const [songs, setSongs] = useState<SongData[]>(INITIAL_SONGS);
  const [activeComments, setActiveComments] = useState<string | null>(null);
  const [newComment, setNewComment] = useState("");
  const [activeSong, setActiveSong] = useState<SongData | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [showLyrics, setShowLyrics] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const duration = 15;
  const isDark = theme === 'dark';

  useEffect(() => {
    let interval: any;
    if (isPlaying && activeSong) {
      interval = setInterval(() => {
        setCurrentTime(prev => {
          if (prev >= duration) return 0;
          return prev + 1;
        });
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isPlaying, activeSong]);

  const toggleLike = (id: string) => {
    setSongs(prev => prev.map(s => {
      if (s.id === id) {
        return { ...s, liked: !s.liked, likes: s.liked ? s.likes - 1 : s.likes + 1 };
      }
      return s;
    }));
  };

  const toggleFavorite = (id: string) => {
    setSongs(prev => prev.map(s => s.id === id ? { ...s, isFavorite: !s.isFavorite } : s));
  };

  const handlePlay = (song: SongData) => {
    if (activeSong?.id === song.id) {
      setIsPlaying(!isPlaying);
    } else {
      setActiveSong(song);
      setIsPlaying(true);
      setCurrentTime(0);
    }
  };

  const addComment = (id: string) => {
    if (!newComment.trim()) return;
    setSongs(prev => prev.map(s => s.id === id ? { ...s, comments: [...s.comments, newComment] } : s));
    setNewComment("");
  };

  const getCurrentLyric = () => {
    if (!activeSong) return "";
    const line = [...activeSong.lyrics].reverse().find(l => currentTime >= l.time);
    return line ? line.text : activeSong.lyrics[0].text;
  };

  const filteredSongs = songs.filter(song => 
    song.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    song.author.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={`h-full px-8 pb-40 overflow-y-auto animate-in fade-in duration-500 scrollbar-hide transition-colors duration-500 ${isDark ? 'bg-[#000b1a]' : 'bg-[#f8fafc]'}`}>
      <div className="max-w-7xl mx-auto py-12">
        <header className="mb-12 text-center relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-blue-500/10 blur-[100px] -z-10" />
          <h2 className={`text-7xl font-fredoka mb-4 tracking-tighter transition-colors ${isDark ? 'bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-sky-400' : 'text-blue-900'} drop-shadow-lg`}>
            作品发布会
          </h2>
          <p className={`text-xl mb-10 font-medium transition-colors ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>沉浸在小小音乐制作人的灵感世界，发现属于未来的旋律！💿</p>
          
          {/* 搜索栏 */}
          <div className="max-w-xl mx-auto relative group">
            <div className={`absolute inset-0 bg-blue-500 rounded-3xl blur transition-opacity ${isDark ? 'opacity-20 group-hover:opacity-30' : 'opacity-10 group-hover:opacity-20'}`}></div>
            <div className={`relative flex items-center border rounded-3xl px-6 py-4 transition-all shadow-2xl ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-blue-100'}`}>
              <Search className="text-slate-400 mr-4" size={24} />
              <input 
                type="text" 
                placeholder="搜索歌曲名字或制作人名字..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`bg-transparent border-none outline-none flex-1 font-bold ${isDark ? 'text-slate-200 placeholder:text-slate-600' : 'text-blue-900 placeholder:text-slate-300'}`}
              />
            </div>
          </div>
        </header>

        {filteredSongs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            {filteredSongs.map((song) => (
              <div 
                key={song.id}
                className={`group relative rounded-[4rem] p-10 border transition-all duration-500 hover:-translate-y-4 backdrop-blur-xl shadow-2xl ${isDark ? 'bg-slate-900/50 border-slate-800/50' : 'bg-white border-blue-100 shadow-blue-900/5'} ${activeSong?.id === song.id ? 'ring-2 ring-blue-500' : ''}`}
              >
                {/* 唱片外盒 */}
                <div className="relative mb-10 group" onClick={() => handlePlay(song)}>
                  <div className={`aspect-square w-full ${song.color} ${song.coverStyle} relative overflow-hidden flex items-center justify-center shadow-2xl transition-all duration-700 group-hover:scale-105 z-10 cursor-pointer`}>
                    <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-black/20"></div>
                    <div className={`w-48 h-48 rounded-full border-[12px] border-black/10 flex items-center justify-center ${isPlaying && activeSong?.id === song.id ? 'animate-spin-slow' : ''}`}>
                      <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-4xl shadow-inner">
                        {song.icon}
                      </div>
                    </div>
                  </div>
                  <div className={`absolute top-6 right-[-15px] w-full h-full rounded-full -z-10 group-hover:right-[-40px] transition-all duration-700 opacity-40 border-[8px] ${isDark ? 'bg-slate-800 border-black/20' : 'bg-slate-100 border-white'}`}></div>
                </div>

                <div className="flex flex-col gap-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className={`text-3xl font-black mb-2 tracking-tight transition-colors ${isDark ? 'text-white' : 'text-blue-900'}`}>{song.title}</h3>
                      <div className={`flex items-center gap-2 text-xs font-black w-fit px-4 py-1.5 rounded-full mb-4 shadow-sm transition-colors ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-blue-50 text-blue-600'}`}>
                        <User size={12} className="text-blue-500" />
                        <span>制作人: {song.author}</span>
                      </div>
                      <div className={`p-5 rounded-3xl border transition-colors ${isDark ? 'bg-white/5 border-white/5' : 'bg-blue-50/30 border-blue-50'}`}>
                        <p className={`text-sm leading-relaxed font-medium italic opacity-80 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{song.description}</p>
                      </div>
                    </div>
                  </div>

                  <div className={`h-[2px] rounded-full ${isDark ? 'bg-slate-800' : 'bg-blue-50'}`} />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-8">
                      <button 
                        onClick={(e) => { e.stopPropagation(); toggleLike(song.id); }}
                        className={`flex items-center gap-3 transition-all ${song.liked ? 'text-pink-500 scale-110' : 'text-slate-400 hover:text-blue-500'}`}
                      >
                        <Heart size={26} fill={song.liked ? "currentColor" : "none"} />
                        <span className="font-black text-xl">{song.likes}</span>
                      </button>
                    </div>
                    <button className={`p-3 rounded-2xl transition-all ${isDark ? 'text-slate-500 hover:text-blue-400 hover:bg-white/5' : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50'}`}>
                      <Share2 size={24} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-32">
            <h3 className="text-2xl font-black text-slate-400">暂无相关作品</h3>
          </div>
        )}
      </div>

      {/* 底部播放器 */}
      {activeSong && (
        <div className="fixed bottom-0 left-0 right-0 z-[110] p-6 animate-in slide-in-from-bottom-full duration-700 ease-out">
          <div className={`max-w-5xl mx-auto rounded-[3rem] border shadow-[0_-30px_100px_rgba(0,0,0,0.4)] overflow-hidden transition-colors duration-500 ${isDark ? 'bg-slate-900/95 border-white/10' : 'bg-white border-blue-100 shadow-blue-900/10'}`}>
            
            {showLyrics && (
              <div className={`px-10 py-4 flex flex-col items-center justify-center border-b h-20 transition-colors ${isDark ? 'bg-black/20 border-white/5' : 'bg-blue-50/30 border-blue-50'}`}>
                <span className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-sky-500">
                  {getCurrentLyric()}
                </span>
              </div>
            )}

            <div className="w-full h-2 bg-slate-200 relative">
              <div 
                className="absolute h-full bg-blue-600 transition-all duration-1000 linear" 
                style={{ width: `${(currentTime / duration) * 100}%` }} 
              />
            </div>
            
            <div className="px-10 py-6 flex items-center justify-between">
              <div className="flex items-center gap-6 w-1/3">
                <div className={`w-16 h-16 ${activeSong.color} rounded-3xl flex items-center justify-center text-3xl shadow-xl`}>
                  {activeSong.icon}
                </div>
                <div className="overflow-hidden">
                  <h4 className={`font-black text-2xl whitespace-nowrap overflow-hidden text-ellipsis transition-colors ${isDark ? 'text-white' : 'text-blue-900'}`}>{activeSong.title}</h4>
                  <span className="text-xs text-slate-500 font-bold uppercase tracking-widest">BY {activeSong.author}</span>
                </div>
              </div>

              <div className="flex items-center gap-10">
                <button 
                  onClick={() => setIsPlaying(!isPlaying)}
                  className={`w-20 h-20 rounded-full flex items-center justify-center shadow-xl hover:scale-110 transition-transform ${isDark ? 'bg-white text-slate-900' : 'bg-blue-600 text-white'}`}
                >
                  {isPlaying ? <Pause size={40} fill="currentColor" /> : <Play size={40} fill="currentColor" className="ml-2" />}
                </button>
              </div>

              <div className="flex items-center justify-end gap-8 w-1/3">
                <button onClick={() => { setActiveSong(null); setIsPlaying(false); }} className={`p-3 rounded-2xl transition-all ${isDark ? 'text-slate-500 hover:text-white bg-white/5' : 'text-slate-400 hover:text-blue-600 bg-blue-50'}`}>
                  <X size={28} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StageMode;
