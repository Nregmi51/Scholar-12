import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Circle,
  Download,
  Eye,
  EyeOff,
  List,
  Moon,
  NotebookPen,
  Sun,
  Type,
  WifiOff,
} from 'lucide-react';
import { SyncProgressInfo } from '../services/githubSync';
import { ModuleProgress, RepoConfig, StudyDocument } from '../types/study';
import { prepareDocxHtmlWithOutline } from '../utils/docx';
import { renderStudyMarkdown } from '../utils/markdown';
import { formatBytes, formatRelativeTime, getUnitAccentTheme } from '../utils/subjects';

interface DocumentReaderProps {
  doc: StudyDocument | null;
  repo?: RepoConfig;
  progress?: ModuleProgress;
  prevDoc: StudyDocument | null;
  nextDoc: StudyDocument | null;
  theme: 'light' | 'dark';
  fontFamily: 'sans' | 'serif';
  fontSize: 'sm' | 'base' | 'lg';
  isOnline: boolean;
  isSyncing?: boolean;
  syncProgress?: SyncProgressInfo | null;
  onToggleTheme: () => void;
  onToggleFontFamily: () => void;
  onCycleFontSize: () => void;
  onToggleComplete: (doc: StudyDocument) => void;
  onToggleBookmark: (doc: StudyDocument) => void;
  onSaveNotes: (doc: StudyDocument, notes: string) => void;
  onSelectDoc: (doc: StudyDocument) => void;
}

