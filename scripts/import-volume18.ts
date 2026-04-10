import fs from "fs/promises";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";
import mammoth from "mammoth";
import type { BookData, Footnote, WebExtensionEntry } from "../shared/schema";

type TocEntry = {
  markerCode: string;
  markerNumber: number;
  pageReference: number;
};

type HeadingMatch = {
  start: number;
  end: number;
  text: string;
  markerCode: string;
  markerNumber: number;
};

type ExtensionFootnoteRef = {
  originalNumber: number;
  displayNumber: number;
  markerKey: string;
  paragraphText: string;
  prefixText: string;
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");
const SOURCE_DIR = path.join(ROOT, "content", "source");
const MAIN_ALIAS = path.join(SOURCE_DIR, "Syntopicon-Volume18_25page.docx alias");
const EXT_ALIAS = path.join(SOURCE_DIR, "Volume18_WebExt.docx alias");
const OUTPUT_MAIN = path.join(ROOT, "client", "src", "lib", "content", "volume18.ts");
const OUTPUT_EXT = path.join(
  ROOT,
  "client",
  "src",
  "lib",
  "content",
  "volume18WebExtensions.ts"
);

const SERIES_TITLE = "First Teaching of the Last Message";
const SERIES_SUBTITLE = "The Divine Science & Its Six Pillars";
const AUTHOR = "Umar F. Abd-Allah Wymann-Landgraf";

async function pathExists(candidate: string) {
  try {
    await fs.access(candidate);
    return true;
  } catch {
    return false;
  }
}

async function findFileRecursive(root: string, targetName: string): Promise<string | null> {
  const queue = [root];
  while (queue.length > 0) {
    const current = queue.shift()!;
    let entries;
    try {
      entries = await fs.readdir(current, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      const next = path.join(current, entry.name);
      if (entry.isFile() && entry.name === targetName) return next;
      if (entry.isDirectory()) queue.push(next);
    }
  }
  return null;
}

async function resolveSourcePath(aliasPath: string): Promise<string> {
  const basename = path.basename(aliasPath).replace(/ alias$/, "");
  const localCandidate = path.join(path.dirname(aliasPath), basename);
  if (await pathExists(localCandidate)) return localCandidate;

  const cloudRoot = path.join(os.homedir(), "Library", "CloudStorage");
  const found = await findFileRecursive(cloudRoot, basename);
  if (found) return found;

  throw new Error(`Unable to resolve source file for ${aliasPath}`);
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function slugify(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .toLowerCase();
}

function stripTags(value: string) {
  return value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, "\"")
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+\n/g, "\n")
    .replace(/\n\s+/g, "\n")
    .replace(/[ \t]+/g, " ")
    .trim();
}

function decodeEntity(entity: string) {
  if (entity === "&nbsp;") return " ";
  if (entity === "&amp;") return "&";
  if (entity === "&quot;") return "\"";
  if (entity === "&#39;" || entity === "&apos;") return "'";
  if (entity === "&lt;") return "<";
  if (entity === "&gt;") return ">";
  if (entity.startsWith("&#x") || entity.startsWith("&#X")) {
    const code = Number.parseInt(entity.slice(3, -1), 16);
    return Number.isFinite(code) ? String.fromCodePoint(code) : entity;
  }
  if (entity.startsWith("&#")) {
    const code = Number.parseInt(entity.slice(2, -1), 10);
    return Number.isFinite(code) ? String.fromCodePoint(code) : entity;
  }
  return entity;
}

function normalizeText(value: string) {
  return stripTags(value).replace(/\s+/g, " ").trim();
}

function normalizeComparableText(value: string) {
  return normalizeText(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’'`]/g, "")
    .replace(/[“”"]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function cleanMainHtml(value: string) {
  return value
    .replace(/<a id="[^"]+"><\/a>/g, "")
    .replace(/<a [^>]*>([\s\S]*?)<\/a>/g, "$1")
    .replace(/<p>\s*<\/p>/g, "")
    .trim();
}

function cleanExtensionHtml(value: string) {
  return value
    .replace(/<a id="[^"]+"><\/a>/g, "")
    .replace(/<p>\s*<\/p>/g, "")
    .trim();
}

function buildSnippet(html: string, length = 240) {
  const text = normalizeText(html);
  if (text.length <= length) return text;
  const cutoff = text.lastIndexOf(" ", length - 1);
  return `${text.slice(0, cutoff > 100 ? cutoff : length).trim()}…`;
}

function parseTocEntries(rawText: string): TocEntry[] {
  const entries = new Map<number, TocEntry>();
  const regex = /^(.*?)\s*\(18:(\d+)\)\t(\d+)$/gm;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(rawText)) !== null) {
    const markerNumber = Number(match[2]);
    if (entries.has(markerNumber)) continue;
    entries.set(markerNumber, {
      markerCode: `18:${markerNumber}`,
      markerNumber,
      pageReference: Number(match[3]),
    });
    if (entries.size === 18) break;
  }
  return Array.from(entries.values()).sort((a, b) => a.markerNumber - b.markerNumber);
}

function parseParagraphs(html: string) {
  const paragraphs: Array<{ html: string; text: string; start: number; end: number }> = [];
  const regex = /<p>[\s\S]*?<\/p>/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(html)) !== null) {
    const paragraphHtml = match[0];
    paragraphs.push({
      html: paragraphHtml,
      text: normalizeText(paragraphHtml),
      start: match.index,
      end: match.index + paragraphHtml.length,
    });
  }
  return paragraphs;
}

