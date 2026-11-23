import DOMPurify from 'dompurify';
import katex from 'katex';
import { marked } from 'marked';
import { RepoConfig } from '../types/study';

export interface TocHeading {
  id: string;
  text: string;
  level: 1 | 2 | 3;
}

function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .replace(/<[^>]*>/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

function resolveRelativeGitHubPath(docPath: string, relativeSrc: string, repo?: RepoConfig): string {
  if (
    !repo ||
    repo.isStarterPack ||
    /^(https?:|data:|blob:|\/)/i.test(relativeSrc)
  ) {
    return relativeSrc;
  }

  const baseParts = docPath.split('/').slice(0, -1);
  const relParts = relativeSrc.split('/');

  for (const part of relParts) {
    if (part === '.' || part === '') continue;
    if (part === '..') {
      baseParts.pop();
    } else {
      baseParts.push(part);
    }
  }

  const resolved = baseParts.map((p) => encodeURIComponent(p)).join('/');
  return `https://raw.githubusercontent.com/${encodeURIComponent(repo.owner)}/${encodeURIComponent(
    repo.repo
  )}/${encodeURIComponent(repo.branch)}/${resolved}`;
}

export function renderStudyMarkdown(
  rawMarkdown: string,
  docPath: string,
  repo?: RepoConfig
): { html: string; headings: TocHeading[] } {
  const codePlaceholders: string[] = [];
  const mathPlaceholders: string[] = [];

  // 1. Protect fenced code blocks and inline code so LaTeX regex never touches code
  let processed = rawMarkdown.replace(/```[\s\S]*?```|`[^`\n]+`/g, (match) => {
    const idx = codePlaceholders.length;
    codePlaceholders.push(match);
    return `@@CODE_BLOCK_${idx}@@`;
  });

  // 2. Render display math $$...$$
  processed = processed.replace(/\$\$([\s\S]+?)\$\$/g, (_match, expr: string) => {
    const idx = mathPlaceholders.length;
    try {
      mathPlaceholders.push(
        katex.renderToString(expr.trim(), {
          displayMode: true,
          throwOnError: false,
        })
      );
    } catch {
      mathPlaceholders.push(`<pre>${expr}</pre>`);
    }
    return `@@MATH_BLOCK_${idx}@@`;
  });

  // 3. Render inline math $...$
  processed = processed.replace(/\$([^\n$]+?)\$/g, (_match, expr: string) => {
    const idx = mathPlaceholders.length;
    try {
      mathPlaceholders.push(
        katex.renderToString(expr.trim(), {
          displayMode: false,
          throwOnError: false,
        })
      );
    } catch {
      mathPlaceholders.push(`<code>${expr}</code>`);
    }
    return `@@MATH_BLOCK_${idx}@@`;
  });

  // 4. Restore code blocks before running marked
  processed = processed.replace(/@@CODE_BLOCK_(\d+)@@/g, (_m, i) => codePlaceholders[Number(i)]);

  // 5. Rewrite relative Markdown image paths to GitHub raw URLs
  processed = processed.replace(
    /!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g,
    (_m, alt: string, src: string, title?: string) => {
      const resolvedSrc = resolveRelativeGitHubPath(docPath, src, repo);
      return `![${alt}](${resolvedSrc}${title ? ` "${title}"` : ''})`;
    }
  );

  // 6. Parse markdown via marked
  const rawHtml = marked.parse(processed, {
    gfm: true,
    breaks: false,
  }) as string;

  // 7. Restore KaTeX HTML placeholders
  const htmlWithMath = rawHtml.replace(
    /@@MATH_BLOCK_(\d+)@@/g,
    (_m, i) => mathPlaceholders[Number(i)]
  );

  // 8. Sanitize safely while allowing KaTeX math tags & attributes
  const sanitized = DOMPurify.sanitize(htmlWithMath, {
    ADD_TAGS: [
      'math',
      'semantics',
      'mrow',
      'mi',
      'mo',
      'mn',
      'msup',
      'msub',
      'mfrac',
      'msqrt',
      'mroot',
      'mtable',
      'mtr',
      'mtd',
      'mtext',
      'mspace',
      'annotation',
    ],
    ADD_ATTR: ['xmlns', 'aria-hidden', 'style', 'encoding', 'referrerpolicy'],
  });

  // 9. Inject heading IDs and extract Table of Contents via DOMParser
  const headings: TocHeading[] = [];
  const doc = new DOMParser().parseFromString(sanitized, 'text/html');
  const seenIds = new Map<string, number>();

  doc.querySelectorAll('h1, h2, h3').forEach((el) => {
    const text = el.textContent?.trim() || '';
    if (!text) return;
    let baseId = slugifyHeading(text) || 'section';
    const count = seenIds.get(baseId) || 0;
    seenIds.set(baseId, count + 1);
    if (count > 0) baseId = `${baseId}-${count}`;
    el.setAttribute('id', baseId);

    const level = el.tagName === 'H1' ? 1 : el.tagName === 'H2' ? 2 : 3;
    headings.push({ id: baseId, text, level });
  });

  doc.querySelectorAll('img').forEach((img) => {
    img.setAttribute('referrerpolicy', 'no-referrer');
    img.setAttribute('loading', 'lazy');
  });

  doc.querySelectorAll('a').forEach((a) => {
    const href = a.getAttribute('href') || '';
    if (href.startsWith('http')) {
      a.setAttribute('target', '_blank');
      a.setAttribute('rel', 'noopener noreferrer');
    }
  });

  return {
    html: doc.body.innerHTML,
    headings,
  };
}
