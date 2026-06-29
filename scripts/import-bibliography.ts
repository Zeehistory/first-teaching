import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import mammoth from "mammoth";
import type {
  BibliographyData,
  BibliographyEntry,
  BibliographySection,
} from "../shared/schema";

type HtmlBlock = {
  html: string;
  text: string;
  start: number;
  end: number;
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");
const SOURCE_ROOT = process.env.FIRST_TEACHING_SOURCE_ROOT
  ? path.resolve(process.env.FIRST_TEACHING_SOURCE_ROOT)
  : ROOT;
const SOURCE = path.join(
  SOURCE_ROOT,
  "25p - First Teaching",
  "Volume 19 (Bibliography)",
  "Volume19-Bibliography.docx",
);
const OUTPUT = path.join(ROOT, "client", "src", "lib", "content", "volume19Bibliography.ts");

function decodeText(value: string) {
  return value
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function parseBlocks(html: string): HtmlBlock[] {
  const blocks: HtmlBlock[] = [];
  const regex = /<(p|h[1-6]|li)\b[^>]*>[\s\S]*?<\/\1>/gi;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(html)) !== null) {
    blocks.push({
      html: match[0],
      text: decodeText(match[0]),
      start: match.index,
      end: match.index + match[0].length,
    });
  }
  return blocks;
}

function slugify(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

function cleanEntryHtml(value: string) {
  return value
    .replace(/<a id="[^"]*"><\/a>/g, "")
    .replace(/<(?:h[1-6])\b[^>]*>/i, "<p>")
    .replace(/<\/(?:h[1-6])>$/i, "</p>")
    .replace(/<li\b[^>]*>/i, "<p>")
    .replace(/<\/li>$/i, "</p>")
    .replace(/<p>\s*<\/p>/gi, "")
    .trim();
}

async function main() {
  const { value: html, messages } = await mammoth.convertToHtml({ path: SOURCE });
  const blocks = parseBlocks(html);
  const sectionHeadings = blocks
    .map((block, index) => {
      const match = block.text.match(/\(((?:PS|SS)\d+)\)\s*$/i);
      return match ? { block, index, code: match[1].toUpperCase() } : null;
    })
    .filter((value): value is NonNullable<typeof value> => Boolean(value));

  if (sectionHeadings.length !== 32) {
    throw new Error(`Expected 32 bibliography sections, found ${sectionHeadings.length}`);
  }

  const sections: BibliographySection[] = sectionHeadings.map((heading, sectionIndex) => {
    const nextHeading = sectionHeadings[sectionIndex + 1];
    const title = heading.block.text.replace(/\s*\((?:PS|SS)\d+\)\s*$/i, "").trim();
    const candidates = blocks.slice(heading.index + 1, nextHeading?.index ?? blocks.length);
    const entries: BibliographyEntry[] = candidates
      .filter((block) => block.text.length > 1)
      .filter((block) => !/^Book (?:One|Two):/i.test(block.text))
      .filter((block) => !/^Index$/i.test(block.text))
      .map((block, entryIndex) => ({
        id: `${heading.code.toLowerCase()}-${String(entryIndex + 1).padStart(4, "0")}-${slugify(block.text.slice(0, 72))}`,
        html: cleanEntryHtml(block.html),
        text: block.text,
      }))
      .filter((entry) => entry.html.length > 0);

    return {
      code: heading.code,
      title,
      sourceType: heading.code.startsWith("PS") ? "primary" : "secondary",
      entries,
    };
  });

  const notes = ["N.p. = no place", "n.p. = no publication", "n.d. = no date"];
  const data: BibliographyData = {
    volumeNumber: 19,
    title: "Bibliography",
    introduction:
      "An online research catalogue of the primary texts, traditional sources, modern studies, translations, and reference works supporting The First Teaching.",
    notes,
    sections,
    totalEntries: sections.reduce((total, section) => total + section.entries.length, 0),
  };

  const output =
    'import type { BibliographyData } from "@shared/schema";\n\n' +
    `export const volumeNineteenBibliography: BibliographyData = ${JSON.stringify(data, null, 2)};\n`;

  await fs.writeFile(OUTPUT, output, "utf8");
  console.log(
    `[bibliography] Wrote ${data.totalEntries} entries across ${sections.length} sections to ${OUTPUT}` +
      (messages.length ? ` (${messages.length} conversion notices)` : ""),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
