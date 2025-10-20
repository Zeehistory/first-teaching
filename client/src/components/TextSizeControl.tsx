import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

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
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="icon"
        onClick={onDecrease}
        disabled={textSize <= 14}
        data-testid="button-decrease-text"
        aria-label="Decrease text size"
      >
        <Minus className="h-4 w-4" />
      </Button>
      <span className="text-sm font-sans text-muted-foreground min-w-[3rem] text-center">
        {textSize}px
      </span>
      <Button
        variant="ghost"
        size="icon"
        onClick={onIncrease}
        disabled={textSize >= 22}
        data-testid="button-increase-text"
        aria-label="Increase text size"
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}
