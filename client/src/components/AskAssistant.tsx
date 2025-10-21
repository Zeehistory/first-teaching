import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Sparkles, Loader2, X, ArrowRight } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";

interface CitationReference {
  marker: number;
  volumeNumber: number;
  chapterId: string;
  chapterTitle: string;
  sectionId: string;
  sectionTitle: string;
  highlight: string;
  snippet: string;
}

interface AskResponse {
  answer: string;
  references: CitationReference[];
}

const PANEL_WIDTH = 360;

function parseAnswer(answer: string, onClick: (marker: number) => void) {
  const segments: Array<string | JSX.Element> = [];
  let lastIndex = 0;
  const citationRegex = /\[#(\d+)\]/g;
  let match: RegExpExecArray | null;

  while ((match = citationRegex.exec(answer)) !== null) {
    const start = match.index;
    if (start > lastIndex) {
      segments.push(answer.slice(lastIndex, start));
    }
    const marker = parseInt(match[1], 10);
    segments.push(
      <button
        key={`${marker}-${start}`}
        onClick={() => onClick(marker)}
        className="mx-0.5 inline-flex items-center justify-center rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary hover:border-primary/60 hover:bg-primary/15"
      >
        #{marker}
      </button>
    );
    lastIndex = citationRegex.lastIndex;
  }

  if (lastIndex < answer.length) {
    segments.push(answer.slice(lastIndex));
  }

  return segments;
}

export default function AskAssistant() {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [location, setLocation] = useLocation();
  const [lastResponse, setLastResponse] = useState<AskResponse | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const handleOpen = () => setOpen(true);
    window.addEventListener("open-ask-assistant", handleOpen);
    return () => window.removeEventListener("open-ask-assistant", handleOpen);
  }, []);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--assistant-panel-width", open ? `${PANEL_WIDTH}px` : "0px");
    document.body.classList.toggle("assistant-open", open);
    return () => {
      root.style.removeProperty("--assistant-panel-width");
      document.body.classList.remove("assistant-open");
    };
  }, [open]);

  const askMutation = useMutation<AskResponse, Error, string>({
    mutationFn: async (prompt: string) => {
      const response = await fetch("/api/ai/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: prompt }),
      });
      if (!response.ok) {
        throw new Error("Unable to reach the study assistant right now.");
      }
      return response.json();
    },
    onSuccess: (data) => {
      setLastResponse(data);
    },
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!question.trim()) return;
    askMutation.mutate(question.trim());
  };

  const handleCitation = useCallback(
    (marker: number) => {
      if (!lastResponse) return;
      const reference = lastResponse.references.find((ref) => ref.marker === marker);
      if (!reference) return;

      const highlight = encodeURIComponent(reference.highlight);
      setOpen(false);
      setLocation(`/v/${reference.volumeNumber}/${reference.chapterId}?s=${reference.sectionId}&h=${highlight}`);
    },
    [lastResponse, setLocation]
  );

  const renderedAnswer = useMemo(() => {
    if (!lastResponse?.answer) return null;
    return parseAnswer(lastResponse.answer, handleCitation);
  }, [lastResponse?.answer, handleCitation]);

  const adjustHeight = useCallback(() => {
    if (!textareaRef.current) return;
    const textarea = textareaRef.current;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(Math.max(textarea.scrollHeight, 56), 180)}px`;
  }, []);

  useEffect(() => {
    adjustHeight();
  }, [question, adjustHeight]);

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-50 flex lg:inset-y-0 lg:left-auto lg:w-[var(--assistant-panel-width,360px)]">
          <div
            className="absolute inset-0 bg-background/70 backdrop-blur-sm lg:hidden"
            onClick={() => setOpen(false)}
          />
          <aside className="relative ml-auto flex h-full w-full max-w-[420px] flex-col border-l border-border bg-background shadow-2xl">
            <header className="flex items-center justify-between border-b border-border px-6 py-4">
              <div className="flex items-center gap-2">
                <span className="text-base font-heading font-semibold tracking-tight text-foreground">Ask Al</span>
                <Badge className="rounded-md bg-primary/20 px-2 py-0 text-[11px] font-semibold uppercase tracking-[0.3em] text-primary">
                  Beta
                </Badge>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Close assistant">
                <X className="h-4 w-4" />
              </Button>
            </header>

            <ScrollArea className="flex-1 px-5">
              <div className="space-y-4 py-5">
                {askMutation.status === "error" && (
                  <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-2 text-xs text-destructive">
                    {askMutation.error?.message ?? "Unable to reach the study assistant right now."}
                  </div>
                )}

                {askMutation.status === "pending" && (
                  <div className="flex h-full min-h-[260px] w-full flex-col items-center justify-center gap-3 text-sm text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Consulting the Teaching…</span>
                  </div>
                )}

                {lastResponse && askMutation.status !== "pending" ? (
                  <div className="space-y-6">
                    <div className="rounded-md border border-border/60 bg-muted/20 px-5 py-4 text-sm leading-relaxed text-foreground" style={{ whiteSpace: "pre-wrap" }}>
                      {renderedAnswer ?? lastResponse.answer}
                    </div>

                    {lastResponse.references.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-xs uppercase tracking-[0.28em] text-muted-foreground">References</div>
                        <div className="space-y-2">
                          {lastResponse.references.map((reference) => (
                            <button
                              key={reference.marker}
                              onClick={() => handleCitation(reference.marker)}
                              className="w-full rounded-md border border-border/70 bg-background px-4 py-3 text-left text-sm text-foreground transition hover:border-primary/40 hover:bg-primary/5"
                            >
                              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-primary">
                                <Badge variant="secondary">#{reference.marker}</Badge>
                                <span className="truncate">Volume {reference.volumeNumber}</span>
                              </div>
                              <div className="mt-1 text-sm font-heading">{reference.chapterTitle}</div>
                              <div className="text-xs text-muted-foreground">{reference.sectionTitle}</div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  askMutation.status !== "pending" && (
                    <div className="flex h-full min-h-[260px] w-full flex-col items-center justify-center gap-4 text-center text-sm text-muted-foreground">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full border border-border bg-muted/40">
                        <AssistantMark className="h-6 w-6 text-foreground/70" />
                      </div>
                      <p className="max-w-[220px] text-foreground/80">
                        Use the power of the Teaching—ask what you are looking for.
                      </p>
                    </div>
                  )
                )}
              </div>
            </ScrollArea>

            <form onSubmit={handleSubmit} className="border-t border-border px-5 py-4">
              <div className="relative overflow-hidden rounded-3xl border border-border bg-muted/25 px-4 py-3">
                <Textarea
                  id="ask-question"
                  value={question}
                  onChange={(event) => setQuestion(event.target.value)}
                  placeholder="Ask within this volume…"
                  ref={textareaRef}
                  className="min-h-[56px] w-full resize-none border-none bg-transparent pr-14 text-sm leading-relaxed focus-visible:ring-0"
                />
                <div className="mt-3 flex items-center justify-between gap-3 text-[11px] text-muted-foreground">
                  <span>Responses cite the passage they quote.</span>
                  <div className="relative">
                    <Button
                      type="submit"
                      disabled={askMutation.status === "pending"}
                      className="h-9 w-9 rounded-full bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
                    >
                      {askMutation.status === "pending" ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <ArrowRight className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </form>
          </aside>
        </div>
      )}
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
