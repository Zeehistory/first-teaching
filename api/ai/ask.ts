import * as assistantModule from "../assistant-core.js";
import { answerQuestion } from "../assistant-core.js";

const assistantModuleKeys = Object.keys(assistantModule);
if (assistantModuleKeys.length === 0) {
  console.warn("[DEBUG] Assistant module appears empty; bundler may have tree-shaken it.");
} else {
  console.log("[DEBUG] Assistant module keys:", assistantModuleKeys);
}

console.log("[DEBUG] process.cwd():", typeof process !== "undefined" ? process.cwd() : "<no process>");
console.log("[DEBUG] import.meta.url:", import.meta.url);

type Req = any;
type Res = any;

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

    const result = await answerQuestion(question);
    return res.status(200).json(result);
  } catch (err: any) {
    const message = err?.message || "Internal Server Error";
    return res.status(500).json({ message });
  }
}
