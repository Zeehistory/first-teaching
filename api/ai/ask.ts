import type { VercelRequest, VercelResponse } from "@vercel/node";
import { answerQuestion } from "../../../server/ai";

function unauthorized(res: VercelResponse) {
  res.setHeader("WWW-Authenticate", 'Basic realm="First Teaching"');
  return res.status(401).json({ message: "Authentication required" });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    // Basic Auth check
    const user = process.env.BASIC_USER || "reader";
    const pass = process.env.BASIC_PASS || "the-first-teaching-testing-2025";
    const enabled = (process.env.BASIC_AUTH || "on").toLowerCase() !== "off";

    if (enabled) {
      const header = req.headers["authorization"] || "";
      const token = typeof header === "string" && header.startsWith("Basic ") ? header.slice(6) : "";
      const [u, p] = token ? Buffer.from(token, "base64").toString().split(":") : ["", ""];
      if (u !== user || p !== pass) {
        return unauthorized(res);
      }
    }

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
