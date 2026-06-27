import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, CornerDownLeft, X } from "lucide-react";
import type { Footnote } from "@shared/schema";
import {
  buildFootnoteSelector,
  getFootnoteDisplayNumber,
  getFootnoteOrigin,
} from "@/lib/footnotes";

interface FootnotePanelProps {
  footnote: Footnote | null;
  onClose: () => void;
}

const MIN_WIDTH = 280;
const MAX_WIDTH = 640;
const COLLAPSED_WIDTH = 56;

export default function FootnotePanel({
  footnote,
  onClose,
}: FootnotePanelProps) {
  const contentRef = useRef<HTMLDivElement | null>(null);
  const dragState = useRef<{ startX: number; startWidth: number }>({ startX: 0, startWidth: 360 });
  const [width, setWidth] = useState(360);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (footnote) {
      setIsCollapsed(false);
      if (contentRef.current) {
        contentRef.current.scrollTop = 0;
      }
    } else {
      setIsCollapsed(false);
      setWidth(360);
    }
  }, [footnote?.id]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (event: MouseEvent) => {
      const { startX, startWidth } = dragState.current;
      const delta = startX - event.clientX;
      const nextWidth = Math.min(Math.max(startWidth + delta, MIN_WIDTH), MAX_WIDTH);
      setWidth(nextWidth);
    };

    const handleMouseUp = () => setIsDragging(false);

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  const panelWidth = useMemo(
    () => (isCollapsed ? COLLAPSED_WIDTH : Math.max(MIN_WIDTH, Math.min(width, MAX_WIDTH))),
    [isCollapsed, width]
  );

  if (!footnote) {
    return null;
  }

  const handleReturnToText = () => {
    if (typeof document === "undefined") return;
    const marker = document.querySelector<HTMLElement>(buildFootnoteSelector(footnote));
    if (!marker) return;
    marker.scrollIntoView({ behavior: "smooth", block: "center" });
    marker.classList.add("footnote-marker-focus");
    window.setTimeout(() => {
      marker.classList.remove("footnote-marker-focus");
    }, 2200);
  };

  if (isCollapsed) {
    return (
      <aside
        className="relative hidden h-full min-h-0 items-center justify-center border-l border-border bg-background/80 text-muted-foreground backdrop-blur md:flex"
        style={{ width: COLLAPSED_WIDTH }}
      >
        <button
          type="button"
          aria-label="Expand footnote window"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition hover:text-foreground"
          onClick={() => setIsCollapsed(false)}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="pointer-events-none absolute bottom-20 origin-bottom-right -rotate-90 text-[10px] font-semibold uppercase tracking-[0.5em] text-muted-foreground/60">
          Notes
        </span>
      </aside>
    );
  }

  const footnoteOrigin = getFootnoteOrigin(footnote);
  const displayNumber = getFootnoteDisplayNumber(footnote);

  return (
    <aside
      className="relative hidden h-full min-h-0 flex-col overflow-hidden border-l border-border bg-background/95 shadow-xl transition-[width] duration-200 md:flex"
      style={{ width: panelWidth }}
      data-testid="footnote-panel"
    >
      <div
        className="absolute left-0 top-0 h-full w-1 cursor-ew-resize"
        onMouseDown={(event) => {
          event.preventDefault();
          dragState.current = { startX: event.clientX, startWidth: panelWidth };
          setIsDragging(true);
        }}
      />

      <header className="flex items-center justify-between gap-3 px-6 pt-6 pb-4">
        <div className="flex items-baseline gap-2.5">
          <span
            className="font-heading text-xl font-semibold leading-none text-primary"
          >
            {displayNumber}
          </span>
          <span className="codex-label text-sm">
            {footnoteOrigin === "web-extension" ? "Web Extension Gloss" : "Syntopicon Footnote"}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Collapse footnote"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition hover:text-foreground"
            onClick={() => setIsCollapsed(true)}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onClose}
            data-testid="button-close-footnote"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition hover:text-foreground"
            aria-label="Hide footnote"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div className="flex flex-1 min-h-0 flex-col px-6 pb-6">
        <div
          ref={contentRef}
          className="minimal-scrollbar flex-1 overflow-y-auto pr-1 text-base leading-relaxed"
        >
          <div
            className="prose prose-primary max-w-none space-y-4 text-foreground/90 chapter-prose"
            dangerouslySetInnerHTML={{ __html: footnote.content }}
          />
        </div>

        <button
          type="button"
          onClick={handleReturnToText}
          className="mt-4 inline-flex items-center gap-2 self-start codex-label transition hover:text-foreground"
        >
          <CornerDownLeft className="h-3.5 w-3.5" />
          Back to the text
        </button>
      </div>
    </aside>
  );
}
