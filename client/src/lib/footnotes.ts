import type { Footnote } from "@shared/schema";

export function getFootnoteOrigin(footnote: Footnote): "syntopicon" | "web-extension" {
  return footnote.origin ?? "syntopicon";
}

export function getFootnoteDisplayNumber(footnote: Footnote): number {
  return footnote.displayNumber ?? footnote.number;
}

export function getFootnoteMarkerKey(footnote: Footnote): string {
  return footnote.markerKey ?? `${getFootnoteOrigin(footnote)}:${footnote.number}`;
}

export function buildFootnoteSelector(footnote: Footnote): string {
  const markerKey = footnote.markerKey;
  if (markerKey) {
    return `sup[data-footnote-key="${CSS.escape(markerKey)}"]`;
  }
  return `sup[data-footnote="${getFootnoteDisplayNumber(footnote)}"]`;
}

