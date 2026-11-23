import React, { useMemo } from 'react';
import { ArrowRight, Bookmark, CheckCircle2, Clock, HardDrive } from 'lucide-react';
import { ModuleProgress, RepoConfig, StudyDocument, SubjectSummary } from '../types/study';
import { formatBytes, formatRelativeTime, getSubjectMeta } from '../utils/subjects';

interface ProgressDashboardProps {
  activeRepo: RepoConfig | null;
  subjects: SubjectSummary[];
  docs: StudyDocument[];
  progressMap: Record<string, ModuleProgress>;
  onOpenModule: (doc: StudyDocument) => void;
  onToggleComplete: (doc: StudyDocument) => void;
}

export const ProgressDashboard: React.FC<ProgressDashboardProps> = ({
  activeRepo,
  subjects,
  docs,
  progressMap,
  onOpenModule,
  onToggleComplete,
}) => {
  const stats = useMemo(() => {
    const totalModules = docs.length;
    let completedModules = 0;
    let totalBytes = 0;
    let remainingMinutes = 0;
    const bookmarked: StudyDocument[] = [];
    const recent: { doc: StudyDocument; lastOpenedAt: number }[] = [];

    for (const doc of docs) {
      const prog = progressMap[doc.key];
      totalBytes += doc.size || 0;
      if (prog?.completed) {
        completedModules += 1;
      } else {
        remainingMinutes += doc.readTimeMinutes;
      }
      if (prog?.bookmarked) {
        bookmarked.push(doc);
      }
      if (prog?.lastOpenedAt) {
        recent.push({ doc, lastOpenedAt: prog.lastOpenedAt });
      }
    }

    recent.sort((a, b) => b.lastOpenedAt - a.lastOpenedAt);
    const pct = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;

    return {
      totalModules,
      completedModules,
      totalBytes,
      remainingMinutes,
      pct,
      bookmarked,
      recent: recent.slice(0, 6),
    };
  }, [docs, progressMap]);

  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (stats.pct / 100) * circumference;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-8 py-6 sm:py-8 pb-24 lg:pb-12 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          Study Progress Tracker
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          {activeRepo
            ? `${activeRepo.label} · ${activeRepo.owner}/${activeRepo.repo}`
            : 'Offline Grade 12 syllabus completion across all synced subjects.'}
        </p>
      </div>

      {/* Top KPI Summary Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Overall Completion Ring Card */}
        <div className="md:col-span-2 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-5">
          <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
            <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96">
              <circle
                cx="48"
                cy="48"
                r={radius}
                strokeWidth="8"
                fill="none"
                className="stroke-slate-100 dark:stroke-slate-800"
              />
              <circle
                cx="48"
                cy="48"
                r={radius}
                strokeWidth="8"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="stroke-sky-600 dark:stroke-sky-400 transition-all duration-500"
              />
            </svg>
            <span className="absolute text-lg font-bold text-slate-900 dark:text-white tabular-nums">
              {stats.pct}%
            </span>
          </div>

          <div className="min-w-0">
            <div className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Overall Syllabus Progress
            </div>
            <div className="mt-1 text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
              {stats.completedModules} / {stats.totalModules} modules
            </div>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
              Across {subjects.length} {subjects.length === 1 ? 'subject' : 'subjects'}
            </div>
          </div>
        </div>

        {/* Remaining Study Time */}
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-sm font-medium">Remaining Reading</span>
            <Clock className="w-4 h-4" />
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
              {stats.remainingMinutes} min
            </div>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Estimated uncompleted study time
            </div>
          </div>
        </div>

        {/* Offline Cache */}
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-sm font-medium">Offline Storage</span>
            <HardDrive className="w-4 h-4" />
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
              {formatBytes(stats.totalBytes)}
            </div>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Cached locally for offline access
            </div>
          </div>
        </div>
      </div>

      {/* Subject Breakdown */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
          Progress by Subject
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjects.map((subj) => {
            const { Icon, tintClass, accentBarClass } = getSubjectMeta(subj.name);
            const isComplete = subj.completedCount === subj.totalCount && subj.totalCount > 0;

            return (
              <div
                key={subj.slug}
                className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between gap-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${tintClass}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-base font-semibold text-slate-900 dark:text-white truncate">
                          {subj.name}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                          {subj.completedCount} of {subj.totalCount} modules · {formatBytes(subj.cachedBytes)}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-slate-900 dark:text-white tabular-nums">
                      {subj.percentage}%
                    </span>
                  </div>

                  <div className="mt-4 h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isComplete ? 'bg-emerald-600 dark:bg-emerald-500' : accentBarClass
                      }`}
                      style={{ width: `${subj.percentage}%` }}
                    />
                  </div>
                </div>

                {subj.nextModule && (
                  <button
                    type="button"
                    onClick={() => onOpenModule(subj.nextModule!)}
                    className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-sky-400 dark:hover:border-sky-600 bg-slate-50 dark:bg-slate-950 flex items-center justify-between gap-2 text-xs font-medium text-slate-800 dark:text-slate-200 transition-colors cursor-pointer"
                  >
                    <span className="truncate">
                      {isComplete ? `Review: ${subj.nextModule.title}` : `Continue: ${subj.nextModule.title}`}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Bookmarked & Recently Studied */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              Bookmarked Modules
            </h2>
            <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
              {stats.bookmarked.length} saved
            </span>
          </div>

          {stats.bookmarked.length === 0 ? (
            <p className="py-6 text-sm text-slate-500 dark:text-slate-400">
              Tap the bookmark icon while reading any module to save it here for quick exam review.
            </p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {stats.bookmarked.map((doc) => {
                const isDone = !!progressMap[doc.key]?.completed;
                return (
                  <div key={doc.key} className="py-3 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => onOpenModule(doc)}
                      className="min-w-0 flex-1 text-left cursor-pointer group"
                    >
                      <div className="flex items-center gap-2">
                        <Bookmark className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
                        <span className="text-sm font-medium text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 truncate">
                          {doc.title}
                        </span>
                      </div>
                      <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 pl-5 truncate">
                        {doc.subject} · {doc.readTimeMinutes} min
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => onToggleComplete(doc)}
                      aria-label={isDone ? 'Mark incomplete' : 'Mark complete'}
                      className="min-h-[44px] px-2.5 flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-emerald-600 cursor-pointer"
                    >
                      <CheckCircle2
                        className={`w-4 h-4 ${
                          isDone ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-300 dark:text-slate-600'
                        }`}
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              Recently Studied
            </h2>
            <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
              {stats.recent.length} modules
            </span>
          </div>

          {stats.recent.length === 0 ? (
            <p className="py-6 text-sm text-slate-500 dark:text-slate-400">
              Modules you open will appear here so you can pick up right where you left off.
            </p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {stats.recent.map(({ doc, lastOpenedAt }) => (
                <button
                  key={doc.key}
                  type="button"
                  onClick={() => onOpenModule(doc)}
                  className="w-full py-3 flex items-center justify-between gap-3 text-left group cursor-pointer"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 truncate">
                      {doc.title}
                    </div>
                    <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 truncate">
                      {doc.subject} · Opened {formatRelativeTime(lastOpenedAt)}
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-sky-600 shrink-0" />
                </button>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
