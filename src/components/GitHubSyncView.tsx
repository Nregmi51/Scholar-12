import React, { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  FolderGit2,
  HardDriveDownload,
  Plus,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { parseGitHubInput, SyncProgressInfo } from '../services/githubSync';
import { RepoConfig, SyncIntervalMinutes, SyncLogEntry } from '../types/study';
import { formatBytes, formatRelativeTime } from '../utils/subjects';

interface GitHubSyncViewProps {
  repos: RepoConfig[];
  activeRepo: RepoConfig | null;
  syncLogs: SyncLogEntry[];
  isSyncing: boolean;
  syncProgress: SyncProgressInfo | null;
  syncError: string | null;
  nextSyncAt: number | null;
  onSelectRepo: (repoId: string) => void;
  onAddAndSyncRepo: (newRepo: RepoConfig) => Promise<void>;
  onSyncNow: (forceFull?: boolean) => Promise<void>;
  onUpdateInterval: (repoId: string, interval: SyncIntervalMinutes) => void;
  onUpdateToken: (repoId: string, token: string) => Promise<void>;
  onDeleteRepo: (repoId: string) => void;
  onOpenApkView: () => void;
}

const INTERVAL_OPTIONS: { value: SyncIntervalMinutes; label: string }[] = [
  { value: 15, label: 'Every 15 minutes' },
  { value: 30, label: 'Every 30 minutes' },
  { value: 60, label: 'Every 1 hour' },
  { value: 360, label: 'Every 6 hours' },
  { value: 1440, label: 'Daily (24 hours)' },
  { value: 0, label: 'Manual sync only' },
];

export const GitHubSyncView: React.FC<GitHubSyncViewProps> = ({
  repos,
  activeRepo,
  syncLogs,
  isSyncing,
  syncProgress,
  syncError,
  nextSyncAt,
  onSelectRepo,
  onAddAndSyncRepo,
  onSyncNow,
  onUpdateInterval,
  onUpdateToken,
  onDeleteRepo,
  onOpenApkView,
}) => {
  const [repoInput, setRepoInput] = useState('');
  const [labelInput, setLabelInput] = useState('');
  const [branchInput, setBranchInput] = useState('main');
  const [docsPathInput, setDocsPathInput] = useState('');
  const [tokenInput, setTokenInput] = useState('');
  const [activeTokenInput, setActiveTokenInput] = useState('');
  const [intervalInput, setIntervalInput] = useState<SyncIntervalMinutes>(60);
  const [formError, setFormError] = useState<string | null>(null);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const parsed = parseGitHubInput(repoInput, branchInput.trim() || 'main', docsPathInput.trim());
    if (!parsed) {
      setFormError('Enter a valid GitHub repository (e.g. username/grade12-notes or full GitHub URL).');
      return;
    }

    const id = `gh-${parsed.owner.toLowerCase()}-${parsed.repo.toLowerCase()}-${Date.now()}`;
    const config: RepoConfig = {
      id,
      label: labelInput.trim() || `${parsed.owner}/${parsed.repo}`,
      owner: parsed.owner,
      repo: parsed.repo,
      branch: parsed.branch,
      docsPath: parsed.docsPath,
      token: tokenInput.trim() || undefined,
      syncIntervalMinutes: intervalInput,
      totalFiles: 0,
      totalBytes: 0,
    };

    try {
      await onAddAndSyncRepo(config);
      setRepoInput('');
      setLabelInput('');
      setDocsPathInput('');
      setTokenInput('');
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Unable to sync repository.');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-8 py-6 sm:py-8 pb-24 lg:pb-12 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            GitHub Repository &amp; Periodic Sync
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Pull Grade 12 <code className="font-study-mono">.docx</code>, Markdown, text, HTML, and PDF docs directly from GitHub and keep them cached offline.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenApkView}
          className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-medium text-slate-800 dark:text-slate-100 whitespace-nowrap shrink-0 cursor-pointer"
        >
          Build APK via GitHub
        </button>
      </div>

      {/* Active Repository Sync Status & Controls */}
      {activeRepo && (
        <section className="p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <FolderGit2 className="w-5 h-5 text-sky-600 dark:text-sky-400 shrink-0" />
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white truncate">
                  {activeRepo.label}
                </h2>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                <span>
                  {activeRepo.isStarterPack
                    ? 'Bundled Offline Starter Pack'
                    : `${activeRepo.owner}/${activeRepo.repo} (${activeRepo.branch})`}
                </span>
                <span aria-hidden="true">·</span>
                <span>{activeRepo.totalFiles} documents</span>
                <span aria-hidden="true">·</span>
                <span>{formatBytes(activeRepo.totalBytes)} cached</span>
                <span aria-hidden="true">·</span>
                <span>Last synced {formatRelativeTime(activeRepo.lastSyncedAt)}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => onSyncNow(false)}
                disabled={isSyncing || activeRepo.isStarterPack}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white text-sm font-medium inline-flex items-center gap-2 transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Syncing...' : 'Sync Changes'}</span>
              </button>

              <button
                type="button"
                onClick={() => onSyncNow(true)}
                disabled={isSyncing || activeRepo.isStarterPack}
                className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 text-slate-800 dark:text-slate-100 text-sm font-medium inline-flex items-center gap-2 transition-colors cursor-pointer"
              >
                <HardDriveDownload className="w-4 h-4" />
                <span>Refresh All Offline</span>
              </button>
            </div>
          </div>

          {/* Sync Progress Bar */}
          {isSyncing && syncProgress && (
            <div className="p-4 rounded-xl border border-sky-200 dark:border-sky-900 bg-sky-50/70 dark:bg-sky-950/30 space-y-2">
              <div className="flex items-center justify-between text-xs font-medium text-sky-900 dark:text-sky-200">
                <span className="truncate">
                  {syncProgress.phase === 'checking'
                    ? 'Checking latest GitHub commit...'
                    : syncProgress.phase === 'saving'
                    ? 'Saving offline cache to device...'
                    : `Downloading ${syncProgress.currentFile || 'documents'}...`}
                </span>
                <span className="tabular-nums shrink-0 ml-2">
                  {syncProgress.completed} / {syncProgress.total}
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-sky-200 dark:bg-sky-900 overflow-hidden">
                <div
                  className="h-full bg-sky-600 dark:bg-sky-400 transition-all duration-200"
                  style={{
                    width: `${
                      syncProgress.total > 0
                        ? Math.round((syncProgress.completed / syncProgress.total) * 100)
                        : 100
                    }%`,
                  }}
                />
              </div>
            </div>
          )}

          {syncError && (
            <div className="p-4 rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 flex items-start gap-3 text-sm text-red-800 dark:text-red-200">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>{syncError}</div>
            </div>
          )}

          {/* Periodic Sync Schedule Selector */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 text-sm text-slate-700 dark:text-slate-300">
              <Clock className="w-4 h-4 text-slate-400 shrink-0" />
              <span>Periodic Auto-Sync Schedule</span>
              {nextSyncAt && activeRepo.syncIntervalMinutes > 0 && !activeRepo.isStarterPack && (
                <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                  · Next check at {new Date(nextSyncAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>

            <select
              aria-label="Periodic auto-sync interval"
              value={activeRepo.syncIntervalMinutes}
              onChange={(e) =>
                onUpdateInterval(activeRepo.id, Number(e.target.value) as SyncIntervalMinutes)
              }
              className="min-h-[42px] px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              {INTERVAL_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {!activeRepo.isStarterPack && (
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-xs text-slate-500 dark:text-slate-400">
                <span className="font-medium text-slate-700 dark:text-slate-300 block">
                  Private Repo Access Token (Optional)
                </span>
                {activeRepo.token
                  ? 'A GitHub token is saved locally for this repository.'
                  : 'Add a GitHub Personal Access Token if this repository is private.'}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="password"
                  value={activeTokenInput}
                  onChange={(e) => setActiveTokenInput(e.target.value)}
                  placeholder="github_pat_..."
                  className="min-h-[40px] w-48 sm:w-56 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <button
                  type="button"
                  disabled={isSyncing}
                  onClick={async () => {
                    await onUpdateToken(activeRepo.id, activeTokenInput.trim());
                    setActiveTokenInput('');
                  }}
                  className="min-h-[40px] px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-medium text-slate-800 dark:text-slate-100 whitespace-nowrap cursor-pointer"
                >
                  Save &amp; Sync
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Connect a GitHub Repository Form + Saved Sources */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <form
          onSubmit={handleConnect}
          className="p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4"
        >
          <div className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-sky-600 dark:text-sky-400" />
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              Connect Your GitHub Docs Repo
            </h2>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Organize your repo with subject or unit folders (for example <code className="font-study-mono">Physics/</code>, <code className="font-study-mono">Unit-1/</code>) containing <code className="font-study-mono">.docx</code>, <code className="font-study-mono">.md</code>, <code className="font-study-mono">.txt</code>, or <code className="font-study-mono">.pdf</code> files.
          </p>

          <div>
            <label htmlFor="gh-repo-url" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              GitHub Repository (owner/repo or URL)
            </label>
            <input
              id="gh-repo-url"
              type="text"
              required
              value={repoInput}
              onChange={(e) => setRepoInput(e.target.value)}
              placeholder="e.g. yourname/grade12-docs or https://github.com/..."
              className="w-full min-h-[44px] px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="gh-branch" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Branch
              </label>
              <input
                id="gh-branch"
                type="text"
                value={branchInput}
                onChange={(e) => setBranchInput(e.target.value)}
                placeholder="main"
                className="w-full min-h-[44px] px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label htmlFor="gh-docs-path" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Docs Subfolder (Optional)
              </label>
              <input
                id="gh-docs-path"
                type="text"
                value={docsPathInput}
                onChange={(e) => setDocsPathInput(e.target.value)}
                placeholder="e.g. docs or grade-12"
                className="w-full min-h-[44px] px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="gh-label" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Display Name (Optional)
              </label>
              <input
                id="gh-label"
                type="text"
                value={labelInput}
                onChange={(e) => setLabelInput(e.target.value)}
                placeholder="Grade 12 Science Notes"
                className="w-full min-h-[44px] px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label htmlFor="gh-interval" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Auto-Sync Frequency
              </label>
              <select
                id="gh-interval"
                value={intervalInput}
                onChange={(e) => setIntervalInput(Number(e.target.value) as SyncIntervalMinutes)}
                className="w-full min-h-[44px] px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                {INTERVAL_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="gh-token" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Personal Access Token (Optional — only for private repos)
            </label>
            <input
              id="gh-token"
              type="password"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="github_pat_... (stored locally on this device)"
              className="w-full min-h-[44px] px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          {formError && (
            <div className="p-3 rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 text-xs text-red-700 dark:text-red-300">
              {formError}
            </div>
          )}

          <button
            type="submit"
            disabled={isSyncing}
            className="w-full min-h-[46px] px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-sky-600 hover:bg-slate-800 dark:hover:bg-sky-500 disabled:opacity-50 text-white text-sm font-semibold transition-colors cursor-pointer"
          >
            {isSyncing ? 'Fetching from GitHub...' : 'Connect & Download Offline'}
          </button>
        </form>

        {/* Saved Repositories + Sync History */}
        <div className="space-y-6">
          <section className="p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              Saved Content Sources
            </h2>

            <div className="space-y-2">
              {repos.map((r) => {
                const isSelected = r.id === activeRepo?.id;
                return (
                  <div
                    key={r.id}
                    className={`flex items-center justify-between gap-3 p-3.5 rounded-xl border transition-colors ${
                      isSelected
                        ? 'border-sky-500 bg-sky-50/50 dark:bg-sky-950/30'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => onSelectRepo(r.id)}
                      className="flex-1 min-w-0 text-left cursor-pointer"
                    >
                      <div className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                        {r.label}
                      </div>
                      <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 tabular-nums truncate">
                        {r.isStarterPack ? 'Local starter pack' : `${r.owner}/${r.repo}`} · {r.totalFiles} files ·{' '}
                        {formatBytes(r.totalBytes)}
                      </div>
                    </button>

                    {!r.isStarterPack && (
                      <button
                        type="button"
                        onClick={() => onDeleteRepo(r.id)}
                        aria-label={`Remove ${r.label}`}
                        className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          <section className="p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              Sync Activity
            </h2>

            {syncLogs.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                No sync events recorded yet for this source.
              </p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-60 overflow-y-auto">
                {syncLogs.map((log) => (
                  <div key={log.id} className="py-2.5 flex items-start gap-2.5 text-xs">
                    {log.status === 'error' ? (
                      <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="text-slate-800 dark:text-slate-200">{log.message}</div>
                      <div className="mt-0.5 text-slate-500 dark:text-slate-400 tabular-nums">
                        {formatRelativeTime(log.timestamp)}
                        {log.commitSha ? ` · Commit ${log.commitSha.slice(0, 7)}` : ''}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};
