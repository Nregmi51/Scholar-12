import DOMPurify from 'dompurify';
import mammoth from 'mammoth/mammoth.browser';
import { TocHeading } from './markdown';

function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .replace(/<[^>]*>/g, '')
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 64);
}

export async function convertDocxBlobToHtml(blob: Blob): Promise<{
  html: string;
  readTimeMinutes: number;
}> {
  const arrayBuffer = await blob.arrayBuffer();
  const result = await mammoth.convertToHtml({ arrayBuffer });
  const sanitized = DOMPurify.sanitize(result.value, {
    ADD_ATTR: ['colspan', 'rowspan', 'alt'],
  });

  const plainText = sanitized.replace(/<[^>]+>/g, ' ').trim();
  const words = plainText.split(/\s+/).filter(Boolean).length;
  const readTimeMinutes = Math.max(1, Math.ceil(words / 180));

  return {
    html: sanitized,
    readTimeMinutes,
  };
}

export function prepareDocxHtmlWithOutline(rawHtml: string): {
  html: string;
  headings: TocHeading[];
  hasQuizAnswers: boolean;
} {
  const headings: TocHeading[] = [];
  const doc = new DOMParser().parseFromString(rawHtml, 'text/html');
  const seenIds = new Map<string, number>();
  let hasQuizAnswers = false;

  const registerHeading = (el: Element, text: string, level: 1 | 2 | 3) => {
    const clean = text.trim();
    if (!clean) return;
    let baseId = slugifyHeading(clean) || 'section';
    const count = seenIds.get(baseId) || 0;
    seenIds.set(baseId, count + 1);
    if (count > 0) baseId = `${baseId}-${count}`;
    el.setAttribute('id', baseId);
    headings.push({ id: baseId, text: clean, level });
  };

  // 1. Transform tables: hero banners, callout boxes, lesson dividers, and Q&A / comparison tables
  const tables = Array.from(doc.querySelectorAll('table'));
  tables.forEach((table, tableIdx) => {
    const rows = Array.from(table.querySelectorAll(':scope > tbody > tr, :scope > tr'));
    const isSingleCell =
      rows.length === 1 &&
      rows[0].querySelectorAll(':scope > td, :scope > th').length === 1;

    if (isSingleCell) {
      const cell = rows[0].querySelector(':scope > td, :scope > th');
      if (!cell) return;
      const text = cell.textContent?.trim() || '';
      const box = doc.createElement('div');
      box.innerHTML = cell.innerHTML;

      if (
        tableIdx === 0 &&
        (/unit\s*\d+|एकाइ\s*[०-९\d]+|कक्षा\s*१२/i.test(text) || text.length < 220)
      ) {
        box.className = 'docx-hero-banner';
      } else if (/^(⚠|नोट|सावधान|note:|tip:|exam tip)/i.test(text)) {
        box.className = 'docx-callout docx-callout-amber';
      } else if (/^(निष्कर्ष|सार|summary|conclusion|मुख्य निष्कर्ष)/i.test(text)) {
        box.className = 'docx-callout docx-callout-emerald';
      } else if (
        /^(पाठ\s*[०-९\d]+|lesson\s*\d+|भाग\s*[०-९\d]+|part\s*\d+|अध्याय)/i.test(text) &&
        text.length < 180
      ) {
        box.className = 'docx-lesson-banner';
        registerHeading(box, text, 1);
      } else if (/^(प्रश्न|अभ्यास|question|exam|मॉडल|नमुना)/i.test(text) && text.length < 160) {
        box.className = 'docx-callout docx-callout-violet';
        registerHeading(box, text, 2);
      } else {
        box.className = 'docx-callout docx-callout-sky';
      }

      table.replaceWith(box);
      return;
    }

    // Multi-cell table: detect Q&A "Answer / उत्तर" column for interactive Self-Quiz mode
    const headerCells = Array.from(table.querySelectorAll('thead th, thead td'));
    const fallbackFirstRow =
      headerCells.length === 0 && rows.length > 1
        ? Array.from(rows[0].querySelectorAll('td, th'))
        : [];
    const activeHeaders = headerCells.length > 0 ? headerCells : fallbackFirstRow;

    if (fallbackFirstRow.length > 0) {
      rows[0].classList.add('docx-table-head-row');
    }

    const answerColIndices: number[] = [];
    activeHeaders.forEach((cell, colIdx) => {
      const hText = (cell.textContent || '').trim().toLowerCase();
      if (
        hText.includes('उत्तर') ||
        hText.includes('answer') ||
        hText === 'ans'
      ) {
        answerColIndices.push(colIdx);
        hasQuizAnswers = true;
      }
    });

    if (answerColIndices.length > 0) {
      table.classList.add('docx-qa-table');
      const bodyRows =
        headerCells.length > 0
          ? Array.from(table.querySelectorAll('tbody tr'))
          : rows.slice(1);
      bodyRows.forEach((tr) => {
        const cells = Array.from(tr.querySelectorAll(':scope > td, :scope > th'));
        answerColIndices.forEach((colIdx) => {
          if (cells[colIdx]) {
            cells[colIdx].classList.add('docx-answer-cell');
          }
        });
      });
    }

    // Wrap table in responsive scroll container
    const wrapper = doc.createElement('div');
    wrapper.className = 'docx-table-wrap';
    table.parentNode?.insertBefore(wrapper, table);
    wrapper.appendChild(table);
  });

  // 2. Style native h1, h2, h3 tags
  doc.querySelectorAll('h1, h2, h3').forEach((el) => {
    const text = el.textContent?.trim() || '';
    if (!text) return;
    const level = el.tagName === 'H1' ? 1 : el.tagName === 'H2' ? 2 : 3;
    if (level === 1) {
      el.classList.add('docx-lesson-heading');
    } else if (level === 2) {
      if (text.includes('⚠')) {
        el.classList.add('docx-h2-amber');
      } else if (/question|प्रश्न|अभ्यास/i.test(text)) {
        el.classList.add('docx-h2-violet');
      } else {
        el.classList.add('docx-h2-sky');
      }
    }
    registerHeading(el, text, level);
  });

  // 3. Highlight ⚠ warning paragraphs and standalone bold section titles (especially for docs without H1/H2)
  const needsBoldOutline = headings.length < 3;
  doc.querySelectorAll('p').forEach((p) => {
    if (p.closest('.docx-hero-banner, .docx-callout, .docx-lesson-banner, table')) return;
    const text = p.textContent?.trim() || '';
    if (!text) return;

    if (text.startsWith('⚠')) {
      p.classList.add('docx-tip-box');
      return;
    }

    // Check if paragraph is purely a bold section header like "1. Study tracker..." or "पाठ १ : ..."
    const firstStrong = p.querySelector(':scope > strong:only-child');
    if (firstStrong && text.length > 3 && text.length < 130) {
      const isLesson = /^(पाठ\s*[०-९\d]+|lesson\s*\d+|एकाइ\s*[०-९\d]+)/i.test(text);
      const isNumberedSection = /^(\d+\.|[A-Z]\.|[क-ह]\.)\s+/.test(text);
      const isQuestionHeader = /(प्रश्न|अभ्यास|question|study tracker|अध्ययन तालिका|स्रोत)/i.test(text);

      if (isLesson) {
        p.classList.add('docx-lesson-heading-p');
        registerHeading(p, text, 1);
      } else if (isNumberedSection || isQuestionHeader || needsBoldOutline) {
        p.classList.add('docx-section-heading-p');
        if (isQuestionHeader) {
          p.classList.add('docx-section-violet');
        }
        registerHeading(p, text, 2);
      }
    }
  });

  // 4. External links
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
    hasQuizAnswers,
  };
}
