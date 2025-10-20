import { useState } from "react";
import ChapterSidebar from "../ChapterSidebar";
import { completeBookData } from "@/lib/bookContent";

export default function ChapterSidebarExample() {
  const initialChapter = completeBookData.chapters[0];
  const initialSection = initialChapter.sections[0];
  const [currentChapterId, setCurrentChapterId] = useState<string | null>(initialChapter.id);
  const [currentSectionId, setCurrentSectionId] = useState<string | null>(initialSection.id);

  return (
    <div className="h-96 w-80">
      <ChapterSidebar
        volumeNumber={completeBookData.volumeNumber}
        chapters={completeBookData.chapters}
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
