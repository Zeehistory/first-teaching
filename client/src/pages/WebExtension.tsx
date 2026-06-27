import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { useLocation, useRoute } from "wouter";
import ChapterContent from "@/components/ChapterContent";
import FootnotePanel from "@/components/FootnotePanel";
import ThemeToggle from "@/components/ThemeToggle";
import TextSizeControl from "@/components/TextSizeControl";
import type { Footnote, Section, WebExtensionEntry } from "@shared/schema";
import { volumeEighteenWebExtensions, volumeOneWebExtensions } from "@/lib/content";
import { buildFootnoteSelector, getFootnoteDisplayNumber } from "@/lib/footnotes";
import { readReadingReturnState } from "@/lib/readingReturn";

function extractGlossSnippet(html: string, limit = 150) {
  const text = (() => {
    if (typeof window !== "undefined") {
      const tmp = window.document.createElement("div");
      tmp.innerHTML = html;
      return tmp.textContent ?? "";
    }
    return html.replace(/<[^>]+>/g, " ");
  })().replace(/\s+/g, " ").trim();
  return text.length <= limit ? text : `${text.slice(0, limit).trimEnd()}…`;
}

export default function WebExtension() {
  const [, params] = useRoute("/v/:volumeNumber/:id/web-extension");
  const [, setLocation] = useLocation();
  const [selectedFootnote, setSelectedFootnote] = useState<Footnote | null>(null);
  const [textSize, setTextSize] = useState(() => {
    const saved = localStorage.getItem("textSize");
    return saved ? parseInt(saved, 10) : 18;
  });

  useEffect(() => {
    localStorage.setItem("textSize", textSize.toString());
  }, [textSize]);

  const volumeNumber = params?.volumeNumber ? parseInt(params.volumeNumber, 10) : NaN;
  const chapterId = params?.id ?? "";
  const extensionsByVolume = {
    1: volumeOneWebExtensions,
    18: volumeEighteenWebExtensions,
  } as const;
  const extensionMap =
    volumeNumber === 1 || volumeNumber === 18 ? extensionsByVolume[volumeNumber] : null;
  const extension = extensionMap ? extensionMap[chapterId] ?? null : null;
  const returnState = useMemo(() => readReadingReturnState(), []);

  /* Adjacent gatherings, by ordinal — the codex's prev/next leaves */
  const { prevExt, nextExt } = useMemo(() => {
    if (!extensionMap || !extension) return { prevExt: null, nextExt: null };
    const ordered = Object.values(extensionMap).sort((a, b) => a.ordinal - b.ordinal);
    const idx = ordered.findIndex((e) => e.chapterId === extension.chapterId);
    return {
      prevExt: idx > 0 ? ordered[idx - 1] : null,
      nextExt: idx > -1 && idx < ordered.length - 1 ? ordered[idx + 1] : null,
    } as { prevExt: WebExtensionEntry | null; nextExt: WebExtensionEntry | null };
  }, [extensionMap, extension]);

  const focusFootnoteMarker = useCallback((footnote: Footnote) => {
    if (typeof document === "undefined") return;
    const marker = document.querySelector<HTMLElement>(buildFootnoteSelector(footnote));
    if (!marker) return;
    marker.scrollIntoView({ behavior: "smooth", block: "center" });
    marker.classList.add("footnote-marker-focus");
    window.setTimeout(() => marker.classList.remove("footnote-marker-focus"), 2200);
  }, []);

  const handleFootnoteOpen = useCallback(
    (footnote: Footnote) => {
      setSelectedFootnote(footnote);
      focusFootnoteMarker(footnote);
    },
    [focusFootnoteMarker]
  );

  const section = useMemo<Section | null>(() => {
    if (!extension) return null;
    return {
      id: extension.id,
      title: extension.title,
      level: 3,
      parentId: null,
      content: extension.content,
      footnotes: extension.footnotes,
    };
  }, [extension]);

  if (!extension || !section) {
    return (
      <div className="codex-page-bg flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <div className="max-w-xl space-y-5">
          <p className="codex-label">Not found</p>
          <h1 className="masthead-title text-4xl">This extension has no leaf</h1>
          <p className="leading-relaxed text-[hsl(var(--codex-ink-soft))]">
            We couldn&apos;t locate the requested web extension.
          </p>
          <button
            type="button"
            onClick={() => setLocation(Number.isFinite(volumeNumber) ? `/v/${volumeNumber}` : "/")}
            className="inline-flex items-center gap-2 text-sm font-medium text-primary transition hover:text-[hsl(var(--gilt))]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to the volume
          </button>
        </div>
      </div>
    );
  }

  const glosses = extension.footnotes ?? [];

  return (
    <div className="web-extension-shell codex-page-bg flex h-screen flex-col overflow-hidden">
      {/* ---------- Codex header ---------- */}
      <header className="flex-shrink-0 border-b border-[hsl(var(--codex-rule)/0.8)] bg-[hsl(var(--codex-vellum)/0.7)] backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-5 py-3 md:px-8">
          <button
            type="button"
            onClick={() =>
              setLocation(returnState?.path ?? `/v/${extension.volumeNumber}/${extension.chapterId}`)
            }
            className="group inline-flex items-center gap-2 codex-label transition hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
            Back to chapter
          </button>

          <div className="flex items-center gap-2">
            <TextSizeControl
              textSize={textSize}
              onIncrease={() => setTextSize((s) => Math.min(s + 2, 22))}
              onDecrease={() => setTextSize((s) => Math.max(s - 2, 14))}
            />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="minimal-scrollbar flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-6xl gap-0 px-4 py-8 md:px-8 md:py-12">
          {/* ---------- Folio rail (signature) ---------- */}
          <aside className="folio-rail relative mr-6 hidden w-14 flex-shrink-0 flex-col items-center pt-2 md:flex">
            <span className="folio-rail-code">{extension.markerCode}</span>
            <span className="mt-6 h-16 w-px bg-[hsl(var(--gilt)/0.4)]" aria-hidden="true" />
            <nav className="mt-auto flex flex-col items-center gap-3 pb-2">
              <button
                type="button"
                disabled={!prevExt}
                onClick={() =>
                  prevExt && setLocation(`/v/${prevExt.volumeNumber}/${prevExt.chapterId}/web-extension`)
                }
                aria-label="Previous extension"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[hsl(var(--codex-rule))] text-[hsl(var(--codex-ink-soft))] transition hover:border-[hsl(var(--gilt))] hover:text-primary disabled:cursor-not-allowed disabled:opacity-30"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                disabled={!nextExt}
                onClick={() =>
                  nextExt && setLocation(`/v/${nextExt.volumeNumber}/${nextExt.chapterId}/web-extension`)
                }
                aria-label="Next extension"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[hsl(var(--codex-rule))] text-[hsl(var(--codex-ink-soft))] transition hover:border-[hsl(var(--gilt))] hover:text-primary disabled:cursor-not-allowed disabled:opacity-30"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </nav>
          </aside>

          {/* ---------- The leaf ---------- */}
          <article className="codex-leaf min-w-0 flex-1 rounded-sm px-6 py-10 md:px-12 md:py-14">
            <header className="mb-10 border-b border-[hsl(var(--codex-rule)/0.7)] pb-8">
              <div className="flex items-center gap-3">
                <span className="codex-label text-primary">Web Extension</span>
                <span className="folio-code text-sm">{extension.markerCode}</span>
              </div>
              <h1 className="masthead-title mt-4 text-[2rem] leading-tight sm:text-4xl md:text-5xl">
                {extension.chapterTitle}
              </h1>
              <p className="mt-4 max-w-2xl text-[0.95rem] leading-relaxed text-[hsl(var(--codex-ink-soft))]">
                Companion reading for the Syntopicon chapter — sources, glosses, and the
                expanded apparatus that outgrew the printed margin.
              </p>
            </header>

            {/* gloss layout: prose + outer margin */}
            <div className="gloss-layout">
              <div className="min-w-0">
                <ChapterContent
                  section={section}
                  chapterTitle={`Web Extensions for "${extension.chapterTitle}"`}
                  textSize={textSize}
                  highlightTerm={null}
                  sectionTrail={[]}
                  currentHighlightIndex={null}
                  onFootnoteClick={handleFootnoteOpen}
                  variant="bare"
                />
              </div>

              {glosses.length > 0 && (
                <aside className="gloss-margin" aria-label="Glosses">
                  <p className="codex-label gloss-margin-label text-primary">Glosses</p>
                  {glosses.map((footnote) => (
                    <button
                      key={footnote.id}
                      type="button"
                      onClick={() => handleFootnoteOpen(footnote)}
                      className={`gloss-item ${
                        selectedFootnote?.id === footnote.id ? "is-active" : ""
                      }`}
                    >
                      <span className="gloss-item-number">
                        {getFootnoteDisplayNumber(footnote)}
                      </span>
                      {extractGlossSnippet(footnote.content)}
                    </button>
                  ))}
                </aside>
              )}
            </div>

            {/* ---------- Gathering navigation (mobile + foot) ---------- */}
            {(prevExt || nextExt) && (
              <nav className="mt-14 flex items-stretch justify-between gap-4 border-t border-[hsl(var(--codex-rule)/0.7)] pt-8">
                {prevExt ? (
                  <button
                    type="button"
                    onClick={() =>
                      setLocation(`/v/${prevExt.volumeNumber}/${prevExt.chapterId}/web-extension`)
                    }
                    className="group flex flex-1 flex-col items-start gap-1 text-left"
                  >
                    <span className="inline-flex items-center gap-1.5 codex-label transition group-hover:text-foreground">
                      <ChevronLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
                      Previous · {prevExt.markerCode}
                    </span>
                    <span className="font-heading text-lg text-foreground">{prevExt.chapterTitle}</span>
                  </button>
                ) : (
                  <span className="flex-1" />
                )}
                {nextExt ? (
                  <button
                    type="button"
                    onClick={() =>
                      setLocation(`/v/${nextExt.volumeNumber}/${nextExt.chapterId}/web-extension`)
                    }
                    className="group flex flex-1 flex-col items-end gap-1 text-right"
                  >
                    <span className="inline-flex items-center gap-1.5 codex-label transition group-hover:text-foreground">
                      Next · {nextExt.markerCode}
                      <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                    </span>
                    <span className="font-heading text-lg text-foreground">{nextExt.chapterTitle}</span>
                  </button>
                ) : (
                  <span className="flex-1" />
                )}
              </nav>
            )}
          </article>
        </div>
      </main>

      <FootnotePanel footnote={selectedFootnote} onClose={() => setSelectedFootnote(null)} />
    </div>
  );
}
