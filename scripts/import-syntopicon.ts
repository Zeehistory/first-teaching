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
const SOURCE_ROOT = process.env.FIRST_TEACHING_SOURCE_ROOT
  ? path.resolve(process.env.FIRST_TEACHING_SOURCE_ROOT)
  : ROOT;
const SOURCE_DIR = path.join(ROOT, "content", "source");
const CONFIGS = {
  1: {
    mainAlias: path.join(SOURCE_DIR, "Syntopicon-Volume1_25-page.docx alias"),
    extAlias: path.join(SOURCE_DIR, "Volume1_WebExt.docx alias"),
    mainFallback: path.join(
      os.homedir(),
      "Library",
      "CloudStorage",
      "OneDrive-Personal",
      "The First Teaching",
      "25p - First Teaching",
      "Volume 1 - 25p",
      "Syntopicon-Volume1_25-page.docx"
    ),
    extFallback: path.join(
      os.homedir(),
      "Library",
      "CloudStorage",
      "OneDrive-Personal",
      "The First Teaching",
      "25p - First Teaching",
      "Volume 1 - 25p",
      "Volume1_WebExt.docx"
    ),
    outputMain: path.join(ROOT, "client", "src", "lib", "content", "volume1.ts"),
    outputExt: path.join(ROOT, "client", "src", "lib", "content", "volume1WebExtensions.ts"),
    exportMainName: "volumeOneData",
    exportExtName: "volumeOneWebExtensions",
    volumeTitle: "Speaking the Truth with Love",
    expectedChapters: 12,
    bodyStartText: "Dedication (1:1)",
    extensionStartPattern: /^Opening of Web-?Extension \(1:1\)$/,
    introduction:
      "Syntopicon 1 gathers the main text for Speaking the Truth with Love with linked chapter-by-chapter web extensions and inline supporting footnotes where the extension material directly clarifies the main text.",
  },
  13: {
    mainAlias: path.join(SOURCE_DIR, "Syntopicon-Volume13_25-page.docx alias"),
    extAlias: path.join(SOURCE_DIR, "Volume13_WebExt.docx alias"),
    mainFallback: path.join(SOURCE_ROOT, "25p - First Teaching", "Volume 13 - 25p", "Syntopicon-Volume13_25-page.docx"),
    extFallback: path.join(SOURCE_ROOT, "25p - First Teaching", "Volume 13 - 25p", "Volume13_WebExt.docx"),
    outputMain: path.join(ROOT, "client", "src", "lib", "content", "volume13.ts"),
    outputExt: path.join(ROOT, "client", "src", "lib", "content", "volume13WebExtensions.ts"),
    exportMainName: "volumeThirteenData",
    exportExtName: "volumeThirteenWebExtensions",
    volumeTitle: "Introducing God’s Prophets & Messengers",
    expectedChapters: 10,
    bodyStartText: "Fundamental Creedal Tenets Regarding God’s Prophets & Messengers (13:1)",
    extensionStartPattern: /^Opening of Web-?Extension \(13:1\)$/i,
    introduction:
      "Syntopicon 13 introduces God’s Prophets and Messengers, tracing the unity of their message from Adam through the antediluvian and early postdiluvian worlds.",
  },
  14: {
    mainAlias: path.join(SOURCE_DIR, "Syntopicon-Volume14_25-page.docx alias"),
    extAlias: path.join(SOURCE_DIR, "Volume14_WebExt.docx alias"),
    mainFallback: path.join(SOURCE_ROOT, "25p - First Teaching", "Volume 14 - 25p", "Syntopicon-Volume14_25-page.docx"),
    extFallback: path.join(SOURCE_ROOT, "25p - First Teaching", "Volume 14 - 25p", "Volume14_WebExt.docx"),
    outputMain: path.join(ROOT, "client", "src", "lib", "content", "volume14.ts"),
    outputExt: path.join(ROOT, "client", "src", "lib", "content", "volume14WebExtensions.ts"),
    exportMainName: "volumeFourteenData",
    exportExtName: "volumeFourteenWebExtensions",
    volumeTitle: "Prophets & Messengers at the End of the Bronze Age & Beginning of the Iron Age",
    expectedChapters: 14,
    bodyStartText: "Late Bronze Age Messengers & Their Times (14:1)",
    extensionStartPattern: /^Opening of Web-?Extension \(14:1\)$/i,
    introduction:
      "Syntopicon 14 follows the Prophetic succession from Jacob and Joseph through Moses, David, and Solomon at the meeting point of the Bronze and Iron Ages.",
  },
  15: {
    mainAlias: path.join(SOURCE_DIR, "Syntopicon-Volume15_25page.docx alias"),
    extAlias: path.join(SOURCE_DIR, "Volume15_WebExt.docx alias"),
    mainFallback: path.join(SOURCE_ROOT, "25p - First Teaching", "Volume 15 - 25p", "Syntopicon-Volume15_25page.docx"),
    extFallback: path.join(SOURCE_ROOT, "25p - First Teaching", "Volume 15 - 25p", "Volume15_WebExt.docx"),
    outputMain: path.join(ROOT, "client", "src", "lib", "content", "volume15.ts"),
    outputExt: path.join(ROOT, "client", "src", "lib", "content", "volume15WebExtensions.ts"),
    exportMainName: "volumeFifteenData",
    exportExtName: "volumeFifteenWebExtensions",
    volumeTitle: "Prophets & Messengers after Solomon & the Onset of the Age of Wrath",
    expectedChapters: 12,
    bodyStartText: "Breakup of Solomon’s Kingdom, Schism, Apostasy, & the Onset of Israel’s Coming Millennium of Wrath & Wickedness (15:1)",
    extensionStartPattern: /^Opening of Web-?Extension \(15:1\)$/i,
    introduction:
      "Syntopicon 15 traces the Prophetic line after Solomon through the age of division and exile, culminating in Mary and the Messiah Jesus son of Mary.",
  },
  16: {
    mainAlias: path.join(SOURCE_DIR, "Syntopicon-Volume16_25page.docx alias"),
    extAlias: path.join(SOURCE_DIR, "Volume16_WebExt.docx alias"),
    mainFallback: path.join(SOURCE_ROOT, "25p - First Teaching", "Volume 16 - 25p", "Syntopicon-Volume16_25page.docx"),
    extFallback: path.join(SOURCE_ROOT, "25p - First Teaching", "Volume 16 - 25p", "Volume16_WebExt.docx"),
    outputMain: path.join(ROOT, "client", "src", "lib", "content", "volume16.ts"),
    outputExt: path.join(ROOT, "client", "src", "lib", "content", "volume16WebExtensions.ts"),
    exportMainName: "volumeSixteenData",
    exportExtName: "volumeSixteenWebExtensions",
    volumeTitle: "God’s Last Messenger Muḥammad, the Paraclete & Prophet of the End of Days",
    expectedChapters: 6,
    bodyStartText: "The End of the Age of Wrath, the Restoration of Prophecy, & the Dawn of the Age of Supreme Felicity (16:1)",
    extensionStartPattern: /^Opening of Web-?Extension \(16:1\)$/i,
    introduction:
      "Syntopicon 16 examines ancient allusions to the final Prophet and presents Muḥammad as the Deuteronomy Prophet, the Paraclete, and the Messenger of the End of Days.",
  },
  17: {
    mainAlias: path.join(SOURCE_DIR, "Syntopicon-Volume17_25page.docx alias"),
    extAlias: path.join(SOURCE_DIR, "Volume17_WebExt.docx alias"),
    mainFallback: path.join(SOURCE_ROOT, "25p - First Teaching", "Volume 17 - 25p", "Syntopicon-Volume17_25page.docx"),
    extFallback: path.join(SOURCE_ROOT, "25p - First Teaching", "Volume 17 - 25p", "Volume17_WebExt.docx"),
    outputMain: path.join(ROOT, "client", "src", "lib", "content", "volume17.ts"),
    outputExt: path.join(ROOT, "client", "src", "lib", "content", "volume17WebExtensions.ts"),
    exportMainName: "volumeSeventeenData",
    exportExtName: "volumeSeventeenWebExtensions",
    volumeTitle: "Eschatology Part One: The Earthly Cosmic Order of Good, the Order of Evil, & Their Contrasting Destinies",
    expectedChapters: 21,
    bodyStartText: "Introduction (17:1)",
    extensionStartPattern: /^Opening of Webextension \(17:1\)$/i,
    introduction:
      "Syntopicon 17 opens the study of Last Things, gathering the main text on Sainthood, Sufism, mediated supplication, worldly eschatology, and the Signs of the End of Time, with linked chapter-by-chapter web extensions and inline supporting footnotes.",
  },
  18: {
    mainAlias: path.join(SOURCE_DIR, "Syntopicon-Volume18_25page.docx alias"),
    extAlias: path.join(SOURCE_DIR, "Volume18_WebExt.docx alias"),
    mainFallback: path.join(
      os.homedir(),
      "Library",
      "CloudStorage",
      "OneDrive-Personal (1-26-26 10:32)",
      "The First Teaching",
      "25p - First Teaching",
      "Volume 18 - 25p",
      "Volume18_25page.docx"
    ),
    extFallback: path.join(
      os.homedir(),
      "Library",
      "CloudStorage",
      "OneDrive-Personal (1-26-26 10:32)",
      "The First Teaching",
      "25p - First Teaching",
      "Volume 18 - 25p",
      "Volume18_WebExt.docx"
    ),
    outputMain: path.join(ROOT, "client", "src", "lib", "content", "volume18.ts"),
    outputExt: path.join(ROOT, "client", "src", "lib", "content", "volume18WebExtensions.ts"),
    exportMainName: "volumeEighteenData",
    exportExtName: "volumeEighteenWebExtensions",
    volumeTitle: "The Hereafter: Otherworldly Eschatology",
    expectedChapters: 18,
    bodyStartText: "Obligatory Creedal Belief in the Hereafter &amp; Otherworldly Eschatology",
    extensionStartPattern: /^Opening of Webextension \(18:1\)$/,
    introduction:
      "Syntopicon 18 gathers the main text on the Hereafter with linked chapter-by-chapter web extensions and inline supporting footnotes where the extension material directly clarifies the main text.",
  },
} as const;

