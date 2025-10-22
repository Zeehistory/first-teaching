import { X, ChevronUp, ChevronDown } from "lucide-react";

interface SearchResultNavigatorProps {
  term: string;
  currentIndex: number;
  total: number;
  onNext: () => void;
  onPrev: () => void;
  onClose?: () => void;
  anchorOffset?: number;
}

export default function SearchResultNavigator({
  term,
  currentIndex,
  total,
  onNext,
  onPrev,
  onClose,
  anchorOffset = 0,
}: SearchResultNavigatorProps) {
  if (total <= 0) return null;
  const label =
    total === 1 ? "1 of 1" : `${Math.max(1, currentIndex + 1)} of ${total}`;

  return (
    <div
      className="fixed top-[6.5rem] z-40 hidden translate-y-0 items-center gap-3 rounded-full border border-border bg-background/95 px-4 py-2 text-xs font-sans text-muted-foreground shadow-lg backdrop-blur sm:flex"
      style={{ right: `calc(${anchorOffset}px + var(--assistant-panel-width, 0px) + 1.5rem)` }}
    >
      <div className="flex flex-col leading-tight">
        <span className="font-semibold tracking-wide text-foreground/80">{label}</span>
        <span className="max-w-[14rem] truncate text-[11px] uppercase tracking-[0.3em] text-muted-foreground/70">
          {term}
        </span>
      </div>
      <div className="flex items-center gap-1 rounded-full border border-border/70 bg-muted/20 p-1">
        <button
          type="button"
          onClick={onPrev}
          className="inline-flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition hover:bg-background hover:text-foreground"
          aria-label="Previous match"
        >
          <ChevronUp className="h-3.5 w-3.5" />
        </button>
        <span className="h-5 w-px bg-border/70" />
        <button
          type="button"
          onClick={onNext}
          className="inline-flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition hover:bg-background hover:text-foreground"
          aria-label="Next match"
        >
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-border/80 text-muted-foreground transition hover:bg-background hover:text-foreground"
          aria-label="Dismiss search highlights"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