export const DocumentReader: React.FC<DocumentReaderProps> = ({
  doc,
  repo,
  progress,
  prevDoc,
  nextDoc,
  theme,
  fontFamily,
  fontSize,
  isOnline,
  isSyncing = false,
  syncProgress = null,
  onToggleTheme,
  onToggleFontFamily,
  onCycleFontSize,
  onToggleComplete,
  onToggleBookmark,
  onSaveNotes,
  onSelectDoc,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [scrollPct, setScrollPct] = useState(0);
  const [showTocMobile, setShowTocMobile] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [draftNotes, setDraftNotes] = useState('');
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [docxUrl, setDocxUrl] = useState<string | null>(null);
  const [quizMode, setQuizMode] = useState(false);
  const proseRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDraftNotes(progress?.notes || '');
  }, [doc?.key, progress?.notes]);

  useEffect(() => {
    setScrollPct(0);
    setShowTocMobile(false);
    setQuizMode(false);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [doc?.key]);

  useEffect(() => {
    if (doc?.type === 'pdf' && doc.blobData) {
      const url = URL.createObjectURL(doc.blobData);
      setPdfUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setPdfUrl(null);
  }, [doc]);

  useEffect(() => {
    if (doc?.type === 'docx' && doc.blobData) {
      const url = URL.createObjectURL(doc.blobData);
      setDocxUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setDocxUrl(null);
  }, [doc]);

  const rendered = useMemo(() => {
    if (!doc) return { html: '', headings: [], hasQuizAnswers: false };
    if (doc.type === 'markdown' && doc.contentText) {
      return { ...renderStudyMarkdown(doc.contentText, doc.path, repo), hasQuizAnswers: false };
    }
    if (doc.type === 'docx' && doc.contentText) {
      return prepareDocxHtmlWithOutline(doc.contentText);
    }
    return { html: '', headings: [], hasQuizAnswers: false };
  }, [doc, repo]);

  const unitTheme = useMemo(
    () => (doc ? getUnitAccentTheme(`${doc.subject} ${doc.title}`) : 'sky'),
    [doc]
  );

  const handleProseClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!quizMode) return;
    const target = (e.target as HTMLElement).closest('.docx-answer-cell');
    if (target) {
      target.classList.toggle('quiz-revealed');
    }
  };

  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const max = el.scrollHeight - el.clientHeight;
    if (max <= 0) {
      setScrollPct(100);
      return;
    }
    setScrollPct(Math.min(100, Math.round((el.scrollTop / max) * 100)));
  };

  const scrollToHeading = (id: string) => {
    const target = document.getElementById(id);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setShowTocMobile(false);
    }
  };

  if (!doc) {
    if (isSyncing) {
      const pct =
        syncProgress && syncProgress.total > 0
          ? Math.round((syncProgress.completed / syncProgress.total) * 100)
          : 15;
      return (
        <div className="flex-1 flex items-center justify-center p-8 text-center">
          <div className="w-full max-w-md space-y-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              Syncing {repo?.label || 'GitHub Repository'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
              {syncProgress?.currentFile
                ? `Downloading ${syncProgress.currentFile}...`
                : 'Connecting to GitHub and caching offline files...'}
            </p>
            <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-sky-600 dark:bg-sky-400 transition-all duration-200"
                style={{ width: `${pct}%` }}
              />
            </div>
            {syncProgress && syncProgress.total > 0 && (
              <div className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                {syncProgress.completed} of {syncProgress.total} files
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="flex-1 flex items-center justify-center p-8 text-center">
        <div className="max-w-md space-y-3">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
            Select a module to begin studying
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Pick a chapter from the sidebar or tap the subject switcher button to explore another Grade 12 subject.
          </p>
        </div>
      </div>
    );
  }

  const isCompleted = !!progress?.completed;
  const isBookmarked = !!progress?.bookmarked;

  const fontSizeClass =
    fontSize === 'sm' ? 'text-[15px]' : fontSize === 'lg' ? 'text-[18px]' : 'text-[16px]';

  const fontFamilyClass = fontFamily === 'serif' ? 'font-study-serif' : 'font-study-sans';

  return (
    <div className="flex-1 flex flex-col min-w-0 h-full bg-white dark:bg-slate-950 relative">
      {/* Subtle top reading progress line */}
      <div className="h-0.5 w-full bg-slate-100 dark:bg-slate-900 shrink-0">
        <div
          className="h-full bg-sky-600 dark:bg-sky-400 transition-[width] duration-150"
          style={{ width: `${scrollPct}%` }}
        />
      </div>

      {/* Reader Utility Toolbar */}
      <div className="flex items-center justify-between gap-3 px-4 sm:px-8 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 shrink-0">
        {/* Unboxed breadcrumb / metadata */}
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 min-w-0 truncate">
          <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
            {doc.subject}
          </span>
          <span aria-hidden="true">/</span>
          <span className="tabular-nums whitespace-nowrap">{doc.readTimeMinutes} min read</span>
          <span aria-hidden="true">·</span>
          <span className="tabular-nums whitespace-nowrap hidden sm:inline">
            {formatBytes(doc.size)} offline
          </span>
          {!isOnline && (
            <>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-400 font-medium whitespace-nowrap">
                <WifiOff className="w-3 h-3" />
                Offline
              </span>
            </>
          )}
        </div>

        {/* Functional reader controls */}
        <div className="flex items-center gap-1 shrink-0">
          {rendered.hasQuizAnswers && (
            <button
              type="button"
              onClick={() => {
                setQuizMode((v) => !v);
                proseRef.current
                  ?.querySelectorAll('.quiz-revealed')
                  .forEach((el) => el.classList.remove('quiz-revealed'));
              }}
              aria-pressed={quizMode}
              title="Mask Q&A answers to test yourself"
              className={`min-h-[40px] px-2.5 flex items-center gap-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                quizMode
                  ? 'bg-violet-100 text-violet-800 dark:bg-violet-950/60 dark:text-violet-300'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {quizMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              <span className="hidden sm:inline">{quizMode ? 'Quiz On' : 'Quiz Mode'}</span>
            </button>
          )}

          {rendered.headings.length > 1 && (
            <button
              type="button"
              onClick={() => setShowTocMobile((v) => !v)}
              aria-label="Toggle module outline"
              className="xl:hidden min-h-[40px] px-2.5 flex items-center gap-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <List className="w-4 h-4" />
              <span className="hidden sm:inline">Outline</span>
            </button>
          )}

          <button
            type="button"
            onClick={onToggleFontFamily}
            title="Switch Sans / Serif font"
            aria-label="Switch reading font family"
            className="min-h-[40px] px-2.5 flex items-center gap-1 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <Type className="w-4 h-4" />
            <span className="hidden sm:inline">{fontFamily === 'serif' ? 'Serif' : 'Sans'}</span>
          </button>

          <button
            type="button"
            onClick={onCycleFontSize}
            title="Adjust font size"
            aria-label="Adjust font size"
            className="min-h-[40px] min-w-[40px] px-2 flex items-center justify-center rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            {fontSize === 'sm' ? 'A-' : fontSize === 'lg' ? 'A+' : 'A'}
          </button>

          <button
            type="button"
            onClick={onToggleTheme}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={() => onToggleBookmark(doc)}
            aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark module'}
            className={`min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg transition-colors cursor-pointer ${
              isBookmarked
                ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/40'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => onToggleComplete(doc)}
            className={`min-h-[40px] px-3 ml-1 inline-flex items-center gap-1.5 rounded-xl text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
              isCompleted
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800'
                : 'bg-sky-600 hover:bg-sky-700 text-white'
            }`}
          >
            {isCompleted ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>Completed</span>
              </>
            ) : (
              <>
                <Circle className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">Mark Done</span>
                <span className="sm:hidden">Done</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Mobile collapsible outline */}
      {showTocMobile && rendered.headings.length > 1 && (
        <div className="xl:hidden border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-4 py-3 max-h-60 overflow-y-auto">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
            In this module
          </div>
          <ul className="space-y-1">
            {rendered.headings.map((h) => (
              <li key={h.id}>
                <button
                  type="button"
                  onClick={() => scrollToHeading(h.id)}
                  className={`w-full text-left py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 truncate cursor-pointer ${
                    h.level === 3 ? 'pl-4' : ''
                  }`}
                >
                  {h.text}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Main Reader Scroll Area + Desktop Outline */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-4 sm:px-8 lg:px-12 py-6 sm:py-8"
        >
          <article className="max-w-[72ch] mx-auto">
            {/* Unboxed file source metadata */}
            <div className="mb-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
              <span>{doc.fileName}</span>
              <span aria-hidden="true">·</span>
              <span>Synced {formatRelativeTime(doc.updatedAt)}</span>
              {isCompleted && progress?.completedAt && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                    Completed {formatRelativeTime(progress.completedAt)}
                  </span>
                </>
              )}
            </div>

            {doc.type === 'markdown' && (
              <div
                data-unit-theme={unitTheme}
                className={`study-prose ${fontFamilyClass} ${fontSizeClass}`}
                dangerouslySetInnerHTML={{ __html: rendered.html }}
              />
            )}

            {doc.type === 'docx' && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    {doc.subject} · {doc.title}
                  </div>
                  {(docxUrl || (repo && !repo.isStarterPack)) && (
                    <a
                      href={
                        docxUrl ||
                        `https://raw.githubusercontent.com/${encodeURIComponent(repo!.owner)}/${encodeURIComponent(
                          repo!.repo
                        )}/${encodeURIComponent(repo!.branch)}/${doc.path
                          .split('/')
                          .map((s) => encodeURIComponent(s))
                          .join('/')}`
                      }
                      download={doc.fileName}
                      target={docxUrl ? undefined : '_blank'}
                      rel={docxUrl ? undefined : 'noopener noreferrer'}
                      className="inline-flex items-center gap-1.5 min-h-[36px] px-3 py-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-100 transition-colors shrink-0"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download .docx</span>
                    </a>
                  )}
                </div>

                {/* Quick Lesson / Section Jump Strip */}
                {rendered.headings.length > 2 && (
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                    {rendered.headings
                      .filter((h) => h.level === 1 || rendered.headings.length <= 8)
                      .slice(0, 8)
                      .map((h) => (
                        <button
                          key={h.id}
                          type="button"
                          onClick={() => scrollToHeading(h.id)}
                          className="min-h-[34px] px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 hover:border-sky-400 dark:hover:border-sky-600 text-xs font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap max-w-[220px] truncate transition-colors cursor-pointer shrink-0"
                        >
                          {h.text}
                        </button>
                      ))}
                  </div>
                )}

                <div
                  ref={proseRef}
                  data-unit-theme={unitTheme}
                  onClick={handleProseClick}
                  className={`study-prose ${fontFamilyClass} ${fontSizeClass} ${
                    quizMode ? 'quiz-mode-active' : ''
                  }`}
                  dangerouslySetInnerHTML={{ __html: rendered.html }}
                />
              </div>
            )}

            {doc.type === 'text' && (
              <div className="space-y-4">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{doc.title}</h1>
                <pre className="whitespace-pre-wrap font-study-mono text-sm leading-relaxed p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200">
                  {doc.contentText}
                </pre>
              </div>
            )}

            {doc.type === 'html' && (
              <div className="space-y-4">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{doc.title}</h1>
                <iframe
                  title={doc.title}
                  sandbox="allow-same-origin"
                  srcDoc={doc.contentText || ''}
                  className="w-full min-h-[65vh] rounded-2xl border border-slate-200 dark:border-slate-800 bg-white"
                />
              </div>
            )}

            {doc.type === 'pdf' && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{doc.title}</h1>
                  {pdfUrl && (
                    <a
                      href={pdfUrl}
                      download={doc.fileName}
                      className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2 rounded-xl bg-slate-900 dark:bg-sky-600 text-white text-sm font-medium hover:bg-slate-800 dark:hover:bg-sky-500 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download PDF</span>
                    </a>
                  )}
                </div>
                {pdfUrl ? (
                  <iframe
                    title={doc.title}
                    src={pdfUrl}
                    className="w-full h-[72vh] rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900"
                  />
                ) : (
                  <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-sm text-slate-600 dark:text-slate-400">
                    Loading cached PDF document...
                  </div>
                )}
              </div>
            )}

            {/* Personal Study Notes */}
            <section className="mt-10 pt-6 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setNotesOpen((v) => !v)}
                className="w-full min-h-[44px] flex items-center justify-between gap-3 py-2 text-left cursor-pointer"
              >
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                  <NotebookPen className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                  <span>Personal Study Notes</span>
                  {draftNotes.trim() && (
                    <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
                      · Saved locally
                    </span>
                  )}
                </span>
                {notesOpen ? (
                  <ChevronUp className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </button>

              {notesOpen && (
                <div className="mt-3 space-y-2">
                  <textarea
                    value={draftNotes}
                    onChange={(e) => {
                      const val = e.target.value;
                      setDraftNotes(val);
                      onSaveNotes(doc, val);
                    }}
                    rows={4}
                    placeholder="Jot down formulas, exam reminders, or questions for this module (saved offline)..."
                    className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              )}
            </section>

            {/* Module Completion CTA & Prev/Next Footer */}
            <footer className="mt-8 pt-6 pb-20 lg:pb-8 border-t border-slate-200 dark:border-slate-800 space-y-4">
              <button
                type="button"
                onClick={() => onToggleComplete(doc)}
                className={`w-full min-h-[48px] px-5 py-3 rounded-2xl flex items-center justify-center gap-2.5 text-sm font-semibold transition-colors cursor-pointer ${
                  isCompleted
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800'
                    : 'bg-slate-900 dark:bg-sky-600 text-white hover:bg-slate-800 dark:hover:bg-sky-500'
                }`}
              >
                {isCompleted ? (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Module Completed — Tap to Undo</span>
                  </>
                ) : (
                  <>
                    <Circle className="w-5 h-5" />
                    <span>Mark Module as Completed</span>
                  </>
                )}
              </button>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {prevDoc ? (
                  <button
                    type="button"
                    onClick={() => onSelectDoc(prevDoc)}
                    className="min-h-[56px] p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900 text-left transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Previous module</span>
                    </div>
                    <div className="mt-1 text-sm font-medium text-slate-900 dark:text-white truncate">
                      {prevDoc.title}
                    </div>
                  </button>
                ) : (
                  <div />
                )}

                {nextDoc && (
                  <button
                    type="button"
                    onClick={() => onSelectDoc(nextDoc)}
                    className="min-h-[56px] p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-sky-400 dark:hover:border-sky-600 bg-white dark:bg-slate-900 text-right transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-end gap-1.5 text-xs text-sky-700 dark:text-sky-400 font-medium">
                      <span>Next module</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                    <div className="mt-1 text-sm font-medium text-slate-900 dark:text-white truncate">
                      {nextDoc.title}
                    </div>
                  </button>
                )}
              </div>
            </footer>
          </article>
        </div>

        {/* Desktop Table of Contents rail */}
        {rendered.headings.length > 1 && (
          <aside className="hidden xl:block w-64 shrink-0 border-l border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950 overflow-y-auto p-5">
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-3">
              Module Outline
            </div>
            <nav aria-label="Module outline" className="space-y-1">
              {rendered.headings.map((h) => (
                <button
                  key={h.id}
                  type="button"
                  onClick={() => scrollToHeading(h.id)}
                  className={`w-full text-left py-1.5 px-2 rounded-lg text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors truncate cursor-pointer ${
                    h.level === 3 ? 'pl-5' : ''
                  }`}
                >
                  {h.text}
                </button>
              ))}
            </nav>
          </aside>
        )}
      </div>
    </div>
  );
};
