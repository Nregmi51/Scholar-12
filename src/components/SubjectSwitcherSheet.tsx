import React, { useMemo, useState } from 'react';
import { ArrowRight, CheckCircle2, Clock, HardDrive, Layers, Search, X } from 'lucide-react';
import { SubjectSummary } from '../types/study';
import { ALL_SUBJECTS_SLUG, formatBytes, getSubjectMeta } from '../utils/subjects';

interface SubjectSwitcherSheetProps {
  isOpen: boolean;
  onClose: () => void;
  subjects: SubjectSummary[];
  allSubjectsSummary?: SubjectSummary | null;
  activeSubjectSlug: string;
  onSelectSubject: (subject: SubjectSummary, openNextModule?: boolean) => void;
}

export const SubjectSwitcherSheet: React.FC<SubjectSwitcherSheetProps> = ({
  isOpen,
  onClose,
  subjects,
  allSubjectsSummary,
  activeSubjectSlug,
  onSelectSubject,
}) => {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return subjects;
    return subjects.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.modules.some((m) => m.title.toLowerCase().includes(q))
    );
  }, [subjects, query]);

  const totalStats = useMemo(() => {
    const completed = subjects.reduce((acc, s) => acc + s.completedCount, 0);
    const total = subjects.reduce((acc, s) => acc + s.totalCount, 0);
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { completed, total, pct };
  }, [subjects]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/60 backdrop-blur-sm sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="subject-switcher-title"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-xl max-h-[86vh] flex flex-col rounded-t-3xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile grab handle */}
        <div className="sm:hidden pt-3 pb-1 flex justify-center">
          <div className="w-10 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
        </div>

        {/* Header */}
        <div className="px-5 pt-3 sm:pt-5 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2
                id="subject-switcher-title"
                className="text-lg font-semibold text-slate-900 dark:text-white"
              >
                Switch Study Subject
              </h2>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                {subjects.length} subjects · {totalStats.completed} of {totalStats.total} modules completed ({totalStats.pct}%)
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close subject switcher"
              className="min-h-[44px] min-w-[44px] -mr-2 -mt-1 flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {subjects.length > 3 && (
            <div className="mt-3 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search subjects or chapters..."
                className="w-full min-h-[44px] pl-10 pr-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          )}
        </div>

        {/* Subject List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {allSubjectsSummary && subjects.length > 1 && !query.trim() && (
            <button
              type="button"
              onClick={() => {
                onSelectSubject(allSubjectsSummary, false);
                onClose();
              }}
              className={`w-full text-left p-4 rounded-2xl border transition-all cursor-pointer ${
                activeSubjectSlug === ALL_SUBJECTS_SLUG
                  ? 'border-sky-500 dark:border-sky-500 bg-sky-50/50 dark:bg-sky-950/30'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-semibold text-slate-900 dark:text-white truncate">
                        {allSubjectsSummary.name}
                      </span>
                      {activeSubjectSlug === ALL_SUBJECTS_SLUG && (
                        <span className="text-xs font-medium text-sky-700 dark:text-sky-400">
                          Active
                        </span>
                      )}
                    </div>
                    <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 tabular-nums truncate">
                      {allSubjectsSummary.completedCount} of {allSubjectsSummary.totalCount} modules · {formatBytes(allSubjectsSummary.cachedBytes)} offline
                    </div>
                  </div>
                </div>
                <span className="text-sm font-semibold text-slate-900 dark:text-white tabular-nums shrink-0">
                  {allSubjectsSummary.percentage}%
                </span>
              </div>
            </button>
          )}

          {filtered.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">
              No subjects match &ldquo;{query}&rdquo;.
            </div>
          ) : (
            filtered.map((subject) => {
              const isSelected = subject.slug === activeSubjectSlug;
              const isComplete = subject.completedCount === subject.totalCount && subject.totalCount > 0;
              const { Icon, tintClass, accentBarClass } = getSubjectMeta(subject.name);

              return (
                <button
                  key={subject.slug}
                  type="button"
                  onClick={() => {
                    onSelectSubject(subject, true);
                    onClose();
                  }}
                  className={`w-full text-left p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-sky-500 dark:border-sky-500 bg-sky-50/50 dark:bg-sky-950/30'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50/70 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3.5 min-w-0">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${tintClass}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-base font-semibold text-slate-900 dark:text-white truncate">
                            {subject.name}
                          </span>
                          {isSelected && (
                            <span className="text-xs font-medium text-sky-700 dark:text-sky-400 whitespace-nowrap">
                              Active
                            </span>
                          )}
                        </div>

                        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                          <span>
                            {subject.completedCount} of {subject.totalCount} completed
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="inline-flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {subject.remainingMinutes > 0
                              ? `${subject.remainingMinutes} min left`
                              : `${subject.totalReadMinutes} min total`}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="inline-flex items-center gap-1">
                            <HardDrive className="w-3 h-3" />
                            {formatBytes(subject.cachedBytes)} offline
                          </span>
                        </div>

                        {subject.nextModule && (
                          <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 truncate">
                            {isComplete ? (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                <span className="truncate">All modules completed</span>
                              </>
                            ) : (
                              <>
                                <ArrowRight className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
                                <span className="truncate">Next: {subject.nextModule.title}</span>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-sm font-semibold text-slate-900 dark:text-white tabular-nums">
                        {subject.percentage}%
                      </span>
                    </div>
                  </div>

                  {/* Progress Track */}
                  <div className="mt-3 h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isComplete ? 'bg-emerald-600 dark:bg-emerald-500' : accentBarClass
                      }`}
                      style={{ width: `${subject.percentage}%` }}
                    />
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
