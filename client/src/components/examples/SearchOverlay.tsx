import { useState } from "react";
import SearchOverlay from "../SearchOverlay";
import { Button } from "@/components/ui/button";
import { mockBookData } from "@/lib/mockData";

export default function SearchOverlayExample() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="p-8">
      <Button onClick={() => setIsOpen(true)}>Open Search</Button>
      <SearchOverlay
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        bookData={mockBookData}
        onResultClick={(chapterId, sectionId) => {
          console.log("Navigate to", chapterId, sectionId);
        }}
      />
    </div>
  );
}
