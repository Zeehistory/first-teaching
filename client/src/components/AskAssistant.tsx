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

type AnswerToken =
  | { type: "text"; content: string; start: number; end: number }
  | { type: "citation"; marker: number; showAt: number };

function renderMarkdownFragment(fragment: string, keyPrefix: string): React.ReactNode[] {
  if (!fragment) return [];
  const tokens = fragment.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\n)/);
  const nodes: React.ReactNode[] = [];

  tokens.forEach((token, index) => {
    if (!token) return;
    const key = `${keyPrefix}-${index}`;
    if (token === "\n") {
      nodes.push(<br key={key} />);
    } else if (token.startsWith("**") && token.endsWith("**")) {
      nodes.push(<strong key={key}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith("*") && token.endsWith("*")) {
      nodes.push(<em key={key}>{token.slice(1, -1)}</em>);
    } else if (token.startsWith("`") && token.endsWith("`")) {
      nodes.push(
        <code key={key} className="rounded bg-muted px-1 py-0.5 text-[0.85em]">
          {token.slice(1, -1)}
        </code>
      );
    } else {
      nodes.push(<span key={key}>{token}</span>);
    }
  });

  return nodes;
}

function tokenizeAnswer(answer: string): AnswerToken[] {
  const parts = answer.split(/(\[#\d+\])/g);
  const tokens: AnswerToken[] = [];
  let charCount = 0;

  parts.forEach((part) => {
    if (!part) return;
    const citationMatch = part.match(/^\[#(\d+)\]$/);
    if (citationMatch) {
      tokens.push({
        type: "citation",
        marker: parseInt(citationMatch[1], 10),
        showAt: charCount,
      });
    } else {
      tokens.push({
        type: "text",
        content: part,
        start: charCount,
        end: charCount + part.length,
      });
      charCount += part.length;
    }
  });

  return tokens;
}

function renderAnswerTokens(
  tokens: AnswerToken[],
  visibleChars: number | undefined,
  onClick: (marker: number, event: React.MouseEvent) => void
): React.ReactNode {
  if (!tokens.length) return null;

  const elements: React.ReactNode[] = [];
  const limit = typeof visibleChars === "number" ? visibleChars : Number.POSITIVE_INFINITY;

  tokens.forEach((token, index) => {
    if (token.type === "text") {
      const available =
        typeof visibleChars === "number"
          ? Math.max(0, Math.min(token.content.length, limit - token.start))
          : token.content.length;

      if (available > 0) {
        const text = token.content.slice(0, available);
        elements.push(...renderMarkdownFragment(text, `text-${index}`));
      }
    } else if (token.type === "citation") {
      const shouldReveal = limit >= token.showAt;
      if (shouldReveal) {
        elements.push(
          <button
            type="button"
            key={`citation-${token.marker}-${index}`}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onClick(token.marker, event);
            }}
            className="mx-0.5 ai-citation"
            style={{ pointerEvents: "auto", zIndex: 9999 }}
          >
            #{token.marker}
          </button>
        );
      }
    }
  });

  return <>{elements}</>;
}

export default function AskAssistant() {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [location, setLocation] = useLocation();
  const [lastResponse, setLastResponse] = useState<AskResponse | null>(null);
  const [answerTokens, setAnswerTokens] = useState<AnswerToken[]>([]);
  const [animatedChars, setAnimatedChars] = useState(0);
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
        headers: {
          "Content-Type": "application/json"
        },
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
    setLastResponse(null);
    setAnswerTokens([]);
    setAnimatedChars(0);
    askMutation.mutate(question.trim());
  };

  const handleCitation = useCallback(
    (marker: number, event?: React.MouseEvent) => {
      if (!lastResponse) return;
      const reference = lastResponse.references.find((ref) => ref.marker === marker);
      if (!reference) {
        console.log(`[Client] No reference found for marker ${marker}`);
        return;
      }

      console.log(`[Client] Clicking citation ${marker}:`, {
        volume: reference.volumeNumber,
        chapter: reference.chapterTitle,
        section: reference.sectionTitle,
        highlight: reference.highlight.substring(0, 50) + '...'
      });

      // determine which occurrence index this specific reference refers to
      const priorSame = lastResponse.references.filter((ref) =>
        ref.marker < marker &&
        ref.volumeNumber === reference.volumeNumber &&
        ref.chapterId === reference.chapterId &&
        ref.sectionId === reference.sectionId &&
        ref.highlight === reference.highlight
      ).length;
      
      console.log(`[Client] Prior same references: ${priorSame}, using hi=${priorSame}`);
      
      if (event) {
        event.preventDefault();
        event.stopPropagation();
      }
      setOpen(false);
      // Build URL safely; let URLSearchParams handle encoding
      const params = new URLSearchParams();
      params.set("s", reference.sectionId);
      params.set("h", reference.highlight);
      params.set("hi", String(priorSame));
      const url = `/v/${reference.volumeNumber}/${reference.chapterId}?${params.toString()}`;
      console.log(`[Client] Navigating to: ${url}`);
      // Use hard navigation for reliability on Vercel
      window.location.assign(url);
    },
    [lastResponse, setLocation]
  );

  const renderedAnswer = useMemo(() => {
    if (!answerTokens.length) return null;
    const totalChars = answerTokens.reduce(
      (sum, token) => (token.type === "text" ? sum + token.content.length : sum),
      0
    );
    const isAnimating = animatedChars < totalChars;
    const visibleChars = isAnimating ? animatedChars : undefined;
    return renderAnswerTokens(answerTokens, visibleChars, handleCitation);
  }, [answerTokens, animatedChars, handleCitation]);

  const adjustHeight = useCallback(() => {
    if (!textareaRef.current) return;
    const textarea = textareaRef.current;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(Math.max(textarea.scrollHeight, 56), 180)}px`;
  }, []);

  useEffect(() => {
    adjustHeight();
  }, [question, adjustHeight]);

  useEffect(() => {
    if (lastResponse?.answer) {
      setAnswerTokens(tokenizeAnswer(lastResponse.answer));
      setAnimatedChars(0);
    }
  }, [lastResponse?.answer]);

  useEffect(() => {
    if (!answerTokens.length) return;
    const totalChars = answerTokens.reduce(
      (sum, token) => (token.type === "text" ? sum + token.content.length : sum),
      0
    );
    if (totalChars === 0) {
      setAnimatedChars(0);
      return;
    }

    const step = Math.max(1, Math.round(totalChars / 160));
    const interval = window.setInterval(() => {
      setAnimatedChars((prev) => {
        if (prev >= totalChars) {
          window.clearInterval(interval);
          return totalChars;
        }
        return Math.min(totalChars, prev + step);
      });
    }, 20);

    return () => window.clearInterval(interval);
  }, [answerTokens]);

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
                    <div
                      className="max-w-none rounded-md border border-border/60 bg-muted/15 px-5 py-5 text-base leading-relaxed text-foreground/90"
                      dir={/[\u0590-\u08FF]/.test(lastResponse.answer) ? "rtl" : "auto"}
                      style={{ pointerEvents: 'auto' }}
                    >
                      {renderedAnswer}
                    </div>

                    {lastResponse.references.length > 0 && (
                      <div className="space-y-3">
                        <div className="text-[10px] uppercase tracking-[0.35em] text-muted-foreground">References</div>
                        <div className="space-y-2">
                          {lastResponse.references.map((reference) => (
                            <button
                              type="button"
                              key={reference.marker}
                              onClick={() => {
                                console.log(`[Reference Card] Clicking reference card for marker ${reference.marker}`);
                                handleCitation(reference.marker);
                              }}
                              className="w-full rounded-md border border-border/60 bg-background/80 px-4 py-3 text-left text-[0.95rem] text-foreground transition hover:border-primary/40 hover:bg-primary/5"
                            >
                              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-primary/80">
                                <span className="ai-citation">#{reference.marker}</span>
                                <span className="truncate">Volume {reference.volumeNumber}</span>
                              </div>
                              <div className="mt-1 font-heading text-foreground">{reference.chapterTitle}</div>
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
              <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
                <div className="flex items-end gap-3">
                  <Textarea
                    id="ask-question"
                    value={question}
                    onChange={(event) => setQuestion(event.target.value)}
                    placeholder="Ask anything…"
                    ref={textareaRef}
                    className="min-h-[56px] w-full resize-none border-none bg-transparent text-[1.05rem] leading-relaxed text-foreground focus-visible:ring-0"
                    dir={question && /[\u0590-\u08FF]/.test(question) ? "rtl" : "auto"}
                  />
                  <Button
                    type="submit"
                    disabled={askMutation.status === "pending"}
                    className="h-10 w-10 shrink-0 rounded-full bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
                    aria-label="Send question"
                  >
                    {askMutation.status === "pending" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ArrowRight className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <div className="mt-2 text-[11px] text-muted-foreground">This AI companion can make mistakes. Check important info.</div>
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
