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
  // A trailing dash/em-dash signals enjambed verse, not a heading.
  if (/[-–—]$/.test(text)) return false;
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

/** Is the paragraph's whole visible content italic (poetry / verse / a
 *  transliterated line)? Such lines are never crossheadings. */
function isWhollyItalic(inner: string): boolean {
  const stripped = inner
    .replace(/<(em|i)\b[^>]*>[\s\S]*?<\/\1>/gi, "") // remove italic runs
    .replace(/<[^>]+>/g, "")
    .replace(/&[a-z]+;/gi, " ")
    .trim();
  // If nothing remains outside the italic runs, the line is wholly italic.
  return stripped.length === 0 && /<(em|i)\b/i.test(inner);
}

/** Is the paragraph's whole visible content bold (optionally bold-italic)? A
 *  standalone fully-bold line is an editorial crosshead — e.g. "Conclusion" or
 *  "Did al-Ḥijr's Monumental Structures Originate as Nabataean Tombs?". */
function isWhollyBold(inner: string): boolean {
  const stripped = inner
    .replace(/<strong\b[^>]*>[\s\S]*?<\/strong>/gi, "") // remove bold runs (and their text)
    .replace(/<[^>]+>/g, "")
    .replace(/&[a-z]+;/gi, " ")
    .trim();
  // Nothing visible sits outside the bold run → the whole line is bold.
  return stripped.length === 0 && /<strong\b/i.test(inner);
}

/**
 * Detect crossheads in `html`, tag them, and return the tagged html plus the
 * ordered list of subsections. `keyPrefix` keeps ids unique across sections.
 *
 * Detection is context-aware: a crosshead must be a *standalone* title-like
 * line. If its immediate neighbours are also short title-like (or italic)
 * lines, it belongs to a verse/poetry run and is left as body text.
 */
/** Decode the handful of HTML entities that appear in heading text so the nav
 *  shows "History & Languages" rather than "History &amp; Languages". */
function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// A bold-italic lead-in ending in a colon ("**_Translation_:** …") is an
// editorial crosshead embedded at the head of a paragraph. We lift it out as a
// real sub-subsection title (nav + UI) and leave the remaining prose behind.
const LEADIN_RE =
  /^<strong><em>([^<]*?)<\/em>\s*:\s*(?:<em>[\s\S]*?<\/em>\s*)?<\/strong>\s*([\s\S]*)$/;

export function processSubsections(html: string, keyPrefix = "sub"): ProcessedContent {
  const subsections: Subsection[] = [];
  const seen = new Set<string>();
  let counter = 0;

  const makeId = (text: string): string => {
    let id = `${keyPrefix}-${slugify(text)}`;
    while (seen.has(id)) id = `${keyPrefix}-${slugify(text)}-${++counter}`;
    seen.add(id);
    return id;
  };

  // First pass: index every plain <p> and classify it in isolation.
  const paras: Array<{
    start: number;
    end: number;
    inner: string;
    candidate: boolean;
    leadinTitle?: string;
    leadinTitleHtml?: string;
    leadinRest?: string;
    boldHeadTitle?: string;
    boldHeadHtml?: string;
  }> = [];
  const re = /<p>([\s\S]*?)<\/p>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    const inner = m[1];
    const structural = /data-|class=|<a\b|<img\b/i.test(inner);
    const italic = isWhollyItalic(inner);
    const leadin = LEADIN_RE.exec(inner);
    const para: (typeof paras)[number] = {
      start: m.index,
      end: re.lastIndex,
      inner,
      candidate: !structural && !italic && looksLikeSubhead(plain(inner)),
    };
    if (leadin) {
      const titleHtml = leadin[1].trim();
      const title = decodeEntities(titleHtml.replace(/<[^>]+>/g, ""));
      if (title) {
        para.leadinTitle = title;
        para.leadinTitleHtml = titleHtml;
        para.leadinRest = leadin[2].trim();
      }
    } else if (!structural && isWhollyBold(inner)) {
      // A standalone fully-bold line is a crosshead heading. Lift the bold so it
      // isn't double-weighted (keep any inner <em> for transliterations) and
      // strip a trailing colon — keep "?" since question headings are common.
      const text = plain(inner);
      const words = text ? text.split(/\s+/).length : 0;
      if (text && text.length <= 120 && words >= 1 && words <= 16) {
        para.boldHeadHtml = inner
          .replace(/<\/?strong\b[^>]*>/gi, "")
          .replace(/\s*[:：]\s*$/, "")
          .trim();
        para.boldHeadTitle = decodeEntities(text).replace(/\s*[:：]\s*$/, "").trim();
      }
    }
    paras.push(para);
  }

  // A colon lead-in ("…said in his Divan:") introduces a quotation or a verse
  // run, not a heading — the line that follows it is content, never a crosshead.
  const followsColonLeadIn = (idx: number): boolean => {
    const prev = paras[idx - 1];
    if (!prev) return false;
    return /[:：]\s*$/.test(plain(prev.inner));
  };

  // A "short/verse-like" neighbour disqualifies a candidate (poetry run).
  const neighbourLooksLikeVerse = (idx: number): boolean => {
    const p = paras[idx];
    if (!p) return false;
    if (isWhollyItalic(p.inner)) return true;
    const t = plain(p.inner);
    if (!t) return false; // empty paragraph = a real separator, fine
    const words = t.split(/\s+/);
    // A neighbour that is itself short and lacks terminal punctuation reads as
    // verse rather than body prose.
    return words.length <= 9 && !/[.!?:]$/.test(t);
  };

  // Second pass: keep only standalone candidates; rebuild html.
  let out = "";
  let cursor = 0;
  paras.forEach((p, i) => {
    out += html.slice(cursor, p.start);
    if (p.leadinTitle) {
      // Promote the bold-italic lead-in to a crosshead and keep the prose body.
      const id = makeId(p.leadinTitle);
      subsections.push({ id, title: p.leadinTitle });
      out += `<p id="${id}" class="${SUBHEAD_CLASS}">${p.leadinTitleHtml}</p>`;
      if (p.leadinRest) out += `<p>${p.leadinRest}</p>`;
      cursor = p.end;
      return;
    }
    if (p.boldHeadTitle) {
      // Promote a standalone fully-bold line to a crosshead heading.
      const id = makeId(p.boldHeadTitle);
      subsections.push({ id, title: p.boldHeadTitle });
      out += `<p id="${id}" class="${SUBHEAD_CLASS}">${p.boldHeadHtml}</p>`;
      cursor = p.end;
      return;
    }
    const standalone =
      p.candidate &&
      !followsColonLeadIn(i) &&
      !neighbourLooksLikeVerse(i - 1) &&
      !neighbourLooksLikeVerse(i + 1);
    if (standalone) {
      const text = plain(p.inner);
      const id = makeId(text);
      subsections.push({ id, title: text });
      out += `<p id="${id}" class="${SUBHEAD_CLASS}">${p.inner}</p>`;
    } else {
      out += html.slice(p.start, p.end);
    }
    cursor = p.end;
  });
  out += html.slice(cursor);

  return { html: out, subsections };
}
