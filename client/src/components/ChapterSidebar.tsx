import { Home, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Chapter } from "@shared/schema";

interface ChapterSidebarProps {
  chapters: Chapter[];
  currentChapterId: string | null;
  currentSectionId: string | null;
  onHomeClick: () => void;
  onSectionClick: (chapterId: string, sectionId: string) => void;
}

export default function ChapterSidebar({
  chapters,
  currentChapterId,
  currentSectionId,
  onHomeClick,
  onSectionClick,
}: ChapterSidebarProps) {
  return (
    <div className="h-full flex flex-col bg-sidebar border-r border-sidebar-border">
      <div className="p-4 border-b border-sidebar-border">
        <Button
          variant="ghost"
          className="w-full justify-start gap-2"
          onClick={onHomeClick}
          data-testid="button-home"
        >
          <Home className="h-4 w-4" />
          <span className="font-sans">Home</span>
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {chapters.map((chapter) => (
            <div key={chapter.id}>
              <h3 className="text-sm font-sans font-semibold text-sidebar-foreground mb-2 uppercase tracking-wide">
                Chapter {chapter.number}
              </h3>
              <h4 className="text-base font-heading font-medium mb-3 text-sidebar-foreground">
                {chapter.title}
              </h4>
              <div className="space-y-1">
                {chapter.sections.map((section) => {
                  const isActive =
                    currentChapterId === chapter.id &&
                    currentSectionId === section.id;
                  return (
                    <button
                      key={section.id}
                      onClick={() => onSectionClick(chapter.id, section.id)}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors hover-elevate active-elevate-2 ${
                        isActive
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "text-sidebar-foreground"
                      }`}
                      data-testid={`section-link-${section.id}`}
                    >
                      <div className="flex items-center gap-2">
                        <ChevronRight
                          className={`h-3 w-3 flex-shrink-0 transition-transform ${
                            isActive ? "rotate-90" : ""
                          }`}
                        />
                        <span className="line-clamp-2">{section.title}</span>
                      </div>
                      {section.pageReference && (
                        <div className="text-xs text-muted-foreground mt-1 ml-5 font-sans">
                          Physical book p. {section.pageReference}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
