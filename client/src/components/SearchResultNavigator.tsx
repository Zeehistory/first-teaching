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
      className="fixed top-[6.5rem] z-40 hidden translate-y-0 items-center gap-3 rounded-full border border-border/60 bg-background/95 px-3 py-1.5 text-xs font-sans text-muted-foreground shadow-md backdrop-blur sm:flex"
      style={{ right: `calc(${anchorOffset}px + var(--assistant-panel-width, 0px) + 1.5rem)` }}
    >
      <span className="font-semibold tabular-nums text-foreground/75">{label}</span>
      <span className="h-4 w-px bg-border/50" />
      <button
        type="button"
        onClick={onPrev}
        className="inline-flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted/50 hover:text-foreground"
        aria-label="Previous match"
      >
        <ChevronUp className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={onNext}
        className="inline-flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted/50 hover:text-foreground"
        aria-label="Next match"
      >
        <ChevronDown className="h-4 w-4" />
      </button>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted/50 hover:text-foreground"
          aria-label="Dismiss search highlights"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
