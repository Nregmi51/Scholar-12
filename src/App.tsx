import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FolderGit2, WifiOff, X } from 'lucide-react';
import { ApkBuilderView } from './components/ApkBuilderView';
import { DocumentReader } from './components/DocumentReader';
import { GitHubSyncView } from './components/GitHubSyncView';
import { MobileBottomNav } from './components/MobileBottomNav';
import { ModuleSidebar } from './components/ModuleSidebar';
import { ProgressDashboard } from './components/ProgressDashboard';
import { StudyHomeHub } from './components/StudyHomeHub';
import { SubjectSwitcherSheet } from './components/SubjectSwitcherSheet';
import { AppTab, TopNav } from './components/TopNav';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import {
  registerPeriodicBackgroundSync,
  syncGitHubRepository,
  SyncProgressInfo,
} from './services/githubSync';
import {
  deleteRepoAndDocs,
  ensureStarterSeeded,
  getAllRepos,
  getDocumentsByRepo,
  getProgressByRepo,
  getSyncLogs,
  loadPreferences,
  saveModuleProgress,
  savePreferences,
  saveRepo,
} from './services/storage';
import {
  ModuleProgress,
  RepoConfig,
  StudyDocument,
  SubjectSummary,
  SyncIntervalMinutes,
  SyncLogEntry,
  UserPreferences,
} from './types/study';
import {
  ALL_SUBJECTS_SLUG,
  buildAllSubjectsSummary,
  buildSubjectSummaries,
} from './utils/subjects';

