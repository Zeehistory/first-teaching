type Req = any;
type Res = any;

function unauthorized(res: Res) {
  res.setHeader("WWW-Authenticate", 'Basic realm="First Teaching"');
  return res.status(401).send("Authentication required");
}

export default async function middleware(req: Req, res: Res) {
  const enabled = (process.env.BASIC_AUTH || "on").toLowerCase() !== "off";
  if (!enabled) return;

  const user = process.env.BASIC_USER || "reader";
  const pass = process.env.BASIC_PASS || "the-first-teaching-testing-2025";

  const header = req.headers["authorization"] || "";
  const token = typeof header === "string" && header.startsWith("Basic ") ? header.slice(6) : "";
  const [u, p] = token ? Buffer.from(token, "base64").toString().split(":") : ["", ""];
  if (u !== user || p !== pass) {
    return unauthorized(res);
  }
  // Valid credentials: allow request to continue without sending a response here.
  return;
}
