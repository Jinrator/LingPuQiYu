
import React, { useState, useRef } from 'react';
import { Camera, Upload, Trash2, Play, Pause, Check, Plus, Music, Image as ImageIcon, X, FileAudio } from 'lucide-react';

interface CapturedSound {
  id: string;
  name: string;
  photoUrl: string;
  audioUrl: string;
}

interface SoundHuntingProjectProps {
  onComplete: () => void;
  onBack: () => void;
  theme?: 'light' | 'dark';
}

const SoundHuntingProject: React.FC<SoundHuntingProjectProps> = ({ onComplete, onBack, theme = 'dark' }) => {
  const [sounds, setSounds] = useState<CapturedSound[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhoto, setNewPhoto] = useState<string | null>(null);
  const [newAudio, setNewAudio] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isDark = theme === 'dark';

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'audio') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    if (type === 'image') setNewPhoto(url);
    else setNewAudio(url);
  };

  const saveSound = () => {
    if (!newName || !newPhoto || !newAudio) return;
    const newEntry: CapturedSound = {
      id: Date.now().toString(),
      name: newName,
      photoUrl: newPhoto,
      audioUrl: newAudio
    };
    setSounds([...sounds, newEntry]);
    resetForm();
  };

  const resetForm = () => {
    setIsAdding(false);
    setNewName('');
    setNewPhoto(null);
    setNewAudio(null);
  };

  const togglePlay = (sound: CapturedSound) => {
    if (playingId === sound.id) {
      audioRef.current?.pause();
      setPlayingId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.src = sound.audioUrl;
        audioRef.current.play();
        setPlayingId(sound.id);
      }
    }
  };

  const deleteSound = (id: string) => {
    setSounds(sounds.filter(s => s.id !== id));
    if (playingId === id) setPlayingId(null);
  };

  return (
    <div className={`fixed inset-0 z-[200] flex flex-col transition-colors duration-500 animate-in fade-in zoom-in-95 ${isDark ? 'bg-slate-950' : 'bg-white'}`}>
      <audio ref={audioRef} onEnded={() => setPlayingId(null)} />

      {/* Header */}
      <header className={`p-8 border-b flex items-center justify-between transition-colors ${isDark ? 'bg-slate-900/50 border-white/5' : 'bg-blue-50/50 border-blue-100'}`}>
        <div className="flex items-center gap-6">
          <button onClick={onBack} className={`p-4 rounded-2xl transition-all ${isDark ? 'bg-white/5 text-slate-400 hover:text-white' : 'bg-white text-slate-500 hover:text-blue-600 border border-blue-100'}`}>
            <X size={24} />
          </button>
          <div>
            <h2 className={`text-3xl font-black tracking-tight ${isDark ? 'text-white' : 'text-blue-900'}`}>L1 · 声音狩猎计划</h2>
            <p className="text-sm font-black text-blue-500 uppercase tracking-widest mt-1">SOUND HUNTING LAB</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex -space-x-2">
            {[1, 2, 3].map(i => (
              <div key={i} className={`w-10 h-10 rounded-full border-4 flex items-center justify-center text-xs font-black transition-colors ${i <= sounds.length ? 'bg-emerald-500 border-emerald-300 text-white' : isDark ? 'bg-slate-800 border-slate-700 text-slate-600' : 'bg-slate-100 border-slate-200 text-slate-400'}`}>
                {i}
              </div>
            ))}
          </div>
          <button
            disabled={sounds.length < 3}
            onClick={onComplete}
            className={`px-10 py-4 rounded-2xl font-black text-lg transition-all flex items-center gap-3 ${sounds.length >= 3 ? 'bg-emerald-600 text-white hover:scale-105 active:scale-95' : 'bg-slate-300 text-slate-500 cursor-not-allowed opacity-50'}`}
          >
            完成狩猎 <Check size={20} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-12 scrollbar-hide">
        <div className="max-w-6xl mx-auto">
          {sounds.length === 0 && !isAdding && (
            <div className="flex flex-col items-center justify-center py-40 text-center animate-in fade-in duration-1000">
               <div className="w-40 h-40 bg-blue-500/10 rounded-[3rem] flex items-center justify-center mb-10 border-4 border-blue-500/20">
                 <Upload className="text-blue-500" size={64} />
               </div>
               <h3 className={`text-4xl font-black mb-4 ${isDark ? 'text-white' : 'text-blue-950'}`}>你的狩猎背包是空的</h3>
               <p className="text-slate-500 text-xl font-medium max-w-md">点击下方的按钮，上传你从身边捕捉到的奇妙声音吧！</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {sounds.map(sound => (
              <div key={sound.id} className={`group relative rounded-[3.5rem] overflow-hidden border transition-all duration-500 hover:-translate-y-2 ${isDark ? 'bg-slate-900 border-white/5' : 'bg-white border-blue-50'}`}>
                <div className="aspect-square relative overflow-hidden">
                  <img src={sound.photoUrl} alt={sound.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
                  <button
                    onClick={() => deleteSound(sound.id)}
                    className="absolute top-6 right-6 p-3 bg-rose-500 text-white rounded-2xl opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
                <div className="p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h4 className={`text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-blue-900'}`}>{sound.name}</h4>
                    <span className="text-[10px] font-black text-blue-500 bg-blue-500/10 px-3 py-1 rounded-full uppercase">Captured</span>
                  </div>
                  <button
                    onClick={() => togglePlay(sound)}
                    className={`w-full py-5 rounded-[2rem] font-black flex items-center justify-center gap-3 transition-all ${playingId === sound.id ? 'bg-rose-500 text-white' : 'bg-blue-600 text-white hover:bg-blue-500'}`}
                  >
                    {playingId === sound.id ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
                    {playingId === sound.id ? '正在播放' : '播放声音'}
                  </button>
                </div>
              </div>
            ))}

            {!isAdding && sounds.length < 5 && (
              <button
                onClick={() => setIsAdding(true)}
                className={`aspect-square rounded-[3.5rem] border-4 border-dashed flex flex-col items-center justify-center gap-6 transition-all hover:scale-[1.02] active:scale-95 ${isDark ? 'border-white/10 bg-white/5 text-slate-500 hover:text-blue-400 hover:border-blue-400/50' : 'border-blue-100 bg-blue-50/30 text-slate-400 hover:text-blue-600 hover:border-blue-200'}`}
              >
                <div className="w-20 h-20 rounded-full bg-current opacity-10 flex items-center justify-center">
                  <Plus size={40} />
                </div>
                <span className="text-xl font-black tracking-tight">上传新声音</span>
              </button>
            )}
          </div>
        </div>
      </main>

      {/* Add Sound Modal */}
      {isAdding && (
        <div className="fixed inset-0 z-[250] backdrop-blur-3xl flex items-center justify-center p-6 bg-slate-950/80 animate-in fade-in duration-300">
          <div className={`w-full max-w-2xl rounded-[4rem] overflow-hidden border transition-all duration-500 ${isDark ? 'bg-slate-900 border-white/5' : 'bg-white border-blue-100'}`}>
            <div className="p-10 border-b flex items-center justify-between transition-colors border-white/5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
              <h3 className="text-3xl font-black">声音上传中心</h3>
              <button onClick={resetForm} className="p-2 hover:bg-white/10 rounded-full transition-all"><X size={28} /></button>
            </div>

            <div className="p-12 space-y-10">
              {/* Name Input */}
              <div className="space-y-4">
                <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest px-4">声音的代号</label>
                <input
                  type="text"
                  placeholder="例如: 午后的海浪声..."
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className={`w-full px-8 py-6 rounded-[2rem] border outline-none font-bold text-xl transition-all ${isDark ? 'bg-white/5 border-white/10 text-white focus:ring-4 ring-blue-500/20' : 'bg-slate-50 border-blue-100 text-blue-950 focus:bg-white focus:ring-4 ring-blue-500/10'}`}
                />
              </div>

              <div className="grid grid-cols-2 gap-8">
                {/* Photo Upload */}
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest px-4">声音的照片</label>
                  <div className={`relative aspect-square rounded-[3rem] border-2 border-dashed flex flex-col items-center justify-center transition-all overflow-hidden ${newPhoto ? 'border-blue-500 bg-blue-500/5' : isDark ? 'border-white/10 bg-white/5' : 'border-blue-100 bg-blue-50/50'}`}>
                    {newPhoto ? (
                      <>
                        <img src={newPhoto} className="w-full h-full object-cover" />
                        <button onClick={() => setNewPhoto(null)} className="absolute top-4 right-4 p-2 bg-black/40 text-white rounded-full hover:bg-black/60"><X size={16} /></button>
                      </>
                    ) : (
                      <div className="flex flex-col items-center gap-4 text-slate-500">
                        <ImageIcon size={40} />
                        <span className="text-sm font-black">选择照片</span>
                        <input type="file" accept="image/*" onChange={e => handleFileUpload(e, 'image')} className="absolute inset-0 opacity-0 cursor-pointer" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Audio Upload */}
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest px-4">声音的文件</label>
                  <div className={`relative aspect-square rounded-[3rem] border-2 border-dashed flex flex-col items-center justify-center transition-all ${newAudio ? 'border-blue-500 bg-blue-500/5' : isDark ? 'border-white/10 bg-white/5' : 'border-blue-100 bg-blue-50/50'}`}>
                    {newAudio ? (
                      <div className="flex flex-col items-center gap-6">
                        <div className="w-20 h-20 rounded-full bg-blue-500 flex items-center justify-center text-white animate-bounce-subtle">
                          <Music size={32} />
                        </div>
                        <span className="text-sm font-black text-blue-500">音频已就绪</span>
                        <button onClick={() => setNewAudio(null)} className="text-xs font-black text-slate-400 hover:text-rose-500 underline uppercase tracking-tighter">重新选择</button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-4 text-slate-500">
                        <FileAudio size={40} />
                        <span className="text-sm font-black">点击上传音频</span>
                        <input type="file" accept="audio/*" onChange={e => handleFileUpload(e, 'audio')} className="absolute inset-0 opacity-0 cursor-pointer" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={saveSound}
                disabled={!newName || !newPhoto || !newAudio}
                className={`w-full py-8 rounded-[2.5rem] font-black text-2xl transition-all flex items-center justify-center gap-4 ${newName && newPhoto && newAudio ? 'bg-gradient-to-r from-blue-600 to-indigo-700 text-white hover:scale-[1.02] active:scale-95' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
              >
                保存到狩猎背包 <Check size={28} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default SoundHuntingProject;