export default function App() {
  const isOnline = useOnlineStatus();
  const [prefs, setPrefs] = useState<UserPreferences>(() => loadPreferences());
  const [activeTab, setActiveTab] = useState<AppTab>('home');
  const [mobileStudyMode, setMobileStudyMode] = useState<'list' | 'reader'>('reader');

  const [isReady, setIsReady] = useState(false);
  const [repos, setRepos] = useState<RepoConfig[]>([]);
  const [docs, setDocs] = useState<StudyDocument[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, ModuleProgress>>({});
  const [syncLogs, setSyncLogs] = useState<SyncLogEntry[]>([]);

  const [activeSubjectSlug, setActiveSubjectSlug] = useState<string>('');
  const [activeDocKey, setActiveDocKey] = useState<string | undefined>(prefs.activeDocKey);
  const [subjectSheetOpen, setSubjectSheetOpen] = useState(false);

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState<SyncProgressInfo | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [nextSyncAt, setNextSyncAt] = useState<number | null>(null);
  const [starterNoticeDismissed, setStarterNoticeDismissed] = useState(false);

  const toastTimerRef = useRef<number | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  }, []);

  // Sync dark mode class onto <html>
  useEffect(() => {
    document.documentElement.classList.toggle('dark', prefs.theme === 'dark');
    savePreferences({ ...prefs, activeDocKey });
  }, [prefs, activeDocKey]);

  const loadRepoData = useCallback(async (repoId: string, preferredDocKey?: string) => {
    const [allRepos, repoDocs, repoProg, logs] = await Promise.all([
      getAllRepos(),
      getDocumentsByRepo(repoId),
      getProgressByRepo(repoId),
      getSyncLogs(repoId),
    ]);

    setRepos(allRepos);
    setDocs(repoDocs);
    setProgressMap(repoProg);
    setSyncLogs(logs);

    const summaries = buildSubjectSummaries(repoDocs, repoProg);
    const preferredDoc = preferredDocKey
      ? repoDocs.find((d) => d.key === preferredDocKey)
      : undefined;

    if (preferredDoc) {
      const eachSingle = summaries.length > 1 && summaries.every((s) => s.modules.length === 1);
      setActiveSubjectSlug(eachSingle ? ALL_SUBJECTS_SLUG : preferredDoc.subjectSlug);
      setActiveDocKey(preferredDoc.key);
    } else if (summaries.length > 0) {
      const eachSingle = summaries.length > 1 && summaries.every((s) => s.modules.length === 1);
      if (eachSingle) {
        const allSummary = buildAllSubjectsSummary(repoDocs, repoProg);
        setActiveSubjectSlug(ALL_SUBJECTS_SLUG);
        setActiveDocKey(allSummary.nextModule?.key || allSummary.modules[0]?.key);
      } else {
        const firstSubj = summaries[0];
        setActiveSubjectSlug(firstSubj.slug);
        setActiveDocKey(firstSubj.nextModule?.key || firstSubj.modules[0]?.key);
      }
    } else {
      setActiveSubjectSlug('');
      setActiveDocKey(undefined);
    }
  }, []);

  // Boot initialization
  useEffect(() => {
    let mounted = true;
    (async () => {
      await ensureStarterSeeded();
      const allRepos = await getAllRepos();
      const hasActive = allRepos.some((r) => r.id === prefs.activeRepoId);
      const targetRepoId = hasActive ? prefs.activeRepoId : allRepos[0]?.id;

      if (!mounted) return;
      if (targetRepoId) {
        if (targetRepoId !== prefs.activeRepoId) {
          setPrefs((p) => ({ ...p, activeRepoId: targetRepoId }));
        }
        await loadRepoData(targetRepoId, prefs.activeDocKey);

        const targetRepo = allRepos.find((r) => r.id === targetRepoId);
        if (targetRepo && !targetRepo.isStarterPack && navigator.onLine) {
          if (targetRepo.totalFiles === 0) {
            setIsReady(true);
            setIsSyncing(true);
            setSyncProgress({ phase: 'checking', completed: 0, total: 1 });
            try {
              const result = await syncGitHubRepository(targetRepo, {
                forceFull: true,
                onProgress: (info) => setSyncProgress(info),
              });
              if (mounted) {
                await loadRepoData(result.repo.id);
                showToast(`Synced ${result.totalFiles} study files from ${result.repo.owner}/${result.repo.repo}.`);
              }
            } catch (err) {
              if (mounted) {
                setSyncError(err instanceof Error ? err.message : 'GitHub sync failed.');
              }
            } finally {
              if (mounted) {
                setIsSyncing(false);
                setSyncProgress(null);
              }
            }
            return;
          }

          // Background check for new or updated files on app open
          const elapsed = Date.now() - (targetRepo.lastSyncedAt || 0);
          if (elapsed > 60 * 1000) {
            setIsReady(true);
            syncGitHubRepository(targetRepo, { forceFull: false })
              .then(async (result) => {
                if (!mounted) return;
                if (!result.upToDate && result.filesUpdated > 0) {
                  await loadRepoData(result.repo.id, prefs.activeDocKey);
                  showToast(
                    `Synced ${result.filesUpdated} updated ${
                      result.filesUpdated === 1 ? 'module' : 'modules'
                    } from GitHub.`
                  );
                } else {
                  setRepos((prev) => prev.map((r) => (r.id === result.repo.id ? result.repo : r)));
                }
              })
              .catch(() => {
                // Keep offline cached content quietly on transient network failure
              });
            return;
          }
        }
      }
      if (mounted) setIsReady(true);
    })();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeRepo = useMemo(
    () => repos.find((r) => r.id === prefs.activeRepoId) || repos[0] || null,
    [repos, prefs.activeRepoId]
  );

  const subjects = useMemo(
    () => buildSubjectSummaries(docs, progressMap),
    [docs, progressMap]
  );

  const allSubjectsSummary = useMemo(
    () =>
      docs.length > 0
        ? buildAllSubjectsSummary(
            docs,
            progressMap,
            activeRepo?.label ? `All · ${activeRepo.repo}` : 'All Units & Subjects'
          )
        : null,
    [docs, progressMap, activeRepo?.label, activeRepo?.repo]
  );

  const activeSubject: SubjectSummary | null = useMemo(() => {
    if (subjects.length === 0) return null;
    if (activeSubjectSlug === ALL_SUBJECTS_SLUG && allSubjectsSummary) {
      return allSubjectsSummary;
    }
    return subjects.find((s) => s.slug === activeSubjectSlug) || subjects[0];
  }, [subjects, activeSubjectSlug, allSubjectsSummary]);

  const activeDoc = useMemo(() => {
    if (!activeDocKey) return activeSubject?.modules[0] || null;
    return docs.find((d) => d.key === activeDocKey) || activeSubject?.modules[0] || null;
  }, [docs, activeDocKey, activeSubject]);

  const { prevDoc, nextDoc } = useMemo(() => {
    if (!activeSubject || !activeDoc) return { prevDoc: null, nextDoc: null };
    const idx = activeSubject.modules.findIndex((m) => m.key === activeDoc.key);
    if (idx < 0) return { prevDoc: null, nextDoc: null };
    return {
      prevDoc: idx > 0 ? activeSubject.modules[idx - 1] : null,
      nextDoc: idx < activeSubject.modules.length - 1 ? activeSubject.modules[idx + 1] : null,
    };
  }, [activeSubject, activeDoc]);

  const performSync = useCallback(
    async (targetRepo: RepoConfig, forceFull = false, silent = false) => {
      if (isSyncing) return;
      if (targetRepo.isStarterPack) {
        if (!silent) {
          setActiveTab('sync');
          showToast('Connect a GitHub repository to sync live documents.');
        }
        return;
      }
      if (!navigator.onLine) {
        if (!silent) {
          showToast('Offline mode active — reading cached documents.');
        }
        return;
      }

      setIsSyncing(true);
      setSyncError(null);
      setSyncProgress({ phase: 'checking', completed: 0, total: 1 });

      try {
        const result = await syncGitHubRepository(targetRepo, {
          forceFull,
          onProgress: (info) => setSyncProgress(info),
        });
        await loadRepoData(result.repo.id, activeDocKey);
        if (!silent) {
          showToast(
            result.upToDate
              ? 'All study documents are up to date.'
              : `Synced ${result.filesUpdated} updated ${result.filesUpdated === 1 ? 'module' : 'modules'}.`
          );
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'GitHub sync failed.';
        setSyncError(msg);
        if (!silent) {
          showToast(msg);
        }
      } finally {
        setIsSyncing(false);
        setSyncProgress(null);
      }
    },
    [isSyncing, loadRepoData, activeDocKey, showToast]
  );

  // Periodic Auto-Sync Scheduler + Online / Visibility Catch-up
  useEffect(() => {
    if (!activeRepo || activeRepo.isStarterPack || activeRepo.syncIntervalMinutes <= 0) {
      setNextSyncAt(null);
      return;
    }

    const intervalMs = activeRepo.syncIntervalMinutes * 60 * 1000;
    const last = activeRepo.lastSyncedAt || Date.now();
    const scheduledTime = last + intervalMs;
    setNextSyncAt(scheduledTime);

    registerPeriodicBackgroundSync(activeRepo.syncIntervalMinutes);

    const checkAndSync = () => {
      if (!navigator.onLine || isSyncing) return;
      const elapsed = Date.now() - (activeRepo.lastSyncedAt || 0);
      if (elapsed >= intervalMs) {
        performSync(activeRepo, false, true);
      }
    };

    const delayUntilNext = Math.max(5000, scheduledTime - Date.now());
    const timeoutId = window.setTimeout(checkAndSync, delayUntilNext);
    const intervalId = window.setInterval(checkAndSync, Math.min(intervalMs, 5 * 60 * 1000));

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        checkAndSync();
      }
    };
    const handleOnline = () => {
      checkAndSync();
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('online', handleOnline);

    return () => {
      window.clearTimeout(timeoutId);
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('online', handleOnline);
    };
  }, [activeRepo, isSyncing, performSync]);

  const handleSelectDoc = useCallback(
    async (doc: StudyDocument, overrideSubjectSlug?: string) => {
      if (overrideSubjectSlug) {
        setActiveSubjectSlug(overrideSubjectSlug);
      } else if (activeSubjectSlug !== ALL_SUBJECTS_SLUG) {
        setActiveSubjectSlug(doc.subjectSlug);
      }
      setActiveDocKey(doc.key);
      setMobileStudyMode('reader');
      setActiveTab('study');

      const existing = progressMap[doc.key];
      const updated: ModuleProgress = {
        key: doc.key,
        repoId: doc.repoId,
        path: doc.path,
        completed: existing?.completed || false,
        completedAt: existing?.completedAt,
        bookmarked: existing?.bookmarked || false,
        notes: existing?.notes || '',
        lastOpenedAt: Date.now(),
      };
      setProgressMap((prev) => ({ ...prev, [doc.key]: updated }));
      await saveModuleProgress(updated);
    },
    [progressMap, activeSubjectSlug]
  );

  const handleToggleComplete = useCallback(
    async (doc: StudyDocument) => {
      const existing = progressMap[doc.key];
      const nextCompleted = !existing?.completed;
      const updated: ModuleProgress = {
        key: doc.key,
        repoId: doc.repoId,
        path: doc.path,
        completed: nextCompleted,
        completedAt: nextCompleted ? Date.now() : undefined,
        bookmarked: existing?.bookmarked || false,
        notes: existing?.notes || '',
        lastOpenedAt: existing?.lastOpenedAt || Date.now(),
      };
      setProgressMap((prev) => ({ ...prev, [doc.key]: updated }));
      await saveModuleProgress(updated);
      showToast(nextCompleted ? `Completed: ${doc.title}` : `Marked incomplete: ${doc.title}`);
    },
    [progressMap, showToast]
  );

  const handleToggleBookmark = useCallback(
    async (doc: StudyDocument) => {
      const existing = progressMap[doc.key];
      const nextBookmarked = !existing?.bookmarked;
      const updated: ModuleProgress = {
        key: doc.key,
        repoId: doc.repoId,
        path: doc.path,
        completed: existing?.completed || false,
        completedAt: existing?.completedAt,
        bookmarked: nextBookmarked,
        notes: existing?.notes || '',
        lastOpenedAt: existing?.lastOpenedAt || Date.now(),
      };
      setProgressMap((prev) => ({ ...prev, [doc.key]: updated }));
      await saveModuleProgress(updated);
      showToast(nextBookmarked ? 'Bookmarked module' : 'Removed bookmark');
    },
    [progressMap, showToast]
  );

  const handleSaveNotes = useCallback(
    async (doc: StudyDocument, notes: string) => {
      const existing = progressMap[doc.key];
      const updated: ModuleProgress = {
        key: doc.key,
        repoId: doc.repoId,
        path: doc.path,
        completed: existing?.completed || false,
        completedAt: existing?.completedAt,
        bookmarked: existing?.bookmarked || false,
        lastOpenedAt: existing?.lastOpenedAt || Date.now(),
        notes,
      };
      setProgressMap((prev) => ({ ...prev, [doc.key]: updated }));
      await saveModuleProgress(updated);
    },
    [progressMap]
  );

  const handleSelectSubject = useCallback(
    (subject: SubjectSummary, openNextModule = true) => {
      setActiveSubjectSlug(subject.slug);
      setActiveTab('study');
      if (openNextModule && subject.nextModule) {
        handleSelectDoc(subject.nextModule, subject.slug);
      } else {
        setMobileStudyMode('list');
      }
    },
    [handleSelectDoc]
  );

  const handleSelectRepo = useCallback(
    async (repoId: string) => {
      setPrefs((p) => ({ ...p, activeRepoId: repoId }));
      setSyncError(null);
      await loadRepoData(repoId);
      const selected = repos.find((r) => r.id === repoId);
      if (selected && !selected.isStarterPack && selected.totalFiles === 0 && navigator.onLine) {
        setActiveTab('sync');
        await performSync(selected, true, false);
        return;
      }
      setActiveTab('study');
      setMobileStudyMode('list');
    },
    [loadRepoData, repos, performSync]
  );

  const handleUpdateToken = useCallback(
    async (repoId: string, token: string) => {
      const target = repos.find((r) => r.id === repoId);
      if (!target) return;
      const updated = { ...target, token: token || undefined };
      await saveRepo(updated);
      setRepos((prev) => prev.map((r) => (r.id === repoId ? updated : r)));
      await performSync(updated, true, false);
    },
    [repos, performSync]
  );

  const handleAddAndSyncRepo = useCallback(
    async (newRepo: RepoConfig) => {
      setIsSyncing(true);
      setSyncError(null);
      setSyncProgress({ phase: 'checking', completed: 0, total: 1 });

      try {
        const result = await syncGitHubRepository(newRepo, {
          forceFull: true,
          onProgress: (info) => setSyncProgress(info),
        });
        setPrefs((p) => ({ ...p, activeRepoId: result.repo.id }));
        await loadRepoData(result.repo.id);
        showToast(`Connected ${result.repo.owner}/${result.repo.repo} (${result.totalFiles} docs cached offline).`);
        setActiveTab('study');
        setMobileStudyMode('list');
      } finally {
        setIsSyncing(false);
        setSyncProgress(null);
      }
    },
    [loadRepoData, showToast]
  );

  const handleUpdateInterval = useCallback(
    async (repoId: string, interval: SyncIntervalMinutes) => {
      const target = repos.find((r) => r.id === repoId);
      if (!target) return;
      const updated = { ...target, syncIntervalMinutes: interval };
      await saveRepo(updated);
      setRepos((prev) => prev.map((r) => (r.id === repoId ? updated : r)));
      showToast(
        interval === 0
          ? 'Automatic periodic sync paused.'
          : `Periodic sync set to every ${interval >= 60 ? `${interval / 60} hour(s)` : `${interval} minutes`}.`
      );
    },
    [repos, showToast]
  );

  const handleDeleteRepo = useCallback(
    async (repoId: string) => {
      await deleteRepoAndDocs(repoId);
      const remaining = await getAllRepos();
      const fallbackId = remaining[0]?.id;
      if (fallbackId) {
        setPrefs((p) => ({ ...p, activeRepoId: fallbackId }));
        await loadRepoData(fallbackId);
      }
      showToast('Removed repository and cleared its offline cache.');
    },
    [loadRepoData, showToast]
  );

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 text-sm">
        Loading Scholar12 offline study library...
      </div>
    );
  }

  const mobileTitle =
    activeTab === 'home'
      ? 'Scholar12'
      : activeTab === 'study' && mobileStudyMode === 'reader' && activeDoc
      ? activeDoc.title
      : activeTab === 'progress'
      ? 'Progress'
      : activeTab === 'sync'
      ? 'GitHub Sync'
      : activeTab === 'apk'
      ? 'APK & Offline'
      : activeSubject?.name || 'Scholar12';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <TopNav
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          if (tab === 'study') setMobileStudyMode('reader');
        }}
        isSyncing={isSyncing}
        onSyncNow={() => {
          if (activeRepo) performSync(activeRepo, false, false);
        }}
        mobileTitle={mobileTitle}
        showMobileBack={activeTab === 'study'}
        onMobileBack={() => {
          if (mobileStudyMode === 'reader') {
            setMobileStudyMode('list');
          } else {
            setActiveTab('home');
          }
        }}
      />

      {/* Offline banner when disconnected */}
      {!isOnline && (
        <div className="px-4 py-2 bg-amber-50 dark:bg-amber-950/60 border-b border-amber-200 dark:border-amber-900 flex items-center justify-center gap-2 text-xs font-medium text-amber-800 dark:text-amber-200">
          <WifiOff className="w-3.5 h-3.5 shrink-0" />
          <span>Offline Mode — Reading from locally cached documents.</span>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-h-0">
        {activeTab === 'home' && (
          <StudyHomeHub
            activeRepo={activeRepo}
            subjects={subjects}
            docs={docs}
            progressMap={progressMap}
            theme={prefs.theme}
            onToggleTheme={() =>
              setPrefs((p) => ({ ...p, theme: p.theme === 'dark' ? 'light' : 'dark' }))
            }
            onOpenModule={(doc, subjSlug) => handleSelectDoc(doc, subjSlug)}
            onOpenSubjectSwitcher={() => setSubjectSheetOpen(true)}
            onOpenGitHubSync={() => setActiveTab('sync')}
          />
        )}

        {activeTab === 'study' && (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Subtle starter banner inviting connection to user's own GitHub repo */}
            {activeRepo?.isStarterPack && !starterNoticeDismissed && (
              <div className="px-4 sm:px-6 py-2.5 bg-sky-50/80 dark:bg-sky-950/40 border-b border-sky-200/80 dark:border-sky-900/70 flex items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 min-w-0">
                  <FolderGit2 className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
                  <span className="truncate">
                    Viewing the Grade 12 Starter Curriculum. Connect your own GitHub docs repository anytime for live periodic sync.
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setActiveTab('sync')}
                    className="font-semibold text-sky-700 dark:text-sky-400 hover:underline whitespace-nowrap cursor-pointer"
                  >
                    Connect GitHub Repo
                  </button>
                  <button
                    type="button"
                    onClick={() => setStarterNoticeDismissed(true)}
                    aria-label="Dismiss notice"
                    className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            <div className="flex-1 flex min-h-0 lg:h-[calc(100vh-3.5rem)]">
              {/* Left Subject & Module Sidebar (Always visible on desktop; visible on mobile in 'list' mode) */}
              <aside
                className={`${
                  mobileStudyMode === 'list' ? 'flex' : 'hidden'
                } lg:flex flex-col w-full lg:w-80 xl:w-88 shrink-0 border-r border-slate-200 dark:border-slate-800 pb-20 lg:pb-0`}
              >
                <ModuleSidebar
                  activeSubject={activeSubject}
                  allSubjectsCount={subjects.length}
                  activeDocKey={activeDoc?.key}
                  progressMap={progressMap}
                  onOpenSubjectSwitcher={() => setSubjectSheetOpen(true)}
                  onSelectDoc={handleSelectDoc}
                  onToggleComplete={handleToggleComplete}
                />
              </aside>

              {/* Center Reader Pane (Always visible on desktop; visible on mobile in 'reader' mode) */}
              <section
                className={`${
                  mobileStudyMode === 'reader' ? 'flex' : 'hidden'
                } lg:flex flex-1 min-w-0 flex-col`}
              >
                <DocumentReader
                  doc={activeDoc}
                  repo={activeRepo || undefined}
                  progress={activeDoc ? progressMap[activeDoc.key] : undefined}
                  prevDoc={prevDoc}
                  nextDoc={nextDoc}
                  theme={prefs.theme}
                  fontFamily={prefs.fontFamily}
                  fontSize={prefs.fontSize}
                  isOnline={isOnline}
                  isSyncing={isSyncing}
                  syncProgress={syncProgress}
                  onToggleTheme={() =>
                    setPrefs((p) => ({ ...p, theme: p.theme === 'dark' ? 'light' : 'dark' }))
                  }
                  onToggleFontFamily={() =>
                    setPrefs((p) => ({
                      ...p,
                      fontFamily: p.fontFamily === 'sans' ? 'serif' : 'sans',
                    }))
                  }
                  onCycleFontSize={() =>
                    setPrefs((p) => ({
                      ...p,
                      fontSize: p.fontSize === 'sm' ? 'base' : p.fontSize === 'base' ? 'lg' : 'sm',
                    }))
                  }
                  onToggleComplete={handleToggleComplete}
                  onToggleBookmark={handleToggleBookmark}
                  onSaveNotes={handleSaveNotes}
                  onSelectDoc={handleSelectDoc}
                />
              </section>
            </div>
          </div>
        )}

        {activeTab === 'progress' && (
          <ProgressDashboard
            activeRepo={activeRepo}
            subjects={subjects}
            docs={docs}
            progressMap={progressMap}
            onOpenModule={handleSelectDoc}
            onToggleComplete={handleToggleComplete}
          />
        )}

        {activeTab === 'sync' && (
          <GitHubSyncView
            repos={repos}
            activeRepo={activeRepo}
            syncLogs={syncLogs}
            isSyncing={isSyncing}
            syncProgress={syncProgress}
            syncError={syncError}
            nextSyncAt={nextSyncAt}
            onSelectRepo={handleSelectRepo}
            onAddAndSyncRepo={handleAddAndSyncRepo}
            onSyncNow={(forceFull) =>
              activeRepo ? performSync(activeRepo, !!forceFull, false) : Promise.resolve()
            }
            onUpdateInterval={handleUpdateInterval}
            onUpdateToken={handleUpdateToken}
            onDeleteRepo={handleDeleteRepo}
            onOpenApkView={() => setActiveTab('apk')}
          />
        )}

        {activeTab === 'apk' && (
          <ApkBuilderView defaultAppName="Scholar12" />
        )}
      </main>

      {/* Detailed Subject Switcher Modal / Bottom Sheet */}
      <SubjectSwitcherSheet
        isOpen={subjectSheetOpen}
        onClose={() => setSubjectSheetOpen(false)}
        subjects={subjects}
        allSubjectsSummary={allSubjectsSummary}
        activeSubjectSlug={activeSubject?.slug || ''}
        onSelectSubject={handleSelectSubject}
      />

      {/* Mobile Fixed Thumb-Zone Bottom Bar */}
      <MobileBottomNav
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          if (tab === 'study') setMobileStudyMode('list');
        }}
        onOpenSubjectSwitcher={() => setSubjectSheetOpen(true)}
        activeSubjectName={activeSubject?.name}
      />

      {/* Transient Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-20 lg:bottom-6 right-4 left-4 sm:left-auto sm:max-w-sm z-50 px-4 py-3 rounded-xl bg-slate-900 dark:bg-slate-800 text-white text-xs font-medium shadow-lg border border-slate-700 flex items-center justify-between gap-3"
        >
          <span>{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            aria-label="Dismiss message"
            className="p-1 text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
