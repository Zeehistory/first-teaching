import { Book, Search as SearchIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { BookData } from "@shared/schema";
import OrnamentalDivider from "./OrnamentalDivider";

interface HomePageProps {
  bookData: BookData;
  onChapterClick: (chapterId: string) => void;
  onSearchClick: () => void;
}

export default function HomePage({
  bookData,
  onChapterClick,
  onSearchClick,
}: HomePageProps) {
  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-primary/10 rounded-full">
              <Book className="h-12 w-12 text-primary" />
            </div>
          </div>
          <h1 className="text-5xl md:text-6xl font-heading font-semibold mb-4">
            {bookData.title}
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground font-heading italic mb-8">
            {bookData.subtitle}
          </p>
          <OrnamentalDivider />
          <p className="text-lg leading-relaxed max-w-2xl mx-auto">
            {bookData.introduction}
          </p>
        </div>

        <div className="flex justify-center mb-12">
          <Button
            variant="outline"
            size="lg"
            onClick={onSearchClick}
            data-testid="button-open-search"
            className="gap-2"
          >
            <SearchIcon className="h-4 w-4" />
            Search All Chapters
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {bookData.chapters.map((chapter) => (
            <Card
              key={chapter.id}
              className="p-6 hover-elevate active-elevate-2 cursor-pointer"
              onClick={() => onChapterClick(chapter.id)}
              data-testid={`chapter-card-${chapter.id}`}
            >
              <div className="flex items-baseline gap-3 mb-3">
                <span className="text-4xl font-heading text-primary">
                  {chapter.number}
                </span>
                <h2 className="text-2xl font-heading font-medium flex-1">
                  {chapter.title}
                </h2>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                {chapter.description}
              </p>
              <div className="mt-4 text-sm text-primary font-sans">
                {chapter.sections.length} section{chapter.sections.length !== 1 ? "s" : ""}
              </div>
            </Card>
          ))}
        </div>

        <div className="mt-16 text-center">
          <p className="text-sm text-muted-foreground font-sans">
            This companion website provides extended discussions referenced in the physical book.
            <br />
            Look for page numbers in the margins to find corresponding online content.
          </p>
        </div>
      </div>
    </div>
  );
}
