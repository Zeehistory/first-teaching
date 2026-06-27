import { ArrowLeft, ArrowUpRight, Search as SearchIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { BookData } from "@shared/schema";

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
    <div className="min-h-screen bg-background">
      {/* ---------- Volume masthead ---------- */}
      <header className="border-b border-[hsl(var(--codex-rule)/0.7)]">
        <div className="mx-auto max-w-4xl px-6 pt-12 pb-12 md:pt-16 md:pb-16">
          <div className="flex items-center justify-between">
            {onBackToLibrary ? (
              <button
                type="button"
                onClick={onBackToLibrary}
                className="group inline-flex items-center gap-2 codex-label transition hover:text-foreground"
              >
                <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
                The Library
              </button>
            ) : (
              <span />
            )}
            <span className="codex-label text-sm">
              Volume {bookData.volumeNumber} / {bookData.totalVolumes}
            </span>
          </div>

          <p className="mt-10 codex-label">{bookData.seriesTitle}</p>
          <h1 className="masthead-title mt-4 text-[2.4rem] leading-[0.96] sm:text-5xl md:text-6xl">
            {bookData.volumeTitle}
          </h1>
          <p className="mt-5 font-heading text-2xl italic text-[hsl(var(--codex-ink-soft))]">
            {bookData.seriesSubtitle}
          </p>

          <div className="codex-rule-gilt mt-9 w-24" />

          <p className="mt-8 max-w-2xl text-lg leading-relaxed text-foreground/85 versal">
            {bookData.introduction}
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-x-8 gap-y-3">
            <span className="codex-label">
              by{" "}
              <span className="font-serif text-sm font-normal normal-case tracking-normal text-foreground">
                {bookData.author}
              </span>
            </span>
            <button
              type="button"
              onClick={onSearchClick}
              data-testid="button-open-search"
              data-tour="home-search"
              className="group inline-flex items-center gap-2 text-sm font-medium text-primary transition hover:text-[hsl(var(--gilt))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 rounded-sm"
            >
              <SearchIcon className="h-4 w-4" />
              Search all chapters
            </button>
          </div>
        </div>
      </header>

      {/* ---------- Chapter ledger ---------- */}
      <section className="mx-auto max-w-4xl px-6 py-14">
        <div className="mb-2 flex items-end justify-between">
          <h2 className="codex-label">Contents</h2>
          <span className="codex-label text-sm text-[hsl(var(--codex-ink-soft))]/70">
            {bookData.chapters.length} chapters
          </span>
        </div>

        <div role="list">
          {bookData.chapters.map((chapter, idx) => (
            <button
              key={chapter.id}
              type="button"
              role="listitem"
              onClick={() => onChapterClick(chapter.id)}
              data-testid={`chapter-card-${chapter.id}`}
              title={chapter.description}
              className="ledger-row group"
            >
              <span className="ledger-index">{String(idx + 1).padStart(2, "0")}</span>
              <span className="min-w-0">
                <span className="block font-heading text-lg font-medium leading-snug text-foreground md:text-xl">
                  {chapter.title}
                </span>
                <span className="mt-1 line-clamp-1 block text-sm text-[hsl(var(--codex-ink-soft))]">
                  {chapter.description}
                </span>
              </span>
              <ArrowUpRight className="h-4 w-4 self-center text-primary opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100" />
            </button>
          ))}
          <div className="border-t border-[hsl(var(--codex-rule)/0.7)]" />
        </div>

        <p className="mt-10 max-w-xl text-sm leading-relaxed text-[hsl(var(--codex-ink-soft))]">
          This companion provides extended discussions and detailed commentary referenced in
          the physical book. Look for page numbers throughout the text to find corresponding
          sections in your printed copy.
        </p>
      </section>
    </div>
  );
}
