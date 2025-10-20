import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { Search as SearchIcon, ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import ChapterSidebar from "@/components/ChapterSidebar";
import ChapterContent from "@/components/ChapterContent";
import SearchOverlay from "@/components/SearchOverlay";
import FootnotePanel from "@/components/FootnotePanel";
import ReadingProgress from "@/components/ReadingProgress";
import ThemeToggle from "@/components/ThemeToggle";
import TextSizeControl from "@/components/TextSizeControl";
import PageReferenceInput from "@/components/PageReferenceInput";
import { mockBookData } from "@/lib/mockData";
import type { Footnote } from "@shared/schema";

export default function Chapter() {
  const [, params] = useRoute("/chapter/:id");
  const [location, setLocation] = useLocation();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedFootnote, setSelectedFootnote] = useState<Footnote | null>(null);
  const [textSize, setTextSize] = useState(() => {
    const saved = localStorage.getItem("textSize");
    return saved ? parseInt(saved) : 18;
  });
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const searchParams = new URLSearchParams(location.split("?")[1]);
  const sectionParam = searchParams.get("section");

  const chapterId = params?.id || null;
  const chapter = mockBookData.chapters.find((c) => c.id === chapterId);
  const [currentSectionId, setCurrentSectionId] = useState<string | null>(
    sectionParam || chapter?.sections[0]?.id || null
  );

  useEffect(() => {
    if (sectionParam) {
      setCurrentSectionId(sectionParam);
    }
  }, [sectionParam]);

  useEffect(() => {
    localStorage.setItem("textSize", textSize.toString());
  }, [textSize]);

  if (!chapter) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-heading mb-4">Chapter not found</h1>
          <Button onClick={() => setLocation("/")}>Return Home</Button>
        </div>
      </div>
    );
  }

  const currentSection = chapter.sections.find((s) => s.id === currentSectionId);
  const currentSectionIndex = chapter.sections.findIndex(
    (s) => s.id === currentSectionId
  );
  const prevSection = currentSectionIndex > 0 ? chapter.sections[currentSectionIndex - 1] : null;
  const nextSection = currentSectionIndex < chapter.sections.length - 1 
    ? chapter.sections[currentSectionIndex + 1] 
    : null;

  const handleSectionClick = (chapterId: string, sectionId: string) => {
    setCurrentSectionId(sectionId);
    setLocation(`/chapter/${chapterId}?section=${sectionId}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <ReadingProgress />
      <div className="flex h-screen overflow-hidden">
        {sidebarOpen && (
          <div className="w-80 flex-shrink-0 overflow-hidden">
            <ChapterSidebar
              chapters={mockBookData.chapters}
              currentChapterId={chapterId}
              currentSectionId={currentSectionId}
              onHomeClick={() => setLocation("/")}
              onSectionClick={handleSectionClick}
            />
          </div>
        )}

        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-background">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                data-testid="button-toggle-sidebar"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  className="text-foreground"
                >
                  <path
                    d="M2 3h12M2 8h12M2 13h12"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </Button>
              <PageReferenceInput
                chapters={mockBookData.chapters}
                onNavigate={handleSectionClick}
              />
            </div>

            <div className="flex items-center gap-2">
              <TextSizeControl
                textSize={textSize}
                onIncrease={() => setTextSize((s) => Math.min(s + 2, 22))}
                onDecrease={() => setTextSize((s) => Math.max(s - 2, 14))}
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSearchOpen(true)}
                data-testid="button-search"
              >
                <SearchIcon className="h-4 w-4" />
              </Button>
              <ThemeToggle />
            </div>
          </header>

          <main className="flex-1 overflow-y-auto">
            {currentSection && (
              <ChapterContent
                section={currentSection}
                chapterTitle={chapter.title}
                chapterNumber={chapter.number}
                textSize={textSize}
                onFootnoteClick={setSelectedFootnote}
              />
            )}

            <div className="max-w-3xl mx-auto px-6 pb-12">
              <div className="flex items-center justify-between pt-8 border-t border-border">
                <div>
                  {prevSection && (
                    <Button
                      variant="outline"
                      onClick={() => handleSectionClick(chapter.id, prevSection.id)}
                      data-testid="button-prev-section"
                      className="gap-2"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      <div className="text-left">
                        <div className="text-xs text-muted-foreground font-sans">
                          Previous
                        </div>
                        <div className="font-medium line-clamp-1">
                          {prevSection.title}
                        </div>
                      </div>
                    </Button>
                  )}
                </div>
                <div>
                  {nextSection && (
                    <Button
                      variant="outline"
                      onClick={() => handleSectionClick(chapter.id, nextSection.id)}
                      data-testid="button-next-section"
                      className="gap-2"
                    >
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground font-sans">
                          Next
                        </div>
                        <div className="font-medium line-clamp-1">
                          {nextSection.title}
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>

      <SearchOverlay
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        bookData={mockBookData}
        onResultClick={handleSectionClick}
      />

      <FootnotePanel
        footnote={selectedFootnote}
        onClose={() => setSelectedFootnote(null)}
      />
    </>
  );
}
