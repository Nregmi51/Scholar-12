import { DocFileType, RepoConfig, StudyDocument, SyncLogEntry } from '../types/study';
import { convertDocxBlobToHtml } from '../utils/docx';
import {
  addSyncLog,
  deleteRemovedDocuments,
  getDocumentsByRepo,
  saveDocuments,
  saveRepo,
} from './storage';

interface GitHubTreeItem {
  path: string;
  mode: string;
  type: 'blob' | 'tree';
  sha: string;
  size?: number;
}

export interface ParsedGitHubSource {
  owner: string;
  repo: string;
  branch: string;
  docsPath: string;
}

export function parseGitHubInput(
  input: string,
  fallbackBranch = 'main',
  fallbackDocsPath = ''
): ParsedGitHubSource | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Handle full GitHub URLs like https://github.com/owner/repo or https://github.com/owner/repo/tree/main/docs
  if (trimmed.includes('github.com')) {
    try {
      const normalized = trimmed.startsWith('http') ? trimmed : `https://${trimmed}`;
      const url = new URL(normalized);
      const parts = url.pathname.replace(/^\/+|\/+$/g, '').split('/');
      if (parts.length >= 2) {
        const owner = parts[0];
        const repo = parts[1].replace(/\.git$/, '');
        let branch = fallbackBranch;
        let docsPath = fallbackDocsPath;

        if (parts[2] === 'tree' && parts.length >= 4) {
          branch = parts[3];
          if (parts.length > 4) {
            docsPath = parts.slice(4).join('/');
          }
        }
        return { owner, repo, branch, docsPath };
      }
    } catch {
      return null;
    }
  }

  // Handle owner/repo shorthand
  const clean = trimmed.replace(/^\/+|\/+$/g, '').replace(/\.git$/, '');
  const segments = clean.split('/');
  if (segments.length === 2 && segments[0] && segments[1]) {
    return {
      owner: segments[0],
      repo: segments[1],
      branch: fallbackBranch,
      docsPath: fallbackDocsPath,
    };
  }

  return null;
}

function getFileExtension(path: string): string {
  const idx = path.lastIndexOf('.');
  return idx >= 0 ? path.slice(idx + 1).toLowerCase() : '';
}

function detectDocType(ext: string): DocFileType | null {
  if (ext === 'md' || ext === 'mdx' || ext === 'markdown') return 'markdown';
  if (ext === 'docx') return 'docx';
  if (ext === 'txt' || ext === 'rst' || ext === 'csv') return 'text';
  if (ext === 'pdf') return 'pdf';
  if (ext === 'html' || ext === 'htm') return 'html';
  return null;
}

function humanizeName(raw: string): string {
  const withoutExt = raw.replace(/\.(md|mdx|markdown|docx|txt|rst|pdf|html|htm|csv)$/i, '');
  // Split camelCase and letter-number boundaries like "Unit8_examNotes" -> "Unit 8 exam Notes"
  const normalized = withoutExt
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/([a-zA-Z])(\d+)/g, '$1 $2')
    .replace(/(\d+)([a-zA-Z])/g, '$1 $2');

  // Extract optional leading numeric prefix like "01-kinematics" -> "01 · Kinematics"
  const numMatch = normalized.match(/^(\d+)[-_.\s]+(.+)$/);
  if (numMatch) {
    const num = numMatch[1].padStart(2, '0');
    const rest = numMatch[2]
      .replace(/[-_]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/\b\w/g, (c) => c.toUpperCase());
    return `${num} · ${rest}`;
  }

  return normalized
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function extractOrderIndex(fileName: string, fallbackIdx: number): number {
  const lessonMatch = fileName.match(/lesson[-_\s]*(\d+)/i);
  if (lessonMatch) return parseInt(lessonMatch[1], 10);
  const unitMatch = fileName.match(/(?:unit|chapter|module)[-_\s]*(\d+)/i);
  if (unitMatch) return parseInt(unitMatch[1], 10);
  const match = fileName.match(/^(\d+)/);
  return match ? parseInt(match[1], 10) : 1000 + fallbackIdx;
}

