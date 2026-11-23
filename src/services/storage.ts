import { ModuleProgress, RepoConfig, StudyDocument, SyncLogEntry, UserPreferences } from '../types/study';
import { buildStarterDocuments, STARTER_REPO_CONFIG, STARTER_REPO_ID } from '../data/starterCurriculum';
import socDocxSeed from '../data/socDocx12Seed.json';

export const SOC_DOCX_12_REPO_ID = 'gh-nregmi51-soc-docx-12';

export const SOC_DOCX_12_REPO_CONFIG: RepoConfig = {
  id: SOC_DOCX_12_REPO_ID,
  label: 'Grade 12 Social Studies (Soc-Docx-12)',
  owner: 'Nregmi51',
  repo: 'Soc-Docx-12',
  branch: 'main',
  docsPath: '',
  syncIntervalMinutes: 60,
  totalFiles: 0,
  totalBytes: 0,
};

const DB_NAME = 'Scholar12DB';
const DB_VERSION = 1;
const PREFS_KEY = 'scholar12_prefs_v1';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('repos')) {
        db.createObjectStore('repos', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('files')) {
        const filesStore = db.createObjectStore('files', { keyPath: 'key' });
        filesStore.createIndex('repoId', 'repoId', { unique: false });
      }
      if (!db.objectStoreNames.contains('progress')) {
        const progressStore = db.createObjectStore('progress', { keyPath: 'key' });
        progressStore.createIndex('repoId', 'repoId', { unique: false });
      }
      if (!db.objectStoreNames.contains('syncLogs')) {
        const logsStore = db.createObjectStore('syncLogs', { keyPath: 'id' });
        logsStore.createIndex('repoId', 'repoId', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function withStore<T>(
  storeName: string,
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, mode);
    const store = tx.objectStore(storeName);
    const req = fn(store);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => db.close();
  });
}

export async function ensureStarterSeeded(): Promise<void> {
  const repos = await getAllRepos();
  if (repos.length === 0) {
    const starterDocs = buildStarterDocuments();
    const totalBytes = starterDocs.reduce((acc, d) => acc + d.size, 0);
    await saveRepo({
      ...STARTER_REPO_CONFIG,
      totalFiles: starterDocs.length,
      totalBytes,
    });
    await saveDocuments(starterDocs);
    await addSyncLog({
      id: `log-starter-${Date.now()}`,
      repoId: STARTER_REPO_ID,
      timestamp: Date.now(),
      status: 'success',
      message: 'Loaded Grade 12 Starter Curriculum for offline study.',
      filesUpdated: starterDocs.length,
    });
  }

  // Clean up old misspelled entry if present
  const staleDocs = repos.find((r) => r.id === 'gh-nregmi51-soc-docs-12');
  if (staleDocs) {
    await deleteRepoAndDocs('gh-nregmi51-soc-docs-12');
  }

  const existingSocDocs = await getDocumentsByRepo(SOC_DOCX_12_REPO_ID);
  const hasSocDocxRepo = repos.some((r) => r.id === SOC_DOCX_12_REPO_ID);

  if (!hasSocDocxRepo || existingSocDocs.length === 0) {
    const seedDocs: StudyDocument[] = socDocxSeed.docs.map((d) => ({
      key: `${SOC_DOCX_12_REPO_ID}:${d.path}`,
      repoId: SOC_DOCX_12_REPO_ID,
      path: d.path,
      subject: d.subject,
      subjectSlug: d.subjectSlug,
      title: d.title,
      fileName: d.fileName,
      type: 'docx',
      contentText: d.html,
      sha: d.sha,
      size: d.size,
      readTimeMinutes: d.readTimeMinutes,
      orderIndex: d.orderIndex,
      updatedAt: socDocxSeed.syncedAt,
    }));

    const totalBytes = seedDocs.reduce((acc, d) => acc + d.size, 0);
    await saveRepo({
      ...SOC_DOCX_12_REPO_CONFIG,
      lastCommitSha: socDocxSeed.commitSha,
      lastSyncedAt: socDocxSeed.syncedAt,
      totalFiles: seedDocs.length,
      totalBytes,
    });
    await saveDocuments(seedDocs);
    await addSyncLog({
      id: `log-socdocx-${Date.now()}`,
      repoId: SOC_DOCX_12_REPO_ID,
      timestamp: Date.now(),
      status: 'success',
      message: `Synced ${seedDocs.length} .docx modules from Nregmi51/Soc-Docx-12.`,
      filesUpdated: seedDocs.length,
      commitSha: socDocxSeed.commitSha,
    });
  }
}

