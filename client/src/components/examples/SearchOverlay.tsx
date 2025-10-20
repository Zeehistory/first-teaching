import { useState } from "react";
import SearchOverlay from "../SearchOverlay";
import { Button } from "@/components/ui/button";
import { completeBookData } from "@/lib/bookContent";

export default function SearchOverlayExample() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="p-8">
      <Button onClick={() => setIsOpen(true)}>Open Search</Button>
      <SearchOverlay
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        bookData={completeBookData}
        onResultClick={(volumeNumber, chapterId, sectionId, term) => {
          console.log("Navigate to", volumeNumber, chapterId, sectionId, term);
        }}
      />
    </div>
  );
}
