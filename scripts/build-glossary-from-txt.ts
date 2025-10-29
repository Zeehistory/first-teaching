import fs from "fs";
import fsp from "fs/promises";
import path from "path";

type GlossaryEntry = { index: number; title: string; slug: string };

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

async function main() {
  const root = process.cwd();
  const txtPath = path.join(root, "content", "source", "Teaching_Glossary_Entries_Clean.txt");
  const outTs = path.join(root, "shared", "glossary.ts");

  if (!fs.existsSync(txtPath)) {
    console.error("[build:glossary:txt] Missing TXT:", txtPath);
    process.exit(1);
  }

  const raw = await fsp.readFile(txtPath, "utf-8");
  const rawLines = raw.split(/\r?\n/);

  const lines = rawLines
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
    .filter((l) => !/^(taken from|volume\s*\d+[:)]?)$/i.test(l));

  const seen = new Set<string>();
  const entries: GlossaryEntry[] = [];

  lines.forEach((title, i) => {
    // collapse weird quotes and punctuation
    const normalized = title.replace(/[\u201C\u201D\u2018\u2019]/g, '"').replace(/\s+/g, ' ').trim();
    const slug = slugify(normalized);
    if (!slug || seen.has(slug)) return;
    seen.add(slug);
    entries.push({ index: entries.length + 1, title: normalized, slug });
  });

  if (entries.length === 0) {
    console.error("[build:glossary:txt] No entries parsed.");
    process.exit(1);
  }

  const ts = `// Auto-generated from TXT by scripts/build-glossary-from-txt.ts\n` +
    `export type GlossaryEntry = { index: number; title: string; slug: string };\n` +
    `export const glossary: GlossaryEntry[] = ${JSON.stringify(entries, null, 2)};\n`;

  await fsp.writeFile(outTs, ts, "utf-8");
  console.log(`[build:glossary:txt] Wrote ${entries.length} entries to ${outTs}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

