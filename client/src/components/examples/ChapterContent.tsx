import { useState } from "react";
import ChapterContent from "../ChapterContent";
import FootnotePanel from "../FootnotePanel";
import { completeBookData } from "@/lib/bookContent";
import type { Footnote } from "@shared/schema";

export default function ChapterContentExample() {
  const [selectedFootnote, setSelectedFootnote] = useState<Footnote | null>(null);
  const chapter = completeBookData.chapters[0];
  const section = chapter.sections[0];

  return (
    <div className="relative min-h-screen">
      <ChapterContent
        section={section}
        chapterTitle={chapter.title}
        textSize={18}
        highlightTerm={null}
        onFootnoteClick={(footnote) => setSelectedFootnote(footnote)}
      />
      <FootnotePanel
        footnote={selectedFootnote}
        onClose={() => setSelectedFootnote(null)}
      />
    </div>
  );
}
