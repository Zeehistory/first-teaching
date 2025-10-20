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
import PageReferenceInput from "@/components/PageReferenceInput";
import { volumes } from "@/lib/volumes";
import type { Footnote } from "@shared/schema";

export default function Chapter() {
  const [, params] = useRoute("/v/:volumeNumber/:id");
  const [location, setLocation] = useLocation();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedFootnote, setSelectedFootnote] = useState<Footnote | null>(null);
  const [textSize, setTextSize] = useState(() => {
    const saved = localStorage.getItem("textSize");
    return saved ? parseInt(saved, 10) : 18;
  });
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [highlightTerm, setHighlightTerm] = useState<string | null>(null);

  const searchParams = new URLSearchParams(location.split("?")[1]);
  const sectionParam = searchParams.get("s");
  const highlightParam = searchParams.get("h");

  const volumeNumber = params?.volumeNumber ? parseInt(params.volumeNumber, 10) : NaN;
  const chapterId = params?.id ?? null;

  const volume = volumes.find((entry) => entry.number === volumeNumber && entry.data);
  const bookData = volume?.data;
  const chapter = bookData?.chapters.find((c) => c.id === chapterId) ?? null;

  const firstSectionId =
    chapter?.sections.find((section) => section.content.trim().length > 0)?.id ??
    chapter?.sections[0]?.id ??
    null;

  const [currentSectionId, setCurrentSectionId] = useState<string | null>(
    sectionParam || firstSectionId
  );

  useEffect(() => {
    if (sectionParam) {
      setCurrentSectionId(sectionParam);
    } else if (firstSectionId) {
      setCurrentSectionId(firstSectionId);
    }
  }, [sectionParam, firstSectionId]);

  useEffect(() => {
    if (highlightParam && highlightParam.trim().length > 0) {
      setHighlightTerm(highlightParam.trim());
    } else {
      setHighlightTerm(null);
    }
  }, [highlightParam]);

  useEffect(() => {
    localStorage.setItem("textSize", textSize.toString());
  }, [textSize]);

  if (!bookData || !chapter) {
    return (
      <div className="flex items-center justify-center min-h-screen px-6 text-center">
        <div className="max-w-xl">
          <h1 className="text-3xl font-heading mb-4">Volume Content Unavailable</h1>
          <p className="text-muted-foreground mb-6">
            The chapter you&apos;re looking for resides in a volume that has not yet been
            released in this digital companion. Please select an available volume from
            the main library to continue reading.
          </p>
          <Button onClick={() => setLocation("/")}>Back to Volume Library</Button>
        </div>
      </div>
    );
  }

  const currentSection = chapter.sections.find((s) => s.id === currentSectionId) ?? null;
  const currentSectionIndex = chapter.sections.findIndex((s) => s.id === currentSectionId);
  const prevSection =
    currentSectionIndex > 0 ? chapter.sections[currentSectionIndex - 1] : null;
  const nextSection =
    currentSectionIndex > -1 && currentSectionIndex < chapter.sections.length - 1
      ? chapter.sections[currentSectionIndex + 1]
      : null;

  const handleSectionClick = (
    volumeNo: number,
    chapId: string,
    sectionId: string,
    highlight?: string
  ) => {
    setCurrentSectionId(sectionId);
    const params = new URLSearchParams();
    params.set("s", sectionId);
    const trimmedHighlight = highlight?.trim();
    if (trimmedHighlight) {
      params.set("h", trimmedHighlight);
    }
    const query = params.toString();
    const path = `/v/${volumeNo}/${chapId}${query ? `?${query}` : ""}`;
    setLocation(path);
    setHighlightTerm(trimmedHighlight ?? null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <ReadingProgress />
      <div className="flex h-screen overflow-hidden">
        {sidebarOpen && (
          <div className="w-80 flex-shrink-0 overflow-hidden">
            <ChapterSidebar
              volumeNumber={bookData.volumeNumber}
              chapters={bookData.chapters}
              currentChapterId={chapterId}
              currentSectionId={currentSectionId}
              onHomeClick={(volumeNo) => setLocation(`/v/${volumeNo}`)}
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
                volumeNumber={bookData.volumeNumber}
                chapters={bookData.chapters}
                onNavigate={handleSectionClick}
              />
            </div>

            <div className="flex items-center gap-2">
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
                textSize={textSize}
                highlightTerm={highlightTerm}
                onFootnoteClick={setSelectedFootnote}
              />
            )}

            <div className="max-w-3xl mx-auto px-6 pb-12">
              <div className="flex items-center justify-between pt-8 border-t border-border">
                <div>
                  {prevSection && (
                    <Button
                      variant="outline"
                      onClick={() =>
                        handleSectionClick(bookData.volumeNumber, chapter.id, prevSection.id)
                      }
                      data-testid="button-prev-section"
                      className="gap-2"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      <div className="text-left">
                        <div className="text-xs text-muted-foreground font-sans">Previous</div>
                        <div className="font-medium line-clamp-1">{prevSection.title}</div>
                      </div>
                    </Button>
                  )}
                </div>
                <div>
                  {nextSection && (
                    <Button
                      variant="outline"
                      onClick={() =>
                        handleSectionClick(bookData.volumeNumber, chapter.id, nextSection.id)
                      }
                      data-testid="button-next-section"
                      className="gap-2"
                    >
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground font-sans">Next</div>
                        <div className="font-medium line-clamp-1">{nextSection.title}</div>
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
        bookData={bookData}
        onResultClick={(volumeNo, chapterId, sectionId, term) =>
          handleSectionClick(volumeNo, chapterId, sectionId, term)
        }
      />

      <FootnotePanel
        footnote={selectedFootnote}
        onClose={() => setSelectedFootnote(null)}
      />
    </>
  );
}
