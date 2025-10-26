import { useState, useEffect, useMemo, useCallback } from "react";
import { useLocation, useRoute, useSearch } from "wouter";
import { Search as SearchIcon, ArrowLeft, ArrowRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import ChapterSidebar from "@/components/ChapterSidebar";
import ChapterContent from "@/components/ChapterContent";
import SearchOverlay from "@/components/SearchOverlay";
import FootnotePanel from "@/components/FootnotePanel";
import FootnotePreviewSidebar from "@/components/FootnotePreviewSidebar";
import SearchResultNavigator from "@/components/SearchResultNavigator";
import ReadingProgress from "@/components/ReadingProgress";
import ThemeToggle from "@/components/ThemeToggle";
import TextSizeControl from "@/components/TextSizeControl";
import PageReferenceInput from "@/components/PageReferenceInput";
import { volumes } from "@/lib/volumes";
import { buildSectionHierarchy } from "@/lib/sectionHierarchy";
import type { Footnote } from "@shared/schema";

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [highlightTerm, setHighlightTerm] = useState<string | null>(null);
  const [highlightMatches, setHighlightMatches] = useState(0);
  const [highlightLocalIndex, setHighlightLocalIndex] = useState<number | null>(null);
  const [highlightGlobalIndex, setHighlightGlobalIndex] = useState<number | null>(null);
  const [highlightSectionsMeta, setHighlightSectionsMeta] = useState<
    Array<{ sectionId: string; count: number; start: number }>
  >([]);
  const [showAssistantIntro, setShowAssistantIntro] = useState(false);
  const [showFootnoteSidebar, setShowFootnoteSidebar] = useState(true);

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
  const availableBooks = useMemo(
    () => volumes.filter((entry) => entry.data).map((entry) => entry.data!),
    []
  );

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
    if (!highlightTerm || !chapter) {
      console.log("[Chapter] Clearing highlight metadata");
      setHighlightMatches(0);
      setHighlightSectionsMeta([]);
      setHighlightGlobalIndex(null);
      setHighlightLocalIndex(null);
      return;
    }

    if (typeof window === "undefined") return;

    const termRegex = new RegExp(escapeRegExp(highlightTerm), "gi");
    const parser = new DOMParser();
    let cumulative = 0;
    const meta: Array<{ sectionId: string; count: number; start: number }> = [];

    chapter.sections.forEach((section) => {
      const doc = parser.parseFromString(`<div>${section.content}</div>`, "text/html");
      const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT);
      let sectionCount = 0;
      let currentNode: Node | null = walker.nextNode();

      while (currentNode) {
        const textNode = currentNode as Text;
        const parentElement = textNode.parentElement;
        if (!parentElement?.closest("sup[data-footnote]")) {
          const matches = textNode.data.match(termRegex);
          if (matches) {
            sectionCount += matches.length;
          }
        }
        currentNode = walker.nextNode();
      }

      if (sectionCount > 0) {
        meta.push({ sectionId: section.id, count: sectionCount, start: cumulative });
        cumulative += sectionCount;
      }
    });

    setHighlightSectionsMeta(meta);
    setHighlightMatches(cumulative);

    if (cumulative === 0) {
      setHighlightGlobalIndex(null);
      setHighlightLocalIndex(null);
      return;
    }

    const targetMeta =
      (sectionParam && meta.find((entry) => entry.sectionId === sectionParam)) || meta[0];

    if (!targetMeta) {
      setHighlightGlobalIndex(0);
      setHighlightLocalIndex(0);
      return;
    }

    const localIndex =
      typeof highlightInstance === "number" && Number.isFinite(highlightInstance)
        ? Math.max(0, Math.min(highlightInstance, targetMeta.count - 1))
        : 0;

    const initialGlobalIndex = targetMeta.start + localIndex;

    console.log(
      `[Chapter] Highlight metadata computed: total=${cumulative}, section=${targetMeta.sectionId}, local=${localIndex}, global=${initialGlobalIndex}`
    );

    setHighlightLocalIndex(localIndex);
    setHighlightGlobalIndex(initialGlobalIndex);
  }, [highlightTerm, chapter, highlightInstance, sectionParam]);

  useEffect(() => {
    localStorage.setItem("textSize", textSize.toString());
  }, [textSize]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const seen = window.localStorage.getItem("assistant-intro-seen");
    if (!seen) {
      const timer = window.setTimeout(() => setShowAssistantIntro(true), 500);
      return () => window.clearTimeout(timer);
    }
    setShowAssistantIntro(false);
    return undefined;
  }, []);

  const dismissAssistantIntro = useCallback(() => {
    setShowAssistantIntro(false);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("assistant-intro-seen", "true");
    }
  }, []);

  const handleAssistantButton = useCallback(() => {
    window.dispatchEvent(new CustomEvent("open-ask-assistant"));
    dismissAssistantIntro();
  }, [dismissAssistantIntro]);

  const focusFootnoteMarker = useCallback((footnote: Footnote) => {
    if (typeof document === "undefined") return;
    const marker = document.querySelector<HTMLElement>(
      `sup[data-footnote="${footnote.number}"]`
    );
    if (!marker) return;
    marker.scrollIntoView({ behavior: "smooth", block: "center" });
    marker.classList.add("footnote-marker-focus");
    window.setTimeout(() => {
      marker.classList.remove("footnote-marker-focus");
    }, 2200);
  }, []);

  const handleFootnoteOpen = useCallback(
    (footnote: Footnote) => {
      setSelectedFootnote(footnote);
      focusFootnoteMarker(footnote);
    },
    [focusFootnoteMarker]
  );

  const clearHighlights = useCallback(() => {
    setHighlightTerm(null);
    setHighlightMatches(0);
    setHighlightGlobalIndex(null);
    setHighlightLocalIndex(null);
    setHighlightSectionsMeta([]);
    const params = new URLSearchParams(search);
    params.delete("h");
    params.delete("hi");
    if (currentSectionId) {
      params.set("s", currentSectionId);
    }
    const query = params.toString();
    setLocation(`/v/${bookData?.volumeNumber}/${chapter?.id}${query ? `?${query}` : ""}`);
  }, [search, currentSectionId, setLocation, bookData?.volumeNumber, chapter?.id]);

  const goToNextHighlight = useCallback(() => {
    setHighlightGlobalIndex((prev) => {
      if (prev === null || highlightMatches === 0) return prev;
      return (prev + 1) % highlightMatches;
    });
  }, [highlightMatches]);

  const goToPrevHighlight = useCallback(() => {
    setHighlightGlobalIndex((prev) => {
      if (prev === null || highlightMatches === 0) return prev;
      return (prev + highlightMatches - 1) % highlightMatches;
    });
  }, [highlightMatches]);

  useEffect(() => {
    if (highlightGlobalIndex === null || highlightSectionsMeta.length === 0) {
      setHighlightLocalIndex(null);
      return;
    }

    const target = highlightSectionsMeta.find(
      (entry) =>
        highlightGlobalIndex >= entry.start && highlightGlobalIndex < entry.start + entry.count
    );

    if (!target) {
      setHighlightLocalIndex(null);
      return;
    }

    const localIndex = highlightGlobalIndex - target.start;
    if (highlightLocalIndex !== localIndex) {
      setHighlightLocalIndex(localIndex);
    }

    if (!bookData || !chapter) return;

    if (currentSectionId !== target.sectionId) {
      setCurrentSectionId(target.sectionId);
    }

    const params = new URLSearchParams(search);
    const currentHi = params.get("hi");
    const desiredHi = String(localIndex);
    let needsUpdate = currentHi !== desiredHi;

    if (params.get("s") !== target.sectionId) {
      params.set("s", target.sectionId);
      needsUpdate = true;
    }

    if (highlightTerm) {
      if (params.get("h") !== highlightTerm) {
        params.set("h", highlightTerm);
        needsUpdate = true;
      }
      if (currentHi !== desiredHi) {
        params.set("hi", desiredHi);
      }
    }

    const query = params.toString();
    const nextPath = `/v/${bookData.volumeNumber}/${chapter.id}${query ? `?${query}` : ""}`;
    if (needsUpdate && location !== nextPath) {
      setLocation(nextPath);
    }
  }, [
    highlightGlobalIndex,
    highlightSectionsMeta,
    highlightLocalIndex,
    highlightTerm,
    search,
    setLocation,
    location,
    bookData,
    chapter,
    currentSectionId,
  ]);

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
      if (highlightTerm) {
        const metaEntry = highlightSectionsMeta.find((entry) => entry.sectionId === sectionId);
        if (metaEntry) {
          const clampedLocal = Math.max(0, Math.min(highlightIndexOverride, metaEntry.count - 1));
          setHighlightLocalIndex(clampedLocal);
          setHighlightGlobalIndex(metaEntry.start + clampedLocal);
        } else {
          setHighlightLocalIndex(Math.max(0, highlightIndexOverride));
          setHighlightGlobalIndex(null);
        }
      } else {
        setHighlightLocalIndex(Math.max(0, highlightIndexOverride));
        setHighlightGlobalIndex(Math.max(0, highlightIndexOverride));
      }
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <ReadingProgress />
      {highlightTerm && highlightMatches > 0 && highlightGlobalIndex !== null && (
        <SearchResultNavigator
          term={highlightTerm}
          currentIndex={highlightGlobalIndex}
          total={highlightMatches}
          onNext={goToNextHighlight}
          onPrev={goToPrevHighlight}
          onClose={clearHighlights}
        />
      )}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 flex">
          <div
            className="absolute inset-0 bg-background/70 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative h-full w-full max-w-[320px]">
            <ChapterSidebar
              volumeNumber={bookData.volumeNumber}
              chapters={bookData.chapters}
              currentChapterId={chapterId}
              currentSectionId={currentSectionId}
              onHomeClick={(volumeNo) => setLocation(`/v/${volumeNo}`)}
              onSectionClick={(volumeNo, chapId, sectionId) => {
                handleSectionClick(volumeNo, chapId, sectionId);
                setSidebarOpen(false);
              }}
            />
            <button
              type="button"
              aria-label="Close navigation"
              className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition hover:text-foreground"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <div className="chapter-shell flex h-screen overflow-hidden">
        {currentSection && showFootnoteSidebar && (
          <FootnotePreviewSidebar
            footnotes={currentSection.footnotes}
            activeFootnoteId={selectedFootnote?.id ?? null}
            onSelect={handleFootnoteOpen}
            onHide={() => setShowFootnoteSidebar(false)}
          />
        )}
        <div className="flex-1 flex overflow-hidden">
          <div className="flex flex-1 flex-col overflow-hidden">
            <header className="flex items-center justify-between border-b border-border bg-background px-6 py-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSidebarOpen((prev) => !prev)}
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
                {!showFootnoteSidebar && currentSection?.footnotes.length ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFootnoteSidebar(true)}
                    className="hidden lg:inline-flex items-center gap-2"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4"
                    >
                      <path d="M13 3v10L8 9l-5 4V3" />
                    </svg>
                Footnotes
                  </Button>
                ) : null}
              </div>

              <div className="flex items-center gap-2">
                <TextSizeControl
                  textSize={textSize}
                  onIncrease={() => setTextSize((s) => Math.min(s + 2, 22))}
                  onDecrease={() => setTextSize((s) => Math.max(s - 2, 14))}
                />
              {highlightTerm && highlightMatches > 0 && highlightGlobalIndex !== null && (
                <div className="flex items-center gap-2 rounded-full border border-border bg-background/80 px-3 py-1 text-xs font-sans text-muted-foreground shadow-sm sm:hidden">
                  <span className="tracking-wide">
                    {highlightMatches === 1
                      ? `1 of 1`
                      : `${highlightGlobalIndex + 1} / ${highlightMatches}`}
                  </span>
                  {highlightMatches > 1 && (
                    <>
                      <button
                        type="button"
                        className="transition-colors hover:text-foreground"
                        onClick={goToPrevHighlight}
                        aria-label="Previous match"
                      >
                        ‹
                      </button>
                      <button
                        type="button"
                        className="transition-colors hover:text-foreground"
                        onClick={goToNextHighlight}
                        aria-label="Next match"
                      >
                        ›
                      </button>
                    </>
                  )}
                </div>
              )}
                <div className="relative">
                  <button
                    type="button"
                    onClick={handleAssistantButton}
                    aria-label="Open study assistant"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background text-foreground transition hover:border-primary/50 hover:text-primary"
                  >
                    <AssistantMark className="h-4 w-4" />
                  </button>
                  {showAssistantIntro && (
                    <div className="absolute right-0 top-full z-30 mt-3 w-64 rounded-xl border border-border bg-background px-4 py-3 text-left shadow-2xl">
                      <span className="pointer-events-none absolute -top-2 right-6 block h-3 w-3 rotate-45 border border-border border-b-0 border-r-0 bg-background" />
                      <div className="text-[10px] font-semibold uppercase tracking-[0.4em] text-primary/70">
                        New
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground/90">
                        Meet Ask Al—your AI guide for summaries, clarifications, and deeper context.
                      </p>
                      <div className="mt-3 flex items-center gap-3">
                        <button
                          type="button"
                          className="flex-1 rounded-md bg-primary/90 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-primary-foreground transition hover:bg-primary"
                          onClick={handleAssistantButton}
                        >
                          Try it
                        </button>
                        <button
                          type="button"
                          className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground transition hover:text-foreground"
                          onClick={dismissAssistantIntro}
                        >
                          Later
                        </button>
                      </div>
                    </div>
                  )}
                </div>
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
                  currentHighlightIndex={highlightLocalIndex}
                  onFootnoteClick={handleFootnoteOpen}
                />
              )}

              <div className="mx-auto max-w-3xl px-6 pb-12">
                <div className="flex items-center justify-between border-t border-border pt-8">
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
                          <div className="font-sans text-xs text-muted-foreground">Previous</div>
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
                          <div className="font-sans text-xs text-muted-foreground">Next</div>
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

          <FootnotePanel
            footnote={selectedFootnote}
            onClose={() => setSelectedFootnote(null)}
          />
        </div>
      </div>

      <SearchOverlay
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        bookData={bookData}
        currentChapter={chapter}
        availableVolumes={availableBooks}
        onResultClick={(volumeNo, chapterId, sectionId, term) =>
          handleSectionClick(volumeNo, chapterId, sectionId, term)
        }
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
