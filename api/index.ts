import fs from "fs";
import path from "path";

type Req = any;
type Res = any;

export default async function handler(_req: Req, res: Res) {
  // Serve the built SPA HTML so client-side routing works for / and /v/*
  const indexPath = path.join(process.cwd(), "api", "_public", "index.html");
  try {
    const html = fs.readFileSync(indexPath, "utf-8");
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.status(200).send(html);
  } catch (e) {
    return res.status(500).send("Index not found. Build may have failed.");
  }
}
