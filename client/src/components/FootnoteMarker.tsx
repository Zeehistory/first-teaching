import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface FootnoteMarkerProps {
  number: number;
  content: string;
  onClick: () => void;
}

export default function FootnoteMarker({
  number,
  content,
  onClick,
}: FootnoteMarkerProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="inline-flex items-center justify-center w-5 h-5 text-xs font-sans bg-primary/10 text-primary rounded-full hover-elevate active-elevate-2 cursor-pointer align-super ml-0.5 transition-colors"
          data-testid={`footnote-marker-${number}`}
          onClick={(e) => {
            e.preventDefault();
            onClick();
          }}
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
        >
          {number}
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 text-sm"
        side="top"
        data-testid={`footnote-preview-${number}`}
      >
        <div className="text-muted-foreground">
          {content.length > 150 ? `${content.substring(0, 150)}...` : content}
        </div>
        <div className="text-xs text-muted-foreground mt-2 italic">
          Click to view full note
        </div>
      </PopoverContent>
    </Popover>
  );
}
