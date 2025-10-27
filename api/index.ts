import fs from "fs";
import path from "path";

type Req = any;
type Res = any;

function unauthorized(res: Res) {
  res.setHeader("WWW-Authenticate", 'Basic realm="First Teaching"');
  return res.status(401).send("Authentication required");
}

export default async function handler(req: Req, res: Res) {
  // Basic Auth
  const enabled = (process.env.BASIC_AUTH || "on").toLowerCase() !== "off";
  if (enabled) {
    const user = process.env.BASIC_USER || "reader";
    const pass = process.env.BASIC_PASS || "the-first-teaching-testing-2025";
    const header = req.headers["authorization"] || "";
    const token = typeof header === "string" && header.startsWith("Basic ") ? header.slice(6) : "";
    const [u, p] = token ? Buffer.from(token, "base64").toString().split(":") : ["", ""];
    if (u !== user || p !== pass) return unauthorized(res);
  }

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

