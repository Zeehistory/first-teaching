import { useState } from "react";
import FootnotePanel from "../FootnotePanel";
import { Button } from "@/components/ui/button";

export default function FootnotePanelExample() {
  const [showPanel, setShowPanel] = useState(false);

  const sampleFootnote = {
    id: "fn1",
    number: 1,
    sectionId: "s1",
    content:
      "This hadith is reported in Sunan Ibn Majah and other collections. While some scholars debate its chain of transmission, its meaning is widely accepted and supported by numerous Quranic verses emphasizing the importance of knowledge.",
  };

  return (
    <div className="relative h-96">
      <div className="p-8">
        <Button onClick={() => setShowPanel(true)}>Show Footnote</Button>
      </div>
      <FootnotePanel
        footnote={showPanel ? sampleFootnote : null}
        onClose={() => setShowPanel(false)}
      />
    </div>
  );
}
