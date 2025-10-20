import { useState } from "react";
import ChapterSidebar from "../ChapterSidebar";
import { volumeOneData } from "@/lib/content";

export default function ChapterSidebarExample() {
  const initialChapter = volumeOneData.chapters[0];
  const initialSection = initialChapter.sections[0];
  const [currentChapterId, setCurrentChapterId] = useState<string | null>(initialChapter.id);
  const [currentSectionId, setCurrentSectionId] = useState<string | null>(initialSection.id);

  return (
    <div className="h-96 w-80">
      <ChapterSidebar
        volumeNumber={volumeOneData.volumeNumber}
        chapters={volumeOneData.chapters}
        currentChapterId={currentChapterId}
        currentSectionId={currentSectionId}
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
