import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { X, Send, Cpu } from 'lucide-react';
import { PALETTE } from '../../constants/palette';
import { useSettings } from '../../contexts/SettingsContext';

interface AIAssistantProps {
  theme?: 'light' | 'dark';
}

const AIAssistant: React.FC<AIAssistantProps> = () => {
  const { t } = useSettings();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; text: string }[]>([
    { role: 'assistant', text: '' },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Set initial greeting with translated text
  useEffect(() => {
    setMessages([{ role: 'assistant', text: t('ai.greeting') }]);
  }, [t]);

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
          systemInstruction: t('ai.systemPrompt'),
        },
      });
      setMessages(prev => [...prev, { role: 'assistant', text: response.text || t('ai.dataInterrupt') }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', text: t('ai.error') }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-20 md:bottom-8 right-3 sm:right-8 z-[150]">
      {isOpen ? (
        <div className="w-[calc(100vw-1.5rem)] sm:w-[400px] h-[70vh] sm:h-[560px] bg-white rounded-2xl shadow-xl border border-slate-200 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-100" style={{ background: PALETTE.blue.bg }}>
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center" style={{ background: PALETTE.blue.accent }}>
                <Cpu size={16} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">Jin-Bot AI</p>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">{t('ai.ready')}</p>
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
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col gap-3 sm:gap-4 scrollbar-hide">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className="max-w-[85%] px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl text-sm font-medium leading-relaxed"
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
                  {t('ai.analyzing')}
                </div>
              </div>
            )}
          </div>

          {/* Quick prompts */}
          <div className="px-4 sm:px-5 pb-2 sm:pb-3 flex gap-1.5 sm:gap-2 flex-wrap">
            {[t('ai.q1'), t('ai.q2'), t('ai.q3')].map(q => (
              <button
                key={q}
                onClick={() => handleSend(q)}
                className="text-xs sm:text-[10px] font-semibold px-2.5 sm:px-3 py-1.5 rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50 transition-all"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="px-4 sm:px-5 pb-4 sm:pb-5 flex gap-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder={t('ai.placeholder')}
              className="flex-1 pl-4 pr-3 py-2.5 sm:py-3 rounded-xl border border-slate-200 text-sm font-medium outline-none transition-all bg-white text-slate-800 placeholder:text-slate-300 focus:border-[#5BA4F5] focus:ring-2 focus:ring-[#5BA4F5]/10"
            />
            <button
              onClick={() => handleSend()}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center text-white transition-all hover:opacity-90 active:scale-95 flex-shrink-0"
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
