import React, { useEffect, useMemo, useState } from 'react';
import { Note } from '../../types';
import { ALL_NOTES } from '../../constants';
import { createKeyboardShortcutMaps, EXTENDED_SHORTCUTS, isEditableTarget } from '../../utils/keyboardShortcuts';

interface PianoProps {
  theme_type?: boolean;
  activeNotes: string[]; // List of note full names e.g. "C4"
  onNotePlay: (note: Note) => void;
  showLabels?: boolean;
  keyboardEnabled?: boolean;
}

const Piano: React.FC<PianoProps> = ({ theme_type, activeNotes, onNotePlay, showLabels = true, keyboardEnabled = true }) => {
  const isBlackKey = (name: string) => name.includes('#');
  const isDark = theme_type;
  const { keyToItem: keyMap, idToShortcut: shortcutByNote } = useMemo(
    () => createKeyboardShortcutMaps(ALL_NOTES, EXTENDED_SHORTCUTS, note => note.full),
    [],
  );
  const showKeyboardHints = showLabels && keyboardEnabled;
  
  // 本地状态用于立即响应按下事件
  const [pressedNote, setPressedNote] = useState<string | null>(null);

  const handleNoteDown = (note: Note) => {
    setPressedNote(note.full); // 立即设置本地状态
    onNotePlay(note); // 调用父组件回调
  };

  const handleNoteUp = () => {
    setPressedNote(null); // 释放时清除本地状态
  };

  useEffect(() => {
    if (!keyboardEnabled) {
      setPressedNote(null);
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.repeat || event.metaKey || event.ctrlKey || event.altKey || isEditableTarget(event.target)) {
        return;
      }

      const note = keyMap[event.key.toLowerCase()];
      if (!note) return;

      handleNoteDown(note);
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      const note = keyMap[event.key.toLowerCase()];
      if (!note) return;

      setPressedNote(currentPressed => currentPressed === note.full ? null : currentPressed);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [keyMap, keyboardEnabled, onNotePlay]);

  return (
    <div 
      className={`relative h-48 md:h-60 flex justify-center rounded-b-xl overflow-hidden p-2 ${
        isDark 
            ? 'bg-slate-800' 
            : 'bg-slate-100 border border-slate-200'
      }`}
    >
      <div className="relative flex justify-center items-start pt-2">
         <div className="flex relative h-full">
            {ALL_NOTES.map((note, i) => {
               const isBlack = isBlackKey(note.name);
               if (isBlack) return null; // Skip black keys in white key loop
               
               // Look ahead to see if next is black
               const nextNote = ALL_NOTES[i+1];
               const hasBlackAfter = nextNote && isBlackKey(nextNote.name);
               const isActive = activeNotes.includes(note.full) || pressedNote === note.full;
               const isMiddleC = note.full === 'C4';
               const whiteShortcut = shortcutByNote[note.full];
               const blackShortcut = hasBlackAfter ? shortcutByNote[nextNote.full] : undefined;

               return (
                 <div key={note.full} className="relative h-full">
                    {/* White Key */}
                    <button
                      onMouseDown={() => handleNoteDown(note)}
                      onMouseUp={handleNoteUp}
                      onMouseLeave={handleNoteUp}
                      style={{
                        backgroundColor: isActive ? '#f9a8d4' : isMiddleC ? '#fefce8' : '#ffffff'
                      }}
                      className={`
                        w-8 md:w-10 h-40 md:h-52 rounded-b-md 
                        flex flex-col justify-end items-center pb-2 z-10 transition-none shadow-sm
                        active:scale-[0.98] origin-top
                        ${isActive 
                            ? 'shadow-[0_0_15px_rgba(244,114,182,0.6)]' 
                            : ''
                        }
                      `}
                    >
                      {showLabels && (
                          <div className="flex flex-col items-center gap-0.5">
                              {showKeyboardHints && whiteShortcut && (
                                <span className={`text-[9px] font-black tracking-wide ${
                                  isDark ? 'text-slate-500' : 'text-slate-300'
                                }`}>{whiteShortcut}</span>
                              )}
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
                        onMouseDown={(e: React.MouseEvent) => {
                           e.stopPropagation();
                           handleNoteDown(nextNote);
                        }}
                        onMouseUp={handleNoteUp}
                        onMouseLeave={handleNoteUp}
                        style={{
                          backgroundColor: (activeNotes.includes(nextNote.full) || pressedNote === nextNote.full) ? '#db2777' : isDark ? '#0f172a' : '#334155'
                        }}
                        className={`
                          absolute -right-2.5 md:-right-3 top-0 w-5 md:w-6 h-24 md:h-32 
                          rounded-b-md z-20 transition-none
                          active:scale-[0.98] origin-top
                          ${(activeNotes.includes(nextNote.full) || pressedNote === nextNote.full)
                            ? 'shadow-[0_0_15px_rgba(219,39,119,0.8)]' 
                            : ''
                          }
                        `}
                      >
                        {showLabels && (
                          <div className="absolute bottom-1.5 left-1/2 flex -translate-x-1/2 flex-col items-center gap-0.5 leading-none">
                            {showKeyboardHints && blackShortcut && (
                              <span className="text-[9px] font-black tracking-[0.08em] text-slate-300">
                                {blackShortcut}
                              </span>
                            )}
                            <span className="text-[9px] font-semibold tracking-[0.04em] text-white">
                              {nextNote.name}
                            </span>
                          </div>
                        )}
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