type ImportConfig = (typeof CONFIGS)[keyof typeof CONFIGS];

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

async function resolveSourcePath(aliasPath: string, fallbackPath?: string): Promise<string> {
  if (fallbackPath && (await pathExists(fallbackPath))) return fallbackPath;

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

function extractPrimaryFootnoteAnchor(content: string) {
  const strongMatch = content.match(/<strong\b[^>]*>([\s\S]*?)<\/strong>/i);
  if (!strongMatch) return null;
  const anchor = normalizeText(strongMatch[1]);
  if (anchor.length < 3 || anchor.length > 160) return null;
  return anchor;
}

function isDistinctiveAnchorCandidate(candidate: string) {
  const clean = normalizeText(candidate);
  if (!clean) return false;

  const tokens = clean.split(/\s+/).filter(Boolean);
  if (!tokens.length) return false;

  const weakWords = new Set([
    "a",
    "an",
    "and",
    "are",
    "as",
    "at",
    "be",
    "but",
    "by",
    "for",
    "from",
    "has",
    "have",
    "he",
    "her",
    "his",
    "in",
    "is",
    "it",
    "its",
    "of",
    "on",
    "or",
    "she",
    "that",
    "the",
    "their",
    "them",
    "they",
    "this",
    "to",
    "was",
    "were",
    "which",
    "who",
    "with",
  ]);

  const meaningfulTokens = tokens.filter((token) => {
    const comparable = normalizeComparableText(token);
    return comparable.length >= 4 && !weakWords.has(comparable);
  });
  const hasScholarlyOrProperSignal = /[A-ZĀĪŪṢḌṬẒḤḪΑ-ΩΆΈΉΊΌΎΏא-תܐ-ܬ]/u.test(clean);
  const hasDiacritics = /[ĀĪŪṢḌṬẒḤḪāīūṣḍṭẓḥḫáéíóúàèìòùâêîôûäëïöüñʿʻ’]/u.test(clean);

  if (tokens.length <= 2 && meaningfulTokens.length === 0) return false;
  if (tokens.length <= 2) return hasScholarlyOrProperSignal || hasDiacritics || meaningfulTokens.length >= 1;
  return meaningfulTokens.length >= 2 || hasScholarlyOrProperSignal || hasDiacritics;
}

function parseTocEntries(rawText: string, volumeNumber: number, expectedChapters: number): TocEntry[] {
  const entries = new Map<number, TocEntry>();
  const regex = new RegExp(`^(.*?)\\s*\\(${volumeNumber}:(\\d+)\\)\\t(\\d+)$`, "gm");
  let match: RegExpExecArray | null;
  while ((match = regex.exec(rawText)) !== null) {
    const markerNumber = Number(match[2]);
    if (entries.has(markerNumber)) continue;
    entries.set(markerNumber, {
      markerCode: `${volumeNumber}:${markerNumber}`,
      markerNumber,
      pageReference: Number(match[3]),
    });
    if (entries.size === expectedChapters) break;
  }
  return Array.from(entries.values()).sort((a, b) => a.markerNumber - b.markerNumber);
}

function mergeTocEntries(primary: TocEntry[], fallback: TocEntry[]) {
  const entries = new Map<number, TocEntry>();
  fallback.forEach((entry) => entries.set(entry.markerNumber, entry));
  primary.forEach((entry) => entries.set(entry.markerNumber, entry));
  return Array.from(entries.values()).sort((a, b) => a.markerNumber - b.markerNumber);
}

function parseParagraphs(html: string) {
  const paragraphs: Array<{ html: string; text: string; start: number; end: number }> = [];
  const regex = /<(?:p|h[1-6])\b[^>]*>[\s\S]*?<\/(?:p|h[1-6])>/g;
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

function parseContentBlocks(html: string) {
  const blocks: Array<{ html: string; text: string; start: number; end: number }> = [];
  const regex = /<(?:p|h[1-6]|li)\b[^>]*>[\s\S]*?<\/(?:p|h[1-6]|li)>/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(html)) !== null) {
    const blockHtml = match[0];
    blocks.push({
      html: blockHtml,
      text: normalizeText(blockHtml),
      start: match.index,
      end: match.index + blockHtml.length,
    });
  }
  return blocks;
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
    if (!isDistinctiveAnchorCandidate(candidate)) continue;
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

  let htmlStartIndex = anchorMatch.htmlStartIndex;
  let htmlEndIndex = anchorMatch.htmlEndIndex;
  const wordCharPattern = /[\p{L}\p{M}\p{N}'’-]/u;

  while (htmlStartIndex > 0 && wordCharPattern.test(html[htmlStartIndex - 1])) {
    htmlStartIndex -= 1;
  }

  while (htmlEndIndex < html.length && wordCharPattern.test(html[htmlEndIndex])) {
    htmlEndIndex += 1;
  }

  const before = html.slice(0, htmlStartIndex);
  const anchorHtml = html.slice(htmlStartIndex, htmlEndIndex);
  const after = html.slice(htmlEndIndex);
  const wrappedAnchor = !/<\/?strong\b/i.test(anchorHtml) ? `<strong>${anchorHtml}</strong>` : anchorHtml;
  const nextHtml = `${before}${wrappedAnchor}${markerHtml}${after}`;

  return {
    html: nextHtml,
    insertionIndex: before.length + wrappedAnchor.length,
  };
}

function findMainBodyStart(html: string, config: ImportConfig) {
  const paragraph = parseParagraphs(html).find((entry) => entry.text === config.bodyStartText);
  if (!paragraph) {
    throw new Error(`Unable to find main Volume body start: ${config.bodyStartText}`);
  }
  return paragraph.start;
}

function findMainHeadings(bodyHtml: string, volumeNumber: number, expectedChapters: number): HeadingMatch[] {
  const paragraphs = parseParagraphs(bodyHtml);
  const headings: HeadingMatch[] = [];

  if (!paragraphs.length) {
    throw new Error("No paragraphs found in main body html");
  }

  headings.push({
    start: paragraphs[0].start,
    end: paragraphs[0].end,
    text: paragraphs[0].text,
    markerCode: `${volumeNumber}:1`,
    markerNumber: 1,
  });

  paragraphs.forEach((paragraph) => {
    const correctedHeading =
      volumeNumber === 14 && paragraph.text === "Iron Age Messengers & Saints, & Their Times (14:1)"
        ? "Iron Age Messengers & Saints, & Their Times (14:11)"
        : paragraph.text;
    const match = correctedHeading.match(new RegExp(`^(.*)\\((${volumeNumber}:\\d+)\\):?$`));
    if (!match) return;
    const markerNumber = Number(match[2].split(":")[1]);
    if (markerNumber === 1) return;
    if (correctedHeading.length > 180) return;
    if (headings.some((entry) => entry.markerNumber === markerNumber)) return;
    headings.push({
      start: paragraph.start,
      end: paragraph.end,
      text: correctedHeading,
      markerCode: match[2],
      markerNumber,
    });
  });

  const ordered = headings.sort((a, b) => a.markerNumber - b.markerNumber);
  if (ordered.length !== expectedChapters) {
    throw new Error(`Expected ${expectedChapters} main headings, found ${ordered.length}`);
  }
  return ordered;
}

function extractMainChapterTitle(heading: HeadingMatch) {
  return heading.text.replace(/\s*\(\d+:\d+\):?\s*$/, "").trim();
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

  parseContentBlocks(contentHtml).forEach((paragraph) => {
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

  const enhancedParagraphs = parseContentBlocks(contentHtml).map((paragraph) => {
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

  contentHtml = contentHtml.replace(/<(?:p|h[1-6]|li)\b[^>]*>[\s\S]*?<\/(?:p|h[1-6]|li)>/g, () => enhancedParagraphs.shift() ?? "");

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
  volumeNumber: number,
  chapterId: string
) {
  const [volumePrefix, markerNumber] = markerCode.split(":");
  const marker = new RegExp(`\\(${volumePrefix}:${markerNumber}\\.?\\)`);
  const link = `<a href="/v/${volumeNumber}/${chapterId}/web-extension" class="web-extension-chip" data-web-extension-link="true" aria-label="Open web extension ${ordinal}">Web-Extension ${ordinal}</a>`;
  return chapterHtml.replace(marker, link).trim();
}

function findExtensionStart(html: string, config: ImportConfig) {
  const paragraph = parseParagraphs(html).find((entry) =>
    config.extensionStartPattern.test(entry.text)
  );
  if (!paragraph) {
    throw new Error("Unable to find web extension body start");
  }
  return paragraph.start;
}

function findExtensionMarkers(bodyHtml: string, volumeNumber: number) {
  const paragraphs = parseParagraphs(bodyHtml);
  const openings = new Map<number, { start: number; end: number }>();
  const endings = new Map<number, { start: number; end: number }>();

  paragraphs.forEach((paragraph) => {
    const opening = paragraph.text.match(
      new RegExp(`^Opening of Web-?Extension \\((${volumeNumber}:\\d+)\\)$`, "i")
    );
    if (opening) {
      const markerNumber = Number(opening[1].split(":")[1]);
      openings.set(markerNumber, { start: paragraph.start, end: paragraph.end });
      return;
    }

    const ending = paragraph.text.match(
      new RegExp(`^End of Web-?Extension(?: \\+ Draft)? \\((${volumeNumber}:\\d+)\\)$`, "i")
    );
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

async function runImport(config: ImportConfig, volumeNumber: number) {
  const mainPath = await resolveSourcePath(config.mainAlias, "mainFallback" in config ? config.mainFallback : undefined);
  const extensionPath = await resolveSourcePath(config.extAlias, "extFallback" in config ? config.extFallback : undefined);

  const [{ value: mainHtml }, { value: extensionHtml }, { value: mainText }] = await Promise.all([
    mammoth.convertToHtml({ path: mainPath }),
    mammoth.convertToHtml({ path: extensionPath }),
    mammoth.extractRawText({ path: mainPath }),
  ]);

  const { value: extensionText } = await mammoth.extractRawText({ path: extensionPath });
  const tocEntries = mergeTocEntries(
    parseTocEntries(mainText, volumeNumber, config.expectedChapters),
    parseTocEntries(extensionText, volumeNumber, config.expectedChapters)
  );
  if (tocEntries.length !== config.expectedChapters) {
    throw new Error(`Expected ${config.expectedChapters} TOC entries, found ${tocEntries.length}`);
  }

  const cleanedMainHtml = cleanMainHtml(mainHtml);
  const mainBodyHtml = cleanedMainHtml.slice(findMainBodyStart(cleanedMainHtml, config));
  const headings = findMainHeadings(mainBodyHtml, volumeNumber, config.expectedChapters);

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
  const extensionBodyHtml = cleanedExtensionHtml.slice(findExtensionStart(cleanedExtensionHtml, config));
  const globalExtensionFootnotes = extractGlobalExtensionFootnotes(cleanedExtensionHtml);
  const { openings, endings } = findExtensionMarkers(extensionBodyHtml, volumeNumber);
  const extensionEntries: Record<string, WebExtensionEntry> = {};

  tocEntries.forEach((entry) => {
    const open = openings.get(entry.markerNumber);
    const explicitEnd = endings.get(entry.markerNumber);
    const nextOpen = openings.get(entry.markerNumber + 1);
    if (!open) {
      throw new Error(`Missing extension opening for ${entry.markerCode}`);
    }
    const chapterMeta = chapterMetaByMarker.get(entry.markerCode);
    if (!chapterMeta) {
      throw new Error(`Missing chapter meta for ${entry.markerCode}`);
    }

    const segmentEnd =
      explicitEnd && explicitEnd.start > open.end
        ? explicitEnd.start
        : nextOpen?.start ?? extensionBodyHtml.length;
    const segmentHtml = removeBoilerplateLead(extensionBodyHtml.slice(open.end, segmentEnd).trim());

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
      volumeNumber,
      chapterMeta.chapterId
    );
    mainChapter.sections[0].footnotes = imported.footnotes;
    mainChapter.description = buildSnippet(mainChapter.sections[0].content);

    extensionEntries[chapterMeta.chapterId] = {
      id: extSectionId,
      markerCode: entry.markerCode,
      ordinal: entry.markerNumber,
      volumeNumber,
      chapterId: chapterMeta.chapterId,
      chapterTitle: chapterMeta.chapterTitle,
      title: `Web Extensions for "${chapterMeta.chapterTitle}"`,
      content,
      footnotes,
    };
  });

  renumberVolumeMainFootnotes(chapters);

  const volumeData: BookData = {
    volumeNumber,
    volumeTitle: config.volumeTitle,
    seriesTitle: SERIES_TITLE,
    seriesSubtitle: SERIES_SUBTITLE,
    author: AUTHOR,
    introduction: config.introduction,
    totalVolumes: 19,
    chapters,
  };

  const mainFile = `import type { BookData } from "@shared/schema";\n\nexport const ${config.exportMainName}: BookData = ${JSON.stringify(
    volumeData,
    null,
    2
  )};\n`;

  const extFile = `import type { WebExtensionEntry } from "@shared/schema";\n\nexport const ${config.exportExtName}: Record<string, WebExtensionEntry> = ${JSON.stringify(
    extensionEntries,
    null,
    2
  )};\n`;

  await fs.writeFile(config.outputMain, mainFile, "utf-8");
  await fs.writeFile(config.outputExt, extFile, "utf-8");

  console.log(`[volume${volumeNumber}] Wrote ${config.outputMain}`);
  console.log(`[volume${volumeNumber}] Wrote ${config.outputExt}`);
}

async function main() {
  const requestedVolume = Number(process.argv[2] ?? 1);
  const config = CONFIGS[requestedVolume as keyof typeof CONFIGS];
  if (!config) throw new Error(`Unsupported syntopicon volume: ${requestedVolume}`);
  await runImport(config, requestedVolume);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
