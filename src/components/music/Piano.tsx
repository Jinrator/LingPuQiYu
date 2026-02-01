
import React from 'react';
import { Note } from '../../types';
import { ALL_NOTES } from '../../constants';

interface PianoProps {
  activeNotes: string[]; // List of note full names e.g. "C4"
  onNotePlay: (note: Note) => void;
  showLabels?: boolean;
}

const Piano: React.FC<PianoProps> = ({ theme_type, activeNotes, onNotePlay, showLabels = true }) => {
  const isBlackKey = (name: string) => name.includes('#');
  const isDark = theme_type;

  // Logic: 3 octaves + C6 = 37 keys approx (22 white keys)
  // To fit in ~800px-1000px, keys should be ~36px-40px. 
  // Let's use a slightly more compact design.

  return (
    <div className={`relative h-48 md:h-60 flex justify-center rounded-b-xl shadow-2xl overflow-hidden p-2 ${
        isDark 
            ? 'bg-slate-800' 
            : 'bg-slate-100 border border-slate-200'
    }`}>
      <div className="relative flex justify-center items-start pt-2">
         <div className="flex relative h-full">
            {ALL_NOTES.map((note, i) => {
               const isBlack = isBlackKey(note.name);
               if (isBlack) return null; // Skip black keys in white key loop
               
               // Look ahead to see if next is black
               const nextNote = ALL_NOTES[i+1];
               const hasBlackAfter = nextNote && isBlackKey(nextNote.name);
               const isActive = activeNotes.includes(note.full);
               const isMiddleC = note.full === 'C4';

               return (
                 <div key={note.full} className="relative h-full">
                    {/* White Key */}
                    <button
                      onMouseDown={() => onNotePlay(note)}
                      className={`
                        w-8 md:w-10 h-40 md:h-52 rounded-b-md 
                        flex flex-col justify-end items-center pb-2 z-10 transition-all shadow-sm
                        hover:bg-slate-50 active:scale-[0.98] origin-top
                        ${isActive 
                            ? 'bg-pink-300 shadow-[0_0_15px_rgba(244,114,182,0.6)]' 
                            : isDark 
                                ? 'bg-white border border-slate-200' 
                                : 'bg-white border border-slate-300'
                        }
                        ${isMiddleC ? 'bg-yellow-50' : ''}
                      `}
                    >
                      {showLabels && (
                          <div className="flex flex-col items-center gap-0.5">
                              {isMiddleC && (
                                  <span className={`text-[9px] font-bold ${
                                      isDark ? 'text-indigo-500' : 'text-indigo-600'
                                  }`}>C4</span>
                              )}
                              <span className={`font-bold text-[10px] ${
                                  isDark ? 'text-slate-400' : 'text-slate-600'
                              }`}>{note.name}</span>
                          </div>
                      )}
                    </button>

                    {/* Black Key */}
                    {hasBlackAfter && (
                      <button
                        onMouseDown={(e) => {
                           e.stopPropagation();
                           onNotePlay(nextNote);
                        }}
                        className={`
                          absolute -right-2.5 md:-right-3 top-0 w-5 md:w-6 h-24 md:h-32 
                          rounded-b-md z-20 transition-all border-x border-b
                          active:scale-[0.98] origin-top shadow-lg
                          ${activeNotes.includes(nextNote.full) 
                            ? 'bg-pink-600 shadow-[0_0_15px_rgba(219,39,119,0.8)]' 
                            : isDark 
                                ? 'bg-slate-900 border-slate-900 bg-gradient-to-b from-slate-800 to-black' 
                                : 'bg-slate-700 border-slate-700 bg-gradient-to-b from-slate-600 to-slate-800'
                          }
                        `}
                      >
                      </button>
                    )}
                 </div>
               );
            })}
         </div>
      </div>
    </div>
);
};

export default Piano;
