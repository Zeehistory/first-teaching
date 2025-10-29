import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { answerQuestion } from "../shared/assistant";

export async function registerRoutes(app: Express): Promise<Server> {
  // put application routes here
  // prefix all routes with /api

  // use storage to perform CRUD operations on the storage interface
  // e.g. storage.insertUser(user) or storage.getUserByUsername(username)

  const httpServer = createServer(app);

  app.post("/api/ai/ask", async (req, res) => {
    const question = (req.body?.question ?? "").toString().trim();
    if (!question) {
      return res.status(400).json({ message: "Question is required" });
    }

    try {
      const result = await answerQuestion(question);
      return res.json(result);
    } catch (error) {
      console.error("AI assistant error", error);
      return res.status(500).json({ message: "Unable to answer the question right now." });
    }
  });

  return httpServer;
}
