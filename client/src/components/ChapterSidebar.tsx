import { Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Chapter } from "@shared/schema";
import { buildSectionHierarchy, type SectionNode } from "@/lib/sectionHierarchy";
import { cn } from "@/lib/utils";

interface ChapterSidebarProps {
  volumeNumber: number;
  chapters: Chapter[];
  currentChapterId: string | null;
  currentSectionId: string | null;
  activeSectionIds: Set<string>;
  onHomeClick: (volumeNumber: number) => void;
  onSectionClick: (volumeNumber: number, chapterId: string, sectionId: string) => void;
}

export default function ChapterSidebar({
  volumeNumber,
  chapters,
  currentChapterId,
  currentSectionId,
  activeSectionIds,
  onHomeClick,
  onSectionClick,
}: ChapterSidebarProps) {
  const renderNode = (chapterId: string, node: SectionNode, depth: number) => {
    const isActive =
      currentChapterId === chapterId && currentSectionId === node.section.id;
    const isInBranch =
      currentChapterId === chapterId && activeSectionIds.has(node.section.id);

    const paddingLeft = depth === 0 ? 14 : 18 + depth * 16;
    const buttonClass = cn(
      "w-full text-left rounded-md transition-colors focus:outline-none focus:ring-1 focus:ring-primary",
      depth === 0
        ? "px-3 py-2 font-heading text-[11px] uppercase tracking-[0.35em]"
        : "px-3 py-2 text-sm font-sans leading-snug",
      isActive
        ? "bg-sidebar-accent text-sidebar-accent-foreground shadow"
        : isInBranch
          ? "bg-sidebar/40 text-sidebar-foreground"
          : "text-sidebar-foreground hover:bg-sidebar/30"
    );

    return (
      <div key={`${chapterId}-${node.section.id}`} className="space-y-1">
        <button
          className={buttonClass}
          style={{ paddingLeft }}
          onClick={() => onSectionClick(volumeNumber, chapterId, node.section.id)}
          data-testid={`section-link-${node.section.id}`}
        >
          <span
            className={cn(
              "flex items-center gap-2",
              depth === 0 ? "text-xs" : "text-sm"
            )}
          >
            {depth > 0 && (
              <span className="h-1.5 w-1.5 rounded-full bg-primary/40 flex-shrink-0" />
            )}
            <span className={depth === 0 ? "truncate" : "line-clamp-2"}>
              {node.section.title}
            </span>
          </span>
        </button>
        {node.children.length > 0 && (
          <div className="space-y-1">
            {node.children.map((child: SectionNode) =>
              renderNode(chapterId, child, depth + 1)
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-sidebar border-r border-sidebar-border">
      <div className="p-4 border-b border-sidebar-border">
        <Button
          variant="ghost"
          className="w-full justify-start gap-2"
          onClick={() => onHomeClick(volumeNumber)}
          data-testid="button-home"
        >
          <Home className="h-4 w-4" />
          <span className="font-sans">Home</span>
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {chapters.map((chapter) => {
            const { tree } = buildSectionHierarchy(chapter.sections);
            return (
              <div key={chapter.id} className="space-y-2">
                <h3 className="text-xs font-sans font-semibold text-sidebar-foreground uppercase tracking-[0.35em]">
                  {chapter.title}
                </h3>
                <div className="space-y-1">
                  {tree.map((node: SectionNode) => renderNode(chapter.id, node, 0))}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
