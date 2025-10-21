# The First Teaching — Digital Companion

An interactive study environment for **“The First Teaching of the Last Message”**. Readers can explore the full multi-volume text, jump between structural sections, and ask an embedded AI assistant for annotated commentary backed by inline citations that deep-link into the source material with precise highlighting.

- **Volumes & Chapters UI:** Responsive reading shell with sidebar navigation, reading progress, and adjustable text size.
- **Citation-aware Assistant:** `/api/ai/ask` endpoint returns answers with numbered citations; the client renders clickable buttons that route to the referenced section.
- **Precise Highlighting:** Citation links include `s`, `h`, and `hi` query parameters so the chapter page scrolls to the correct section and activates the matched highlight term.
- **Search & Footnotes:** Modal search overlay, footnote drawer, and page reference input for fast navigation.
- **Embeddings Knowledge Base:** Locally generated OpenAI embeddings allow semantic citations into the text corpus.

---

## Project Structure

- `server/` — Express API, AI assistant routes, Vite integration for dev, and optional basic auth.
- `client/` — Vite + React (Wouter router, TanStack Query, Tailwind) for the reader experience.
- `content/` — Source documents used to build the knowledge index.
- `scripts/` — Helpers such as `build-embeddings.ts` to refresh the AI knowledge base.
- `shared/` — Shared TypeScript types used by server and client.

---

## Prerequisites

- Node.js ≥ 20 (project currently runs with v23.7.0 in development).
- npm ≥ 9.
- An OpenAI API key with access to the `text-embedding-3-large` model.

---

## Environment Variables

Create a `.env` file in the project root or export variables in your shell before starting the server:

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `OPENAI_API_KEY` | ✅ | — | Used by `server/ai.ts` to generate embeddings and answer questions. |
| `PORT` | ❌ | `5000` | Express listen port (API + client in production). |
| `HOST` | ❌ | `127.0.0.1` | Bind host. |
| `BASIC_USER` | ❌ | `reader` | Username for optional HTTP basic auth. |
| `BASIC_PASS` | ❌ | `the-first-teaching-testing-2025` | Password for basic auth. |
| `BASIC_AUTH` | ❌ | `on` | Set to `off` to disable basic auth in development. |

> ℹ️ The AI assistant will refuse to start without `OPENAI_API_KEY`. If you only want to browse the static content, you can temporarily comment out the client creation in `server/ai.ts`, but the preferred approach is supplying the key.

---

## Installing Dependencies

```bash
npm install
cd client && npm install
```

Run the root install first (server + shared dependencies), then install the client bundle.

---

## Running in Development

Start the API (Express + Vite middleware):

```bash
OPENAI_API_KEY="sk-..." npm run dev
```

If the default port (`5000`) is busy, override it:

```bash
PORT=5001 OPENAI_API_KEY="sk-..." npm run dev
```

Then launch the Vite dev server in another terminal:

```bash
cd client
npm run dev
```

Visit the Vite URL (default `http://localhost:5173`). The frontend proxies API calls to the Express server.

---

## Building the Knowledge Index

When content changes, regenerate embeddings so the assistant returns accurate references:

```bash
npm run build:knowledge
```

This reads from `content/`, generates embeddings via OpenAI, and writes `server/data/knowledge-index.json`. Ensure your API key is set before running the script.

---

## Quality Checks & Production Build

- **Type check:** `npm run check`
- **Client build:** From repo root `npm run build` (runs both `vite build` for the client and bundles the server entry with esbuild).
- **Start production bundle:** `npm start` (after `npm run build`).

---

## Troubleshooting

- **Missing API key:** `OpenAIError: The OPENAI_API_KEY environment variable is missing` — set `OPENAI_API_KEY` before starting the server or mock the AI layer.
- **Port already in use:** `EADDRINUSE 127.0.0.1:5000` — stop the other process (`lsof -i :5000`) or set `PORT` to a free port.
- **Knowledge index not found:** On first run you may see `Knowledge index not found – run npm run build:knowledge` in server logs. Run the build command above to generate embeddings.
- **Highlights not activating:** Ensure citation URLs include `h` and `hi` parameters (handled by the assistant response). The Chapter page now consumes them via Wouter’s `useSearch`, so reloading the page preserves the highlight.

---

## Contributing Workflow

1. Create a descriptive branch.
2. Make changes in `client/` and/or `server/`.
3. Validate with `npm run check` and manual verification of citation highlighting.
4. Run `npm run build:knowledge` if you modified the corpus.
5. Submit a pull request with a summary of the feature/fix and any highlight regression checks.

Enjoy exploring *The First Teaching* with precise, AI-assisted citations!
