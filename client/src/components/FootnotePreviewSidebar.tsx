import { useMemo } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { Footnote } from "@shared/schema";
import {
  getFootnoteDisplayNumber,
  getFootnoteOrigin,
} from "@/lib/footnotes";

interface FootnotePreviewSidebarProps {
  footnotes: Footnote[];
  activeFootnoteId: string | null;
  onSelect: (footnote: Footnote) => void;
  onHide: () => void;
}

function extractPreview(content: string) {
  const compact = (input: string) => input.replace(/\s+/g, " ").trim();

  if (typeof window !== "undefined") {
    const temp = window.document.createElement("div");
    temp.innerHTML = content;
    return compact(temp.textContent ?? "");
  }

  return compact(content.replace(/<[^>]+>/g, ""));
}

export default function FootnotePreviewSidebar({
  footnotes,
  activeFootnoteId,
  onSelect,
  onHide,
}: FootnotePreviewSidebarProps) {
  const previews = useMemo(
    () =>
      footnotes.map((footnote) => ({
        ...footnote,
        preview: extractPreview(footnote.content).slice(0, 180),
      })),
    [footnotes]
  );

  return (
    <aside className="hidden lg:flex h-full w-80 flex-shrink-0 flex-col border-r border-border bg-muted/10">
      <div className="flex items-center justify-between border-b border-border px-4 py-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
            Footnotes
          </div>
          <p className="mt-1 text-sm text-muted-foreground/70">
            Preview notes and jump straight to their details.
          </p>
        </div>
        <button
          type="button"
          onClick={onHide}
          aria-label="Hide footnote previews"
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground transition hover:text-foreground"
        >
          <span className="sr-only">Close footnote sidebar</span>
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          >
            <path d="M4 4l8 8M12 4l-8 8" />
          </svg>
        </button>
      </div>

      {previews.length === 0 ? (
        <div className="flex flex-1 items-center justify-center px-6 text-center text-sm text-muted-foreground/80">
          No footnotes in this section.
        </div>
      ) : (
        <ScrollArea className="flex-1">
          <div className="space-y-3 px-4 py-4">
            {previews.map((footnote) => {
              const isActive = activeFootnoteId === footnote.id;
              return (
                <button
                  key={footnote.id}
                  type="button"
                  onClick={() => onSelect(footnote)}
                  className={cn(
                    "group w-full rounded-xl border border-border/70 bg-background/60 p-3 text-left shadow-sm transition hover:border-primary/50 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                    isActive && "border-primary/60 bg-primary/5"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[hsl(185,35%,88%)] font-heading text-base text-[hsl(184,42%,32%)] shadow-sm">
                      {getFootnoteDisplayNumber(footnote)}
                    </div>
                    <div className="space-y-1">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-muted-foreground/80">
                        {getFootnoteOrigin(footnote) === "web-extension"
                          ? `Web Ext ${getFootnoteDisplayNumber(footnote)}`
                          : `Footnote ${getFootnoteDisplayNumber(footnote)}`}
                      </div>
                      <div className="text-sm leading-snug text-foreground/80 line-clamp-3 group-hover:text-foreground">
                        {footnote.preview || "Additional commentary."}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </ScrollArea>
      )}
    </aside>
  );
}