export async function getAllRepos(): Promise<RepoConfig[]> {
  return withStore<RepoConfig[]>('repos', 'readonly', (store) => store.getAll());
}

export async function saveRepo(repo: RepoConfig): Promise<void> {
  await withStore('repos', 'readwrite', (store) => store.put(repo));
}

export async function deleteRepoAndDocs(repoId: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['repos', 'files', 'syncLogs'], 'readwrite');
    tx.objectStore('repos').delete(repoId);

    const filesStore = tx.objectStore('files');
    const filesIndex = filesStore.index('repoId');
    const filesReq = filesIndex.getAllKeys(IDBKeyRange.only(repoId));
    filesReq.onsuccess = () => {
      for (const k of filesReq.result) {
        filesStore.delete(k);
      }
    };

    const logsStore = tx.objectStore('syncLogs');
    const logsIndex = logsStore.index('repoId');
    const logsReq = logsIndex.getAllKeys(IDBKeyRange.only(repoId));
    logsReq.onsuccess = () => {
      for (const k of logsReq.result) {
        logsStore.delete(k);
      }
    };

    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

export async function getDocumentsByRepo(repoId: string): Promise<StudyDocument[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('files', 'readonly');
    const index = tx.objectStore('files').index('repoId');
    const req = index.getAll(IDBKeyRange.only(repoId));
    req.onsuccess = () => resolve(req.result as StudyDocument[]);
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => db.close();
  });
}

export async function saveDocuments(docs: StudyDocument[]): Promise<void> {
  if (docs.length === 0) return;
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('files', 'readwrite');
    const store = tx.objectStore('files');
    for (const doc of docs) {
      store.put(doc);
    }
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

export async function deleteRemovedDocuments(repoId: string, activeKeys: Set<string>): Promise<void> {
  const existing = await getDocumentsByRepo(repoId);
  const toDelete = existing.filter((d) => !activeKeys.has(d.key)).map((d) => d.key);
  if (toDelete.length === 0) return;

  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('files', 'readwrite');
    const store = tx.objectStore('files');
    for (const k of toDelete) {
      store.delete(k);
    }
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

export async function getProgressByRepo(repoId: string): Promise<Record<string, ModuleProgress>> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('progress', 'readonly');
    const index = tx.objectStore('progress').index('repoId');
    const req = index.getAll(IDBKeyRange.only(repoId));
    req.onsuccess = () => {
      const map: Record<string, ModuleProgress> = {};
      for (const item of req.result as ModuleProgress[]) {
        map[item.key] = item;
      }
      resolve(map);
    };
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => db.close();
  });
}

export async function saveModuleProgress(entry: ModuleProgress): Promise<void> {
  await withStore('progress', 'readwrite', (store) => store.put(entry));
}

export async function getSyncLogs(repoId: string): Promise<SyncLogEntry[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('syncLogs', 'readonly');
    const index = tx.objectStore('syncLogs').index('repoId');
    const req = index.getAll(IDBKeyRange.only(repoId));
    req.onsuccess = () => {
      const list = (req.result as SyncLogEntry[]).sort((a, b) => b.timestamp - a.timestamp);
      resolve(list.slice(0, 20));
    };
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => db.close();
  });
}

export async function addSyncLog(log: SyncLogEntry): Promise<void> {
  await withStore('syncLogs', 'readwrite', (store) => store.put(log));
}

export function loadPreferences(): UserPreferences {
  try {
    const raw = window.localStorage.getItem(PREFS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<UserPreferences>;
      const rawRepoId = parsed.activeRepoId;
      const migratedRepoId =
        !rawRepoId || rawRepoId === 'gh-nregmi51-soc-docs-12' || rawRepoId === STARTER_REPO_ID
          ? SOC_DOCX_12_REPO_ID
          : rawRepoId;
      return {
        activeRepoId: migratedRepoId,
        theme: parsed.theme === 'dark' ? 'dark' : 'light',
        fontFamily: parsed.fontFamily === 'serif' ? 'serif' : 'sans',
        fontSize: parsed.fontSize === 'sm' || parsed.fontSize === 'lg' ? parsed.fontSize : 'base',
        activeDocKey: parsed.activeDocKey,
      };
    }
  } catch {
    // Fallback to defaults
  }
  return {
    activeRepoId: SOC_DOCX_12_REPO_ID,
    theme: 'light',
    fontFamily: 'sans',
    fontSize: 'base',
  };
}

export function savePreferences(prefs: UserPreferences): void {
  try {
    window.localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {
    // Ignore storage quota errors
  }
}