function buildAnchorCandidates(prefixText: string) {
  const words = prefixText.split(/\s+/).filter(Boolean);
  const candidates: string[] = [];
  const maxLength = Math.min(words.length, 12);
  for (let length = maxLength; length >= 1; length -= 1) {
    const candidate = words
      .slice(words.length - length)
      .join(" ")
      .replace(/^[([{“"']+/g, "")
      .replace(/[)\]},”"'.:;!?]+$/g, "")
      .trim();
    if (!candidate) continue;
    if (candidate.length < 3) continue;
    if (length === 1) {
      const comparable = normalizeComparableText(candidate);
      const looksLikeName = /[A-ZĀĪŪṢḌṬẒḤḪʻ’'\-]/u.test(candidate);
      if (comparable.length < 6 || !looksLikeName) continue;
    }
    candidates.push(candidate);
  }
  return Array.from(new Set(candidates));
}

function isProperTermCandidate(candidate: string) {
  const clean = normalizeText(candidate).trim();
  if (!clean) return false;

  const tokens = clean.split(/\s+/).filter(Boolean);
  if (!tokens.length || tokens.length > 6) return false;

  const bannedLeadingWords = new Set([
    "the",
    "a",
    "an",
    "and",
    "or",
    "but",
    "for",
    "nor",
    "so",
    "yet",
    "of",
    "to",
    "in",
    "on",
    "at",
    "by",
    "with",
    "from",
    "into",
    "through",
    "during",
    "before",
    "after",
    "above",
    "below",
    "between",
    "under",
    "again",
    "further",
    "then",
    "once",
    "this",
    "that",
    "these",
    "those",
    "their",
    "there",
    "whose",
    "which",
    "what",
    "where",
    "when",
    "while",
    "everything",
    "something",
    "nothing",
  ]);

  const hasDiacriticsOrScholarlyMarks = /[ĀĪŪṢḌṬẒḤḪŚŻŁŃẞẊʿʻ’]/u.test(clean);
  const hasInternalHyphen = /[A-Za-z\u00C0-\u024F][-'’][A-Za-z\u00C0-\u024F]/u.test(clean);
  const hasCapitalizedToken = tokens.some((token) => /^[A-ZĀĪŪṢḌṬẒḤḪ]/u.test(token));
  const hasConnectorPattern = /\b(al|ibn|bin|bint|abu|abū|umm|ahl)-?[A-ZĀĪŪṢḌṬẒḤḪ]/u.test(clean);

  if (bannedLeadingWords.has(tokens[0].toLowerCase())) return false;
  if (tokens.length === 1) {
    return hasCapitalizedToken || hasDiacriticsOrScholarlyMarks || hasInternalHyphen || hasConnectorPattern;
  }

  return hasCapitalizedToken || hasDiacriticsOrScholarlyMarks || hasConnectorPattern;
}

function findVisibleAnchorMatch(html: string, prefixText: string) {
  const candidates = buildAnchorCandidates(prefixText);
  if (!candidates.length) return null;

  let visibleText = "";
  const visibleToHtmlStart: number[] = [];
  const visibleToHtmlEnd: number[] = [];

  for (let index = 0; index < html.length; index += 1) {
    const char = html[index];
    if (char === "<") {
      const closingIndex = html.indexOf(">", index);
      if (closingIndex === -1) break;
      index = closingIndex;
      continue;
    }
    if (char === "&") {
      const closingIndex = html.indexOf(";", index);
      if (closingIndex !== -1) {
        const entity = html.slice(index, closingIndex + 1);
        const decoded = decodeEntity(entity);
        for (const entityChar of decoded) {
          visibleText += entityChar;
          visibleToHtmlStart.push(index);
          visibleToHtmlEnd.push(closingIndex + 1);
        }
        index = closingIndex;
        continue;
      }
    }
    visibleText += char;
    visibleToHtmlStart.push(index);
    visibleToHtmlEnd.push(index + 1);
  }

  const visibleTextLower = visibleText.toLocaleLowerCase();
  for (const candidate of candidates) {
    const matchIndex = visibleTextLower.lastIndexOf(candidate.toLocaleLowerCase());
    if (matchIndex === -1) continue;
    const visibleEnd = matchIndex + candidate.length;
    return {
      candidate,
      matchedWords: candidate.split(/\s+/).filter(Boolean).length,
      htmlStartIndex: visibleToHtmlStart[matchIndex] ?? null,
      htmlEndIndex: visibleToHtmlEnd[Math.max(visibleEnd - 1, 0)] ?? null,
    };
  }

  return null;
}

function wrapAnchorAndInsertMarker(
  html: string,
  anchorMatch: { candidate: string; htmlStartIndex: number | null; htmlEndIndex: number | null },
  markerHtml: string
) {
  if (anchorMatch.htmlStartIndex === null || anchorMatch.htmlEndIndex === null) {
    return { html, insertionIndex: null };
  }

  const before = html.slice(0, anchorMatch.htmlStartIndex);
  const anchorHtml = html.slice(anchorMatch.htmlStartIndex, anchorMatch.htmlEndIndex);
  const after = html.slice(anchorMatch.htmlEndIndex);
  const shouldBold = isProperTermCandidate(anchorMatch.candidate);
  const wrappedAnchor =
    shouldBold && !/<\/?strong\b/i.test(anchorHtml) ? `<strong>${anchorHtml}</strong>` : anchorHtml;
  const nextHtml = `${before}${wrappedAnchor}${markerHtml}${after}`;

  return {
    html: nextHtml,
    insertionIndex: before.length + wrappedAnchor.length,
  };
}

function findMainBodyStart(html: string) {
  const bodyTitle = "<p>Obligatory Creedal Belief in the Hereafter &amp; Otherworldly Eschatology</p>";
  const index = html.indexOf(bodyTitle);
  if (index === -1) {
    throw new Error("Unable to find main Volume 18 body start");
  }
  return index;
}

function findMainHeadings(bodyHtml: string): HeadingMatch[] {
  const paragraphs = parseParagraphs(bodyHtml);
  const headings: HeadingMatch[] = [];

  if (!paragraphs.length) {
    throw new Error("No paragraphs found in main body html");
  }

  headings.push({
    start: paragraphs[0].start,
    end: paragraphs[0].end,
    text: paragraphs[0].text,
    markerCode: "18:1",
    markerNumber: 1,
  });

  paragraphs.forEach((paragraph) => {
    const match = paragraph.text.match(/^(.*)\((18:\d+)\)$/);
    if (!match) return;
    const markerNumber = Number(match[2].split(":")[1]);
    if (markerNumber === 1) return;
    if (paragraph.text.length > 180) return;
    if (headings.some((entry) => entry.markerNumber === markerNumber)) return;
    headings.push({
      start: paragraph.start,
      end: paragraph.end,
      text: paragraph.text,
      markerCode: match[2],
      markerNumber,
    });
  });

  const ordered = headings.sort((a, b) => a.markerNumber - b.markerNumber);
  if (ordered.length !== 18) {
    throw new Error(`Expected 18 main headings, found ${ordered.length}`);
  }
  return ordered;
}

function extractMainChapterTitle(heading: HeadingMatch) {
  return heading.text.replace(/\s*\(18:\d+\)\s*$/, "").trim();
}

function extractExtensionFootnotes(
  segmentHtml: string,
  sectionId: string,
  globalFootnotes: Map<number, string>
): {
  content: string;
  footnotes: Footnote[];
  references: ExtensionFootnoteRef[];
} {
  let contentHtml = segmentHtml;
  const footnotes: Footnote[] = [];
  const references: ExtensionFootnoteRef[] = [];
  const refRegex = /<sup>\s*<a href="#footnote-(\d+)"[^>]*>\[(\d+)\]<\/a>\s*<\/sup>/g;
  const refsInOrder = [...contentHtml.matchAll(refRegex)].map((match) => Number(match[1]));
  const displayNumberByOriginal = new Map<number, number>();
  refsInOrder.forEach((originalNumber) => {
    if (!displayNumberByOriginal.has(originalNumber)) {
      displayNumberByOriginal.set(originalNumber, displayNumberByOriginal.size + 1);
    }
  });

  Array.from(displayNumberByOriginal.entries())
    .sort((a, b) => a[1] - b[1])
    .forEach(([originalNumber, displayNumber]) => {
    const content = globalFootnotes.get(originalNumber);
    if (!content) return;
    footnotes.push({
      id: `fn-${sectionId}-${displayNumber}`,
      number: displayNumber,
      displayNumber,
      markerKey: `${sectionId}:web-extension:${displayNumber}`,
      origin: "web-extension",
      content,
      sectionId,
    });
  });

  parseParagraphs(contentHtml).forEach((paragraph) => {
    refRegex.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = refRegex.exec(paragraph.html)) !== null) {
      const prefixHtml = paragraph.html.slice(0, match.index);
      const originalNumber = Number(match[1]);
      const displayNumber = displayNumberByOriginal.get(originalNumber);
      if (!displayNumber) continue;
      references.push({
        originalNumber,
        displayNumber,
        markerKey: `${sectionId}:web-extension:${displayNumber}`,
        paragraphText: normalizeText(
          paragraph.html.replace(
            /<sup>\s*<a href="#footnote-(\d+)"[^>]*>\[(\d+)\]<\/a>\s*<\/sup>/g,
            ""
          )
        ),
        prefixText: normalizeText(prefixHtml),
      });
    }
    refRegex.lastIndex = 0;
  });

  const enhancedParagraphs = parseParagraphs(contentHtml).map((paragraph) => {
    let paragraphHtml = paragraph.html;
    refRegex.lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = refRegex.exec(paragraphHtml)) !== null) {
      const originalNumber = Number(match[1]);
      const displayNumber = displayNumberByOriginal.get(originalNumber);
      if (!displayNumber) continue;

      const markerKey = `${sectionId}:web-extension:${displayNumber}`;
      const markerHtml = `<sup data-footnote="${displayNumber}" data-footnote-key="${markerKey}" data-footnote-origin="web-extension">${displayNumber}</sup>`;
      const prefixHtml = paragraphHtml.slice(0, match.index);
      const anchorMatch = findVisibleAnchorMatch(prefixHtml, normalizeText(prefixHtml));
      const paragraphWithoutOriginalRef = `${paragraphHtml.slice(0, match.index)}${paragraphHtml.slice(match.index + match[0].length)}`;

      if (!anchorMatch) {
        paragraphHtml = `${paragraphHtml.slice(0, match.index)}${markerHtml}${paragraphHtml.slice(match.index + match[0].length)}`;
        refRegex.lastIndex = 0;
        continue;
      }

      const enhanced = wrapAnchorAndInsertMarker(paragraphWithoutOriginalRef, anchorMatch, markerHtml);
      paragraphHtml = enhanced.html;
      refRegex.lastIndex = 0;
    }

    return paragraphHtml;
  });

  contentHtml = contentHtml.replace(/<p>[\s\S]*?<\/p>/g, () => enhancedParagraphs.shift() ?? "");

  return { content: contentHtml.trim(), footnotes, references };
}

function extractGlobalExtensionFootnotes(html: string) {
  const footnotes = new Map<number, string>();
  const liRegex = /<li id="footnote-(\d+)">([\s\S]*?)<\/li>/g;
  let liMatch: RegExpExecArray | null;
  while ((liMatch = liRegex.exec(html)) !== null) {
    const number = Number(liMatch[1]);
    const content = liMatch[2]
      .replace(new RegExp(`<a href="#footnote-ref-${number}">↑<\\/a>`, "g"), "")
      .trim();
    footnotes.set(number, content);
  }
  return footnotes;
}

function injectMainFootnotes(
  chapterHtml: string,
  chapterId: string,
  references: ExtensionFootnoteRef[],
  extensionFootnotes: Footnote[]
) {
  const mainParagraphs = parseParagraphs(chapterHtml);
  const paragraphHtmls = mainParagraphs.map((paragraph) => paragraph.html);
  const importedByReference = new Set<string>();
  const occupiedInsertionPoints = new Set<string>();
  const placements: Array<{
    paragraphIndex: number;
    insertionIndex: number;
    placeholder: string;
    source: Footnote;
  }> = [];

  const scoreParagraphMatch = (extensionParagraph: string, mainParagraph: string) => {
    const extNorm = normalizeComparableText(extensionParagraph);
    const mainNorm = normalizeComparableText(mainParagraph);
    if (!extNorm || !mainNorm) return 0;
    if (extNorm === mainNorm) return 10000;

    const words = extNorm.split(" ").filter(Boolean);
    const maxGram = Math.min(words.length, 10);
    for (let size = maxGram; size >= 3; size -= 1) {
      for (let start = 0; start <= words.length - size; start += 1) {
        const gram = words.slice(start, start + size).join(" ");
        if (mainNorm.includes(gram)) {
          return size * 1000 - Math.abs(mainNorm.length - extNorm.length);
        }
      }
    }

    const extTokens = new Set(words.filter((word) => word.length >= 4));
    const mainTokens = new Set(mainNorm.split(" ").filter((word) => word.length >= 4));
    let overlap = 0;
    extTokens.forEach((token) => {
      if (mainTokens.has(token)) overlap += 1;
    });
    return overlap;
  };

  let paragraphSearchIndex = 0;
  references.forEach((reference) => {
    const source = extensionFootnotes.find((entry) => entry.markerKey === reference.markerKey);
    if (!source || importedByReference.has(reference.markerKey) || mainParagraphs.length === 0) {
      return;
    }

    let bestMatch:
      | {
          paragraphIndex: number;
          insertionIndex: number;
          matchedWords: number;
          paragraphScore: number;
        }
      | null = null;

    for (let index = paragraphSearchIndex; index < mainParagraphs.length; index += 1) {
      const paragraphScore = scoreParagraphMatch(reference.paragraphText, mainParagraphs[index].text);
      if (paragraphScore < 3) continue;

      const visibleMatch = findVisibleAnchorMatch(paragraphHtmls[index], reference.prefixText);
      if (!visibleMatch || visibleMatch.htmlEndIndex === null) continue;

      const totalScore = visibleMatch.matchedWords * 10000 + paragraphScore;
      const bestTotal =
        bestMatch === null ? -1 : bestMatch.matchedWords * 10000 + bestMatch.paragraphScore;

      if (totalScore > bestTotal) {
        bestMatch = {
          paragraphIndex: index,
          insertionIndex: visibleMatch.htmlEndIndex,
          matchedWords: visibleMatch.matchedWords,
          paragraphScore,
        };
      }
    }

    if (!bestMatch) {
      console.warn(
        `[volume18] Skipped main-text insertion for footnote ${reference.originalNumber} in ${chapterId}: no exact anchor phrase found`
      );
      return;
    }

    if (bestMatch.matchedWords < 2 && bestMatch.paragraphScore < 1000) {
      console.warn(
        `[volume18] Skipped main-text insertion for footnote ${reference.originalNumber} in ${chapterId}: anchor match too weak`
      );
      return;
    }

    const currentHtml = paragraphHtmls[bestMatch.paragraphIndex];
    paragraphSearchIndex = bestMatch.paragraphIndex;
    const insertionPointKey = `${bestMatch.paragraphIndex}:${bestMatch.insertionIndex}`;
    if (occupiedInsertionPoints.has(insertionPointKey)) {
      console.warn(
        `[volume18] Skipped main-text insertion for footnote ${reference.originalNumber} in ${chapterId}: anchor already occupied`
      );
      return;
    }

    const placeholder = `__V18_MAIN_FOOTNOTE_${placements.length}__`;
    const anchorMatch = findVisibleAnchorMatch(currentHtml, reference.prefixText);
    if (!anchorMatch) {
      console.warn(
        `[volume18] Skipped main-text insertion for footnote ${reference.originalNumber} in ${chapterId}: anchor disappeared before insertion`
      );
      return;
    }

    const enhanced = wrapAnchorAndInsertMarker(currentHtml, anchorMatch, placeholder);
    if (enhanced.insertionIndex === null) {
      console.warn(
        `[volume18] Skipped main-text insertion for footnote ${reference.originalNumber} in ${chapterId}: invalid insertion point`
      );
      return;
    }

    paragraphHtmls[bestMatch.paragraphIndex] = enhanced.html;
    occupiedInsertionPoints.add(insertionPointKey);
    importedByReference.add(reference.markerKey);
    placements.push({
      paragraphIndex: bestMatch.paragraphIndex,
      insertionIndex: enhanced.insertionIndex,
      placeholder,
      source,
    });
  });

  const orderedPlacements = paragraphHtmls.flatMap((html, paragraphIndex) => {
    const local: Array<{ placement: typeof placements[number]; visualIndex: number }> = [];
    placements.forEach((placement) => {
      if (placement.paragraphIndex !== paragraphIndex) return;
      const visualIndex = html.indexOf(placement.placeholder);
      if (visualIndex === -1) return;
      local.push({ placement, visualIndex });
    });
    return local.sort((a, b) => a.visualIndex - b.visualIndex).map((entry) => entry.placement);
  });

  orderedPlacements.forEach((placement, index) => {
      const displayNumber = index + 1;
      const markerKey = `${chapterId}:syntopicon:${displayNumber}`;
      const marker = `<sup data-footnote="${displayNumber}" data-footnote-key="${markerKey}" data-footnote-origin="syntopicon">${displayNumber}</sup>`;
      paragraphHtmls[placement.paragraphIndex] = paragraphHtmls[placement.paragraphIndex].replace(
        placement.placeholder,
        marker
      );
    });

  const imported = orderedPlacements.map((placement, index) => ({
      ...placement.source,
      id: `fn-${chapterId}-${index + 1}`,
      number: index + 1,
      displayNumber: index + 1,
      markerKey: `${chapterId}:syntopicon:${index + 1}`,
      origin: "syntopicon" as const,
      sectionId: chapterId,
    }));

  return {
    content: chapterHtml.replace(/<p>[\s\S]*?<\/p>/g, () => paragraphHtmls.shift() ?? ""),
    footnotes: imported.sort((a, b) => a.number - b.number),
  };
}

function replaceMainMarkerWithLink(
  chapterHtml: string,
  markerCode: string,
  ordinal: number,
  chapterId: string
) {
  const marker = `(${markerCode})`;
  const link = `<a href="/v/18/${chapterId}/web-extension" class="web-extension-chip" data-web-extension-link="true" aria-label="Open web extension ${ordinal}">Web-Extension ${ordinal}</a>`;
  return chapterHtml.replace(marker, link).trim();
}

function findExtensionStart(html: string) {
  const marker = "<p><em>Opening of Webextension (18:1)</em></p>";
  const index = html.indexOf(marker);
  if (index === -1) {
    throw new Error("Unable to find web extension body start");
  }
  return index;
}

function findExtensionMarkers(bodyHtml: string) {
  const paragraphs = parseParagraphs(bodyHtml);
  const openings = new Map<number, { start: number; end: number }>();
  const endings = new Map<number, { start: number; end: number }>();

  paragraphs.forEach((paragraph) => {
    const opening = paragraph.text.match(/^Opening of Webextension \((18:\d+)\)$/);
    if (opening) {
      const markerNumber = Number(opening[1].split(":")[1]);
      openings.set(markerNumber, { start: paragraph.start, end: paragraph.end });
      return;
    }

    const ending = paragraph.text.match(/^End of Webextension(?: \+ Draft)? \((18:\d+)\)$/);
    if (ending) {
      const markerNumber = Number(ending[1].split(":")[1]);
      endings.set(markerNumber, { start: paragraph.start, end: paragraph.end });
    }
  });

  return { openings, endings };
}

function removeBoilerplateLead(segmentHtml: string) {
  const paragraphs = parseParagraphs(segmentHtml);
  if (!paragraphs.length) return segmentHtml.trim();
  const firstText = paragraphs[0].text;
  if (
    /Redundancy Check/i.test(firstText) ||
    /Ready to Go After Final Edits/i.test(firstText) ||
    /Under Construction/i.test(firstText)
  ) {
    return segmentHtml.slice(paragraphs[0].end).trim();
  }
  return segmentHtml.trim();
}

function renumberVolumeMainFootnotes(chapters: BookData["chapters"]) {
  let globalNumber = 1;
  const markerRegex =
    /<sup data-footnote="(\d+)" data-footnote-key="([^"]+)" data-footnote-origin="syntopicon">\d+<\/sup>/g;

  chapters.forEach((chapter) => {
    const section = chapter.sections[0];
    if (!section) return;

    const syntopiconFootnotes = section.footnotes.filter(
      (footnote) => footnote.origin === "syntopicon"
    );
    let localIndex = 0;

    section.content = section.content.replace(
      markerRegex,
      (_match, _previousNumber, _previousMarkerKey) => {
        const footnote = syntopiconFootnotes[localIndex];
        if (!footnote) {
          console.warn(
            `[volume18] Found extra syntopicon marker without matching footnote in ${chapter.id}`
          );
          return "";
        }

        const nextMarkerKey = `${chapter.id}:syntopicon:${globalNumber}`;
        footnote.id = `fn-${chapter.id}-${globalNumber}`;
        footnote.number = globalNumber;
        footnote.displayNumber = globalNumber;
        footnote.markerKey = nextMarkerKey;

        const marker = `<sup data-footnote="${globalNumber}" data-footnote-key="${nextMarkerKey}" data-footnote-origin="syntopicon">${globalNumber}</sup>`;
        globalNumber += 1;
        localIndex += 1;
        return marker;
      }
    );

    if (localIndex !== syntopiconFootnotes.length) {
      console.warn(
        `[volume18] Syntopicon footnote count mismatch in ${chapter.id}: consumed ${localIndex} of ${syntopiconFootnotes.length}`
      );
    }

    section.footnotes = [
      ...syntopiconFootnotes,
      ...section.footnotes.filter((footnote) => footnote.origin !== "syntopicon"),
    ];
  });
}

