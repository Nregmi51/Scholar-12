import {
  Atom,
  BookOpenText,
  Dna,
  FlaskConical,
  FolderOpen,
  Globe2,
  Landmark,
  Sigma,
  Terminal,
  TrendingUp,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { ModuleProgress, StudyDocument, SubjectSummary } from '../types/study';

export function buildSubjectSummaries(
  docs: StudyDocument[],
  progressMap: Record<string, ModuleProgress>
): SubjectSummary[] {
  const bySlug = new Map<string, StudyDocument[]>();

  for (const doc of docs) {
    const existing = bySlug.get(doc.subjectSlug) || [];
    existing.push(doc);
    bySlug.set(doc.subjectSlug, existing);
  }

  const summaries: SubjectSummary[] = [];

  for (const [slug, group] of bySlug.entries()) {
    const sortedModules = [...group].sort((a, b) => {
      if (a.orderIndex !== b.orderIndex) return a.orderIndex - b.orderIndex;
      return a.path.localeCompare(b.path);
    });

    let completedCount = 0;
    let cachedBytes = 0;
    let totalReadMinutes = 0;
    let remainingMinutes = 0;
    let nextModule: StudyDocument | null = null;

    for (const mod of sortedModules) {
      const prog = progressMap[mod.key];
      const isDone = !!prog?.completed;
      if (isDone) {
        completedCount += 1;
      } else {
        remainingMinutes += mod.readTimeMinutes;
        if (!nextModule) {
          nextModule = mod;
        }
      }
      totalReadMinutes += mod.readTimeMinutes;
      cachedBytes += mod.size || 0;
    }

    const totalCount = sortedModules.length;
    const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    summaries.push({
      name: sortedModules[0].subject,
      slug,
      modules: sortedModules,
      completedCount,
      totalCount,
      percentage,
      cachedBytes,
      totalReadMinutes,
      remainingMinutes,
      nextModule: nextModule || sortedModules[0] || null,
    });
  }

  return summaries.sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
  );
}

export const ALL_SUBJECTS_SLUG = '__all__';

export function buildAllSubjectsSummary(
  docs: StudyDocument[],
  progressMap: Record<string, ModuleProgress>,
  label = 'All Units & Subjects'
): SubjectSummary {
  const sortedModules = [...docs].sort((a, b) => {
    if (a.orderIndex !== b.orderIndex) return a.orderIndex - b.orderIndex;
    return a.path.localeCompare(b.path, undefined, { numeric: true, sensitivity: 'base' });
  });

  let completedCount = 0;
  let cachedBytes = 0;
  let totalReadMinutes = 0;
  let remainingMinutes = 0;
  let nextModule: StudyDocument | null = null;

  for (const mod of sortedModules) {
    const isDone = !!progressMap[mod.key]?.completed;
    if (isDone) {
      completedCount += 1;
    } else {
      remainingMinutes += mod.readTimeMinutes;
      if (!nextModule) nextModule = mod;
    }
    totalReadMinutes += mod.readTimeMinutes;
    cachedBytes += mod.size || 0;
  }

  const totalCount = sortedModules.length;
  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return {
    name: label,
    slug: ALL_SUBJECTS_SLUG,
    modules: sortedModules,
    completedCount,
    totalCount,
    percentage,
    cachedBytes,
    totalReadMinutes,
    remainingMinutes,
    nextModule: nextModule || sortedModules[0] || null,
  };
}

export type UnitAccentTheme =
  | 'sky'
  | 'indigo'
  | 'emerald'
  | 'amber'
  | 'rose'
  | 'cyan'
  | 'violet'
  | 'blue';

export function getUnitAccentTheme(name: string): UnitAccentTheme {
  const lower = name.toLowerCase();
  const unitMatch = lower.match(/unit[-_\s]*(\d+)/i);
  if (unitMatch) {
    const num = parseInt(unitMatch[1], 10);
    const palette: UnitAccentTheme[] = [
      'sky',     // Unit 1
      'indigo',  // Unit 2
      'emerald', // Unit 3 / 6
      'amber',   // Unit 4 / 7
      'rose',    // Unit 5 / 8
      'emerald', // Unit 6
      'amber',   // Unit 7
      'rose',    // Unit 8
      'cyan',    // Unit 9
      'violet',  // Unit 10
      'blue',    // Unit 11
    ];
    if (num >= 1 && num <= palette.length) {
      return palette[num - 1];
    }
    return palette[num % palette.length];
  }
  if (lower.includes('phys')) return 'sky';
  if (lower.includes('calc') || lower.includes('math')) return 'indigo';
  if (lower.includes('chem')) return 'amber';
  if (lower.includes('bio')) return 'emerald';
  if (lower.includes('eng') || lower.includes('lit')) return 'rose';
  if (lower.includes('comp')) return 'cyan';
  if (lower.includes('econ')) return 'violet';
  return 'sky';
}

const THEME_CLASSES: Record<
  UnitAccentTheme,
  {
    tintClass: string;
    accentBarClass: string;
    gradientClass: string;
    softCardClass: string;
  }
