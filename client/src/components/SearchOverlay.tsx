import { useState, useEffect } from "react";
import { X, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { BookData, Chapter, Section } from "@shared/schema";

interface SearchResult {
  chapter: Chapter;
  section: Section;
  snippet: string;
}

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  bookData: BookData;
  onResultClick: (chapterId: string, sectionId: string) => void;
}

export default function SearchOverlay({
  isOpen,
  onClose,
  bookData,
  onResultClick,
}: SearchOverlayProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const searchResults: SearchResult[] = [];
    const lowerQuery = query.toLowerCase();

    bookData.chapters.forEach((chapter) => {
      chapter.sections.forEach((section) => {
        if (
          section.title.toLowerCase().includes(lowerQuery) ||
          section.content.toLowerCase().includes(lowerQuery)
        ) {
          const index = section.content.toLowerCase().indexOf(lowerQuery);
          const start = Math.max(0, index - 50);
          const end = Math.min(section.content.length, index + query.length + 50);
          const snippet = section.content.substring(start, end);

          searchResults.push({
            chapter,
            section,
            snippet: `...${snippet}...`,
          });
        }
      });
    });

    setResults(searchResults);
  }, [query, bookData]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 animate-in fade-in duration-200"
      data-testid="search-overlay"
    >
      <div className="container max-w-3xl mx-auto pt-20 px-6">
        <div className="flex items-center gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search chapters and content..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-12 h-14 text-lg"
              autoFocus
              data-testid="input-search"
            />
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            data-testid="button-close-search"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="space-y-6">
          {results.length === 0 && query && (
            <p className="text-center text-muted-foreground py-12">
              No results found for "{query}"
            </p>
          )}
          {results.map((result, index) => (
            <button
              key={index}
              onClick={() => {
                onResultClick(result.chapter.id, result.section.id);
                onClose();
              }}
              className="block w-full text-left p-6 bg-card rounded-md border border-card-border hover-elevate active-elevate-2"
              data-testid={`search-result-${index}`}
            >
              <div className="text-sm font-sans text-primary mb-1">
                Chapter {result.chapter.number}: {result.chapter.title}
              </div>
              <div className="text-base font-medium mb-2">
                {result.section.title}
              </div>
              <div className="text-sm text-muted-foreground line-clamp-2">
                {result.snippet}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
