import { ScrollArea } from "@/components/ui/scroll-area";
import { hasRenderableContent } from "@/lib/content";
import type { Chapter } from "@shared/schema";

interface ChapterSidebarProps {
  volumeNumber: number;
  chapters: Chapter[];
  currentChapterId: string | null;
  currentSectionId: string | null;
  /** Retained for API compatibility; the home action now lives in the tab row. */
  onHomeClick?: (volumeNumber: number) => void;
  onSectionClick: (volumeNumber: number, chapterId: string, sectionId: string) => void;
}

export default function ChapterSidebar({
  volumeNumber,
  chapters,
  currentChapterId,
  currentSectionId,
  onSectionClick,
}: ChapterSidebarProps) {
  return (
    <div className="flex h-full flex-col bg-sidebar">
      <ScrollArea className="flex-1">
        <nav className="px-5 pb-6 pt-4">
          <ol className="space-y-7">
            {chapters.map((chapter, chapterIdx) => {
              const baseLevel =
                chapter.sections.length > 0
                  ? Math.min(...chapter.sections.map((s) => s.level))
                  : 0;
              const isChapterActive = currentChapterId === chapter.id;
              /* Normalise the heading: a title like "Book Thirteen: Crossing
                 the Great Traverse (al-Ṣirāṭ)" splits into a short heading
                 ("Book Thirteen") and a subtitle ("Crossing the Great
                 Traverse…"), so every chapter reads the same clean way. */
              const titleParts = chapter.title.split(/:\s*([\s\S]+)/);
              const headingLabel = titleParts[1] ? titleParts[0].trim() : chapter.title.trim();
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
                <li key={chapter.id}>
                  <button
                    type="button"
                    onClick={
                      echoSection && !echoDisabled
                        ? () => onSectionClick(volumeNumber, chapter.id, echoSection.id)
                        : undefined
                    }
                    disabled={!echoSection || echoDisabled}
                    className={`group flex w-full items-baseline gap-3 text-left ${
                      echoSection && !echoDisabled ? "cursor-pointer" : "cursor-default"
                    }`}
                  >
                    <span
                      className={`mt-0.5 font-sans text-[0.7rem] font-semibold tabular-nums transition-colors ${
                        echoActive
                          ? "text-[hsl(var(--gilt))]"
                          : "text-sidebar-foreground/40 group-hover:text-sidebar-foreground/70"
                      }`}
                    >
                      {String(chapterIdx + 1).padStart(2, "0")}
                    </span>
                    <span className="min-w-0">
                      <span
                        className={`block font-heading text-[1.05rem] font-medium leading-snug transition-colors ${
                          echoActive
                            ? "text-primary"
                            : "text-sidebar-foreground group-hover:text-primary"
                        }`}
                      >
                        {headingLabel}
                      </span>
                      {headingSubtitle && onlyEcho && (
                        <span className="mt-0.5 block font-serif text-sm leading-snug text-sidebar-foreground/60">
                          {headingSubtitle}
                        </span>
                      )}
                    </span>
                  </button>

                  {!onlyEcho && (
                    <ul className="mt-2.5 space-y-px border-l border-sidebar-border/70 pl-3">
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
                              <span className="line-clamp-2">{section.title}</span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>
      </ScrollArea>
    </div>
  );
}
