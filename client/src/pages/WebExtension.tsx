import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, BookOpenText, Orbit } from "lucide-react";
import { useLocation, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import ChapterContent from "@/components/ChapterContent";
import FootnotePanel from "@/components/FootnotePanel";
import ThemeToggle from "@/components/ThemeToggle";
import TextSizeControl from "@/components/TextSizeControl";
import type { Footnote, Section } from "@shared/schema";
import { volumeEighteenWebExtensions } from "@/lib/content";
import { buildFootnoteSelector } from "@/lib/footnotes";
import { readReadingReturnState } from "@/lib/readingReturn";

export default function WebExtension() {
  const [, params] = useRoute("/v/:volumeNumber/:id/web-extension");
  const [, setLocation] = useLocation();
  const [selectedFootnote, setSelectedFootnote] = useState<Footnote | null>(null);
  const [textSize, setTextSize] = useState(() => {
    const saved = localStorage.getItem("textSize");
    return saved ? parseInt(saved, 10) : 18;
  });

  useEffect(() => {
    localStorage.setItem("textSize", textSize.toString());
  }, [textSize]);

  const volumeNumber = params?.volumeNumber ? parseInt(params.volumeNumber, 10) : NaN;
  const chapterId = params?.id ?? "";
  const extension =
    volumeNumber === 18 ? volumeEighteenWebExtensions[chapterId] ?? null : null;
  const returnState = useMemo(() => readReadingReturnState(), []);

  const focusFootnoteMarker = useCallback((footnote: Footnote) => {
    if (typeof document === "undefined") return;
    const marker = document.querySelector<HTMLElement>(buildFootnoteSelector(footnote));
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

  const section = useMemo<Section | null>(() => {
    if (!extension) return null;
    return {
      id: extension.id,
      title: extension.title,
      level: 3,
      parentId: null,
      content: extension.content,
      footnotes: extension.footnotes,
    };
  }, [extension]);

  if (!extension || !section) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <div className="max-w-xl space-y-4">
          <h1 className="text-3xl font-heading">Web Extension Not Found</h1>
          <p className="text-muted-foreground leading-relaxed">
            We couldn&apos;t locate the requested Volume 18 web extension.
          </p>
          <Button onClick={() => setLocation("/v/18")}>Back to Volume 18</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="chapter-shell web-extension-shell relative flex h-screen overflow-hidden">
      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-1 flex-col overflow-hidden">
          <header className="web-extension-header border-b border-[hsl(34,45%,78%)] px-6 py-5">
            <div className="mx-auto flex max-w-5xl items-start justify-between gap-6">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full border border-[hsl(34,55%,74%)] bg-[hsl(34,90%,94%)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.32em] text-[hsl(20,55%,30%)] shadow-sm">
                  <Orbit className="h-3.5 w-3.5" />
                  Supplemental Reading
                </div>

                <div className="space-y-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="min-h-0 gap-1.5 px-0 py-0 font-heading text-lg text-[hsl(20,40%,34%)] shadow-none hover:bg-transparent hover:text-[hsl(20,58%,22%)] hover:shadow-none"
                    onClick={() =>
                      setLocation(returnState?.path ?? `/v/18/${extension.chapterId}`)
                    }
                  >
                    <ArrowLeft className="h-5 w-5" />
                    Back To Chapter
                  </Button>

                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[hsl(34,50%,76%)] bg-[linear-gradient(135deg,hsl(34,100%,96%),hsl(26,70%,90%))] text-[hsl(20,58%,28%)] shadow-sm">
                        <BookOpenText className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-[11px] font-semibold uppercase tracking-[0.34em] text-[hsl(20,30%,40%)]">
                          Web Extension {extension.ordinal}
                        </div>
                        <h1 className="font-heading text-2xl md:text-3xl text-[hsl(24,38%,20%)]">
                          {extension.chapterTitle}
                        </h1>
                      </div>
                    </div>
                    <p className="max-w-3xl text-sm leading-relaxed text-[hsl(24,22%,34%)]">
                      This page contains the companion Web-Extension material for the Syntopicon
                      chapter. 
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <TextSizeControl
                  textSize={textSize}
                  onIncrease={() => setTextSize((size) => Math.min(size + 2, 22))}
                  onDecrease={() => setTextSize((size) => Math.max(size - 2, 14))}
                />
                <ThemeToggle />
              </div>
            </div>
          </header>

          <main className="minimal-scrollbar flex-1 overflow-y-auto">
            <div className="web-extension-stage min-h-full px-4 py-6 md:px-6 md:py-8">
              <div className="mx-auto max-w-5xl rounded-[2rem] border border-[hsl(34,42%,82%)] bg-[hsl(42,44%,97%)] shadow-[0_20px_80px_rgba(145,94,30,0.08)]">
                <div className="border-b border-[hsl(34,38%,84%)] px-6 py-4">
                  <div className="inline-flex items-center gap-2 rounded-full bg-[hsl(34,70%,92%)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-[hsl(20,52%,30%)]">
                    Web Extension Text
                  </div>
                </div>
                <ChapterContent
                  section={section}
                  chapterTitle={`Web Extensions for "${extension.chapterTitle}"`}
                  textSize={textSize}
                  highlightTerm={null}
                  sectionTrail={[]}
                  currentHighlightIndex={null}
                  onFootnoteClick={handleFootnoteOpen}
                />
              </div>
            </div>
          </main>
        </div>

        <FootnotePanel footnote={selectedFootnote} onClose={() => setSelectedFootnote(null)} />
      </div>
    </div>
  );
}
