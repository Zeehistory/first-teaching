import { useState } from "react";
import { BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { Chapter } from "@shared/schema";

interface PageReferenceInputProps {
  chapters: Chapter[];
  onNavigate: (chapterId: string, sectionId: string) => void;
}

export default function PageReferenceInput({
  chapters,
  onNavigate,
}: PageReferenceInputProps) {
  const [pageNumber, setPageNumber] = useState("");
  const [open, setOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const page = parseInt(pageNumber);
    if (isNaN(page)) return;

    for (const chapter of chapters) {
      for (const section of chapter.sections) {
        if (section.pageReference === page) {
          onNavigate(chapter.id, section.id);
          setOpen(false);
          setPageNumber("");
          return;
        }
      }
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          data-testid="button-page-reference"
          aria-label="Go to page from physical book"
        >
          <BookOpen className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" data-testid="page-reference-popover">
        <form onSubmit={handleSubmit}>
          <div className="space-y-3">
            <div>
              <h4 className="font-medium text-sm mb-1">Find by Page Number</h4>
              <p className="text-xs text-muted-foreground">
                Enter a page number from the physical book
              </p>
            </div>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="e.g., 12"
                value={pageNumber}
                onChange={(e) => setPageNumber(e.target.value)}
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
