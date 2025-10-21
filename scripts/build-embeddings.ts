import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import OpenAI from "openai";
import { volumeOneData } from "../client/src/lib/content/volume1";
import { volumeTwoData } from "../client/src/lib/content/volume2";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface KnowledgeChunkInput {
  id: string;
  text: string;
  metadata: {
    volumeNumber: number;
    volumeTitle: string;
    chapterId: string;
    chapterTitle: string;
    sectionId: string;
    sectionTitle: string;
    snippet: string;
    highlight: string;
    keyphrase: string;
  };
}

interface KnowledgeChunk extends KnowledgeChunkInput {
  embedding: number[];
}

const OUTPUT_PATH = path.join(__dirname, "../server/data/knowledge-index.json");
const MAX_CHARS = 900;
const BATCH_SIZE = 32;

function htmlToPlainText(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&ldquo;/g, "\"")
    .replace(/&rdquo;/g, "\"")
    .replace(/&lsquo;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function chunkParagraph(paragraph: string): string[] {
  const chunks: string[] = [];
  let remaining = paragraph.trim();
  while (remaining.length > MAX_CHARS) {
    const sliceIndex = remaining.lastIndexOf(" ", MAX_CHARS);
    const index = sliceIndex > 0 ? sliceIndex : MAX_CHARS;
    chunks.push(remaining.slice(0, index).trim());
    remaining = remaining.slice(index).trim();
  }
  if (remaining) {
    chunks.push(remaining);
  }
  return chunks;
}

function collectChunks(): KnowledgeChunkInput[] {
  const books = [volumeOneData, volumeTwoData];
  const entries: KnowledgeChunkInput[] = [];

  books.forEach((book) => {
    book.chapters.forEach((chapter) => {
      chapter.sections.forEach((section) => {
        const plainText = htmlToPlainText(section.content);
        if (!plainText) return;

        const paragraphs = plainText
          .split(/\n+/)
          .map((p) => p.trim())
          .filter(Boolean);

        paragraphs.forEach((paragraph, index) => {
          const chunks = chunkParagraph(paragraph);
          chunks.forEach((chunk, chunkIndex) => {
            const normalized = chunk.replace(/[\s\u00A0]+/g, " ").trim();
            const rawHighlight = normalized;
            const snippet = normalized.length > 200
              ? `${normalized.slice(0, normalized.lastIndexOf(" ", 180)).trim()}…`
              : normalized;
            const keyphrase = normalized.split(" ").slice(0, 12).join(" ");
            entries.push({
              id: `${book.volumeNumber}:${chapter.id}:${section.id}:${index}:${chunkIndex}`,
              text: chunk,
              metadata: {
                volumeNumber: book.volumeNumber,
                volumeTitle: book.volumeTitle,
                chapterId: chapter.id,
                chapterTitle: chapter.title,
                sectionId: section.id,
                sectionTitle: section.title,
                snippet,
                highlight: rawHighlight,
                keyphrase,
              },
            });
          });
        });
      });
    });
  });

  return entries;
}

async function main() {
  if (!process.env.OPENAI_API_KEY) {
    console.error("OPENAI_API_KEY is required to build embeddings");
    process.exit(1);
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const inputs = collectChunks();

  console.log(`Preparing ${inputs.length} knowledge chunks…`);

  const outputDir = path.dirname(OUTPUT_PATH);
  await fs.mkdir(outputDir, { recursive: true });

  const knowledge: KnowledgeChunk[] = [];

  for (let i = 0; i < inputs.length; i += BATCH_SIZE) {
    const batch = inputs.slice(i, i + BATCH_SIZE);
    const response = await client.embeddings.create({
      model: "text-embedding-3-large",
      input: batch.map((entry) => entry.text),
    });

    response.data.forEach((item, index) => {
      knowledge.push({
        ...batch[index],
        embedding: item.embedding,
      });
    });

    console.log(`Embedded ${Math.min(i + BATCH_SIZE, inputs.length)} / ${inputs.length}`);
  }

  await fs.writeFile(OUTPUT_PATH, JSON.stringify(knowledge, null, 2), "utf-8");
  console.log(`Saved embeddings to ${OUTPUT_PATH}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
