import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import type { Footnote } from "@shared/schema";

interface FootnotePanelProps {
  footnote: Footnote | null;
  onClose: () => void;
}

export default function FootnotePanel({ footnote, onClose }: FootnotePanelProps) {
  if (!footnote) return null;

  const contentRef = useRef<HTMLDivElement | null>(null);
  const [height, setHeight] = useState(320);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  }, [footnote.id]);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!isDragging) return;
      const distanceFromBottom = window.innerHeight - event.clientY;
      const newHeight = Math.min(Math.max(220, distanceFromBottom + 40), window.innerHeight - 80);
      setHeight(newHeight);
    };

    const stopDragging = () => setIsDragging(false);

    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", stopDragging);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", stopDragging);
    };
  }, [isDragging]);

  return (
    <div
      className="fixed bottom-0 left-0 bg-card border-t border-card-border shadow-xl z-50 animate-in slide-in-from-bottom duration-300"
      data-testid="footnote-panel"
      style={{ right: "var(--assistant-panel-width)", maxWidth: "calc(100vw - var(--assistant-panel-width))" }}
    >
      <div
        className="max-w-4xl mx-auto px-6 pt-4 pb-6"
        style={{ height }}
      >
        <div
          className="w-full max-w-2xl mx-auto mb-4 h-3 rounded-full bg-border cursor-row-resize"
          onMouseDown={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
        />
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[hsl(185,35%,88%)] text-[hsl(184,42%,32%)] font-heading text-xl shadow-sm">
              {footnote.number}
            </span>
            <div>
              <span className="text-xs font-sans uppercase tracking-wide text-muted-foreground block">
                Footnote
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              data-testid="button-close-footnote"
              className="inline-flex items-center justify-center w-9 h-9 rounded-md border border-border text-muted-foreground hover:bg-muted transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div
          ref={contentRef}
          className="text-base leading-relaxed h-[calc(100%-5rem)] overflow-y-auto pr-2 space-y-3 chapter-prose"
          dangerouslySetInnerHTML={{ __html: footnote.content }}
        />
      </div>
    </div>
  );
}
