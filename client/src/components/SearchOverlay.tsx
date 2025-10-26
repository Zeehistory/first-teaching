import { useState, useEffect, useMemo } from "react";
import { X, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { BookData, Chapter, Section } from "@shared/schema";

interface SearchResult {
  volumeNumber: number;
  volumeTitle: string;
  chapter: Chapter;
  section: Section;
  snippetHtml: string;
}

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  bookData: BookData;
  currentChapter?: Chapter | null;
  availableVolumes?: BookData[];
  onResultClick: (volumeNumber: number, chapterId: string, sectionId: string, query: string) => void;
}

type SearchScope = "chapter" | "volume" | "corpus";

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export default function SearchOverlay({
  isOpen,
  onClose,
  bookData,
  currentChapter,
  availableVolumes = [],
  onResultClick,
}: SearchOverlayProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [scope, setScope] = useState<SearchScope>(currentChapter ? "chapter" : "volume");

  const scopeOptions = useMemo(
    () => [
      {
        value: "chapter" as const,
        label: "Chapter",
        description: currentChapter?.title ? `Only “${currentChapter.title}”` : "Focus on this chapter",
        disabled: !currentChapter,
      },
      {
        value: "volume" as const,
        label: "Volume",
        description: `All of Volume ${bookData.volumeNumber}`,
        disabled: false,
      },
      {
        value: "corpus" as const,
        label: "Corpus",
        description: "Every available volume",
        disabled: availableVolumes.length === 0,
      },
    ],
    [availableVolumes.length, bookData.volumeNumber, currentChapter]
  );

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const trimmedQuery = query.trim();
    const searchResults: SearchResult[] = [];
    const lowerQuery = trimmedQuery.toLowerCase();

    const collections: Array<{ volumeNumber: number; volumeTitle: string; chapters: Chapter[] }> = [];

    if (scope === "chapter" && currentChapter) {
      collections.push({
        volumeNumber: bookData.volumeNumber,
        volumeTitle: bookData.volumeTitle,
        chapters: [currentChapter],
      });
    } else if (scope === "volume") {
      collections.push({
        volumeNumber: bookData.volumeNumber,
        volumeTitle: bookData.volumeTitle,
        chapters: bookData.chapters,
      });
    } else if (scope === "corpus") {
      const pools = availableVolumes.length ? availableVolumes : [bookData];
      pools.forEach((volumeData) => {
        collections.push({
          volumeNumber: volumeData.volumeNumber,
          volumeTitle: volumeData.volumeTitle,
          chapters: volumeData.chapters,
        });
      });
    }

    if (collections.length === 0) {
      setResults([]);
      return;
    }

    const highlightQuery = escapeRegExp(trimmedQuery);
    const highlightRegex = new RegExp(`(${highlightQuery})`, "gi");

    collections.forEach(({ volumeNumber, volumeTitle, chapters }) => {
      chapters.forEach((chapter) => {
        chapter.sections.forEach((section) => {
          const plainContent = section.content.replace(/<[^>]+>/g, " ");
          const titleMatchIndex = section.title.toLowerCase().indexOf(lowerQuery);
          const contentMatchIndex = plainContent.toLowerCase().indexOf(lowerQuery);
          if (titleMatchIndex === -1 && contentMatchIndex === -1) {
            return;
          }

          const sourceText = contentMatchIndex !== -1 ? plainContent : section.title;
          const matchIndex = contentMatchIndex !== -1 ? contentMatchIndex : titleMatchIndex;
          const start = Math.max(0, matchIndex - 80);
          const end = Math.min(sourceText.length, matchIndex + trimmedQuery.length + 80);
          const snippet = sourceText.substring(start, end);
          const decoratedSnippet = snippet.replace(
            highlightRegex,
            "<mark class=\"bg-primary/15 text-primary font-semibold rounded-sm px-1\">$1</mark>"
          );

          const prefix = start > 0 ? "…" : "";
          const suffix = end < sourceText.length ? "…" : "";

          searchResults.push({
            volumeNumber,
            volumeTitle,
            chapter,
            section,
            snippetHtml: `${prefix}${decoratedSnippet}${suffix}`,
          });
        });
      });
    });

    setResults(searchResults);
  }, [
    query,
    scope,
    bookData,
    currentChapter,
    availableVolumes,
  ]);

  useEffect(() => {
    if (scope === "chapter" && !currentChapter) {
      setScope("volume");
    }
  }, [currentChapter, scope]);

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
        <div className="mb-10 rounded-3xl border border-border/80 bg-card/80 shadow-xl backdrop-blur">
          <div className="flex items-center gap-5 px-6 pt-6">
            <div className="relative flex-1">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search the Teaching…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-14 rounded-2xl border border-border/80 bg-background/70 pl-14 text-lg shadow-sm focus-visible:ring-1"
                autoFocus
                data-testid="input-search"
              />
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              data-testid="button-close-search"
              className="rounded-full border border-border/70 bg-background/60 shadow-sm"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="px-6 pb-6 pt-5">
            <div className="text-[0.7rem] font-semibold uppercase tracking-[0.35em] text-muted-foreground/80">
              Search Within
            </div>
            <div className="mt-3 flex flex-wrap gap-3">
              {scopeOptions.map((option) => {
                const isActive = scope === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => !option.disabled && setScope(option.value)}
                    disabled={option.disabled}
                    className={`group inline-flex items-center gap-3 rounded-full border px-4 py-2 transition ${
                      isActive
                        ? "border-primary/50 bg-primary/10 text-primary"
                        : "border-border/70 bg-background/60 text-muted-foreground hover:border-primary/30 hover:text-primary"
                    } ${option.disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                  >
                    <span
                      className={`grid h-4 w-4 place-items-center rounded-full border ${
                        isActive ? "border-primary bg-primary" : "border-border/70"
                      }`}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-background" />
                    </span>
                    <span className="flex flex-col items-start leading-tight">
                      <span className="text-xs font-semibold uppercase tracking-[0.2em]">
                        {option.label}
                      </span>
                      <span className="text-[0.7rem] text-muted-foreground/80">
                        {option.description}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {results.length === 0 && query && (
            <p className="py-12 text-center text-muted-foreground">
              No results for “{query.trim()}” in this scope.
            </p>
          )}
          {results.map((result, index) => (
            <button
              key={index}
              onClick={() => {
                onResultClick(
                  result.volumeNumber,
                  result.chapter.id,
                  result.section.id,
                  query.trim()
                );
                onClose();
              }}
              className="block w-full rounded-2xl border border-border/70 bg-card/80 p-6 text-left shadow-sm transition hover:border-primary/30 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              data-testid={`search-result-${index}`}
            >
              <div className="mb-1 text-sm font-sans text-primary">
                Volume {result.volumeNumber} • {result.chapter.title}
              </div>
              <div className="mb-2 text-base font-medium">
                {result.section.title}
              </div>
              <div
                className="line-clamp-3 text-sm text-muted-foreground"
                dangerouslySetInnerHTML={{ __html: result.snippetHtml }}
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
