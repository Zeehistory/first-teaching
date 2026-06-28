/**
 * build-summaries.ts
 *
 * Pre-generates short, human one-line summaries for hover/preview surfaces so
 * the static (GitHub Pages) site can show "what this is about" without a
 * backend. Output: client/src/data/summaries.json, a flat map keyed by a
 * stable id:
 *
 *   {
 *     "footnote:<footnoteId>": "…",
 *     "section:<sectionId>":   "…",
 *     "sub:<subId>":           "…"
 *   }
 *
 * The components read this map and fall back to an excerpt when a key is
 * missing, so the site keeps working before/while this runs.
 *
 * Usage:
 *   ANTHROPIC_API_KEY=sk-... npx tsx scripts/build-summaries.ts
 *   ANTHROPIC_API_KEY=sk-... npx tsx scripts/build-summaries.ts --force   # re-do all
 *
 * Uses the Messages Batches API (async, 50% cost) on claude-opus-4-8.
 * Requires: npm i @anthropic-ai/sdk
 */
import Anthropic from "@anthropic-ai/sdk";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { volumes } from "../client/src/lib/volumes";
import { processSubsections } from "../client/src/lib/subsections";
import type { BookData, Footnote, Section } from "../shared/schema";

const OUT = path.resolve("client/src/data/summaries.json");
const MODEL = "claude-opus-4-8";
const force = process.argv.includes("--force");

function plain(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

interface Item {
  key: string;
  kind: "footnote" | "section" | "sub";
  label: string; // title or footnote number, for context
  text: string; // source text to summarize
}

/** Walk every volume and collect the items that need a summary. */
function collectItems(): Item[] {
  const items: Item[] = [];
  const books = volumes
    .map((v) => v.data)
    .filter((d): d is BookData => Boolean(d));

  for (const book of books) {
    for (const chapter of book.chapters) {
      for (const section of chapter.sections as Section[]) {
        const sectionBody = plain(section.content);
        if (sectionBody.length > 60) {
          items.push({
            key: `section:${section.id}`,
            kind: "section",
            label: section.title,
            text: sectionBody.slice(0, 4000),
          });
        }
        // Crossheads: summarize the text that follows each within the section.
        const { subsections } = processSubsections(section.content, section.id);
        subsections.forEach((sub) => {
          items.push({
            key: `sub:${sub.id}`,
            kind: "sub",
            label: sub.title,
            text: sectionBody.slice(0, 4000),
          });
        });
        // Footnotes
        section.footnotes?.forEach((fn: Footnote) => {
          const fnBody = plain(fn.content);
          if (fnBody.length > 40) {
            items.push({
              key: `footnote:${fn.id}`,
              kind: "footnote",
              label: `Footnote ${fn.number}`,
              text: fnBody.slice(0, 4000),
            });
          }
        });
      }
    }
  }
  return items;
}

function promptFor(item: Item): string {
  const what =
    item.kind === "footnote"
      ? "this footnote"
      : item.kind === "sub"
        ? `the passage under the heading “${item.label}”`
        : `this section (“${item.label}”)`;
  return [
    `Write a single concise sentence (max ~18 words) summarizing what ${what} is about.`,
    `Be specific and neutral; no "This section…" preamble; no quotation marks.`,
    `Preserve any transliterated terms (e.g. al-Ṣirāṭ) exactly.`,
    ``,
    item.text,
  ].join("\n");
}

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("ANTHROPIC_API_KEY is required.");
    process.exit(1);
  }
  const client = new Anthropic();

  const existing: Record<string, string> =
    !force && existsSync(OUT) ? JSON.parse(readFileSync(OUT, "utf8")) : {};

  const all = collectItems();
  const todo = all.filter((it) => !existing[it.key]);
  console.log(
    `${all.length} items total; ${todo.length} to summarize${force ? " (force)" : ""}.`,
  );
  if (todo.length === 0) {
    console.log("Nothing to do.");
    return;
  }

  // Submit as one Messages batch (async, 50% cost).
  const batch = await client.messages.batches.create({
    requests: todo.map((it) => ({
      custom_id: it.key.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 64),
      params: {
        model: MODEL,
        max_tokens: 128,
        thinking: { type: "adaptive" },
        messages: [{ role: "user", content: promptFor(it) }],
      },
    })),
  });
  console.log(`Submitted batch ${batch.id}. Polling…`);

  // Poll until ended.
  let status = batch;
  while (status.processing_status !== "ended") {
    await new Promise((r) => setTimeout(r, 10_000));
    status = await client.messages.batches.retrieve(batch.id);
    process.stdout.write(".");
  }
  console.log("\nBatch ended. Collecting results…");

  // Map custom_id back to the original key.
  const byCustomId = new Map(
    todo.map((it) => [it.key.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 64), it.key]),
  );

  const out: Record<string, string> = { ...existing };
  for await (const entry of await client.messages.batches.results(batch.id)) {
    if (entry.result.type !== "succeeded") continue;
    const key = byCustomId.get(entry.custom_id);
    if (!key) continue;
    const block = entry.result.message.content.find((b) => b.type === "text");
    const text = block && "text" in block ? block.text.trim() : "";
    if (text) out[key] = text.replace(/^["“]|["”]$/g, "").trim();
  }

  mkdirSync(path.dirname(OUT), { recursive: true });
  writeFileSync(OUT, JSON.stringify(out, null, 2) + "\n");
  console.log(`Wrote ${Object.keys(out).length} summaries → ${OUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
