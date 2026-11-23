import React from 'react';
import { CheckSquare, GitBranch, Home, Layers } from 'lucide-react';
import { AppTab } from './TopNav';

interface MobileBottomNavProps {
  activeTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
  onOpenSubjectSwitcher: () => void;
  activeSubjectName?: string;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onSelectTab,
  onOpenSubjectSwitcher,
  activeSubjectName,
}) => {
  return (
    <nav
      aria-label="Mobile bottom navigation"
      className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 pb-safe"
    >
      <div className="grid grid-cols-4 items-center h-16">
        <button
          type="button"
          onClick={() => onSelectTab('home')}
          className={`min-h-[44px] flex flex-col items-center justify-center gap-0.5 px-1 cursor-pointer transition-colors ${
            activeTab === 'home' || activeTab === 'study'
              ? 'text-indigo-600 dark:text-sky-400'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[11px] font-medium tracking-tight whitespace-nowrap">Home</span>
        </button>

        <button
          type="button"
          onClick={onOpenSubjectSwitcher}
          className="min-h-[44px] flex flex-col items-center justify-center gap-0.5 px-1 text-slate-600 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 cursor-pointer transition-colors"
        >
          <Layers className="w-5 h-5 text-sky-600 dark:text-sky-400" />
          <span className="text-[11px] font-medium tracking-tight truncate max-w-[72px]">
            {activeSubjectName || 'Subjects'}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onSelectTab('progress')}
          className={`min-h-[44px] flex flex-col items-center justify-center gap-0.5 px-1 cursor-pointer transition-colors ${
            activeTab === 'progress'
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <CheckSquare className="w-5 h-5" />
          <span className="text-[11px] font-medium tracking-tight whitespace-nowrap">Progress</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectTab('sync')}
          className={`min-h-[44px] flex flex-col items-center justify-center gap-0.5 px-1 cursor-pointer transition-colors ${
            activeTab === 'sync' || activeTab === 'apk'
              ? 'text-violet-600 dark:text-violet-400'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <GitBranch className="w-5 h-5" />
          <span className="text-[11px] font-medium tracking-tight whitespace-nowrap">GitHub</span>
        </button>
      </div>
    </nav>
  );
};
