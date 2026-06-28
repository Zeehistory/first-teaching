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
