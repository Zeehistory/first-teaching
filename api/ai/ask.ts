import { answerQuestion } from "../../server/ai";

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
