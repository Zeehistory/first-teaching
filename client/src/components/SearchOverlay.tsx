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
      className="fixed inset-0 z-50 bg-[hsl(var(--background)/0.96)] backdrop-blur-md animate-in fade-in duration-200"
      data-testid="search-overlay"
      onClick={onClose}
    >
      <div
        className="mx-auto max-w-2xl px-6 pt-24"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search bar — a single clean rule, no boxed chrome */}
        <div className="flex items-center gap-4 border-b border-[hsl(var(--codex-rule))] pb-4">
          <Search className="h-5 w-5 flex-shrink-0 text-[hsl(var(--codex-ink-soft))]" />
          <Input
            type="search"
            placeholder="Search the Teaching…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-auto flex-1 border-0 bg-transparent p-0 text-xl shadow-none focus-visible:ring-0 placeholder:text-[hsl(var(--codex-ink-soft))]"
            autoFocus
            data-testid="input-search"
          />
          <button
            type="button"
            onClick={onClose}
            data-testid="button-close-search"
            aria-label="Close search"
            className="flex h-8 w-8 items-center justify-center rounded-full text-[hsl(var(--codex-ink-soft))] transition hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scope — a quiet inline segmented control */}
        <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2">
          <span className="text-[0.66rem] font-semibold uppercase tracking-[0.22em] text-[hsl(var(--codex-ink-soft))]">
            Within
          </span>
          {scopeOptions.map((option) => {
            const isActive = scope === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => !option.disabled && setScope(option.value)}
                disabled={option.disabled}
                title={option.description}
                className={`text-sm transition ${
                  isActive
                    ? "font-semibold text-primary underline decoration-1 underline-offset-[6px]"
                    : "text-[hsl(var(--codex-ink-soft))] hover:text-foreground"
                } ${option.disabled ? "cursor-not-allowed opacity-40" : "cursor-pointer"}`}
              >
                {option.label}
              </button>
            );
          })}
        </div>

        {/* Results */}
        <div className="mt-8 max-h-[60vh] space-y-1 overflow-y-auto minimal-scrollbar pb-12">
          {results.length === 0 && query && (
            <p className="py-12 text-center text-sm text-[hsl(var(--codex-ink-soft))]">
              No results for “{query.trim()}”.
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
              className="block w-full rounded-lg px-4 py-3.5 text-left transition hover:bg-[hsl(var(--codex-rule)/0.35)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              data-testid={`search-result-${index}`}
            >
              <div className="text-[0.7rem] uppercase tracking-[0.16em] text-[hsl(var(--codex-ink-soft))]">
                Vol {result.volumeNumber} · {result.chapter.title}
              </div>
              <div className="mt-0.5 font-heading text-base text-foreground">
                {result.section.title}
              </div>
              <div
                className="mt-1 line-clamp-2 text-sm text-[hsl(var(--codex-ink-soft))]"
                dangerouslySetInnerHTML={{ __html: result.snippetHtml }}
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
