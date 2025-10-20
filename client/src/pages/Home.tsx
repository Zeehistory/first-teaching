import { useLocation } from "wouter";
import { useState } from "react";
import HomePage from "@/components/HomePage";
import SearchOverlay from "@/components/SearchOverlay";
import { mockBookData } from "@/lib/mockData";

export default function Home() {
  const [, setLocation] = useLocation();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <>
      <HomePage
        bookData={mockBookData}
        onChapterClick={(chapterId) => setLocation(`/chapter/${chapterId}`)}
        onSearchClick={() => setIsSearchOpen(true)}
      />
      <SearchOverlay
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        bookData={mockBookData}
        onResultClick={(chapterId, sectionId) => {
          setLocation(`/chapter/${chapterId}?section=${sectionId}`);
        }}
      />
    </>
  );
}
