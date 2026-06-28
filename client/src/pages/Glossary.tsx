import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import { glossary, type GlossaryEntry } from "@shared/glossary";
import { ArrowLeft, Search, X, CornerDownLeft } from "lucide-react";
import { readReadingReturnState } from "@/lib/readingReturn";

const PLACEHOLDER_BODY =
  "A working definition for this term is being prepared. It will explain what the Teaching means by it, how it is used across the volumes, and the distinctions that matter for the reader-listener.";

// First letter used for the A–Z index. Non-alphabetic titles fall under "#".
function letterOf(title: string): string {
  const ch = title.trim().charAt(0).toUpperCase();
  return /[A-Z]/.test(ch) ? ch : "#";
}

export default function Glossary() {
  const [, setLocation] = useLocation();
  const returnState = useMemo(() => readReadingReturnState(), []);
  const [query, setQuery] = useState("");
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  const goBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      window.history.back();
    } else {
      setLocation("/v/1");
    }
  };

  const filtered = useMemo<GlossaryEntry[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return glossary;
    return glossary.filter((e) => e.title.toLowerCase().includes(q));
  }, [query]);

  // Group filtered entries by first letter, preserving order.
  const groups = useMemo(() => {
    const map = new Map<string, GlossaryEntry[]>();
    for (const entry of filtered) {
      const letter = letterOf(entry.title);
      const bucket = map.get(letter);
      if (bucket) bucket.push(entry);
      else map.set(letter, [entry]);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  const activeLetters = useMemo(() => new Set(groups.map(([l]) => l)), [groups]);
  const alphabet = useMemo(
    () => ["#", ...Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i))],
    [],
  );

  const selected = useMemo(
    () => glossary.find((e) => e.slug === selectedSlug) ?? null,
    [selectedSlug],
  );

  // Default the detail pane to the first entry once results settle.
  useEffect(() => {
    if (selected && filtered.some((e) => e.slug === selected.slug)) return;
    setSelectedSlug(filtered[0]?.slug ?? null);
  }, [filtered, selected]);

  const jumpToLetter = (letter: string) => {
    const el = document.getElementById(`letter-${letter}`);
    if (el && listRef.current) {
      listRef.current.scrollTo({ top: el.offsetTop - 8, behavior: "smooth" });
    }
  };

  return (
    <div className="glossary-page codex-page-bg flex h-screen flex-col overflow-hidden">
      {/* ---------- Header ---------- */}
      <header className="flex-shrink-0 border-b border-[hsl(var(--codex-rule)/0.6)] bg-[hsl(var(--codex-vellum)/0.85)] backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-5 py-3.5 md:px-8">
          <button
            type="button"
            onClick={goBack}
            className="group inline-flex items-center gap-2 text-sm text-[hsl(var(--codex-ink-soft))] transition hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            Back
          </button>
          <div className="ml-1 flex items-baseline gap-3">
            <h1 className="font-heading text-lg font-semibold text-foreground">
              The Teaching Glossary
            </h1>
            <span className="hidden text-[0.7rem] uppercase tracking-[0.2em] text-[hsl(var(--codex-ink-soft))] sm:inline">
              {glossary.length} terms
            </span>
          </div>
        </div>
      </header>

      {/* ---------- Two-pane browser ---------- */}
      <div className="mx-auto flex w-full max-w-6xl flex-1 overflow-hidden px-0 md:px-8">
        {/* Index pane */}
        <div className="glossary-index flex w-full flex-col border-r border-[hsl(var(--codex-rule)/0.6)] md:w-[22rem] lg:w-[24rem]">
          <div className="flex-shrink-0 px-5 pb-4 pt-5 md:px-6">
            <div className="glossary-search">
              <Search className="h-4 w-4 flex-shrink-0 text-[hsl(var(--codex-ink-soft))]" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search terms…"
                className="min-w-0 flex-1 bg-transparent text-[0.95rem] text-foreground placeholder:text-[hsl(var(--codex-ink-soft))] focus:outline-none"
                aria-label="Search glossary terms"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="Clear search"
                  className="flex-shrink-0 text-[hsl(var(--codex-ink-soft))] transition hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          <div
            ref={listRef}
            className="minimal-scrollbar relative flex-1 overflow-y-auto px-2 pb-8 md:px-3"
          >
            {groups.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-[hsl(var(--codex-ink-soft))]">
                No terms match “{query}”.
              </p>
            ) : (
              groups.map(([letter, entries]) => (
                <section key={letter} id={`letter-${letter}`} className="scroll-mt-2">
                  <h2 className="glossary-letter-heading">{letter}</h2>
                  <ul>
                    {entries.map((entry) => {
                      const isActive = entry.slug === selectedSlug;
                      return (
                        <li key={entry.slug}>
                          <button
                            type="button"
                            onClick={() => setSelectedSlug(entry.slug)}
                            className={`glossary-term-row ${isActive ? "is-active" : ""}`}
                          >
                            {entry.title}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ))
            )}
          </div>
        </div>

        {/* A–Z rail */}
        <nav
          className="glossary-azrail hidden flex-col items-center justify-center gap-0.5 px-1.5 md:flex"
          aria-label="Jump to letter"
        >
          {alphabet.map((letter) => {
            const enabled = activeLetters.has(letter);
            return (
              <button
                key={letter}
                type="button"
                disabled={!enabled}
                onClick={() => jumpToLetter(letter)}
                className="glossary-azrail-letter"
              >
                {letter}
              </button>
            );
          })}
        </nav>

        {/* Detail pane */}
        <div className="hidden flex-1 overflow-y-auto md:block">
          {selected ? (
            <article className="minimal-scrollbar mx-auto max-w-2xl px-8 py-12 lg:px-12 lg:py-16">
              <div className="flex items-baseline gap-3 text-[0.7rem] uppercase tracking-[0.22em] text-[hsl(var(--codex-ink-soft))]">
                <span>Term</span>
                <span aria-hidden="true">·</span>
                <span className="text-primary">
                  {String(selected.index).padStart(3, "0")}
                </span>
              </div>
              <h2 className="masthead-title mt-4 text-[2rem] leading-tight sm:text-4xl">
                {selected.title}
              </h2>
              <hr className="mt-7 border-0 border-t border-[hsl(var(--codex-rule)/0.6)]" />
              <p className="mt-7 font-serif text-[1.05rem] leading-relaxed text-foreground/90">
                {PLACEHOLDER_BODY}
              </p>
              <p className="mt-4 text-xs italic text-[hsl(var(--codex-ink-soft))]">
                Definition in preparation.
              </p>
              <button
                type="button"
                onClick={() => setLocation(returnState?.path ?? "/v/1")}
                className="mt-10 inline-flex items-center gap-2 text-sm text-primary transition hover:text-[hsl(var(--gilt))]"
              >
                <CornerDownLeft className="h-4 w-4" />
                Back to reading
              </button>
            </article>
          ) : (
            <div className="flex h-full items-center justify-center px-8 text-center">
              <p className="text-sm text-[hsl(var(--codex-ink-soft))]">
                Select a term to read its definition.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Mobile: tapping a term routes to a focused detail (reuse selected pane below list) */}
      {selected && (
        <div className="glossary-mobile-detail border-t border-[hsl(var(--codex-rule)/0.6)] bg-[hsl(var(--codex-vellum))] px-5 py-5 md:hidden">
          <h2 className="font-heading text-xl font-semibold text-foreground">
            {selected.title}
          </h2>
          <p className="mt-2 font-serif text-[0.95rem] leading-relaxed text-foreground/90">
            {PLACEHOLDER_BODY}
          </p>
        </div>
      )}
    </div>
  );
}
