import { useState, useEffect, useMemo } from "react";
import { useLocation, useRoute, useSearch } from "wouter";
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
import { volumes } from "@/lib/volumes";
import { buildSectionHierarchy } from "@/lib/sectionHierarchy";
import type { Footnote } from "@shared/schema";

export default function Chapter() {
  const [, params] = useRoute("/v/:volumeNumber/:id");
  const [location, setLocation] = useLocation();
  const search = useSearch();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedFootnote, setSelectedFootnote] = useState<Footnote | null>(null);
  const [textSize, setTextSize] = useState(() => {
    const saved = localStorage.getItem("textSize");
    return saved ? parseInt(saved, 10) : 18;
  });
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [highlightTerm, setHighlightTerm] = useState<string | null>(null);
  const [highlightMatches, setHighlightMatches] = useState(0);
  const [highlightIndex, setHighlightIndex] = useState<number | null>(null);

  const searchParams = useMemo(() => new URLSearchParams(search), [search]);
  const sectionParam = searchParams.get("s");
  const highlightRawParam = searchParams.get("h");
  const highlightParam =
    highlightRawParam && highlightRawParam.trim().length > 0 ? highlightRawParam : null;
  const highlightInstanceParam = searchParams.get("hi");
  const highlightInstance = highlightInstanceParam ? parseInt(highlightInstanceParam, 10) : null;
  console.log(`[Chapter] URL: ${location}`);
  console.log(`[Chapter] search: ?${search}`);
  console.log(`[Chapter] searchParams:`, Object.fromEntries(searchParams.entries()));

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
    console.log(`[Chapter] sectionParam:`, sectionParam);
    console.log(`[Chapter] firstSectionId:`, firstSectionId);
    if (sectionParam) {
      console.log(`[Chapter] Setting currentSectionId to:`, sectionParam);
      setCurrentSectionId(sectionParam);
    } else if (firstSectionId) {
      console.log(`[Chapter] Setting currentSectionId to firstSectionId:`, firstSectionId);
      setCurrentSectionId(firstSectionId);
    }
  }, [sectionParam, firstSectionId]);

  useEffect(() => {
    console.log(`[Chapter] highlightParam:`, highlightParam ? `"${highlightParam.substring(0, 50)}..."` : 'null');
    console.log(`[Chapter] highlightRawParam:`, highlightRawParam ? `"${highlightRawParam.substring(0, 50)}..."` : 'null');
    if (highlightParam && highlightParam.length > 0) {
      setHighlightTerm(highlightParam);
    } else {
      setHighlightTerm(null);
    }
  }, [highlightParam, highlightRawParam]);

  useEffect(() => {
    console.log(`[Chapter] highlightTerm:`, highlightTerm ? `"${highlightTerm.substring(0, 50)}..."` : 'null');
    console.log(`[Chapter] highlightInstance:`, highlightInstance);
    
    if (highlightTerm) {
      const index =
        typeof highlightInstance === "number" && Number.isFinite(highlightInstance)
          ? Math.max(0, highlightInstance)
          : 0;
      console.log(`[Chapter] Setting highlight index to ${index} for term: "${highlightTerm.substring(0, 50)}..."`);
      setHighlightIndex(index);
    } else {
      console.log(`[Chapter] No highlight term, clearing highlights`);
      setHighlightIndex(null);
      setHighlightMatches(0);
    }
  }, [highlightTerm, highlightInstance]);

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

  const sectionHierarchy = useMemo(() => buildSectionHierarchy(chapter.sections), [chapter]);

  const currentSection = chapter.sections.find((s) => s.id === currentSectionId) ?? null;
  const currentSectionIndex = chapter.sections.findIndex((s) => s.id === currentSectionId);
  
  console.log(`[Chapter] currentSectionId:`, currentSectionId);
  console.log(`[Chapter] currentSection:`, currentSection ? currentSection.title : 'null');
  console.log(`[Chapter] currentSectionIndex:`, currentSectionIndex);
  const prevSection =
    currentSectionIndex > 0 ? chapter.sections[currentSectionIndex - 1] : null;
  const nextSection =
    currentSectionIndex > -1 && currentSectionIndex < chapter.sections.length - 1
      ? chapter.sections[currentSectionIndex + 1]
      : null;

  const sectionTrail = currentSection
    ? sectionHierarchy.trails.get(currentSection.id) ?? []
    : [];

  const handleSectionClick = (
    volumeNo: number,
    chapId: string,
    sectionId: string,
    highlight?: string,
    highlightIndexOverride?: number
  ) => {
    setCurrentSectionId(sectionId);
    const params = new URLSearchParams();
    params.set("s", sectionId);
    const trimmedHighlight = highlight?.trim();
    if (trimmedHighlight) {
      params.set("h", trimmedHighlight);
      if (typeof highlightIndexOverride === "number" && highlightIndexOverride >= 0) {
        params.set("hi", String(highlightIndexOverride));
      }
    }
    const query = params.toString();
    const path = `/v/${volumeNo}/${chapId}${query ? `?${query}` : ""}`;
    setLocation(path);
    setHighlightTerm(trimmedHighlight ?? null);
    if (typeof highlightIndexOverride === "number") {
      setHighlightIndex(Math.max(0, highlightIndexOverride));
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <ReadingProgress />
      <div className="chapter-shell flex h-screen overflow-hidden">
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
                onNavigate={(volumeNo, chapterId, sectionId) =>
                  handleSectionClick(volumeNo, chapterId, sectionId)
                }
              />
            </div>

            <div className="flex items-center gap-2">
              <TextSizeControl
                textSize={textSize}
                onIncrease={() => setTextSize((s) => Math.min(s + 2, 22))}
                onDecrease={() => setTextSize((s) => Math.max(s - 2, 14))}
              />
              {highlightTerm && highlightMatches > 0 && highlightIndex !== null && (
                <div className="hidden sm:flex items-center gap-2 rounded-full border border-border bg-background/80 px-3 py-1 text-xs font-sans text-muted-foreground shadow-sm">
                  <span className="tracking-wide">
                    {highlightMatches === 1
                      ? `1 of 1`
                      : `${highlightIndex + 1} / ${highlightMatches}`}
                  </span>
                  {highlightMatches > 1 && (
                    <>
                      <button
                        type="button"
                        className="hover:text-foreground transition-colors"
                        onClick={() =>
                          setHighlightIndex((prev) =>
                            prev === null || highlightMatches === 0
                              ? prev
                              : (prev + highlightMatches - 1) % highlightMatches
                          )
                        }
                        aria-label="Previous match"
                      >
                        ‹
                      </button>
                      <button
                        type="button"
                        className="hover:text-foreground transition-colors"
                        onClick={() =>
                          setHighlightIndex((prev) =>
                            prev === null || highlightMatches === 0
                              ? prev
                              : (prev + 1) % highlightMatches
                          )
                        }
                        aria-label="Next match"
                      >
                        ›
                      </button>
                    </>
                  )}
                </div>
              )}
              <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent("open-ask-assistant"))}
                aria-label="Open study assistant"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background text-foreground transition hover:border-primary/50 hover:text-primary"
              >
                <AssistantMark className="h-4 w-4" />
              </button>
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
                sectionTrail={sectionTrail}
                currentHighlightIndex={highlightIndex}
                onHighlightMatches={(count) => {
                  setHighlightMatches(count);
                  if (count === 0) {
                    setHighlightIndex(null);
                  } else {
                    setHighlightIndex((prev) =>
                      prev !== null && prev < count ? prev : 0
                    );
                  }
                }}
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

function AssistantMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 4 12 6 8 4 6 6 8 10 6 16 8 22 6 26 8 28 12 26 16 28 20 26 24 28 26 26 24 22 26 16 24 10 26 6 24 4 20 6 16 4Z" />
      <circle cx="16" cy="16" r="5.5" />
    </svg>
  );
}