function deriveSubjectAndTitle(
  fullPath: string,
  docsRoot: string,
  fallbackIdx: number
): { subject: string; subjectSlug: string; title: string; fileName: string; orderIndex: number } {
  const cleanRoot = docsRoot.replace(/^\/+|\/+$/g, '');
  let relPath = fullPath;
  if (cleanRoot && fullPath.toLowerCase().startsWith(cleanRoot.toLowerCase() + '/')) {
    relPath = fullPath.slice(cleanRoot.length + 1);
  }

  const segments = relPath.split('/').filter(Boolean);
  const fileName = segments[segments.length - 1] || fullPath;

  let subject = 'General Notes';
  if (segments.length >= 2) {
    subject = humanizeName(segments[0]).replace(/^\d+\s·\s/, '');
  } else {
    // Smart unit/chapter detection for root-level files like "12-Unit-1-Lesson-2.docx"
    const unitMatch = fileName.match(/(?:unit|chapter|module|subject)[-_.\s]*(\d+)/i);
    if (unitMatch) {
      subject = `Unit ${unitMatch[1]}`;
    }
  }

  const title =
    segments.length > 2
      ? `${humanizeName(segments.slice(1, -1).join(' / '))} / ${humanizeName(fileName)}`
      : humanizeName(fileName);

  const subjectSlug = subject.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'general';
  const orderIndex = extractOrderIndex(fileName, fallbackIdx);

  return { subject, subjectSlug, title, fileName, orderIndex };
}

function estimateReadMinutes(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 180));
}

function buildHeaders(token?: string): HeadersInit {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
  };
  if (token && token.trim()) {
    headers.Authorization = `Bearer ${token.trim()}`;
  }
  return headers;
}

async function fetchRepoDefaultBranch(owner: string, repo: string, token?: string): Promise<string> {
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
    headers: buildHeaders(token),
  });
  if (!res.ok) {
    if (res.status === 404 || res.status === 401) {
      throw new Error(
        `Could not access ${owner}/${repo} (HTTP ${res.status}). Make sure the repository exists and is public, or add a GitHub Personal Access Token if it is private.`
      );
    }
    throw new Error(`GitHub repository inaccessible (HTTP ${res.status}).`);
  }
  const data = (await res.json()) as { default_branch?: string };
  return data.default_branch || 'main';
}

export interface SyncProgressInfo {
  phase: 'checking' | 'downloading' | 'saving';
  completed: number;
  total: number;
  currentFile?: string;
}

export interface SyncResult {
  repo: RepoConfig;
  filesUpdated: number;
  totalFiles: number;
  upToDate: boolean;
  commitSha: string;
}

