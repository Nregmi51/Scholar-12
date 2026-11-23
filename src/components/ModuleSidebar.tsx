import React, { useMemo, useState } from 'react';
import { Bookmark, Check, Search } from 'lucide-react';
import { ModuleProgress, StudyDocument, SubjectSummary } from '../types/study';
import { formatBytes, getSubjectMeta } from '../utils/subjects';
import { SubjectSwitcherButton } from './SubjectSwitcherButton';

type ModuleFilter = 'all' | 'todo' | 'done' | 'saved';

interface ModuleSidebarProps {
  activeSubject: SubjectSummary | null;
  allSubjectsCount: number;
  activeDocKey?: string;
  progressMap: Record<string, ModuleProgress>;
  onOpenSubjectSwitcher: () => void;
  onSelectDoc: (doc: StudyDocument) => void;
  onToggleComplete: (doc: StudyDocument) => void;
}

export const ModuleSidebar: React.FC<ModuleSidebarProps> = ({
  activeSubject,
  allSubjectsCount,
  activeDocKey,
  progressMap,
  onOpenSubjectSwitcher,
  onSelectDoc,
  onToggleComplete,
}) => {
  const [filter, setFilter] = useState<ModuleFilter>('all');
  const [query, setQuery] = useState('');

  const filteredModules = useMemo(() => {
    if (!activeSubject) return [];
    const q = query.trim().toLowerCase();
    return activeSubject.modules.filter((mod) => {
      const prog = progressMap[mod.key];
      const isDone = !!prog?.completed;
      const isSaved = !!prog?.bookmarked;
      if (filter === 'todo' && isDone) return false;
      if (filter === 'done' && !isDone) return false;
      if (filter === 'saved' && !isSaved) return false;
      if (q && !mod.title.toLowerCase().includes(q) && !mod.fileName.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
  }, [activeSubject, progressMap, filter, query]);

  return (
    <div className="flex flex-col h-full bg-slate-50/70 dark:bg-slate-950">
      {/* Detailed Subject Switcher Button */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 space-y-3">
        <SubjectSwitcherButton
          activeSubject={activeSubject}
          allSubjectsCount={allSubjectsCount}
          onClick={onOpenSubjectSwitcher}
        />

        {/* Interactive segmented filter tabs */}
        <div className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-slate-200/70 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
          {(
            [
              { id: 'all', label: 'All' },
              { id: 'todo', label: 'To Do' },
              { id: 'done', label: 'Done' },
              { id: 'saved', label: 'Saved' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              className={`min-h-[34px] px-2 py-1 rounded-lg text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                filter === tab.id
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeSubject && activeSubject.modules.length > 4 && (
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter modules..."
              className="w-full min-h-[38px] pl-9 pr-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
        )}
      </div>

      {/* Module List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
        {!activeSubject ? (
          <div className="p-6 text-center text-sm text-slate-500 dark:text-slate-400">
            Select or sync a GitHub repository to browse study modules.
          </div>
        ) : filteredModules.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500 dark:text-slate-400">
            No modules match the current filter.
          </div>
        ) : (
          filteredModules.map((mod) => {
            const prog = progressMap[mod.key];
            const isCompleted = !!prog?.completed;
            const isBookmarked = !!prog?.bookmarked;
            const isActive = mod.key === activeDocKey;
            const { Icon, tintClass } = getSubjectMeta(mod.subject);

            return (
              <div
                key={mod.key}
                className={`group flex items-stretch rounded-xl border transition-colors ${
                  isActive
                    ? 'border-sky-500 dark:border-sky-500 bg-white dark:bg-slate-900 shadow-xs'
                    : 'border-transparent hover:border-slate-200 dark:hover:border-slate-800 hover:bg-white/80 dark:hover:bg-slate-900/60'
                }`}
              >
                {/* Completion checkbox hitbox */}
                <button
                  type="button"
                  onClick={() => onToggleComplete(mod)}
                  aria-label={isCompleted ? `Mark ${mod.title} incomplete` : `Mark ${mod.title} complete`}
                  className="min-w-[44px] min-h-[56px] flex items-center justify-center shrink-0 cursor-pointer"
                >
                  <span
                    className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                      isCompleted
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'border-slate-300 dark:border-slate-600 group-hover:border-sky-500 bg-white dark:bg-slate-950'
                    }`}
                  >
                    {isCompleted && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                  </span>
                </button>

                {/* Module title & unboxed metadata */}
                <button
                  type="button"
                  onClick={() => onSelectDoc(mod)}
                  className="flex-1 min-w-0 py-3 pr-3 text-left flex items-center gap-2.5 cursor-pointer"
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${tintClass}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-sm font-medium leading-snug truncate ${
                          isActive
                            ? 'text-sky-700 dark:text-sky-400'
                            : isCompleted
                            ? 'text-slate-600 dark:text-slate-300'
                            : 'text-slate-900 dark:text-slate-100'
                        }`}
                      >
                        {mod.title}
                      </span>
                      {isBookmarked && (
                        <Bookmark className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
                      )}
                    </div>

                    <div className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 tabular-nums truncate">
                      <span>{mod.subject}</span>
                      <span aria-hidden="true">·</span>
                      <span>{mod.readTimeMinutes} min</span>
                      <span aria-hidden="true">·</span>
                      <span>{formatBytes(mod.size)}</span>
                    </div>
                  </div>
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
