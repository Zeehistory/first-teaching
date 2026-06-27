import { Minus, Plus } from "lucide-react";

const iconBtn =
  "inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition hover:text-foreground disabled:opacity-30 disabled:hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30";

interface TextSizeControlProps {
  textSize: number;
  onIncrease: () => void;
  onDecrease: () => void;
}

export default function TextSizeControl({
  textSize,
  onIncrease,
  onDecrease,
}: TextSizeControlProps) {
  return (
    <div className="flex items-center">
      <button
        type="button"
        onClick={onDecrease}
        disabled={textSize <= 14}
        data-testid="button-decrease-text"
        aria-label="Decrease text size"
        className={iconBtn}
      >
        <Minus className="h-4 w-4" />
      </button>
      <span className="min-w-[2.5rem] text-center text-xs tabular-nums text-muted-foreground">
        {textSize}
      </span>
      <button
        type="button"
        onClick={onIncrease}
        disabled={textSize >= 22}
        data-testid="button-increase-text"
        aria-label="Increase text size"
        className={iconBtn}
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
