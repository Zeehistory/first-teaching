import { ScrollArea } from "@/components/ui/scroll-area";
import { hasRenderableContent } from "@/lib/content";
import { processSubsections } from "@/lib/subsections";
import Transliterated from "@/components/Transliterated";
import type { Chapter } from "@shared/schema";

interface ChapterSidebarProps {
  volumeNumber: number;
  chapters: Chapter[];
  currentChapterId: string | null;
  currentSectionId: string | null;
  /** Retained for API compatibility; the home action now lives in the tab row. */
  onHomeClick?: (volumeNumber: number) => void;
  onSectionClick: (volumeNumber: number, chapterId: string, sectionId: string) => void;
  /** Jump to a crosshead within a (possibly other) section, same page. */
  onSubsectionClick?: (
    volumeNumber: number,
    chapterId: string,
    sectionId: string,
    subId: string
  ) => void;
}

/* A "Book …" chapter is a subsection that nests under the most recent
   thematic chapter (a Part). Anything that isn't a "Book" — descriptive
   thematic titles, Introduction, Conclusion — is a Part header in its own
   right. We group the flat chapter list accordingly so the nav reads as
   Parts with their Books indented beneath. */
const isBookChapter = (chapter: Chapter) =>
  /^\s*book\b/i.test(chapter.title);

interface ChapterGroup {
  part: { chapter: Chapter; index: number } | null;
  books: Array<{ chapter: Chapter; index: number }>;
}

function groupChapters(chapters: Chapter[]): ChapterGroup[] {
  const groups: ChapterGroup[] = [];
  chapters.forEach((chapter, index) => {
    if (isBookChapter(chapter)) {
      // A Book with no preceding Part stands on its own (no parent).
      const current = groups[groups.length - 1];
      if (current && current.part) {
        current.books.push({ chapter, index });
      } else {
        groups.push({ part: null, books: [{ chapter, index }] });
      }
    } else {
      groups.push({ part: { chapter, index }, books: [] });
    }
  });
  return groups;
}

