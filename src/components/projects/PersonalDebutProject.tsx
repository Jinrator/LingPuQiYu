
import React, { useState, useRef } from 'react';
import { GoogleGenAI } from '@google/genai';
import { X, Check, Wand2, Sparkles, Trophy, Share2, QrCode, Play, Pause, Music2, PenTool, Disc, Send, Loader2 } from 'lucide-react';

interface PersonalDebutProjectProps {
  onComplete: () => void;
  onBack: () => void;
  theme?: 'light' | 'dark';
}

const PersonalDebutProject: React.FC<PersonalDebutProjectProps> = ({ onComplete, onBack, theme = 'dark' }) => {
  const [songTitle, setSongTitle] = useState('');
  const [producerName, setProducerName] = useState('');
  const [prompt, setPrompt] = useState('');
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const isDark = theme === 'dark';

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
        if (part.inlineData) {
          setCoverUrl(`data:image/png;base64,${part.inlineData.data}`);
          break;
        }
      }
    } catch (err) {
      console.error("Image generation failed", err);
      // Fallback color if generation fails for demo
      setCoverUrl("https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=800&auto=format&fit=crop");
    } finally {
      setIsGenerating(false);
    }
  };

  const publishSong = () => {
    if (!songTitle || !producerName || !coverUrl) return;
    setIsPublishing(true);
    setTimeout(() => {
      setIsPublishing(false);
      setIsComplete(true);
    }, 3000);
  };

  if (isComplete) {
    return (
      <div className={`fixed inset-0 z-[250] flex flex-col items-center justify-center p-8 transition-all duration-1000 ${isDark ? 'bg-slate-950' : 'bg-blue-50'}`}>
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
           {[...Array(20)].map((_, i) => (
             <div key={i} className="absolute animate-bounce" style={{ 
               left: Math.random() * 100 + '%', 
               top: Math.random() * 100 + '%', 
               animationDelay: Math.random() * 2 + 's' 
             }}>
                <Sparkles className="text-yellow-400 opacity-20" size={Math.random() * 40 + 20} />
             </div>
           ))}
        </div>

        <div className={`w-full max-w-4xl rounded-[5rem] p-16 flex flex-col items-center gap-12 text-center animate-in zoom-in-95 duration-1000 border relative z-10 ${isDark ? 'bg-slate-900 border-white/5' : 'bg-white border-blue-100'}`}>
           <div className="w-32 h-32 bg-emerald-500 rounded-[2.5rem] flex items-center justify-center text-white animate-bounce">
              <Trophy size={64} />
           </div>
           
           <div className="space-y-4">
              <h2 className={`text-6xl font-fredoka tracking-tight ${isDark ? 'text-white' : 'text-blue-950'}`}>传奇首单，正式出道！</h2>
              <p className="text-xl font-bold text-slate-500 italic">“ 你的音乐已经飞往演出舞台，在那里你会遇见更多的听众。 ”</p>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-12 w-full">
              <div className="flex flex-col items-center gap-6">
                 <div className={`w-64 h-64 rounded-full border-8 p-4 ${isDark ? 'border-white/10' : 'border-blue-50'} animate-spin-slow`}>
                    <div className="w-full h-full rounded-full overflow-hidden">
                       <img src={coverUrl!} alt="Album Cover" className="w-full h-full object-cover" />
                    </div>
                 </div>
                 <div className="text-center">
                    <h3 className="text-2xl font-black text-blue-500">{songTitle}</h3>
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-1">PROD BY {producerName}</p>
                 </div>
              </div>

              <div className={`p-10 rounded-[3.5rem] border flex flex-col items-center justify-center gap-8 ${isDark ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-blue-50'}`}>
                 <div className="w-40 h-40 bg-white p-4 rounded-3xl flex items-center justify-center border-4 border-blue-500">
                    <QrCode size={120} className="text-slate-900" />
                 </div>
                 <div className="space-y-2">
                    <p className="text-sm font-black text-blue-500 uppercase tracking-widest">扫描二维码分享</p>
                    <p className="text-xs text-slate-500 font-medium">邀请你的第一批听众，开启你的音乐节！</p>
                 </div>
                 <button className="flex items-center gap-3 text-blue-600 font-black hover:scale-105 transition-transform">
                    <Share2 size={20} /> 保存精美海报
                 </button>
              </div>
           </div>

           <button 
             onClick={onComplete}
             className="px-20 py-6 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-[2.5rem] font-black text-2xl hover:scale-105 active:scale-95 transition-all"
           >
             返回主地图
           </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`fixed inset-0 z-[200] flex flex-col transition-all duration-700 overflow-hidden ${isDark ? 'bg-slate-950' : 'bg-[#fcfdff]'}`}>
      
      <header className={`relative z-10 p-8 flex items-center justify-between transition-colors border-b backdrop-blur-xl ${isDark ? 'bg-slate-900/60 border-white/5' : 'bg-white/60 border-blue-100'}`}>
        <div className="flex items-center gap-6">
          <button onClick={onBack} className={`p-4 rounded-2xl transition-all ${isDark ? 'bg-white/5 text-slate-400' : 'bg-white border border-blue-100 text-blue-600'}`}>
            <X size={24} />
          </button>
          <div>
            <h2 className={`text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-blue-950'}`}>L15 · 个人首单发布</h2>
            <p className={`text-[10px] font-black uppercase tracking-[0.3em] mt-1 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>FINAL STAGE RELEASE</p>
          </div>
        </div>
        
        <button 
          disabled={!songTitle || !producerName || !coverUrl || isPublishing}
          onClick={publishSong}
          className={`px-10 py-4 rounded-2xl font-black text-sm text-white transition-all ${songTitle && coverUrl ? 'bg-blue-600 scale-105 hover:bg-blue-500' : 'bg-slate-400 opacity-50 cursor-not-allowed'}`}
        >
          {isPublishing ? <Loader2 size={18} className="animate-spin" /> : <><Send size={18} className="mr-2 inline" /> 全球发布</>}
        </button>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row items-stretch p-8 relative z-10 gap-8 overflow-y-auto scrollbar-hide">
        
        {/* 左侧：黑胶唱片预览 */}
        <div className={`flex-1 rounded-[4rem] border p-12 flex flex-col items-center justify-center gap-12 relative overflow-hidden ${isDark ? 'bg-slate-900/40 border-white/5' : 'bg-white border-blue-100'}`}>
           <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.2)_0%,transparent_70%)]" />
           
           <div className="relative group">
              <div className={`w-80 h-80 rounded-full bg-slate-900 flex items-center justify-center border-[12px] border-black/20 ${isPlaying ? 'animate-spin-slow' : ''}`}>
                 <div className="w-full h-full rounded-full border-8 border-white/5 flex items-center justify-center overflow-hidden">
                    {coverUrl ? (
                      <img src={coverUrl} alt="Album Art" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-slate-700">
                         <Music2 size={64} className="opacity-20" />
                         <span className="text-[10px] font-black uppercase tracking-widest opacity-40">等待封面注入</span>
                      </div>
                    )}
                 </div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                 <button onClick={() => setIsPlaying(!isPlaying)} className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-full border border-white/30 flex items-center justify-center text-white">
                    {isPlaying ? <Pause size={32} /> : <Play size={32} className="ml-1" />}
                 </button>
              </div>
           </div>

           <div className="text-center space-y-2">
              <h3 className={`text-4xl font-black ${isDark ? 'text-white' : 'text-blue-900'}`}>{songTitle || '未命名作品'}</h3>
              <p className="text-blue-500 font-black uppercase tracking-[0.4em] text-sm">PRODUCED BY {producerName || '神秘制作人'}</p>
           </div>
        </div>

        {/* 右侧：发布控制台 */}
        <div className="w-full lg:w-[500px] flex flex-col gap-8">
           
           <div className={`p-10 rounded-[3.5rem] border space-y-8 ${isDark ? 'bg-slate-900/60 border-white/5' : 'bg-white border-blue-50'}`}>
              <div className="flex items-center gap-4">
                 <PenTool className="text-blue-500" size={24} />
                 <h4 className={`text-xl font-black ${isDark ? 'text-white' : 'text-blue-900'}`}>作品基本信息</h4>
              </div>
              <div className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">单曲标题</label>
                    <input 
                      type="text" 
                      placeholder="取个响亮的名字..."
                      value={songTitle}
                      onChange={(e) => setSongTitle(e.target.value)}
                      className={`w-full px-6 py-4 rounded-2xl border transition-all font-bold ${isDark ? 'bg-white/5 border-white/5 text-white focus:border-blue-500' : 'bg-slate-50 border-slate-100 text-blue-950 focus:bg-white focus:border-blue-300'}`}
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">制作人签名</label>
                    <input 
                      type="text" 
                      placeholder="你的艺名..."
                      value={producerName}
                      onChange={(e) => setProducerName(e.target.value)}
                      className={`w-full px-6 py-4 rounded-2xl border transition-all font-bold ${isDark ? 'bg-white/5 border-white/5 text-white focus:border-blue-500' : 'bg-slate-50 border-slate-100 text-blue-950 focus:bg-white focus:border-blue-300'}`}
                    />
                 </div>
              </div>
           </div>

           <div className={`flex-1 p-10 rounded-[3.5rem] border flex flex-col gap-6 relative overflow-hidden ${isDark ? 'bg-slate-900 border-white/5' : 'bg-white border-blue-50'}`}>
              <div className="flex items-center gap-4">
                 <Wand2 className="text-indigo-500" size={24} />
                 <h4 className={`text-xl font-black ${isDark ? 'text-white' : 'text-blue-900'}`}>AI 封面绘图引擎</h4>
              </div>
              
              <div className="space-y-4">
                 <p className="text-xs font-medium text-slate-500 leading-relaxed">描述你音乐的“颜色”或“情绪”，AI 导师 Jin-Bot 将为你生成艺术封面。</p>
                 <textarea 
                   rows={3}
                   placeholder="例如：快乐的橙色小猫，在蓝色的音符云朵上跳舞..."
                   value={prompt}
                   onChange={(e) => setPrompt(e.target.value)}
                   className={`w-full px-6 py-4 rounded-3xl border transition-all font-bold resize-none ${isDark ? 'bg-white/5 border-white/5 text-white focus:border-indigo-500' : 'bg-slate-50 border-slate-100 text-blue-950 focus:bg-white focus:border-indigo-300'}`}
                 />
              </div>

              <button 
                onClick={generateCover}
                disabled={!prompt.trim() || isGenerating}
                className={`w-full py-5 rounded-3xl font-black text-white flex items-center justify-center gap-3 transition-all ${!prompt.trim() || isGenerating ? 'bg-slate-400 opacity-50' : 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:scale-[1.02]'}`}
              >
                {isGenerating ? <Loader2 className="animate-spin" size={20} /> : <><Sparkles size={20} /> 生成封面艺术</>}
              </button>

              <div className="mt-auto flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5">
                 <Disc className="text-blue-500 animate-spin-slow" size={20} />
                 <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Voyage Engine v5.0 · Art Gen Mod active</span>
              </div>
           </div>

        </div>
      </main>

      {/* 仪式感提示层 */}
      {isPublishing && (
        <div className="fixed inset-0 z-[300] backdrop-blur-xl bg-blue-950/40 flex flex-col items-center justify-center gap-12 animate-in fade-in duration-500 text-white">
           <div className="relative">
              <div className="w-40 h-40 bg-white/10 rounded-full animate-ping absolute inset-0" />
              <div className="w-40 h-40 bg-blue-600 rounded-[3rem] flex items-center justify-center border-4 border-white/20 animate-bounce relative z-10">
                 <Send size={64} />
              </div>
           </div>
           <div className="text-center space-y-4">
              <h3 className="text-5xl font-fredoka tracking-tighter">正在飞往演出舞台...</h3>
              <p className="text-blue-200 font-bold tracking-widest uppercase text-sm animate-pulse">正在上传母带 · 正在分发唱片 · 正在邀请听众</p>
           </div>
        </div>
      )}
    </div>
  );
};

export default PersonalDebutProject;
