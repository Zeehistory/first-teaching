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
          
          <div className="mb-3">
            <p className="text-sm font-sans uppercase tracking-wide text-primary mb-2">
              Volume {bookData.volumeNumber} of {bookData.totalVolumes}
            </p>
            <h2 className="text-2xl md:text-3xl font-heading italic text-muted-foreground mb-4">
              {bookData.volumeTitle}
            </h2>
          </div>

          <OrnamentalDivider />

          <div className="mb-8">
            <h1 className="text-4xl md:text-5xl font-heading font-semibold mb-3">
              {bookData.seriesTitle}
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground font-heading italic">
              {bookData.seriesSubtitle}
            </p>
          </div>

          <p className="text-base font-sans text-muted-foreground mb-6">
            by {bookData.author}
          </p>

          <OrnamentalDivider />

          <div className="max-w-2xl mx-auto">
            <p className="text-lg leading-relaxed">
              {bookData.introduction}
            </p>
          </div>
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

        <div className="mb-8">
          <h3 className="text-2xl font-heading font-medium text-center mb-8">
            Table of Contents
          </h3>
        </div>

        <div className="space-y-4">
          {bookData.chapters.map((chapter) => (
            <Card
              key={chapter.id}
              className="p-6 hover-elevate active-elevate-2 cursor-pointer"
              onClick={() => onChapterClick(chapter.id)}
              data-testid={`chapter-card-${chapter.id}`}
            >
              <div className="flex items-start gap-4 mb-3">
                {chapter.number > 0 && (
                  <span className="text-3xl font-heading text-primary flex-shrink-0">
                    {chapter.number}
                  </span>
                )}
                <div className="flex-1">
                  <h2 className="text-xl md:text-2xl font-heading font-medium mb-2">
                    {chapter.title}
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    {chapter.description}
                  </p>
                  <div className="mt-3 text-sm text-primary font-sans">
                    {chapter.sections.length} section{chapter.sections.length !== 1 ? "s" : ""}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="mt-16 text-center">
          <p className="text-sm text-muted-foreground font-sans leading-relaxed">
            This companion website provides extended discussions and detailed commentary referenced in the physical book.
            <br />
            Look for page numbers throughout the text to find corresponding sections in your printed copy.
            <br />
            <span className="italic mt-2 block">
              "Read, mark, learn, and inwardly digest"
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
