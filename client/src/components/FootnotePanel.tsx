import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Footnote } from "@shared/schema";

interface FootnotePanelProps {
  footnote: Footnote | null;
  onClose: () => void;
}

export default function FootnotePanel({ footnote, onClose }: FootnotePanelProps) {
  if (!footnote) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 bg-card border-t border-card-border shadow-xl z-50 animate-in slide-in-from-bottom duration-300"
      data-testid="footnote-panel"
    >
      <div className="max-w-4xl mx-auto px-6 py-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-heading text-primary">
              {footnote.number}
            </span>
            <span className="text-xs font-sans uppercase tracking-wide text-muted-foreground">
              Footnote
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            data-testid="button-close-footnote"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="text-base leading-relaxed">
          {footnote.content}
        </div>
      </div>
    </div>
  );
}