async function main() {
  const mainPath = await resolveSourcePath(MAIN_ALIAS);
  const extensionPath = await resolveSourcePath(EXT_ALIAS);

  const [{ value: mainHtml }, { value: extensionHtml }, { value: mainText }] = await Promise.all([
    mammoth.convertToHtml({ path: mainPath }),
    mammoth.convertToHtml({ path: extensionPath }),
    mammoth.extractRawText({ path: mainPath }),
  ]);

  const tocEntries = parseTocEntries(mainText);
  if (tocEntries.length !== 18) {
    throw new Error(`Expected 18 TOC entries, found ${tocEntries.length}`);
  }

  const cleanedMainHtml = cleanMainHtml(mainHtml);
  const mainBodyHtml = cleanedMainHtml.slice(findMainBodyStart(cleanedMainHtml));
  const headings = findMainHeadings(mainBodyHtml);

  const chapters: BookData["chapters"] = [];
  const chapterMetaByMarker = new Map<
    string,
    { chapterId: string; chapterTitle: string; pageReference: number; ordinal: number }
  >();

  headings.forEach((heading, index) => {
    const nextHeading = headings[index + 1];
    const chapterTitle = extractMainChapterTitle(heading);
    const chapterId = slugify(chapterTitle);
    const segmentStart = heading.end;
    const segmentEnd = nextHeading ? nextHeading.start : mainBodyHtml.length;
    const rawChapterHtml = mainBodyHtml.slice(segmentStart, segmentEnd).trim();
    const tocEntry = tocEntries.find((entry) => entry.markerNumber === heading.markerNumber);
    if (!tocEntry) {
      throw new Error(`Missing TOC entry for marker ${heading.markerCode}`);
    }

    chapterMetaByMarker.set(heading.markerCode, {
      chapterId,
      chapterTitle,
      pageReference: tocEntry.pageReference,
      ordinal: heading.markerNumber,
    });

    chapters.push({
      id: chapterId,
      number: index + 1,
      title: chapterTitle,
      description: buildSnippet(rawChapterHtml),
      sections: [
        {
          id: chapterId,
          title: chapterTitle,
          level: 3,
          parentId: null,
          content: rawChapterHtml,
          pageReference: tocEntry.pageReference,
          footnotes: [],
        },
      ],
    });
  });

  const cleanedExtensionHtml = cleanExtensionHtml(extensionHtml);
  const extensionBodyHtml = cleanedExtensionHtml.slice(findExtensionStart(cleanedExtensionHtml));
  const globalExtensionFootnotes = extractGlobalExtensionFootnotes(cleanedExtensionHtml);
  const { openings, endings } = findExtensionMarkers(extensionBodyHtml);
  const extensionEntries: Record<string, WebExtensionEntry> = {};

  tocEntries.forEach((entry) => {
    const open = openings.get(entry.markerNumber);
    const end = endings.get(entry.markerNumber);
    if (!open || !end) {
      throw new Error(`Missing extension boundaries for ${entry.markerCode}`);
    }
    const chapterMeta = chapterMetaByMarker.get(entry.markerCode);
    if (!chapterMeta) {
      throw new Error(`Missing chapter meta for ${entry.markerCode}`);
    }

    const segmentHtml = removeBoilerplateLead(
      extensionBodyHtml.slice(open.end, end.start).trim()
    );

    const mainChapter = chapters.find((chapter) => chapter.id === chapterMeta.chapterId)!;
    const extSectionId = `web-extension-${chapterMeta.chapterId}`;
    const { content, footnotes, references } = extractExtensionFootnotes(
      segmentHtml,
      extSectionId,
      globalExtensionFootnotes
    );

    const imported = injectMainFootnotes(
      mainChapter.sections[0].content,
      mainChapter.sections[0].id,
      references,
      footnotes
    );

    mainChapter.sections[0].content = replaceMainMarkerWithLink(
      imported.content,
      entry.markerCode,
      entry.markerNumber,
      chapterMeta.chapterId
    );
    mainChapter.sections[0].footnotes = imported.footnotes;
    mainChapter.description = buildSnippet(mainChapter.sections[0].content);

    extensionEntries[chapterMeta.chapterId] = {
      id: extSectionId,
      markerCode: entry.markerCode,
      ordinal: entry.markerNumber,
      volumeNumber: 18,
      chapterId: chapterMeta.chapterId,
      chapterTitle: chapterMeta.chapterTitle,
      title: `Web Extensions for "${chapterMeta.chapterTitle}"`,
      content,
      footnotes,
    };
  });

  renumberVolumeMainFootnotes(chapters);

  const volumeData: BookData = {
    volumeNumber: 18,
    volumeTitle: "The Hereafter: Otherworldly Eschatology",
    seriesTitle: SERIES_TITLE,
    seriesSubtitle: SERIES_SUBTITLE,
    author: AUTHOR,
    introduction:
      "Syntopicon 18 gathers the main text on the Hereafter with linked chapter-by-chapter web extensions and inline supporting footnotes where the extension material directly clarifies the main text.",
    totalVolumes: 19,
    chapters,
  };

  const mainFile = `import type { BookData } from "@shared/schema";\n\nexport const volumeEighteenData: BookData = ${JSON.stringify(
    volumeData,
    null,
    2
  )};\n`;

  const extFile = `import type { WebExtensionEntry } from "@shared/schema";\n\nexport const volumeEighteenWebExtensions: Record<string, WebExtensionEntry> = ${JSON.stringify(
    extensionEntries,
    null,
    2
  )};\n`;

  await fs.writeFile(OUTPUT_MAIN, mainFile, "utf-8");
  await fs.writeFile(OUTPUT_EXT, extFile, "utf-8");

  console.log(`[volume18] Wrote ${OUTPUT_MAIN}`);
  console.log(`[volume18] Wrote ${OUTPUT_EXT}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
