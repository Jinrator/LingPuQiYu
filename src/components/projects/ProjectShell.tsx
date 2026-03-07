import React from 'react';
import { ArrowLeft, Check, Loader2 } from 'lucide-react';
import { PALETTE, PaletteKey } from '../../constants/palette';

interface ProjectShellProps {
  /** Lesson number, e.g. 1 */
  lessonId: number;
  /** Chinese title */
  title: string;
  /** English subtitle tag */
  subtitle: string;
  /** PALETTE key for accent color */
  color?: PaletteKey;
  /** Right-side action button label */
  actionLabel: string;
  /** Whether the action button is enabled */
  actionEnabled: boolean;
  /** Action button click handler */
  onAction: () => void;
  /** Back button handler */
  onBack: () => void;
  /** Whether action is loading */
  loading?: boolean;
  /** Main content */
  children: React.ReactNode;
  /** Optional footer text */
  footerText?: string;
}

const ProjectShell: React.FC<ProjectShellProps> = ({
  lessonId,
  title,
  subtitle,
  color = 'blue',
  actionLabel,
  actionEnabled,
  onAction,
  onBack,
  loading = false,
  children,
  footerText,
}) => {
  const accent = PALETTE[color].accent;

  return (
    <div className="fixed inset-0 z-[200] flex flex-col bg-[#F5F7FA] overflow-hidden">
      {/* Header */}
      <header className="relative z-10 px-4 py-3 sm:px-6 sm:py-4 flex items-center justify-between bg-white border-b border-slate-200 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            onClick={onBack}
            className="p-2 sm:p-2.5 rounded-xl border border-slate-200 text-slate-400 bg-white hover:bg-slate-50 transition-all active:scale-95"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h2 className="text-sm sm:text-base font-bold tracking-tight text-slate-800">
              L{lessonId} · {title}
            </h2>
            <p
              className="text-[10px] font-semibold uppercase tracking-widest"
              style={{ color: accent }}
            >
              {subtitle}
            </p>
          </div>
        </div>

        <button
          disabled={!actionEnabled || loading}
          onClick={onAction}
          className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl font-semibold text-xs sm:text-sm flex items-center gap-2 transition-all ${
            actionEnabled && !loading
              ? 'bg-[#1e293b] text-white hover:opacity-90 active:scale-95'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-40'
          }`}
        >
          {loading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <>
              {actionLabel} <Check size={14} />
            </>
          )}
        </button>
      </header>

      {/* Main content area */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 pb-24 sm:pb-10">
          {children}
        </div>
      </main>

      {/* Footer */}
      {footerText && (
        <footer className="h-10 sm:h-12 flex items-center justify-center bg-white border-t border-slate-200/60">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-300">
            {footerText}
          </p>
        </footer>
      )}
    </div>
  );
};

export default ProjectShell;
