import React from 'react';
import { ChevronLeft, RefreshCw } from 'lucide-react';

export type AppTab = 'home' | 'study' | 'progress' | 'sync' | 'apk';

interface TopNavProps {
  activeTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
  isSyncing: boolean;
  onSyncNow: () => void;
  mobileTitle?: string;
  showMobileBack?: boolean;
  onMobileBack?: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  activeTab,
  onSelectTab,
  isSyncing,
  onSyncNow,
  mobileTitle,
  showMobileBack = false,
  onMobileBack,
}) => {
  const navItems: { id: AppTab; label: string }[] = [
    { id: 'home', label: 'Home' },
    { id: 'study', label: 'Reader' },
    { id: 'progress', label: 'Progress' },
    { id: 'sync', label: 'GitHub Sync' },
    { id: 'apk', label: 'APK' },
  ];

  return (
    <div className="sticky top-0 z-30">
      {/* Vibrant top accent ribbon */}
      <div className="h-[3px] w-full bg-gradient-to-r from-sky-500 via-indigo-500 to-emerald-500" />

      {/* Desktop Top Bar — strictly 3 zones separated by gap-8 */}
      <header className="hidden lg:flex items-center justify-between gap-8 h-14 px-6 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md">
        {/* Zone 1: Single text element wordmark */}
        <button
          type="button"
          onClick={() => onSelectTab('home')}
          className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-sky-600 via-indigo-600 to-violet-600 dark:from-sky-400 dark:via-indigo-400 dark:to-violet-400 bg-clip-text text-transparent whitespace-nowrap shrink-0 cursor-pointer"
        >
          Scholar12
        </button>

        {/* Zone 2: Clean single-line text nav links */}
        <nav className="flex items-center gap-7" aria-label="Primary navigation">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                className={`relative py-1 text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  isActive
                    ? 'text-indigo-600 dark:text-sky-400'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {item.label}
                {isActive && (
                  <span className="absolute left-0 right-0 -bottom-[17px] h-0.5 bg-gradient-to-r from-sky-500 to-indigo-600" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Single primary action */}
        <div className="shrink-0">
          <button
            type="button"
            onClick={onSyncNow}
            disabled={isSyncing}
            className="inline-flex items-center gap-2 min-h-[38px] px-4 py-1.5 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 disabled:opacity-60 text-white text-xs font-semibold shadow-xs transition-all whitespace-nowrap shrink-0 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
          </button>
        </div>
      </header>

      {/* Mobile Top App Bar (52px) */}
      <header className="flex lg:hidden items-center justify-between gap-3 h-[52px] px-3 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md">
        <div className="flex items-center gap-1 min-w-0">
          {showMobileBack && onMobileBack ? (
            <button
              type="button"
              onClick={onMobileBack}
              aria-label="Back to module list"
              className="min-h-[44px] min-w-[44px] -ml-1 flex items-center justify-center rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          ) : null}
          <span
            className={`text-base font-extrabold tracking-tight truncate ${
              !mobileTitle || mobileTitle === 'Scholar12'
                ? 'bg-gradient-to-r from-sky-600 via-indigo-600 to-violet-600 dark:from-sky-400 dark:to-violet-400 bg-clip-text text-transparent'
                : 'text-slate-900 dark:text-white'
            }`}
          >
            {mobileTitle || 'Scholar12'}
          </span>
        </div>

        <button
          type="button"
          onClick={onSyncNow}
          disabled={isSyncing}
          aria-label="Sync GitHub documents"
          className="inline-flex items-center gap-1.5 min-h-[40px] px-3 rounded-xl bg-sky-50 dark:bg-sky-950/50 text-xs font-semibold text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900/60 disabled:opacity-60 whitespace-nowrap shrink-0 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
          <span>{isSyncing ? 'Syncing' : 'Sync'}</span>
        </button>
      </header>
    </div>
  );
};
