import { useState } from "react";
import ChapterContent from "../ChapterContent";
import { mockBookData } from "@/lib/mockData";
import FootnotePanel from "../FootnotePanel";
import type { Footnote } from "@shared/schema";

export default function ChapterContentExample() {
  const [selectedFootnote, setSelectedFootnote] = useState<Footnote | null>(null);
  const section = mockBookData.chapters[0].sections[0];

  return (
    <div className="relative min-h-screen">
      <ChapterContent
        section={section}
        chapterTitle={mockBookData.chapters[0].title}
        chapterNumber={mockBookData.chapters[0].number}
        textSize={18}
        onFootnoteClick={(footnote) => setSelectedFootnote(footnote)}
      />
      <FootnotePanel
        footnote={selectedFootnote}
        onClose={() => setSelectedFootnote(null)}
      />
    </div>
  );
}