export default function ChapterSidebar({
  volumeNumber,
  chapters,
  currentChapterId,
  currentSectionId,
  onSectionClick,
  onSubsectionClick,
}: ChapterSidebarProps) {
  const groups = groupChapters(chapters);

  /* Crossheadings inside a section, listed in the nav as deeper-indented
     italic sub-entries that scroll within the same page. */
  const renderSubList = (
    chapter: Chapter,
    sectionId: string,
    sectionContent: string,
    baseIndentPx: number
  ) => {
    const subsections = processSubsections(sectionContent, sectionId).subsections;
    if (subsections.length === 0) return null;
    return (
      <ul className="mb-2 mt-1.5 space-y-1 border-l border-sidebar-border/40 pl-3">
        {subsections.map((sub) => (
          <li key={sub.id}>
            <button
              type="button"
              onClick={() =>
                onSubsectionClick?.(volumeNumber, chapter.id, sectionId, sub.id)
              }
              className="block w-full rounded-sm py-1 pr-2 text-left font-serif text-[0.8rem] italic leading-snug text-sidebar-foreground/55 transition-colors hover:text-primary"
              style={{ paddingLeft: `${baseIndentPx}px` }}
            >
              <span className="line-clamp-2"><Transliterated text={sub.title} /></span>
            </button>
          </li>
        ))}
      </ul>
    );
  };

  const renderChapter = (chapter: Chapter, chapterIdx: number, isPart = false) => {
              const baseLevel =
                chapter.sections.length > 0
                  ? Math.min(...chapter.sections.map((s) => s.level))
                  : 0;
              const isChapterActive = currentChapterId === chapter.id;
              /* Show the full chapter title on one line (e.g. "Book One: The
                 Coming of the Hour (al-Sāʿa)"). The colon split is kept only to
                 detect the echo-section case below. */
              const titleParts = chapter.title.split(/:\s*([\s\S]+)/);
              const headingLabel = chapter.title.trim();
              const headingSubtitle = titleParts[1]?.trim() ?? null;
              /* Hide a lone section row that just repeats the chapter title;
                 the chapter heading itself becomes the link in that case. */
              const onlyEcho =
                chapter.sections.length === 1 &&
                (chapter.sections[0].title.trim() === chapter.title.trim() ||
                  (headingSubtitle != null &&
                    chapter.sections[0].title.trim() === headingSubtitle));
              const echoSection = onlyEcho ? chapter.sections[0] : null;
              const echoActive =
                echoSection != null &&
                isChapterActive &&
                currentSectionId === echoSection.id;
              const echoDisabled =
                echoSection != null && !hasRenderableContent(echoSection.content);

              return (
                <>
                  <button
                    type="button"
                    onClick={
                      echoSection && !echoDisabled
                        ? () => onSectionClick(volumeNumber, chapter.id, echoSection.id)
                        : undefined
                    }
                    disabled={!echoSection || echoDisabled}
                    className={`group flex w-full items-baseline text-left ${
                      echoSection && !echoDisabled ? "cursor-pointer" : "cursor-default"
                    }`}
                  >
                    <span className="min-w-0">
                      <span
                        className={`block font-heading leading-snug transition-colors ${
                          isPart
                            ? "text-[1.15rem] font-semibold"
                            : "text-[1.05rem] font-medium"
                        } ${
                          echoActive
                            ? "text-primary"
                            : isPart
                              ? "text-primary group-hover:text-primary"
                              : "text-sidebar-foreground group-hover:text-primary"
                        }`}
                      >
                        <Transliterated text={headingLabel} />
                      </span>
                      {headingSubtitle && onlyEcho && (
                        <span className="mt-0.5 block font-serif text-sm leading-snug text-sidebar-foreground/60">
                          <Transliterated text={headingSubtitle} />
                        </span>
                      )}
                    </span>
                  </button>

                  {onlyEcho && echoSection && !echoDisabled &&
                    renderSubList(chapter, echoSection.id, echoSection.content, 14)}

                  {!onlyEcho && (
                    <ul className="mt-3 space-y-1.5 border-l border-sidebar-border/70 pl-3">
                      {chapter.sections.map((section) => {
                        const isActive =
                          currentChapterId === chapter.id &&
                          currentSectionId === section.id;
                        const indentLevel = Math.max(0, section.level - baseLevel);
                        const isDisabled = !hasRenderableContent(section.content);
                        return (
                          <li key={section.id}>
                            <button
                              type="button"
                              onClick={
                                isDisabled
                                  ? undefined
                                  : () => onSectionClick(volumeNumber, chapter.id, section.id)
                              }
                              disabled={isDisabled}
                              aria-disabled={isDisabled}
                              className={`relative w-full rounded-sm py-1.5 pr-2 text-left text-sm leading-snug transition-colors ${
                                isActive
                                  ? "text-primary"
                                  : isDisabled
                                    ? "cursor-not-allowed text-sidebar-foreground/35"
                                    : "text-sidebar-foreground/75 hover:text-foreground"
                              }`}
                              style={{ paddingLeft: `${indentLevel * 14}px` }}
                              data-testid={`section-link-${section.id}`}
                            >
                              {isActive && (
                                <span
                                  className="absolute -left-[13px] top-1/2 h-4 w-px -translate-y-1/2 bg-[hsl(var(--gilt))]"
                                  aria-hidden="true"
                                />
                              )}
                              <span className="line-clamp-2"><Transliterated text={section.title} /></span>
                            </button>

                            {!isDisabled &&
                              renderSubList(
                                chapter,
                                section.id,
                                section.content,
                                (indentLevel + 1) * 14
                              )}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </>
              );
  };

  return (
    <div className="flex h-full flex-col bg-sidebar">
      <ScrollArea className="flex-1">
        <nav className="px-5 pb-6 pt-4">
          <ol className="space-y-10">
            {groups.map((group, groupIdx) => {
              if (group.part && group.books.length > 0) {
                return (
                  <li key={group.part.chapter.id}>
                    {renderChapter(group.part.chapter, group.part.index, true)}
                    <ol className="mt-5 space-y-8 border-l border-sidebar-border/60 pl-5">
                      {group.books.map((book) => (
                        <li key={book.chapter.id}>
                          {renderChapter(book.chapter, book.index)}
                        </li>
                      ))}
                    </ol>
                  </li>
                );
              }
              // A standalone part (no books) or an orphan book group.
              const flat = group.part ? [group.part] : group.books;
              return flat.map((entry) => (
                <li key={entry.chapter.id}>
                  {renderChapter(entry.chapter, entry.index)}
                </li>
              ));
            })}
          </ol>
        </nav>
      </ScrollArea>
    </div>
  );
}
