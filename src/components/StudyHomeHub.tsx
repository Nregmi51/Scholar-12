import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock,
  HardDrive,
  Layers,
  Moon,
  Sun,
} from 'lucide-react';
import { ModuleProgress, RepoConfig, StudyDocument, SubjectSummary } from '../types/study';
import { formatBytes, formatRelativeTime, getSubjectMeta } from '../utils/subjects';

interface StudyHomeHubProps {
  activeRepo: RepoConfig | null;
  subjects: SubjectSummary[];
  docs: StudyDocument[];
  progressMap: Record<string, ModuleProgress>;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onOpenModule: (doc: StudyDocument, subjectSlug?: string) => void;
  onOpenSubjectSwitcher: () => void;
  onOpenGitHubSync: () => void;
}

type HubFilter = 'all' | 'todo' | 'done';

export const StudyHomeHub: React.FC<StudyHomeHubProps> = ({
  activeRepo,
  subjects,
  docs,
  progressMap,
  theme,
  onToggleTheme,
  onOpenModule,
  onOpenSubjectSwitcher,
  onOpenGitHubSync,
}) => {
  const [filter, setFilter] = useState<HubFilter>('all');
  const [heroImgFailed, setHeroImgFailed] = useState(false);

  const stats = useMemo(() => {
    const total = docs.length;
    let completed = 0;
    let bytes = 0;
    let remainingMin = 0;
    let nextDoc: StudyDocument | null = null;

    const ordered = [...docs].sort((a, b) => a.orderIndex - b.orderIndex);
    for (const d of ordered) {
      bytes += d.size || 0;
      if (progressMap[d.key]?.completed) {
        completed += 1;
      } else {
        remainingMin += d.readTimeMinutes;
        if (!nextDoc) nextDoc = d;
      }
    }

    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
    return {
      total,
      completed,
      bytes,
      remainingMin,
      pct,
      continueDoc: nextDoc || ordered[0] || null,
    };
  }, [docs, progressMap]);

  const filteredSubjects = useMemo(() => {
    if (filter === 'all') return subjects;
    return subjects.filter((s) => {
      const done = s.completedCount === s.totalCount && s.totalCount > 0;
      return filter === 'done' ? done : !done;
    });
  }, [subjects, filter]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-24 lg:pb-12 space-y-8">
      {/* Vibrant 2-Column Hero Split */}
      <section className="rounded-3xl overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-sky-900 text-white shadow-xl border border-indigo-800/40">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
          <div className="lg:col-span-7 p-6 sm:p-8 lg:p-10 flex flex-col justify-between gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-medium text-sky-200 truncate">
                  {activeRepo?.label || 'Grade 12 Study Library'} · Synced {formatRelativeTime(activeRepo?.lastSyncedAt)}
                </span>
                <button
                  type="button"
                  onClick={onToggleTheme}
                  aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                  className="min-h-[40px] min-w-[40px] rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors shrink-0 cursor-pointer"
                >
                  {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-[2.65rem] font-bold tracking-tight leading-tight text-white [text-wrap:balance]">
                Your Grade 12 Notes, Organized &amp; Ready Offline
              </h1>

              <p className="text-sm sm:text-base text-sky-100/90 max-w-xl leading-relaxed">
                Read your GitHub-synced study modules with unit color coding, interactive exam Q&amp;A masking, and automatic background updates.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              {stats.continueDoc ? (
                <button
                  type="button"
                  onClick={() => onOpenModule(stats.continueDoc!)}
                  className="min-h-[48px] px-5 py-2.5 rounded-2xl bg-white text-slate-900 hover:bg-sky-50 font-semibold text-sm inline-flex items-center gap-2 shadow-sm active:scale-[0.99] transition-all whitespace-nowrap cursor-pointer"
                >
                  <BookOpen className="w-4 h-4 text-sky-600 shrink-0" />
                  <span>
                    {stats.completed > 0 ? 'Continue' : 'Start'}: {stats.continueDoc.subject}
                  </span>
                  <ArrowRight className="w-4 h-4 shrink-0" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onOpenGitHubSync}
                  className="min-h-[48px] px-5 py-2.5 rounded-2xl bg-white text-slate-900 hover:bg-sky-50 font-semibold text-sm inline-flex items-center gap-2 shadow-sm cursor-pointer"
                >
                  <span>Connect GitHub Docs</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}

              <button
                type="button"
                onClick={onOpenSubjectSwitcher}
                className="min-h-[48px] px-5 py-2.5 rounded-2xl bg-white/12 hover:bg-white/20 border border-white/20 text-white font-medium text-sm inline-flex items-center gap-2 transition-colors whitespace-nowrap cursor-pointer"
              >
                <Layers className="w-4 h-4 shrink-0" />
                <span>Switch Subject ({subjects.length})</span>
              </button>
            </div>
          </div>

          {/* Hero Artwork */}
          <div className="lg:col-span-5 relative min-h-[200px] sm:min-h-[240px] lg:min-h-full bg-gradient-to-br from-sky-500/20 to-indigo-500/30">
            {!heroImgFailed ? (
              <img
                src="/src/assets/images/hero_grade12_study_1795451163018.jpg"
                alt="Grade 12 study textbooks, globe, and knowledge cards illustration"
                referrerPolicy="no-referrer"
                onError={() => setHeroImgFailed(true)}
                className="w-full h-full object-cover lg:absolute lg:inset-0"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center p-8 bg-gradient-to-br from-sky-600 to-indigo-700">
                <BookOpen className="w-16 h-16 text-white/80" />
              </div>
            )}
            <div className="hidden lg:block absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-indigo-950/90 to-transparent pointer-events-none" />
          </div>
        </div>
      </section>

      {/* 4-Column Colorful KPI Strip */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        <div className="p-4 sm:p-5 rounded-2xl border border-sky-200 dark:border-sky-900/70 bg-gradient-to-br from-sky-50 to-white dark:from-sky-950/40 dark:to-slate-900">
          <div className="text-xs font-medium text-sky-700 dark:text-sky-300">
            Syllabus Progress
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tabular-nums">
              {stats.pct}%
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
              {stats.completed}/{stats.total} done
            </span>
          </div>
          <div className="mt-3 h-1.5 w-full rounded-full bg-sky-100 dark:bg-sky-900/60 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 transition-all duration-300"
              style={{ width: `${stats.pct}%` }}
            />
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl border border-emerald-200 dark:border-emerald-900/70 bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/40 dark:to-slate-900">
          <div className="flex items-center justify-between text-xs font-medium text-emerald-700 dark:text-emerald-300">
            <span>Synced Subjects</span>
            <Layers className="w-4 h-4 shrink-0" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tabular-nums">
            {subjects.length}
          </div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
            {stats.total} total study modules
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl border border-amber-200 dark:border-amber-900/70 bg-gradient-to-br from-amber-50 to-white dark:from-amber-950/40 dark:to-slate-900">
          <div className="flex items-center justify-between text-xs font-medium text-amber-800 dark:text-amber-300">
            <span>Study Time Left</span>
            <Clock className="w-4 h-4 shrink-0" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tabular-nums">
            {stats.remainingMin} min
          </div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Remaining reading estimate
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl border border-violet-200 dark:border-violet-900/70 bg-gradient-to-br from-violet-50 to-white dark:from-violet-950/40 dark:to-slate-900">
          <div className="flex items-center justify-between text-xs font-medium text-violet-700 dark:text-violet-300">
            <span>Offline Cache</span>
            <HardDrive className="w-4 h-4 shrink-0" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tabular-nums">
            {formatBytes(stats.bytes)}
          </div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Available without internet
          </div>
        </div>
      </section>

      {/* Colorful Units & Subjects Grid */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Subjects &amp; Study Units
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Tap any card to jump directly into its offline study notes and exam Q&amp;A.
            </p>
          </div>

          <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-slate-200/70 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 self-start sm:self-auto">
            {(
              [
                { id: 'all', label: 'All' },
                { id: 'todo', label: 'In Progress' },
                { id: 'done', label: 'Completed' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id)}
                className={`min-h-[36px] px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                  filter === tab.id
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {filteredSubjects.length === 0 ? (
          <div className="p-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center text-sm text-slate-500 dark:text-slate-400">
            No units match this filter yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredSubjects.map((subj) => {
              const { Icon, gradientClass, softCardClass, accentBarClass } = getSubjectMeta(subj.name);
              const isComplete = subj.completedCount === subj.totalCount && subj.totalCount > 0;
              const targetDoc = subj.nextModule || subj.modules[0];

              return (
                <button
                  key={subj.slug}
                  type="button"
                  onClick={() => targetDoc && onOpenModule(targetDoc, subj.slug)}
                  className={`group text-left rounded-2xl overflow-hidden border bg-white dark:bg-slate-900 shadow-xs hover:shadow-md active:scale-[0.99] transition-all flex flex-col justify-between cursor-pointer ${softCardClass}`}
                >
                  {/* Colorful Card Header Band */}
                  <div className={`p-4 bg-gradient-to-r ${gradientClass} text-white`}>
                    <div className="flex items-center justify-between gap-2">
                      <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0">
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-xs font-semibold tabular-nums text-white/95">
                        {subj.percentage}%
                      </span>
                    </div>
                    <h3 className="mt-3 text-lg font-bold tracking-tight text-white truncate">
                      {subj.name}
                    </h3>
                    <p className="text-xs text-white/85 tabular-nums truncate">
                      {subj.completedCount} of {subj.totalCount} {subj.totalCount === 1 ? 'module' : 'modules'} · {formatBytes(subj.cachedBytes)}
                    </p>
                  </div>

                  {/* Card Body */}
                  <div className="p-4 flex-1 flex flex-col justify-between gap-4">
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-slate-800 dark:text-slate-200 line-clamp-2">
                        {targetDoc ? targetDoc.title : subj.name}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                        {subj.totalReadMinutes} min read
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            isComplete ? 'bg-emerald-600 dark:bg-emerald-500' : accentBarClass
                          }`}
                          style={{ width: `${subj.percentage}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-xs font-semibold">
                        {isComplete ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Completed</span>
                          </span>
                        ) : (
                          <span className="text-slate-600 dark:text-slate-300 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                            Open Notes
                          </span>
                        )}
                        <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-all" />
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
