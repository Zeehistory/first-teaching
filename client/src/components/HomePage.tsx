import { Book, Search as SearchIcon, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { BookData } from "@shared/schema";
import OrnamentalDivider from "./OrnamentalDivider";

interface HomePageProps {
  bookData: BookData;
  onChapterClick: (chapterId: string) => void;
  onSearchClick: () => void;
  onBackToLibrary?: () => void;
}

export default function HomePage({
  bookData,
  onChapterClick,
  onSearchClick,
  onBackToLibrary,
}: HomePageProps) {
  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-6 py-16">
        {onBackToLibrary && (
          <div className="mb-10">
            <Button
              variant="ghost"
              onClick={onBackToLibrary}
              className="gap-2 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Main Library
            </Button>
          </div>
        )}

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
            data-tour="home-search"
          >
            <SearchIcon className="h-4 w-4" />
            Search All Chapters
          </Button>
        </div>

        <div className="mb-8">
          <h3 className="text-2xl font-heading font-medium text-center mb-5">Table of Contents</h3>
          <p className="mx-auto max-w-2xl text-center text-sm text-muted-foreground">
            Compact view. Hover for a quick summary. Click a tile to open the chapter.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-1 xl:grid-cols-2 gap-4">
          {bookData.chapters.map((chapter, idx) => (
            <Card
              key={chapter.id}
              className="group p-4 hover-elevate active-elevate-2 cursor-pointer"
              onClick={() => onChapterClick(chapter.id)}
              data-testid={`chapter-card-${chapter.id}`}
              title={chapter.description}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-border bg-muted/40 font-heading text-sm text-foreground/80">
                  {idx + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-heading font-medium leading-snug break-words">
                    {chapter.title}
                  </h2>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground/90">
                    {chapter.description}
                  </p>
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
          </p>
        </div>
      </div>
    </div>
  );
}