> = {
  sky: {
    tintClass: 'bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300',
    accentBarClass: 'bg-sky-600 dark:bg-sky-400',
    gradientClass: 'from-sky-600 to-cyan-500',
    softCardClass: 'border-sky-200/80 dark:border-sky-900/70 hover:border-sky-400 dark:hover:border-sky-600',
  },
  indigo: {
    tintClass: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300',
    accentBarClass: 'bg-indigo-600 dark:bg-indigo-400',
    gradientClass: 'from-indigo-600 to-violet-500',
    softCardClass: 'border-indigo-200/80 dark:border-indigo-900/70 hover:border-indigo-400 dark:hover:border-indigo-600',
  },
  emerald: {
    tintClass: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300',
    accentBarClass: 'bg-emerald-600 dark:bg-emerald-400',
    gradientClass: 'from-emerald-600 to-teal-500',
    softCardClass: 'border-emerald-200/80 dark:border-emerald-900/70 hover:border-emerald-400 dark:hover:border-emerald-600',
  },
  amber: {
    tintClass: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300',
    accentBarClass: 'bg-amber-600 dark:bg-amber-400',
    gradientClass: 'from-amber-600 to-orange-500',
    softCardClass: 'border-amber-200/80 dark:border-amber-900/70 hover:border-amber-400 dark:hover:border-amber-600',
  },
  rose: {
    tintClass: 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300',
    accentBarClass: 'bg-rose-600 dark:bg-rose-400',
    gradientClass: 'from-rose-600 to-pink-500',
    softCardClass: 'border-rose-200/80 dark:border-rose-900/70 hover:border-rose-400 dark:hover:border-rose-600',
  },
  cyan: {
    tintClass: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/50 dark:text-cyan-300',
    accentBarClass: 'bg-cyan-600 dark:bg-cyan-400',
    gradientClass: 'from-cyan-600 to-sky-500',
    softCardClass: 'border-cyan-200/80 dark:border-cyan-900/70 hover:border-cyan-400 dark:hover:border-cyan-600',
  },
  violet: {
    tintClass: 'bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300',
    accentBarClass: 'bg-violet-600 dark:bg-violet-400',
    gradientClass: 'from-violet-600 to-purple-500',
    softCardClass: 'border-violet-200/80 dark:border-violet-900/70 hover:border-violet-400 dark:hover:border-violet-600',
  },
  blue: {
    tintClass: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
    accentBarClass: 'bg-blue-600 dark:bg-blue-400',
    gradientClass: 'from-blue-600 to-indigo-500',
    softCardClass: 'border-blue-200/80 dark:border-blue-900/70 hover:border-blue-400 dark:hover:border-blue-600',
  },
};

export function getSubjectMeta(subjectName: string): {
  Icon: LucideIcon;
  tintClass: string;
  accentBarClass: string;
  gradientClass: string;
  softCardClass: string;
  theme: UnitAccentTheme;
} {
  const lower = subjectName.toLowerCase();
  const theme = getUnitAccentTheme(subjectName);
  const colors = THEME_CLASSES[theme];

  let Icon: LucideIcon = FolderOpen;
  if (lower.includes('phys')) Icon = Atom;
  else if (lower.includes('calc') || lower.includes('math') || lower.includes('vector') || lower.includes('alg')) Icon = Sigma;
  else if (lower.includes('chem')) Icon = FlaskConical;
  else if (lower.includes('bio') || lower.includes('life') || lower.includes('anat')) Icon = Dna;
  else if (lower.includes('eng') || lower.includes('lit') || lower.includes('writ')) Icon = BookOpenText;
  else if (lower.includes('comp') || lower.includes('cs') || lower.includes('code') || lower.includes('prog')) Icon = Terminal;
  else if (lower.includes('hist') || lower.includes('gov') || lower.includes('pol') || lower.includes('soc')) Icon = Landmark;
  else if (lower.includes('econ') || lower.includes('bus') || lower.includes('fin')) Icon = TrendingUp;
  else if (lower.includes('geo') || lower.includes('earth')) Icon = Globe2;
  else if (lower.includes('unit') || lower.includes('chapter')) {
    const unitMatch = lower.match(/unit[-_\s]*(\d+)/i);
    const num = unitMatch ? parseInt(unitMatch[1], 10) : 1;
    const unitIcons: LucideIcon[] = [BookOpenText, Terminal, Landmark, Globe2, Landmark, Landmark, Globe2, Landmark, Globe2, TrendingUp, BookOpenText];
    Icon = unitIcons[(num - 1) % unitIcons.length] || BookOpenText;
  }

  return {
    Icon,
    tintClass: colors.tintClass,
    accentBarClass: colors.accentBarClass,
    gradientClass: colors.gradientClass,
    softCardClass: colors.softCardClass,
    theme,
  };
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function formatRelativeTime(timestamp?: number): string {
  if (!timestamp) return 'Not synced yet';
  const diffSec = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDays = Math.floor(diffHr / 24);
  return `${diffDays}d ago`;
}
