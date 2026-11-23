import React from 'react';
import { ChevronsUpDown, CheckCircle2, HardDrive } from 'lucide-react';
import { SubjectSummary } from '../types/study';
import { formatBytes, getSubjectMeta } from '../utils/subjects';

interface SubjectSwitcherButtonProps {
  activeSubject: SubjectSummary | null;
  allSubjectsCount: number;
  onClick: () => void;
  variant?: 'sidebar' | 'mobile-bar';
}

export const SubjectSwitcherButton: React.FC<SubjectSwitcherButtonProps> = ({
  activeSubject,
  allSubjectsCount,
  onClick,
  variant = 'sidebar',
}) => {
  if (!activeSubject) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="w-full min-h-[56px] flex items-center justify-between gap-3 px-3.5 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-sky-300 dark:hover:border-sky-700 text-left transition-colors cursor-pointer"
      >
        <div className="min-w-0">
          <div className="text-sm font-semibold text-slate-900 dark:text-white truncate">
            Choose Subject
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
            {allSubjectsCount} {allSubjectsCount === 1 ? 'subject' : 'subjects'} available
          </div>
        </div>
        <ChevronsUpDown className="w-4 h-4 text-slate-400 shrink-0" />
      </button>
    );
  }

  const { Icon, gradientClass } = getSubjectMeta(activeSubject.name);
  const isComplete = activeSubject.completedCount === activeSubject.totalCount && activeSubject.totalCount > 0;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Switch subject. Currently studying ${activeSubject.name}, ${activeSubject.completedCount} of ${activeSubject.totalCount} modules completed.`}
      className={`group relative w-full overflow-hidden rounded-2xl bg-gradient-to-r ${gradientClass} text-white shadow-md hover:shadow-lg active:scale-[0.99] transition-all text-left cursor-pointer ${
        variant === 'mobile-bar' ? 'p-3' : 'p-3.5'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0">
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-sm font-bold text-white truncate">
                {activeSubject.name}
              </span>
              {isComplete && (
                <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0" />
              )}
            </div>
            <div className="mt-0.5 flex items-center gap-1.5 text-xs text-white/90 tabular-nums truncate">
              <span>
                {activeSubject.completedCount}/{activeSubject.totalCount} modules
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-semibold text-white">
                {activeSubject.percentage}%
              </span>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1">
                <HardDrive className="w-3 h-3 shrink-0" />
                {formatBytes(activeSubject.cachedBytes)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 pl-2">
          <span className="hidden sm:inline text-xs font-medium text-white/90 group-hover:text-white whitespace-nowrap">
            Switch ({allSubjectsCount})
          </span>
          <div className="w-8 h-8 rounded-lg bg-white/20 group-hover:bg-white/30 flex items-center justify-center transition-colors">
            <ChevronsUpDown className="w-4 h-4 text-white" />
          </div>
        </div>
      </div>

      {/* Integrated detailed progress track */}
      <div className="mt-3 h-1.5 w-full rounded-full bg-black/20 overflow-hidden">
        <div
          className="h-full rounded-full bg-white transition-all duration-300"
          style={{ width: `${activeSubject.percentage}%` }}
        />
      </div>
    </button>
  );
};
