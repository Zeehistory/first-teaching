/**
 * Sub-subsection detection.
 *
 * Inside a book's HTML content, some paragraphs are really crossheadings —
 * short title-like lines (e.g. "Enoch, Meṭāṭrôn, and Angelic Messengerhood")
 * that sit between body paragraphs. They carry no distinguishing markup, so we
 * detect them heuristically: a short standalone <p>, with no terminal
 * sentence punctuation, that reads like a title rather than a sentence.
 *
 * Detected paragraphs are tagged with a stable id + the `content-subhead`
 * class so the prose can style them and the nav can anchor-scroll to them.
 * These remain on the same book page — they are not separate routes.
 */

const SUBHEAD_CLASS = "content-subhead";

// Strip tags to get the visible text of a paragraph's inner HTML.
function plain(inner: string): string {
  return inner
    .replace(/<[^>]+>/g, "")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/**
 * A paragraph reads as a crosshead when it is short, title-cased, and lacks
 * sentence-ending punctuation — but isn't an empty or single-word fragment.
 */
function looksLikeSubhead(text: string): boolean {
  if (!text) return false;
  const words = text.split(/\s+/);
  // Title length window: long enough to be a heading, short enough not to be
  // a sentence/paragraph.
  if (words.length < 2 || words.length > 12) return false;
  if (text.length > 90) return false;
  // No terminal sentence punctuation, and no internal sentence breaks.
  if (/[.!?;:]\s/.test(text)) return false;
  if (/[.!?:]$/.test(text)) return false;
  if (/[,;]$/.test(text)) return false;
  // Editorial placeholders are not headings.
  if (/please define/i.test(text)) return false;
  // A line that opens with a discourse connective is running prose, not a head.
  if (/^(similarly|likewise|moreover|however|therefore|thus|hence|indeed|accordingly|furthermore|nevertheless|conversely)\b/i.test(text)) {
    return false;
  }
  // Reject lines that are obviously running prose (common lowercase openers).
  if (/^(the|a|an|and|but|or|in|on|of|to|for|with|it|this|that|these|those|as|by|from|he|she|they|we|i)\b/i.test(text)) {
    // Allow if it is otherwise strongly title-like (Title Case majority).
  }
  // Must be predominantly Title Case: most significant words capitalized.
  const significant = words.filter((w) => w.length > 3);
  if (significant.length === 0) return false;
  const capped = significant.filter((w) => /^[A-ZĀĪŪṢḌṬẒḤ'‘"(]/.test(w)).length;
  return capped / significant.length >= 0.6;
}

export interface Subsection {
  id: string;
  title: string;
}

export interface ProcessedContent {
  html: string;
  subsections: Subsection[];
}

/**
 * Detect crossheads in `html`, tag them, and return the tagged html plus the
 * ordered list of subsections. `keyPrefix` keeps ids unique across sections.
 */
export function processSubsections(html: string, keyPrefix = "sub"): ProcessedContent {
  const subsections: Subsection[] = [];
  const seen = new Set<string>();
  let counter = 0;

  // Only consider plain <p>…</p> with no attributes — tagged/structural
  // paragraphs (blockquotes, web-extension chips, etc.) are excluded.
  const tagged = html.replace(/<p>([\s\S]*?)<\/p>/g, (match, inner) => {
    // Skip paragraphs that contain block-level markers we never treat as heads.
    if (/data-|class=|<a\b|<img\b/i.test(inner)) return match;
    const text = plain(inner);
    if (!looksLikeSubhead(text)) return match;

    let id = `${keyPrefix}-${slugify(text)}`;
    while (seen.has(id)) id = `${keyPrefix}-${slugify(text)}-${++counter}`;
    seen.add(id);
    subsections.push({ id, title: text });
    return `<p id="${id}" class="${SUBHEAD_CLASS}">${inner}</p>`;
  });

  return { html: tagged, subsections };
}
