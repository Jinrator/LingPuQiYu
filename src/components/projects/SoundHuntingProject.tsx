import React, { useState, useRef } from 'react';
import { Upload, Trash2, Play, Pause, Check, Plus, Image as ImageIcon, X, FileAudio } from 'lucide-react';
import { PALETTE } from '../../constants/palette';
import ProjectShell from './ProjectShell';

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

const SoundHuntingProject: React.FC<SoundHuntingProjectProps> = ({ onComplete, onBack }) => {
  const [sounds, setSounds] = useState<CapturedSound[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhoto, setNewPhoto] = useState<string | null>(null);
  const [newAudio, setNewAudio] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'audio') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    if (type === 'image') setNewPhoto(url);
    else setNewAudio(url);
  };

  const saveSound = () => {
    if (!newName || !newPhoto || !newAudio) return;
    setSounds([...sounds, { id: Date.now().toString(), name: newName, photoUrl: newPhoto, audioUrl: newAudio }]);
    resetForm();
  };

  const resetForm = () => { setIsAdding(false); setNewName(''); setNewPhoto(null); setNewAudio(null); };

  const togglePlay = (sound: CapturedSound) => {
    if (playingId === sound.id) { audioRef.current?.pause(); setPlayingId(null); }
    else if (audioRef.current) { audioRef.current.src = sound.audioUrl; audioRef.current.play(); setPlayingId(sound.id); }
  };

  const deleteSound = (id: string) => { setSounds(sounds.filter(s => s.id !== id)); if (playingId === id) setPlayingId(null); };

  return (
    <ProjectShell
      lessonId={1}
      title="声音狩猎计划"
      subtitle="SOUND HUNTING LAB"
      color="blue"
      actionLabel="完成狩猎"
      actionEnabled={sounds.length >= 3}
      onAction={onComplete}
      onBack={onBack}
      footerText="Sound Capture Engine · L1 Project"
    >
      <audio ref={audioRef} onEnded={() => setPlayingId(null)} />

      {/* Progress indicators */}
      <div className="flex items-center gap-3 mb-4 sm:mb-6">
        <div className="flex -space-x-1.5">
          {[1, 2, 3].map(i => (
            <div
              key={i}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-semibold"
              style={i <= sounds.length
                ? { background: PALETTE.green.accent, color: '#fff' }
                : { background: '#F8FAFC', color: '#94A3B8', border: '2px solid #E2E8F0' }
              }
            >{i}</div>
          ))}
        </div>
        <span className="text-xs font-semibold text-slate-400">{sounds.length}/3 已捕捉</span>
      </div>

      {/* Empty state */}
      {sounds.length === 0 && !isAdding && (
        <div className="flex flex-col items-center justify-center py-16 sm:py-24 text-center">
          <div
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl flex items-center justify-center mb-5"
            style={{ background: PALETTE.blue.bg, border: `2px solid ${PALETTE.blue.accent}33` }}
          >
            <Upload size={32} style={{ color: PALETTE.blue.accent }} />
          </div>
          <h3 className="text-xl font-bold tracking-tight text-slate-800 mb-2">你的狩猎背包是空的</h3>
          <p className="text-sm font-medium text-slate-400 max-w-sm">点击下方按钮，上传你从身边捕捉到的奇妙声音吧</p>
        </div>
      )}

      {/* Sound cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {sounds.map(sound => (
          <div key={sound.id} className="group bg-white rounded-2xl border border-slate-200 shadow-[0_1px_4px_rgba(0,0,0,0.02)] overflow-hidden transition-all hover:shadow-[0_1px_6px_rgba(0,0,0,0.03)] hover:-translate-y-0.5">
            <div className="aspect-[4/3] relative overflow-hidden">
              <img src={sound.photoUrl} alt={sound.name} className="w-full h-full object-cover" />
              <button
                onClick={() => deleteSound(sound.id)}
                className="absolute top-3 right-3 p-1.5 bg-white/90 rounded-lg text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
              >
                <Trash2 size={14} />
              </button>
            </div>
            <div className="p-3.5 sm:p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold text-slate-800 truncate">{sound.name}</h4>
                <span
                  className="px-2 py-0.5 rounded-full text-[10px] font-semibold border"
                  style={{ background: PALETTE.blue.bg, color: PALETTE.blue.accent, borderColor: PALETTE.blue.accent + '33' }}
                >Captured</span>
              </div>
              <button
                onClick={() => togglePlay(sound)}
                className="w-full py-2.5 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition-all text-white hover:opacity-90 active:scale-95"
                style={{ background: playingId === sound.id ? '#ef4444' : PALETTE.blue.accent }}
              >
                {playingId === sound.id ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
                {playingId === sound.id ? '正在播放' : '播放声音'}
              </button>
            </div>
          </div>
        ))}

        {/* Add new sound button */}
        {!isAdding && sounds.length < 5 && (
          <button
            onClick={() => setIsAdding(true)}
            className="aspect-[4/3] rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-95 hover:border-[#5BA4F5] bg-white"
          >
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: PALETTE.blue.bg }}>
              <Plus size={20} style={{ color: PALETTE.blue.accent }} />
            </div>
            <span className="text-xs font-semibold text-slate-400">上传新声音</span>
          </button>
        )}
      </div>

      {/* Add Sound Modal */}
      {isAdding && (
        <div className="fixed inset-0 z-[250] bg-slate-900/30 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-6">
          <div className="w-full sm:max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.06)] overflow-hidden max-h-[85vh] overflow-y-auto">
            {/* Modal header */}
            <div className="p-5 sm:p-6 border-b border-slate-200 flex items-center justify-between" style={{ background: PALETTE.blue.bg }}>
              <h3 className="text-base font-bold text-slate-800">声音上传中心</h3>
              <button onClick={resetForm} className="p-1.5 rounded-lg bg-white/70 text-slate-400 hover:text-slate-600 transition-all">
                <X size={14} />
              </button>
            </div>

            <div className="p-5 sm:p-6 space-y-5">
              {/* Name input */}
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-1.5 block">声音的代号</label>
                <input
                  type="text"
                  placeholder="例如: 午后的海浪声..."
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-xl border text-sm font-medium outline-none transition-all bg-white border-slate-200 text-slate-800 placeholder:text-slate-300 focus:border-[#5BA4F5] focus:ring-2 focus:ring-[#5BA4F5]/10"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {/* Photo upload */}
                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-1.5 block">声音的照片</label>
                  <div className="relative aspect-square rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center overflow-hidden bg-[#F8FAFC]">
                    {newPhoto ? (
                      <>
                        <img src={newPhoto} className="w-full h-full object-cover" />
                        <button onClick={() => setNewPhoto(null)} className="absolute top-2 right-2 p-1 bg-white/80 rounded-lg text-slate-400"><X size={12} /></button>
                      </>
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-slate-300">
                        <ImageIcon size={24} />
                        <span className="text-xs font-semibold">选择照片</span>
                        <input type="file" accept="image/*" onChange={e => handleFileUpload(e, 'image')} className="absolute inset-0 opacity-0 cursor-pointer" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Audio upload */}
                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-1.5 block">声音的文件</label>
                  <div className="relative aspect-square rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center bg-[#F8FAFC]">
                    {newAudio ? (
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: PALETTE.blue.bg }}>
                          <FileAudio size={20} style={{ color: PALETTE.blue.accent }} />
                        </div>
                        <span className="text-xs font-semibold" style={{ color: PALETTE.blue.accent }}>音频已就绪</span>
                        <button onClick={() => setNewAudio(null)} className="text-[10px] font-semibold text-slate-400 hover:text-red-500 underline">重新选择</button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-slate-300">
                        <FileAudio size={24} />
                        <span className="text-xs font-semibold">上传音频</span>
                        <input type="file" accept="audio/*" onChange={e => handleFileUpload(e, 'audio')} className="absolute inset-0 opacity-0 cursor-pointer" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={saveSound}
                disabled={!newName || !newPhoto || !newAudio}
                className={`w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
                  newName && newPhoto && newAudio
                    ? 'bg-[#1e293b] text-white hover:opacity-90 active:scale-95'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-40'
                }`}
              >
                保存到狩猎背包 <Check size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </ProjectShell>
  );
};

export default SoundHuntingProject;
