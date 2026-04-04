import React, { useState, useRef } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Wand2, Sparkles, Trophy, Share2, QrCode, Play, Pause, PenTool, Send, Loader2, Music2, Upload, ImagePlus, FileAudio, Disc3 } from 'lucide-react';
import { PALETTE } from '../../constants/palette';
import ProjectShell from './ProjectShell';

const PersonalDebutProject: React.FC<{ onComplete: () => void; onBack: () => void; theme?: 'light' | 'dark' }> = ({ onComplete, onBack }) => {
  const [songTitle, setSongTitle] = useState('');
  const [producerName, setProducerName] = useState('');
  const [prompt, setPrompt] = useState('');
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  const generateCover = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      const fullPrompt = `A vibrant, creative music album cover for kids, theme: ${prompt}, high quality art style, 1k resolution.`;
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: fullPrompt }] },
        config: { imageConfig: { aspectRatio: "1:1" } },
      });
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) { setCoverUrl(`data:image/png;base64,${part.inlineData.data}`); break; }
      }
    } catch (err) {
      console.error("Image generation failed", err);
      setCoverUrl("/images/InspirationGenie.jpg");
    } finally { setIsGenerating(false); }
  };

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setCoverUrl(url);
  };

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAudioFile(file);
    const url = URL.createObjectURL(file);
    setAudioUrl(url);
    setIsPlaying(false);
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const publishSong = () => {
    if (!songTitle || !producerName || !coverUrl) return;
    setIsPublishing(true);
    setTimeout(() => { setIsPublishing(false); setIsComplete(true); }, 3000);
  };

  /* ── Completion celebration screen ── */
  if (isComplete) {
    return (
      <div className="fixed inset-0 z-[250] flex flex-col items-center justify-center p-4 sm:p-8 bg-[#F5F7FA]">
        <div className="w-full max-w-2xl bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-slate-200 p-6 sm:p-10 flex flex-col items-center gap-6 sm:gap-8 text-center">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-white" style={{ background: PALETTE.green.accent }}>
            <Trophy size={40} />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-800 mb-2">传奇首单，正式出道！</h2>
            <p className="text-sm font-medium text-slate-500">你的音乐已经飞往演出舞台，快去那里聆听你的作品吧。</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 w-full">
            {/* Album art */}
            <div className="flex flex-col items-center gap-3">
              <div className="w-40 h-40 sm:w-48 sm:h-48 rounded-2xl overflow-hidden border border-slate-200">
                <img src={coverUrl!} alt="Album Cover" className="w-full h-full object-cover" />
              </div>
              <h3 className="text-sm font-bold" style={{ color: PALETTE.blue.accent }}>{songTitle}</h3>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">PROD BY {producerName}</p>
            </div>
            {/* QR share */}
            <div className="bg-[#F8FAFC] rounded-2xl border border-slate-200 p-5 sm:p-6 flex flex-col items-center justify-center gap-4">
              <div className="w-28 h-28 bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-center">
                <QrCode size={80} className="text-slate-800" />
              </div>
              <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: PALETTE.blue.accent }}>扫描二维码分享</p>
              <button className="flex items-center gap-2 text-xs font-semibold transition-all hover:scale-[1.02]" style={{ color: PALETTE.blue.accent }}>
                <Share2 size={14} /> 保存精美海报
              </button>
            </div>
          </div>

          {/* Stage CTA */}
          <div className="w-full rounded-xl border p-4 flex items-center gap-4"
            style={{ background: PALETTE.pink.bg, borderColor: PALETTE.pink.accent + '33' }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-white"
              style={{ background: PALETTE.pink.accent }}>
              <Disc3 size={20} />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-bold text-slate-800">前往演出舞台聆听</p>
              <p className="text-xs font-medium text-slate-500">你的首单已上架，在舞台模式中可以播放欣赏</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <button onClick={onComplete}
              className="flex-1 py-3.5 rounded-xl font-semibold text-sm text-slate-600 flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-95 border border-slate-200 bg-white">
              返回主地图
            </button>
            <button onClick={onComplete}
              className="flex-1 py-3.5 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-95"
              style={{ background: PALETTE.pink.accent }}>
              <Disc3 size={16} /> 去演出舞台
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ProjectShell lessonId={15} title="个人首单发布" subtitle="FINAL STAGE RELEASE" color="blue"
      actionLabel={isPublishing ? '' : '全球发布'} actionEnabled={!!songTitle && !!producerName && !!coverUrl && !!audioFile && !isPublishing}
      onAction={publishSong} onBack={onBack} loading={isPublishing} footerText="Voyage Engine · L15">

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        {/* Left: vinyl preview */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_1px_4px_rgba(0,0,0,0.02)] p-5 sm:p-6 flex flex-col items-center gap-4">
          <div className="relative group">
            <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
            <button onClick={() => coverInputRef.current?.click()}
              className="w-48 h-48 sm:w-56 sm:h-56 rounded-2xl bg-[#F8FAFC] border border-slate-200 flex items-center justify-center overflow-hidden transition-all hover:border-slate-300 hover:bg-slate-100 active:scale-95 cursor-pointer">
              {coverUrl ? (
                <img src={coverUrl} alt="Album Art" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-2 text-slate-300">
                  <Music2 size={40} />
                  <span className="text-[10px] font-semibold uppercase tracking-widest">点击上传封面</span>
                </div>
              )}
            </button>
            {coverUrl && audioUrl && (
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl bg-slate-900/20 pointer-events-none">
                <button onClick={togglePlay} style={{ pointerEvents: 'auto' }}
                  className="w-12 h-12 rounded-xl bg-white/90 flex items-center justify-center text-slate-800 transition-all active:scale-95">
                  {isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
                </button>
              </div>
            )}
          </div>
          <div className="text-center">
            <h3 className="text-base font-bold text-slate-800">{songTitle || '未命名作品'}</h3>
            <p className="text-[10px] font-semibold uppercase tracking-widest mt-1" style={{ color: PALETTE.blue.accent }}>
              PRODUCED BY {producerName || '神秘制作人'}
            </p>
          </div>
          {/* Audio upload zone */}
          <input ref={audioInputRef} type="file" accept="audio/*" className="hidden" onChange={handleAudioUpload} />
          {audioFile ? (
            <button onClick={() => audioInputRef.current?.click()}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-slate-200 shadow-[0_1px_2px_rgba(0,0,0,0.02)] text-slate-600 text-xs font-semibold w-full justify-center transition-all hover:bg-slate-50 active:scale-95">
              <span className="w-1.5 h-1.5 rounded-full animate-pulse flex-shrink-0" style={{ background: PALETTE.green.accent }} />
              <span className="truncate">{audioFile.name.length > 22 ? audioFile.name.slice(0, 22) + '…' : audioFile.name}</span>
            </button>
          ) : (
            <button onClick={() => audioInputRef.current?.click()}
              className="w-full py-3 rounded-xl border-2 border-dashed border-slate-200 text-slate-400 text-xs font-semibold flex items-center justify-center gap-2 transition-all hover:border-slate-300 hover:text-slate-500 active:scale-95">
              <FileAudio size={14} /> 点击上传音频文件
            </button>
          )}
          {audioUrl && <audio ref={audioRef} src={audioUrl} onEnded={() => setIsPlaying(false)} />}
        </div>

        {/* Right: controls */}
        <div className="space-y-4">
          {/* Basic info */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_1px_4px_rgba(0,0,0,0.02)] p-4 sm:p-5 space-y-4">
            <div className="flex items-center gap-3">
              <PenTool size={18} style={{ color: PALETTE.blue.accent }} />
              <h4 className="text-sm font-bold text-slate-800">作品基本信息</h4>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-1 block">单曲标题</label>
                <input type="text" placeholder="取个响亮的名字..." value={songTitle}
                  onChange={(e) => setSongTitle(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border text-sm font-medium outline-none transition-all bg-white border-slate-200 text-slate-800 placeholder:text-slate-300 focus:border-[#5BA4F5] focus:ring-2 focus:ring-[#5BA4F5]/10" />
              </div>
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-1 block">制作人签名</label>
                <input type="text" placeholder="你的艺名..." value={producerName}
                  onChange={(e) => setProducerName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border text-sm font-medium outline-none transition-all bg-white border-slate-200 text-slate-800 placeholder:text-slate-300 focus:border-[#5BA4F5] focus:ring-2 focus:ring-[#5BA4F5]/10" />
              </div>
            </div>
          </div>

          {/* Cover: upload or AI generate */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_1px_4px_rgba(0,0,0,0.02)] p-4 sm:p-5 space-y-4">
            <div className="flex items-center gap-3">
              <Wand2 size={18} style={{ color: PALETTE.pink.accent }} />
              <h4 className="text-sm font-bold text-slate-800">AI 封面绘图引擎</h4>
            </div>
            <p className="text-xs font-medium text-slate-500 leading-relaxed">描述你音乐的"颜色"或"情绪"，AI 导师将为你生成艺术封面。</p>
            <textarea rows={2} placeholder="例如：快乐的橙色小猫，在蓝色的音符云朵上跳舞..."
              value={prompt} onChange={(e) => setPrompt(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border text-sm font-medium outline-none transition-all bg-white border-slate-200 text-slate-800 placeholder:text-slate-300 focus:border-[#5BA4F5] focus:ring-2 focus:ring-[#5BA4F5]/10 resize-none" />
            <button onClick={generateCover} disabled={!prompt.trim() || isGenerating}
              className={`w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
                !prompt.trim() || isGenerating
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-40'
                  : 'text-white hover:opacity-90 active:scale-95'
              }`}
              style={prompt.trim() && !isGenerating ? { background: PALETTE.pink.accent } : undefined}>
              {isGenerating ? <Loader2 className="animate-spin" size={16} /> : <><Sparkles size={16} /> AI 生成封面</>}
            </button>
          </div>

        </div>
      </div>

      {/* Publishing overlay */}
      {isPublishing && (
        <div className="fixed inset-0 z-[300] bg-slate-900/30 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-6">
          <div className="w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.06)] p-6 sm:p-8 flex flex-col items-center gap-5 text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white" style={{ background: PALETTE.blue.accent }}>
              <Send size={28} />
            </div>
            <h3 className="text-base font-bold text-slate-800">正在飞往演出舞台...</h3>
            <p className="text-xs font-medium text-slate-400">正在上传母带 · 正在分发唱片 · 正在邀请听众</p>
            <Loader2 size={24} className="animate-spin" style={{ color: PALETTE.blue.accent }} />
          </div>
        </div>
      )}
    </ProjectShell>
  );
};

export default PersonalDebutProject;
