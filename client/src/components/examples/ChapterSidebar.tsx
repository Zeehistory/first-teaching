import { useState } from "react";
import ChapterSidebar from "../ChapterSidebar";
import { mockBookData } from "@/lib/mockData";

export default function ChapterSidebarExample() {
  const [currentChapterId, setCurrentChapterId] = useState<string | null>("ch1");
  const [currentSectionId, setCurrentSectionId] = useState<string | null>("ch1-s1");

  return (
    <div className="h-96 w-80">
      <ChapterSidebar
        chapters={mockBookData.chapters}
        currentChapterId={currentChapterId}
        currentSectionId={currentSectionId}
        onHomeClick={() => console.log("Home clicked")}
        onSectionClick={(chapterId, sectionId) => {
          setCurrentChapterId(chapterId);
          setCurrentSectionId(sectionId);
          console.log("Section clicked:", chapterId, sectionId);
        }}
      />
    </div>
  );
}
