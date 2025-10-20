import { useState } from "react";
import ChapterSidebar from "../ChapterSidebar";
import { volumeOneData } from "@/lib/content";
import { buildSectionHierarchy } from "@/lib/sectionHierarchy";

export default function ChapterSidebarExample() {
  const initialChapter = volumeOneData.chapters[0];
  const initialSection = initialChapter.sections[0];
  const [currentChapterId, setCurrentChapterId] = useState<string | null>(initialChapter.id);
  const [currentSectionId, setCurrentSectionId] = useState<string | null>(initialSection.id);

  const currentChapter =
    volumeOneData.chapters.find((chapter) => chapter.id === currentChapterId) ?? initialChapter;
  const { trails } = buildSectionHierarchy(currentChapter.sections);
  const activeIds =
    currentSectionId != null
      ? new Set([
          currentSectionId,
          ...(trails.get(currentSectionId)?.map((section) => section.id) ?? []),
        ])
      : new Set<string>();

  return (
    <div className="h-96 w-80">
      <ChapterSidebar
        volumeNumber={volumeOneData.volumeNumber}
        chapters={volumeOneData.chapters}
        currentChapterId={currentChapterId}
        currentSectionId={currentSectionId}
        activeSectionIds={activeIds}
        onHomeClick={(volumeNumber) => console.log("Home clicked", volumeNumber)}
        onSectionClick={(volumeNumber, chapterId, sectionId) => {
          setCurrentChapterId(chapterId);
          setCurrentSectionId(sectionId);
          console.log("Section clicked:", volumeNumber, chapterId, sectionId);
        }}
      />
    </div>
  );
}
