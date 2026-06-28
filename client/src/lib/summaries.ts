import summaries from "@/data/summaries.json";

/**
 * Pre-generated one-line summaries for hover/preview surfaces, keyed by
 * `footnote:<id>`, `section:<id>`, or `sub:<id>`. Built offline by
 * scripts/build-summaries.ts. When a key is missing we fall back to an
 * excerpt, so previews always show something.
 */
const MAP = summaries as Record<string, string>;

export function footnoteSummary(id: string): string | null {
  return MAP[`footnote:${id}`] ?? null;
}

export function sectionSummary(id: string): string | null {
  return MAP[`section:${id}`] ?? null;
}

export function subSummary(id: string): string | null {
  return MAP[`sub:${id}`] ?? null;
}

/**
 * Tidy a preview string for display: drop a trailing ellipsis (the data often
 * stores pre-truncated snippets ending in "…") and trim to the last complete
 * sentence so the preview reads as a whole thought rather than a cut-off line.
 */
export function cleanPreview(text: string): string {
  let t = (text ?? "").trim();
  // Remove trailing ellipsis / comma-ellipsis artefacts.
  t = t.replace(/[\s,;:]*(?:…|\.\.\.)\s*$/, "").trim();
  // If it ends mid-sentence (no terminal punctuation), trim back to the last
  // sentence end so we don't show a dangling fragment.
  if (!/[.!?”"’']$/.test(t)) {
    const lastEnd = Math.max(t.lastIndexOf(". "), t.lastIndexOf("! "), t.lastIndexOf("? "));
    if (lastEnd > 40) t = t.slice(0, lastEnd + 1).trim();
  }
  return t;
}
