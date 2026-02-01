
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { MessageCircle, X, Send, Sparkles, Music2, BrainCircuit, AlertCircle, Cpu } from 'lucide-react';

interface AIAssistantProps {
  theme?: 'light' | 'dark';
}

const AIAssistant: React.FC<AIAssistantProps> = ({ theme = 'dark' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{role: 'user' | 'assistant', text: string, type?: 'theory' | 'chat'}>([
    { role: 'assistant', text: "嘿！我是你的音乐制作人小助手 Jin-Bot 🤖。在这里，我们可以一起讨论音程逻辑、合成器参数，或者单纯聊聊你的创作灵感！", type: 'theory' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isDark = theme === 'dark';

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (customInput?: string) => {
    const userMessage = customInput || input;
    if (!userMessage.trim()) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsTyping(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: userMessage,
        config: {
          systemInstruction: `你是一个生音科技（Jinrator）的音乐科技导师，名叫Jin-Bot。
          风格：科技感、严谨但友善、充满活力，专为儿童设计。
          解释：将音乐概念与科技/物理结合。
          回复要求：简洁、充满鼓励，并在结尾提供两个相关的创作方向供孩子选择。
          始终使用中文。`,
        }
      });
      
      const aiText = response.text || "数据传输中断，请重试。";
      setMessages(prev => [...prev, { role: 'assistant', text: aiText }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', text: "我的电路出了一点小状况，稍等一下下！⚡" }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-12 right-12 z-[150]">
      {isOpen ? (
        <div className={`w-[450px] h-[650px] rounded-[3.5rem] flex flex-col overflow-hidden animate-in slide-in-from-bottom-20 slide-in-from-right-20 duration-500 shadow-lg border ${isDark ? 'bg-[#001a33]/95 border-white/10 backdrop-blur-2xl' : 'bg-white/95 border-blue-100 backdrop-blur-2xl'}`}>
          <div className="p-10 bg-gradient-to-r from-blue-600 to-indigo-700 flex items-center justify-between">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center animate-pulse border border-white/20">
                <Cpu className="text-white" size={32} />
              </div>
              <div>
                <span className="font-black text-xl tracking-tight block text-white uppercase">Jin-Bot AI</span>
                <span className="text-[10px] text-blue-200 font-black uppercase tracking-widest">创作助教就绪</span>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white/40 hover:text-white p-3 hover:bg-white/5 rounded-2xl transition-all">
              <X size={28} />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-10 flex flex-col gap-8 scrollbar-hide">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`
                  max-w-[85%] p-6 rounded-[2.5rem] text-sm leading-relaxed border
                  ${m.role === 'user' 
                    ? 'bg-blue-600 border-blue-400 text-white rounded-br-none' 
                    : isDark ? 'bg-white/5 border-white/10 text-slate-200 rounded-bl-none' : 'bg-blue-50/50 border-blue-100 text-blue-900 rounded-bl-none'}
                `}>
                  {m.text}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-blue-500/10 px-6 py-3 rounded-full text-[10px] font-black text-blue-500 animate-pulse border border-blue-500/20 tracking-widest uppercase">
                  数据流分析中...
                </div>
              </div>
            )}
          </div>

          <div className={`p-8 flex flex-col gap-5 border-t ${isDark ? 'bg-black/40 border-white/5' : 'bg-slate-50 border-blue-50'}`}>
            <div className="flex gap-3 flex-wrap">
              {["什么是频率？📡", "教我写节奏 🥁", "优化我的旋律 🔧"].map(q => (
                <button 
                  key={q}
                  onClick={() => handleSend(q)}
                  className={`text-[10px] font-black px-4 py-2 rounded-xl border transition-all ${isDark ? 'bg-white/5 border-white/10 text-blue-300 hover:bg-white/10' : 'bg-white border-blue-100 text-blue-600 hover:bg-blue-50'}`}
                >
                  {q}
                </button>
              ))}
            </div>
            <div className="flex gap-4">
              <input 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="在此输入指令..."
                className={`flex-1 border rounded-[1.8rem] px-8 py-5 text-sm outline-none transition-all ${isDark ? 'bg-white/5 border-white/10 text-white focus:ring-2 ring-blue-500 placeholder:text-slate-600' : 'bg-white border-blue-100 text-blue-950 focus:ring-2 ring-blue-500 placeholder:text-slate-300'}`}
              />
              <button 
                onClick={() => handleSend()}
                className="w-16 h-16 bg-blue-600 rounded-[1.5rem] flex items-center justify-center hover:bg-blue-500 transition-all active:scale-90"
              >
                <Send size={28} className="text-white" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button 
          onClick={() => setIsOpen(true)}
          className={`
            w-28 h-28 rounded-[3rem] flex items-center justify-center hover:scale-110 active:scale-95 transition-all group relative border-4
            ${isDark ? 'bg-gradient-to-br from-blue-500 to-indigo-800 border-white/20' : 'bg-white border-blue-100'}
          `}
        >
          <div className="relative w-full h-full flex items-center justify-center">
             <Cpu className={`${isDark ? 'text-white' : 'text-blue-600'} group-hover:rotate-12 transition-transform duration-500 animate-bounce-subtle`} size={48} />
             {/* 浮动装饰件 */}
             <div className="absolute -top-2 -left-2 w-6 h-6 bg-blue-400 rounded-full animate-ping opacity-20" />
             <div className="absolute top-2 right-2 w-4 h-4 bg-indigo-500 rounded-full animate-bounce delay-300" />
          </div>
          <div className="absolute -top-1 -right-1 bg-rose-500 text-white w-10 h-10 rounded-full border-4 border-white flex items-center justify-center font-black text-[10px]">
            AI
          </div>
        </button>
      )}
    </div>
  );
};

export default AIAssistant;
