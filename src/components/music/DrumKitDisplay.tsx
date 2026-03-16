import React, { useState } from 'react';
import { DrumType } from '../../types';
import { audioService } from '../../services/audioService';
import { Info } from 'lucide-react';

interface DrumPartDefinition {
  id: DrumType; // acoustic only for now
  label: string;
  description: string;
  color: string;
  position: { x: number; y: number };
  size: { w: number; h: number }; 
  shape: 'circle' | 'ellipse' | 'rect';
  rotation?: number;
}

const DRUM_PARTS: DrumPartDefinition[] = [
  {
    id: 'crash',
    label: '吊镲 (Crash)',
    description: '声音响亮、激烈的镲片，通常用于强调重音或乐段的开始。具有较长的延音。',
    color: '#eab308', // yellow-500
    position: { x: 150, y: 100 },
    size: { w: 45, h: 45 },
    shape: 'circle'
  },
  {
    id: 'hightom',
    label: '高嗵 (Hi-Tom)',
    description: '音调较高的桶鼓，常用于过门（Fill-in）演奏，增加节奏的丰富性。',
    color: '#a78bfa', // violet-400
    position: { x: 280, y: 150 },
    size: { w: 35, h: 35 },
    shape: 'circle'
  },
  {
    id: 'midtom',
    label: '中嗵 (Mid-Tom)',
    description: '音调中等的桶鼓，通常与高嗵鼓配合使用，构建旋律性的节奏过门。',
    color: '#8b5cf6', // violet-500
    position: { x: 380, y: 150 },
    size: { w: 38, h: 38 },
    shape: 'circle'
  },
  {
    id: 'ride',
    label: '叮叮镲 (Ride)',
    description: '声音清脆、延音较短的镲片。常用于保持固定的节奏型（Ride Pattern），如爵士乐中的摇摆节奏。',
    color: '#fb923c', // orange-400
    position: { x: 500, y: 120 },
    size: { w: 48, h: 48 },
    shape: 'circle'
  },
  {
    id: 'hihat',
    label: '闭镲 (Hi-hat)',
    description: '由两片镲片组成，通过脚踏板控制开合。闭合时声音短促清脆，开放时声音较长且沙哑。是维持节拍的重要乐器。',
    color: '#facc15', // amber-400
    position: { x: 100, y: 250 },
    size: { w: 35, h: 35 },
    shape: 'circle'
  },
  {
    id: 'snare',
    label: '军鼓 (Snare)',
    description: '鼓底装有响弦（Snare wires），敲击时发出尖锐明亮的声音。通常在第2和第4拍演奏，是现代音乐节奏的骨架。',
    color: '#f43f5e', // rose-500
    position: { x: 200, y: 280 },
    size: { w: 42, h: 42 },
    shape: 'circle'
  },
  {
    id: 'kick',
    label: '底鼓 (Kick)',
    description: '音调最低、体积最大的鼓，由右脚踏板控制。负责低频节奏，通常在第1和第3拍演奏，奠定乐曲的基础律动。',
    color: '#4f46e5', // indigo-600
    position: { x: 330, y: 320 },
    size: { w: 55, h: 55 },
    shape: 'circle'
  },
  {
    id: 'lowtom',
    label: '低嗵 (Low-Tom/Floor Tom)',
    description: '音调较低的落地桶鼓，声音深沉有力，常用于增强节奏的厚重感。',
    color: '#7c3aed', // violet-600
    position: { x: 460, y: 280 },
    size: { w: 45, h: 45 },
    shape: 'circle'
  },
];

