import { useState } from "react";
import { ListOrdered } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
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
        <Button
          variant="outline"
          size="icon"
          data-testid="button-page-reference"
          aria-label="Find by extension number"
          className={cn(matchNavigationButton && "h-10 w-10")}
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" data-testid="page-reference-popover">
        <form onSubmit={handleSubmit}>
          <div className="space-y-3">
            <div>
              <h4 className="font-medium text-sm mb-1">Find by Extension Number</h4>
              <p className="text-xs text-muted-foreground">
                Jump straight to any numbered extension in this volume.
              </p>
            </div>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="e.g., 23"
                value={extensionValue}
                onChange={(e) => setExtensionValue(e.target.value)}
                data-testid="input-page-number"
                className="flex-1"
              />
              <Button type="submit" data-testid="button-go-to-page">
                Go
              </Button>
            </div>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  );
}
