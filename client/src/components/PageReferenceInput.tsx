import { useState } from "react";
import { ListOrdered } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import type { Chapter, Footnote } from "@shared/schema";
import { getFootnoteDisplayNumber, getFootnoteOrigin } from "@/lib/footnotes";

interface PageReferenceInputProps {
  volumeNumber: number;
  chapters: Chapter[];
  onNavigate: (
    volumeNumber: number,
    chapterId: string,
    sectionId: string,
    footnote: Footnote | null
  ) => void;
  matchNavigationButton?: boolean;
}

export default function PageReferenceInput({
  volumeNumber,
  chapters,
  onNavigate,
  matchNavigationButton = false,
}: PageReferenceInputProps) {
  const [open, setOpen] = useState(false);
  const [extensionValue, setExtensionValue] = useState("");
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(extensionValue, 10);
    if (Number.isNaN(parsed)) {
      toast({
        title: "Enter an extension number",
        description: "Use digits like 23 to jump to that reference.",
      });
      return;
    }

    for (const chapter of chapters) {
      for (const section of chapter.sections) {
        const match =
          section.footnotes.find(
            (footnote) =>
              getFootnoteOrigin(footnote) === "web-extension" &&
              getFootnoteDisplayNumber(footnote) === parsed
          ) ??
          section.footnotes.find((footnote) => getFootnoteDisplayNumber(footnote) === parsed);
        if (match) {
          onNavigate(volumeNumber, chapter.id, section.id, match);
          setOpen(false);
          setExtensionValue("");
          return;
        }
      }
    }

    toast({
      title: "Extension not found",
      description: `No extension ${parsed} exists in this volume.`,
    });
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          data-testid="button-page-reference"
          aria-label="Find by extension number"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        >
          <ListOrdered className="h-4 w-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-72 rounded-xl border-[hsl(var(--codex-rule))] p-4"
        data-testid="page-reference-popover"
      >
        <form onSubmit={handleSubmit}>
          <h4 className="font-heading text-lg font-semibold leading-tight">
            Jump to an extension
          </h4>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Enter any extension number in this volume.
          </p>
          <div className="mt-3 flex items-center gap-2 border-b border-[hsl(var(--codex-rule))] pb-1.5 focus-within:border-[hsl(var(--gilt))]">
            <input
              type="number"
              placeholder="e.g. 23"
              value={extensionValue}
              onChange={(e) => setExtensionValue(e.target.value)}
              data-testid="input-page-number"
              className="min-w-0 flex-1 border-0 bg-transparent p-0 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-0 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
            <button
              type="submit"
              data-testid="button-go-to-page"
              className="text-sm font-medium text-primary transition hover:text-[hsl(var(--gilt))]"
            >
              Go
            </button>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  );
}
