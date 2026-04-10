import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, CornerDownLeft, X } from "lucide-react";
import type { Footnote } from "@shared/schema";
import {
  buildFootnoteSelector,
  getFootnoteDisplayNumber,
  getFootnoteOrigin,
} from "@/lib/footnotes";
import { decorateTimelineDatesInElement } from "@/lib/timeline";

interface FootnotePanelProps {
  footnote: Footnote | null;
  onClose: () => void;
  onTimelineClick?: (eventId: string) => void;
  timelineSourceKey?: string;
}

const MIN_WIDTH = 280;
const MAX_WIDTH = 640;
const COLLAPSED_WIDTH = 56;

export default function FootnotePanel({
  footnote,
  onClose,
  onTimelineClick,
  timelineSourceKey,
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

  useEffect(() => {
    const container = contentRef.current;
    if (!container || !timelineSourceKey) return;

    decorateTimelineDatesInElement(container, timelineSourceKey);

    const getTimelineHost = (target: EventTarget | null): HTMLElement | null => {
      if (!target || !(target instanceof HTMLElement)) return null;
      return target.closest("[data-timeline-id]") as HTMLElement | null;
    };

    const handleClick = (event: MouseEvent) => {
      const host = getTimelineHost(event.target);
      const eventId = host?.dataset.timelineId;
      if (!host || !eventId) return;
      event.preventDefault();
      event.stopPropagation();
      onTimelineClick?.(eventId);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      const host = getTimelineHost(event.target);
      const eventId = host?.dataset.timelineId;
      if (!host || !eventId) return;
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      onTimelineClick?.(eventId);
    };

    container.addEventListener("click", handleClick);
    container.addEventListener("keydown", handleKeyDown);
    return () => {
      container.removeEventListener("click", handleClick);
      container.removeEventListener("keydown", handleKeyDown);
    };
  }, [timelineSourceKey, footnote?.id, onTimelineClick]);

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

      <header className="flex items-start justify-between gap-3 border-b border-border px-5 py-5">
        <div className="flex items-center gap-3">
          <span
            className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full font-heading text-lg shadow-sm"
            data-footnote-panel-origin={footnoteOrigin}
          >
            {displayNumber}
          </span>
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
              {footnoteOrigin === "web-extension" ? "Web Ext Footnote" : "Syntopicon Footnote"}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Collapse footnote window"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted-foreground transition hover:text-foreground"
            onClick={() => setIsCollapsed(true)}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
            }}
            data-testid="button-close-footnote"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted-foreground transition hover:text-foreground"
            aria-label="Hide footnote window"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div className="flex flex-1 min-h-0 flex-col px-5 pb-6 pt-4">
        <div className="mb-4 flex items-center justify-end gap-3">
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition hover:border-primary/40 hover:text-primary"
            onClick={handleReturnToText}
            aria-label="Back to text"
          >
            <CornerDownLeft className="h-4 w-4" />
          </button>
        </div>

        <div
          ref={contentRef}
          className="minimal-scrollbar flex-1 overflow-y-auto rounded-2xl border border-border/60 bg-muted/15 px-5 py-5 text-base leading-relaxed"
        >
          <div
            className="prose prose-primary max-w-none space-y-4 text-foreground/90 chapter-prose"
            dangerouslySetInnerHTML={{ __html: footnote.content }}
          />
        </div>
      </div>
    </aside>
  );
}
