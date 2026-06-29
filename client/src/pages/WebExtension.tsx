import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useLocation, useRoute } from "wouter";
import ChapterContent from "@/components/ChapterContent";
import ThemeToggle from "@/components/ThemeToggle";
import TextSizeControl from "@/components/TextSizeControl";
import type { Footnote, Section, WebExtensionEntry } from "@shared/schema";
import {
  volumeOneWebExtensions,
  volumeThirteenWebExtensions,
  volumeFourteenWebExtensions,
  volumeFifteenWebExtensions,
  volumeSixteenWebExtensions,
  volumeSeventeenWebExtensions,
  volumeEighteenWebExtensions,
} from "@/lib/content";
import { buildFootnoteSelector, getFootnoteDisplayNumber } from "@/lib/footnotes";
import { readReadingReturnState } from "@/lib/readingReturn";

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
    13: volumeThirteenWebExtensions,
    14: volumeFourteenWebExtensions,
    15: volumeFifteenWebExtensions,
    16: volumeSixteenWebExtensions,
    17: volumeSeventeenWebExtensions,
    18: volumeEighteenWebExtensions,
  } as const;
  const extensionMap =
    volumeNumber in extensionsByVolume
      ? extensionsByVolume[volumeNumber as keyof typeof extensionsByVolume]
      : null;
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

  // Clicking a marker opens the note in the right-hand panel and gently marks
  // the reference in the text so the reader keeps their place.
  const handleFootnoteOpen = useCallback((footnote: Footnote) => {
    setSelectedFootnote(footnote);
    if (typeof document === "undefined") return;
    const marker = document.querySelector<HTMLElement>(buildFootnoteSelector(footnote));
    if (!marker) return;
    marker.classList.add("footnote-marker-focus");
    window.setTimeout(() => marker.classList.remove("footnote-marker-focus"), 2000);
  }, []);

  const closePanel = useCallback(() => setSelectedFootnote(null), []);

  // Close the panel with Escape.
  useEffect(() => {
    if (!selectedFootnote) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSelectedFootnote(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedFootnote]);

  // A new chapter/extension resets any open note.
  useEffect(() => {
    setSelectedFootnote(null);
  }, [chapterId, volumeNumber]);

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

  const goPrev = () =>
    prevExt && setLocation(`/v/${prevExt.volumeNumber}/${prevExt.chapterId}/web-extension`);
  const goNext = () =>
    nextExt && setLocation(`/v/${nextExt.volumeNumber}/${nextExt.chapterId}/web-extension`);

  const panelOpen = Boolean(selectedFootnote);

  return (
    <div
      className="web-extension-shell codex-page-bg flex h-screen flex-col overflow-hidden"
      data-panel-open={panelOpen}
    >
      {/* ---------- Header ---------- */}
      <header className="flex-shrink-0 border-b border-[hsl(var(--codex-rule)/0.6)] bg-[hsl(var(--codex-vellum)/0.85)] backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-6 px-5 py-3.5 md:px-6">
          <button
            type="button"
            onClick={() =>
              setLocation(returnState?.path ?? `/v/${extension.volumeNumber}/${extension.chapterId}`)
            }
            className="group inline-flex items-center gap-2 text-sm text-[hsl(var(--codex-ink-soft))] transition hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
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
        <article className="mx-auto max-w-3xl px-5 py-12 md:px-6 md:py-16">
          {/* ---------- Title block ---------- */}
          <header className="mb-12">
            <div className="flex items-baseline gap-3 text-[0.7rem] uppercase tracking-[0.22em] text-[hsl(var(--codex-ink-soft))]">
              <span>Web Extension</span>
              <span aria-hidden="true">·</span>
              <span className="text-primary">{extension.markerCode}</span>
            </div>
            <h1 className="masthead-title mt-5 text-[2.1rem] leading-[1.08] sm:text-4xl md:text-[2.9rem]">
              {extension.chapterTitle}
            </h1>
            <p className="mt-5 max-w-xl text-[0.95rem] italic leading-relaxed text-[hsl(var(--codex-ink-soft))]">
              Companion reading for the Syntopicon chapter — its sources, glosses, and
              expanded apparatus.
            </p>
            <hr className="mt-8 border-0 border-t border-[hsl(var(--codex-rule)/0.6)]" />
          </header>

          {/* ---------- Prose ---------- */}
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

          {/* ---------- Adjacent extensions ---------- */}
          {(prevExt || nextExt) && (
            <nav className="mt-16 flex items-stretch justify-between gap-6 border-t border-[hsl(var(--codex-rule)/0.6)] pt-8">
              {prevExt ? (
                <button
                  type="button"
                  onClick={goPrev}
                  className="group flex flex-1 flex-col items-start gap-1 text-left"
                >
                  <span className="inline-flex items-center gap-1.5 text-[0.7rem] uppercase tracking-[0.18em] text-[hsl(var(--codex-ink-soft))] transition group-hover:text-foreground">
                    <ChevronLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
                    Previous · {prevExt.markerCode}
                  </span>
                  <span className="font-heading text-base text-foreground">{prevExt.chapterTitle}</span>
                </button>
              ) : (
                <span className="flex-1" />
              )}
              {nextExt ? (
                <button
                  type="button"
                  onClick={goNext}
                  className="group flex flex-1 flex-col items-end gap-1 text-right"
                >
                  <span className="inline-flex items-center gap-1.5 text-[0.7rem] uppercase tracking-[0.18em] text-[hsl(var(--codex-ink-soft))] transition group-hover:text-foreground">
                    Next · {nextExt.markerCode}
                    <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                  <span className="font-heading text-base text-foreground">{nextExt.chapterTitle}</span>
                </button>
              ) : (
                <span className="flex-1" />
              )}
            </nav>
          )}
        </article>
      </main>

      {/* ---------- Note panel (right-hand drawer) ---------- */}
      <button
        type="button"
        aria-hidden={!panelOpen}
        tabIndex={-1}
        onClick={closePanel}
        className={`note-panel-scrim ${panelOpen ? "is-open" : ""}`}
      />
      <aside
        className={`note-panel ${panelOpen ? "is-open" : ""}`}
        aria-hidden={!panelOpen}
        aria-label="Note"
      >
        {selectedFootnote && (
          <>
            <header className="note-panel-head">
              <span className="note-panel-eyebrow">
                Note
                <span className="note-panel-numeral">
                  {getFootnoteDisplayNumber(selectedFootnote)}
                </span>
              </span>
              <button
                type="button"
                onClick={closePanel}
                aria-label="Close note"
                className="note-panel-close"
              >
                <X className="h-4 w-4" />
              </button>
            </header>
            <div
              key={selectedFootnote.id}
              className="note-panel-body chapter-prose minimal-scrollbar"
              dangerouslySetInnerHTML={{ __html: selectedFootnote.content }}
            />
          </>
        )}
      </aside>
    </div>
  );
}
