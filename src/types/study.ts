export type DocFileType = 'markdown' | 'text' | 'pdf' | 'html' | 'docx';

export type SyncIntervalMinutes = 0 | 15 | 30 | 60 | 360 | 1440;

export interface RepoConfig {
  id: string;
  label: string;
  owner: string;
  repo: string;
  branch: string;
  docsPath: string;
  token?: string;
  isStarterPack?: boolean;
  lastCommitSha?: string;
  lastSyncedAt?: number;
  syncIntervalMinutes: SyncIntervalMinutes;
  totalFiles: number;
  totalBytes: number;
}

export interface StudyDocument {
  key: string; // `${repoId}:${path}`
  repoId: string;
  path: string;
  subject: string;
  subjectSlug: string;
  title: string;
  fileName: string;
  type: DocFileType;
  contentText?: string;
  blobData?: Blob;
  sha: string;
  size: number;
  readTimeMinutes: number;
  orderIndex: number;
  updatedAt: number;
}

export interface ModuleProgress {
  key: string; // `${repoId}:${path}`
  repoId: string;
  path: string;
  completed: boolean;
  completedAt?: number;
  bookmarked: boolean;
  lastOpenedAt?: number;
  notes: string;
}

export interface SyncLogEntry {
  id: string;
  repoId: string;
  timestamp: number;
  status: 'success' | 'up-to-date' | 'error';
  message: string;
  filesUpdated: number;
  commitSha?: string;
}

export interface SubjectSummary {
  name: string;
  slug: string;
  modules: StudyDocument[];
  completedCount: number;
  totalCount: number;
  percentage: number;
  cachedBytes: number;
  totalReadMinutes: number;
  remainingMinutes: number;
  nextModule: StudyDocument | null;
}

export interface UserPreferences {
  activeRepoId: string;
  theme: 'light' | 'dark';
  fontFamily: 'sans' | 'serif';
  fontSize: 'sm' | 'base' | 'lg';
  activeDocKey?: string;
}
