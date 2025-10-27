import OpenAI from "openai";
import fs from "fs";
import path from "path";

type Req = any;
type Res = any;

function unauthorized(res: Res) {
  res.setHeader("WWW-Authenticate", 'Basic realm="First Teaching"');
  return res.status(401).json({ message: "Authentication required" });
}

// Minimal replicas of server/ai.ts helpers (trimmed)
function vectorNorm(values: number[]): number {
  return Math.sqrt(values.reduce((sum, v) => sum + v * v, 0));
}

function cosineSimilarity(a: number[], aNorm: number, b: number[], bNorm: number): number {
  const length = Math.min(a.length, b.length);
  let dot = 0;
  for (let i = 0; i < length; i++) dot += a[i] * b[i];
  return dot / (aNorm * bNorm);
}

const KNOWLEDGE_PATH = path.join(process.cwd(), "server", "data", "knowledge-index.json");
let knowledgeBase: any[] | null = null;

function loadKnowledgeBase() {
  if (knowledgeBase) return knowledgeBase;
  if (!fs.existsSync(KNOWLEDGE_PATH)) return (knowledgeBase = []);
  const parsed = JSON.parse(fs.readFileSync(KNOWLEDGE_PATH, "utf-8"));
  knowledgeBase = parsed.map((chunk: any) => ({ ...chunk, norm: vectorNorm(chunk.embedding) }));
  return knowledgeBase;
}

async function embedQuery(client: OpenAI, query: string) {
  const r = await client.embeddings.create({ model: "text-embedding-3-large", input: query });
  const embedding = r.data[0].embedding as number[];
  return { embedding, norm: vectorNorm(embedding) };
}

function pickTopChunks(embedding: number[], norm: number, topK = 8) {
  const base = loadKnowledgeBase();
  if (!base.length) return [] as any[];
  return base
    .map((chunk) => ({ chunk, score: cosineSimilarity(chunk.embedding, chunk.norm, embedding, norm) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map((e) => e.chunk);
}

function buildPrompt(question: string, chunks: any[]): string {
  const context = chunks
    .map((chunk, i) => `[#${i + 1}] Volume ${chunk.metadata.volumeNumber} — ${chunk.metadata.chapterTitle} — ${chunk.metadata.sectionTitle}\n${chunk.text}`)
    .join("\n\n");
  return `CONTEXT\n${context}\n\nQUESTION\n${question}`;
}

export default async function handler(req: Req, res: Res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const question = (req.body?.question ?? "").toString().trim();
    if (!question) {
      return res.status(400).json({ message: "Question is required" });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ message: "OPENAI_API_KEY not configured" });
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const { embedding, norm } = await embedQuery(client, question);
    const top = pickTopChunks(embedding, norm, 8);
    const prompt = buildPrompt(question, top);

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      messages: [
        { role: "system", content: "You respond in Markdown with citations like [#1]." },
        { role: "user", content: prompt },
      ],
    });

    const answer = response.choices[0]?.message?.content?.trim() ?? "";
    return res.status(200).json({ answer, references: [] });
  } catch (err: any) {
    const message = err?.message || "Internal Server Error";
    return res.status(500).json({ message });
  }
}