const DrumKitDisplay: React.FC = () => {
  const [activeDrum, setActiveDrum] = useState<DrumType | null>(null);
  const [hoveredDrum, setHoveredDrum] = useState<DrumType | null>(null);

  const handleDrumClick = (drumId: DrumType) => {
    setActiveDrum(drumId);
    audioService.playDrum(drumId);
    // Reset active state animation after a short delay
    setTimeout(() => {
        // We keep the selection, but the visual 'hit' effect can be transient if handled via CSS animation
        setActiveDrum(null);
    }, 150);
  };

  const selectedDrum = DRUM_PARTS.find(d => d.id === activeDrum) || DRUM_PARTS.find(d => d.id === hoveredDrum);

  const renderCymbal = (part: DrumPartDefinition, isActive: boolean) => {
    return (
      <g>
         {/* Stand top */}
        <line x1={part.position.x} y1={part.position.y} x2={part.position.x} y2={part.position.y + 20} stroke="#94a3b8" strokeWidth="4" />
        
        {/* Cymbal Body */}
        <ellipse 
            cx={part.position.x} 
            cy={part.position.y} 
            rx={part.size.w} 
            ry={part.size.h * 0.3} 
            fill="url(#cymbalGold)"
            stroke="#b45309" 
            strokeWidth="1"
            className="transition-transform duration-75"
            style={{ transform: isActive ? 'rotate(1deg) translateY(2px)' : 'none', transformOrigin: `${part.position.x}px ${part.position.y}px` }}
        />
        {/* Shine/Grooves */}
        <ellipse 
            cx={part.position.x} 
            cy={part.position.y} 
            rx={part.size.w * 0.7} 
            ry={part.size.h * 0.21} 
            fill="none"
            stroke="rgba(255,255,255,0.3)" 
            strokeWidth="1"
        />
         <ellipse 
            cx={part.position.x} 
            cy={part.position.y} 
            rx={part.size.w * 0.4} 
            ry={part.size.h * 0.12} 
            fill="none"
            stroke="rgba(255,255,255,0.3)" 
            strokeWidth="1"
        />
        {/* Bell */}
        <ellipse 
            cx={part.position.x} 
            cy={part.position.y - 1} 
            rx={part.size.w * 0.15} 
            ry={part.size.h * 0.15 * 0.3} 
            fill="#f59e0b"
        />
      </g>
    );
  };
  
  const renderHiHat = (part: DrumPartDefinition, isActive: boolean) => {
      return (
        <g>
            {/* Stand rod */}
            <line x1={part.position.x} y1={part.position.y - 10} x2={part.position.x} y2={part.position.y + 40} stroke="#cbd5e1" strokeWidth="3" />
            
            {/* Bottom Cymbal */}
             <ellipse 
                cx={part.position.x} 
                cy={part.position.y + 4} 
                rx={part.size.w} 
                ry={part.size.h * 0.3} 
                fill="url(#cymbalGold)"
                stroke="#b45309" 
                strokeWidth="1"
            />
            {/* Top Cymbal */}
             <ellipse 
                cx={part.position.x} 
                cy={part.position.y} 
                rx={part.size.w} 
                ry={part.size.h * 0.3} 
                fill="url(#cymbalGold)"
                stroke="#b45309" 
                strokeWidth="1"
                className="transition-transform duration-75"
                style={{ transform: isActive ? 'translateY(3px)' : 'none' }}
            />
            {/* Hardware Clutch */}
             <rect x={part.position.x - 3} y={part.position.y - 8} width="6" height="6" fill="#64748b" />
        </g>
      )
  }

  const renderDrum = (part: DrumPartDefinition, isActive: boolean) => {
    const isKick = part.id === 'kick';
    const isActiveTransform = isActive ? 'scale(0.98)' : 'scale(1)';
    
    if (isKick) {
        return (
            <g style={{ transform: isActiveTransform, transformBox: 'fill-box', transformOrigin: 'center' }} className="transition-transform duration-75">
                {/* Kick Shell (Front View) */}
                <circle cx={part.position.x} cy={part.position.y} r={part.size.w} fill={part.color} stroke="#333" strokeWidth="2" />
                {/* Kick Hoop */}
                <circle cx={part.position.x} cy={part.position.y} r={part.size.w - 4} fill="none" stroke="#e2e8f0" strokeWidth="6" />
                {/* Kick Head */}
                <circle cx={part.position.x} cy={part.position.y} r={part.size.w - 8} fill="url(#drumHead)" />
                {/* Beater Impact Point */}
                <circle cx={part.position.x} cy={part.position.y} r={8} fill="rgba(0,0,0,0.1)" />
                {/* Lugs */}
                {[0, 45, 90, 135, 180, 225, 270, 315].map(deg => (
                     <circle 
                        key={deg}
                        cx={part.position.x + (part.size.w - 4) * Math.cos(deg * Math.PI / 180)} 
                        cy={part.position.y + (part.size.w - 4) * Math.sin(deg * Math.PI / 180)} 
                        r={2} 
                        fill="#cbd5e1" 
                    />
                ))}
            </g>
        )
    }

    return (
      <g style={{ transform: isActiveTransform, transformBox: 'fill-box', transformOrigin: 'center' }} className="transition-transform duration-75">
        {/* Drum Shell Side (Fake 3D) */}
        <path 
            d={`M ${part.position.x - part.size.w} ${part.position.y} 
               L ${part.position.x - part.size.w * 0.9} ${part.position.y + part.size.h * 0.8} 
               C ${part.position.x - part.size.w * 0.5} ${part.position.y + part.size.h * 1.1}, ${part.position.x + part.size.w * 0.5} ${part.position.y + part.size.h * 1.1}, ${part.position.x + part.size.w * 0.9} ${part.position.y + part.size.h * 0.8}
               L ${part.position.x + part.size.w} ${part.position.y}`}
            fill={part.color}
            stroke="rgba(0,0,0,0.1)"
        />
        
        {/* Bottom Rim (Hint) */}
        <path 
            d={`M ${part.position.x - part.size.w * 0.9} ${part.position.y + part.size.h * 0.8} 
               C ${part.position.x - part.size.w * 0.5} ${part.position.y + part.size.h * 1.1}, ${part.position.x + part.size.w * 0.5} ${part.position.y + part.size.h * 1.1}, ${part.position.x + part.size.w * 0.9} ${part.position.y + part.size.h * 0.8}`}
            fill="none"
            stroke="#cbd5e1"
            strokeWidth="3"
        />

        {/* Top Rim */}
        <ellipse 
            cx={part.position.x} 
            cy={part.position.y} 
            rx={part.size.w} 
            ry={part.size.h * 0.4} 
            fill="#e2e8f0"
            stroke="#94a3b8" 
            strokeWidth="1"
        />
        {/* Head */}
        <ellipse 
            cx={part.position.x} 
            cy={part.position.y} 
            rx={part.size.w - 4} 
            ry={part.size.h * 0.4 - 2} 
            fill="url(#drumHead)"
        />
        {/* Snare Wires Hint (Only for Snare) */}
        {part.id === 'snare' && (
             <path d={`M ${part.position.x - 20} ${part.position.y + 10} Q ${part.position.x} ${part.position.y + 15} ${part.position.x + 20} ${part.position.y + 10}`} fill="none" stroke="rgba(0,0,0,0.1)" strokeWidth="1" />
        )}
      </g>
    );
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col md:flex-row gap-8 items-center justify-center">
      {/* Visual Diagram */}
      <div className="relative w-full max-w-[500px] aspect-[4/3] bg-gradient-to-b from-slate-50 to-white rounded-xl border border-slate-100/50">
        <svg viewBox="0 0 600 450" className="w-full h-full drop-shadow-xl" style={{ filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.05))' }}>
          <defs>
             {/* Simple Gold Gradient for Cymbals */}
            <radialGradient id="cymbalGold" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                <stop offset="0%" stopColor="#fef08a" /> {/* yellow-200 */}
                <stop offset="70%" stopColor="#eab308" /> {/* yellow-500 */}
                <stop offset="100%" stopColor="#a16207" /> {/* yellow-700 */}
            </radialGradient>
            
            {/* Drum Head Gradient */}
            <radialGradient id="drumHead" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="90%" stopColor="#f1f5f9" /> {/* slate-100 */}
                <stop offset="100%" stopColor="#e2e8f0" /> {/* slate-200 */}
            </radialGradient>
          </defs>

          {/* Stands and Hardware (Behind) */}
          <g stroke="#cbd5e1" strokeWidth="4" strokeLinecap="round">
            {/* Crash Stand */}
            <path d="M 150 145 L 180 350 M 130 350 L 200 350 L 180 350 L 150 145" fill="none" />
             {/* Ride Stand */}
            <path d="M 500 168 L 480 350 M 450 350 L 510 350 L 480 350 L 500 168" fill="none" />
             {/* Hi-hat Stand */}
            <line x1="100" y1="285" x2="100" y2="400" />
            <line x1="70" y1="400" x2="130" y2="400" /> {/* Legs */}
             {/* Snare Stand */}
            <path d="M 200 322 L 200 400 M 170 400 L 230 400" fill="none" />
            <path d="M 180 280 L 200 322 L 220 280" fill="none" strokeWidth="3" /> {/* Snare Basket */}
             {/* Toms Holder (Center Post on Kick) */}
            <line x1="330" y1="265" x2="330" y2="300" strokeWidth="6" />
            <path d="M 330 250 L 280 185 M 330 250 L 380 188" fill="none" strokeWidth="4" />
          </g>

          {/* Connectors / Kick pedal */}
           <path d="M 330 375 L 330 420 M 310 420 L 350 420" stroke="#94a3b8" strokeWidth="5" fill="none" />
           <rect x="315" y="390" width="30" height="20" fill="#64748b" rx="2" /> {/* Pedal Footboard */}


          {/* Render Parts in correct Z-order (Back to Front) */}
          {DRUM_PARTS.sort((a,b) => a.position.y - b.position.y).map((part) => (
            <g 
              key={part.id}
              onClick={() => handleDrumClick(part.id)}
              onMouseEnter={() => setHoveredDrum(part.id)}
              onMouseLeave={() => setHoveredDrum(null)}
              className="cursor-pointer"
            >
                {/* Shadow */}
                 {(part.id !== 'kick' && !part.id.includes('hat')) && (
                    <ellipse 
                        cx={part.position.x} 
                        cy={part.position.y + part.size.h * (part.id.includes('cymbal') ? 4 : 0.8)} 
                        rx={part.size.w * 0.8} 
                        ry={part.size.h * 0.2} 
                        fill="rgba(0,0,0,0.05)"
                        className="blur-sm"
                    />
                 )}

                 {/* Custom Renderer based on type */}
                 {part.id === 'hihat' ? renderHiHat(part, activeDrum === part.id) :
                  (part.id === 'crash' || part.id === 'ride' || part.id === 'openhat') ? renderCymbal(part, activeDrum === part.id) :
                  renderDrum(part, activeDrum === part.id)}

                 {/* Label on hover */}
                 {hoveredDrum === part.id && (
                     <g pointerEvents="none">
                        <rect 
                            x={part.position.x - 40} 
                            y={part.position.y - part.size.h - 30} 
                            width="80" 
                            height="24" 
                            rx="12" 
                            fill="rgba(15, 23, 42, 0.9)" 
                        />
                        <text 
                            x={part.position.x} 
                            y={part.position.y - part.size.h - 14} 
                            textAnchor="middle" 
                            fill="white" 
                            fontSize="12" 
                            fontWeight="bold"
                            className="select-none"
                        >
                            {part.label.split(' ')[0]}
                        </text>
                        {/* Triangle pointing down */}
                        <path d={`M ${part.position.x} ${part.position.y - part.size.h - 6} L ${part.position.x - 5} ${part.position.y - part.size.h - 10} L ${part.position.x + 5} ${part.position.y - part.size.h - 10} Z`} fill="rgba(15, 23, 42, 0.9)" />
                     </g>
                 )}
            </g>
          ))}
        </svg>
        <div className="absolute bottom-2 right-4 text-xs text-slate-400 italic">
            * {activeDrum ? '正在播放...' : '点击鼓件试听'}
        </div>
      </div>

      {/* Info Panel */}
      <div className="flex-1 w-full min-h-[160px] flex flex-col justify-center animate-fade-in">
        {selectedDrum ? (
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
            <h3 className="text-2xl font-bold flex items-center gap-3 mb-3 border-b border-slate-200 pb-3" style={{ color: selectedDrum.color }}>
                {selectedDrum.label}
            </h3>
            <p className="text-slate-600 leading-relaxed text-lg">
                {selectedDrum.description}
            </p>
             <div className="mt-4 flex gap-2">
                <button 
                  onClick={() => audioService.playDrum(selectedDrum.id)}
                  className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 active:scale-95 transition-all shadow-sm flex items-center gap-2"
                >
                    <span className="w-2 h-2 rounded-full" style={{ background: selectedDrum.color }}></span>
                    再次试听
                </button>
             </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 p-6 text-center border-2 border-dashed border-slate-100 rounded-2xl">
            <Info size={48} className="mb-4 text-slate-200" />
            <p className="text-lg font-medium text-slate-500">点击左侧鼓组部件查看详细介绍</p>
            <p className="text-sm mt-2">了解每个部件的声音特点和作用</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DrumKitDisplay;
