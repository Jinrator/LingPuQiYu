import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { X, Send, Cpu } from 'lucide-react';
import { PALETTE } from '../../constants/palette';

interface AIAssistantProps {
  theme?: 'light' | 'dark';
}

const AIAssistant: React.FC<AIAssistantProps> = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; text: string }[]>([
    { role: 'assistant', text: '嘿！我是你的音乐助手 Jin-Bot。可以问我音程、节奏、和弦，或者聊聊你的创作灵感！' },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
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
          systemInstruction: `你是生音科技的音乐科技导师 Jin-Bot。风格：专业、友善、充满活力，专为儿童设计。将音乐概念与科技结合解释。回复简洁，结尾提供两个创作方向。始终使用中文。`,
        },
      });
      setMessages(prev => [...prev, { role: 'assistant', text: response.text || '数据传输中断，请重试。' }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', text: '我的电路出了一点小状况，稍等一下！⚡' }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-8 right-8 z-[150]">
      {isOpen ? (
        <div className="w-[400px] h-[560px] bg-white rounded-2xl shadow-xl border border-slate-200 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100" style={{ background: PALETTE.blue.bg }}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: PALETTE.blue.accent }}>
                <Cpu size={18} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">Jin-Bot AI</p>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">创作助教就绪</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 rounded-xl border border-slate-200 bg-white text-slate-400 hover:text-slate-600 transition-all"
            >
              <X size={14} />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 flex flex-col gap-4 scrollbar-hide">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className="max-w-[85%] px-4 py-3 rounded-xl text-sm font-medium leading-relaxed"
                  style={m.role === 'user'
                    ? { background: '#1e293b', color: 'white' }
                    : { background: PALETTE.blue.bg, color: '#475569' }}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div
                  className="px-4 py-2 rounded-full text-[10px] font-semibold uppercase tracking-widest animate-pulse"
                  style={{ background: PALETTE.blue.bg, color: PALETTE.blue.accent }}
                >
                  分析中...
                </div>
              </div>
            )}
          </div>

          {/* Quick prompts */}
          <div className="px-5 pb-3 flex gap-2 flex-wrap">
            {['什么是频率？', '教我写节奏', '优化我的旋律'].map(q => (
              <button
                key={q}
                onClick={() => handleSend(q)}
                className="text-[10px] font-semibold px-3 py-1.5 rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50 transition-all"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="px-5 pb-5 flex gap-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="在此输入问题..."
              className="flex-1 pl-4 pr-3 py-3 rounded-xl border border-slate-200 text-sm font-medium outline-none transition-all bg-white text-slate-800 placeholder:text-slate-300 focus:border-[#5BA4F5] focus:ring-2 focus:ring-[#5BA4F5]/10"
            />
            <button
              onClick={() => handleSend()}
              className="w-11 h-11 rounded-xl flex items-center justify-center text-white transition-all hover:opacity-90 active:scale-95 flex-shrink-0"
              style={{ background: PALETTE.blue.accent }}
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg border border-slate-200 bg-white transition-all hover:scale-[1.05] active:scale-95 relative"
        >
          <Cpu size={22} style={{ color: PALETTE.blue.accent }} />
          <span
            className="absolute -top-1.5 -right-1.5 text-[9px] font-bold text-white px-1.5 py-0.5 rounded-full"
            style={{ background: PALETTE.blue.accent }}
          >
            AI
          </span>
        </button>
      )}
    </div>
  );
};

export default AIAssistant;