export async function syncGitHubRepository(
  config: RepoConfig,
  options?: {
    forceFull?: boolean;
    onProgress?: (info: SyncProgressInfo) => void;
  }
): Promise<SyncResult> {
  const { owner, repo, token, docsPath } = config;
  let branch = config.branch.trim();

  if (config.isStarterPack) {
    return {
      repo: config,
      filesUpdated: 0,
      totalFiles: config.totalFiles,
      upToDate: true,
      commitSha: 'starter',
    };
  }

  options?.onProgress?.({ phase: 'checking', completed: 0, total: 1 });

  if (!branch) {
    branch = await fetchRepoDefaultBranch(owner, repo, token);
  }

  // 1. Fetch latest commit on branch
  const commitRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/commits/${encodeURIComponent(branch)}`,
    { headers: buildHeaders(token), cache: 'no-store' }
  );

  if (!commitRes.ok) {
    if (commitRes.status === 404 && branch === 'main') {
      // Auto-retry with repository default branch
      branch = await fetchRepoDefaultBranch(owner, repo, token);
    } else if (commitRes.status === 403) {
      throw new Error('GitHub API rate limit reached. Add a GitHub Personal Access Token or retry shortly.');
    } else {
      throw new Error(`Failed to read branch "${branch}" from ${owner}/${repo} (HTTP ${commitRes.status}).`);
    }
  }

  const verifiedCommitRes =
    commitRes.ok
      ? commitRes
      : await fetch(
          `https://api.github.com/repos/${owner}/${repo}/commits/${encodeURIComponent(branch)}`,
          { headers: buildHeaders(token), cache: 'no-store' }
        );

  if (!verifiedCommitRes.ok) {
    throw new Error(`Unable to fetch commit for ${owner}/${repo} (${verifiedCommitRes.status}).`);
  }

  const commitData = (await verifiedCommitRes.json()) as {
    sha: string;
    commit?: { tree?: { sha: string } };
  };
  const latestCommitSha = commitData.sha;
  const treeSha = commitData.commit?.tree?.sha || latestCommitSha;

  const existingDocs = await getDocumentsByRepo(config.id);
  const existingByKey = new Map<string, StudyDocument>(existingDocs.map((d) => [d.key, d]));

  if (!options?.forceFull && config.lastCommitSha === latestCommitSha && existingDocs.length > 0) {
    const updatedRepo: RepoConfig = {
      ...config,
      branch,
      lastSyncedAt: Date.now(),
    };
    await saveRepo(updatedRepo);
    await addSyncLog({
      id: `log-${Date.now()}`,
      repoId: config.id,
      timestamp: Date.now(),
      status: 'up-to-date',
      message: `Already up to date (${latestCommitSha.slice(0, 7)}).`,
      filesUpdated: 0,
      commitSha: latestCommitSha,
    });
    return {
      repo: updatedRepo,
      filesUpdated: 0,
      totalFiles: existingDocs.length,
      upToDate: true,
      commitSha: latestCommitSha,
    };
  }

  // 2. Fetch recursive git tree
  const treeRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/trees/${treeSha}?recursive=1`,
    { headers: buildHeaders(token), cache: 'no-store' }
  );
  if (!treeRes.ok) {
    throw new Error(`Failed to list repository files (HTTP ${treeRes.status}).`);
  }

  const treeJson = (await treeRes.json()) as { tree: GitHubTreeItem[]; truncated?: boolean };
  const cleanRoot = docsPath.replace(/^\/+|\/+$/g, '').toLowerCase();

  const candidateItems = treeJson.tree.filter((item) => {
    if (item.type !== 'blob') return false;
    if (cleanRoot && !item.path.toLowerCase().startsWith(cleanRoot + '/')) return false;
    const fileName = item.path.split('/').pop() || '';
    if (fileName.startsWith('.')) return false;
    // Skip repo meta files if at root when user likely wants study content, unless only root files exist
    const ext = getFileExtension(item.path);
    return detectDocType(ext) !== null;
  });

  if (candidateItems.length === 0) {
    throw new Error(
      `No study documents (.docx, .md, .txt, .pdf, .html) found in ${owner}/${repo}${cleanRoot ? `/${docsPath}` : ''}.`
    );
  }

  const activeKeys = new Set<string>();
  const toFetch: GitHubTreeItem[] = [];

  for (const item of candidateItems) {
    const key = `${config.id}:${item.path}`;
    activeKeys.add(key);
    const cached = existingByKey.get(key);
    if (options?.forceFull || !cached || cached.sha !== item.sha) {
      toFetch.push(item);
    }
  }

  const downloadedDocs: StudyDocument[] = [];
  const totalToFetch = toFetch.length;

  for (let i = 0; i < totalToFetch; i++) {
    const item = toFetch[i];
    options?.onProgress?.({
      phase: 'downloading',
      completed: i,
      total: totalToFetch,
      currentFile: item.path,
    });

    const ext = getFileExtension(item.path);
    const docType = detectDocType(ext) || 'text';
    const encodedPath = item.path
      .split('/')
      .map((s) => encodeURIComponent(s))
      .join('/');

    let contentText: string | undefined;
    let blobData: Blob | undefined;
    let actualSize = item.size || 0;
    let readTimeMinutes = 5;

    if (token && token.trim()) {
      // Authenticated fetch via GitHub Blob API
      const blobRes = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/git/blobs/${item.sha}`,
        { headers: buildHeaders(token) }
      );
      if (!blobRes.ok) {
        throw new Error(`Failed to download ${item.path} (HTTP ${blobRes.status}).`);
      }
      const blobJson = (await blobRes.json()) as { content: string; encoding: string; size: number };
      actualSize = blobJson.size || actualSize;
      const cleanBase64 = blobJson.content.replace(/\s/g, '');
      const binaryString = atob(cleanBase64);
      const bytes = new Uint8Array(binaryString.length);
      for (let b = 0; b < binaryString.length; b++) {
        bytes[b] = binaryString.charCodeAt(b);
      }
      if (docType === 'pdf') {
        blobData = new Blob([bytes], { type: 'application/pdf' });
      } else if (docType === 'docx') {
        blobData = new Blob([bytes], {
          type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        });
        const converted = await convertDocxBlobToHtml(blobData);
        contentText = converted.html;
        readTimeMinutes = converted.readTimeMinutes;
      } else {
        contentText = new TextDecoder().decode(bytes);
        readTimeMinutes = estimateReadMinutes(contentText);
      }
    } else {
      // Direct raw.githubusercontent.com download for public repos (fast, zero API rate limit impact)
      const rawUrl = `https://raw.githubusercontent.com/${encodeURIComponent(owner)}/${encodeURIComponent(
        repo
      )}/${encodeURIComponent(branch)}/${encodedPath}?v=${encodeURIComponent(item.sha)}`;
      const rawRes = await fetch(rawUrl, { cache: 'no-store' });
      if (!rawRes.ok) {
        throw new Error(`Failed to fetch ${item.path} (HTTP ${rawRes.status}).`);
      }
      if (docType === 'pdf') {
        blobData = await rawRes.blob();
        actualSize = blobData.size;
      } else if (docType === 'docx') {
        blobData = await rawRes.blob();
        actualSize = blobData.size;
        const converted = await convertDocxBlobToHtml(blobData);
        contentText = converted.html;
        readTimeMinutes = converted.readTimeMinutes;
      } else {
        contentText = await rawRes.text();
        actualSize = new Blob([contentText]).size;
        readTimeMinutes = estimateReadMinutes(contentText);
      }
    }

    const meta = deriveSubjectAndTitle(item.path, docsPath, i);
    downloadedDocs.push({
      key: `${config.id}:${item.path}`,
      repoId: config.id,
      path: item.path,
      subject: meta.subject,
      subjectSlug: meta.subjectSlug,
      title: meta.title,
      fileName: meta.fileName,
      type: docType,
      contentText,
      blobData,
      sha: item.sha,
      size: actualSize,
      readTimeMinutes,
      orderIndex: meta.orderIndex,
      updatedAt: Date.now(),
    });
  }

  options?.onProgress?.({ phase: 'saving', completed: totalToFetch, total: totalToFetch });

  await saveDocuments(downloadedDocs);
  await deleteRemovedDocuments(config.id, activeKeys);

  const finalDocs = await getDocumentsByRepo(config.id);
  const totalBytes = finalDocs.reduce((acc, d) => acc + (d.size || 0), 0);

  const updatedRepo: RepoConfig = {
    ...config,
    branch,
    lastCommitSha: latestCommitSha,
    lastSyncedAt: Date.now(),
    totalFiles: finalDocs.length,
    totalBytes,
  };

  await saveRepo(updatedRepo);

  const syncLog: SyncLogEntry = {
    id: `log-${Date.now()}`,
    repoId: config.id,
    timestamp: Date.now(),
    status: 'success',
    message:
      totalToFetch > 0
        ? `Synced ${totalToFetch} updated ${totalToFetch === 1 ? 'document' : 'documents'} from ${owner}/${repo}.`
        : `Verified ${finalDocs.length} documents against ${latestCommitSha.slice(0, 7)}.`,
    filesUpdated: totalToFetch,
    commitSha: latestCommitSha,
  };
  await addSyncLog(syncLog);

  return {
    repo: updatedRepo,
    filesUpdated: totalToFetch,
    totalFiles: finalDocs.length,
    upToDate: totalToFetch === 0,
    commitSha: latestCommitSha,
  };
}

export async function registerPeriodicBackgroundSync(intervalMinutes: number): Promise<boolean> {
  if (intervalMinutes <= 0 || !('serviceWorker' in navigator)) return false;
  try {
    const registration = (await navigator.serviceWorker.ready) as ServiceWorkerRegistration & {
      periodicSync?: {
        register: (tag: string, options: { minInterval: number }) => Promise<void>;
      };
    };
    if (registration.periodicSync) {
      await registration.periodicSync.register('scholar12-github-sync', {
        minInterval: intervalMinutes * 60 * 1000,
      });
      return true;
    }
  } catch {
    // Periodic Background Sync API may require installed PWA permissions on some browsers;
    // foreground interval + online/visibility catch-up handles all environments reliably.
  }
  return false;
}
