import { useState } from "react";
import ChapterContent from "../ChapterContent";
import FootnotePanel from "../FootnotePanel";
import { volumeOneData } from "@/lib/content";
import { buildSectionHierarchy } from "@/lib/sectionHierarchy";
import type { Footnote } from "@shared/schema";

export default function ChapterContentExample() {
  const [selectedFootnote, setSelectedFootnote] = useState<Footnote | null>(null);
  const chapter = volumeOneData.chapters[0];
  const section = chapter.sections[0];
  const { trails } = buildSectionHierarchy(chapter.sections);
  const trail = trails.get(section.id) ?? [];

  return (
    <div className="relative min-h-screen">
      <ChapterContent
        section={section}
        chapterTitle={chapter.title}
        textSize={18}
        highlightTerm={null}
        sectionTrail={trail}
        currentHighlightIndex={null}
        onFootnoteClick={(footnote) => setSelectedFootnote(footnote)}
      />
      <FootnotePanel
        footnote={selectedFootnote}
        onClose={() => setSelectedFootnote(null)}
      />
    </div>
  );
}
