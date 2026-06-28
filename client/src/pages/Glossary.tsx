import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import { glossary, type GlossaryEntry } from "@shared/glossary";
import { ArrowLeft, Search, X, CornerDownLeft, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { readReadingReturnState } from "@/lib/readingReturn";
import Transliterated from "@/components/Transliterated";

// Sort key ignores leading quotes/punctuation and diacritics so that
// "Identity" files under I and Ḥadīth under H — while quotes stay in display.
function sortKey(title: string): string {
  return title
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip diacritics (Ḥadīth → Hadith)
    .replace(/^[^A-Za-z0-9]+/, "") // drop leading quotes/punctuation
    .toLowerCase();
}

// First letter used for the A–Z index. Non-alphabetic titles fall under "#".
function letterOf(title: string): string {
  const ch = sortKey(title).charAt(0).toUpperCase();
  return /[A-Z]/.test(ch) ? ch : "#";
}

export default function Glossary() {
  const [, setLocation] = useLocation();
  const returnState = useMemo(() => readReadingReturnState(), []);
  const [query, setQuery] = useState("");
  const [indexCollapsed, setIndexCollapsed] = useState(false);
  // Initialise the selected term from the URL hash (e.g. /glossary#islam from a
  // clicked term) synchronously, so it is never overridden by the default.
  const [selectedSlug, setSelectedSlug] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    const slug = window.location.hash.replace(/^#/, "");
    return slug && glossary.some((e) => e.slug === slug) ? slug : null;
  });
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

  // Group filtered entries by first letter; sort entries alphabetically within
  // each letter and the letters themselves ("#" last).
  const groups = useMemo(() => {
    const map = new Map<string, GlossaryEntry[]>();
    for (const entry of filtered) {
      const letter = letterOf(entry.title);
      const bucket = map.get(letter);
      if (bucket) bucket.push(entry);
      else map.set(letter, [entry]);
    }
    const entries = Array.from(map.entries());
    entries.forEach(([, bucket]) =>
      bucket.sort((a, b) => sortKey(a.title).localeCompare(sortKey(b.title))),
    );
    return entries.sort(([a]: [string, GlossaryEntry[]], [b]: [string, GlossaryEntry[]]) => {
      if (a === "#") return 1;
      if (b === "#") return -1;
      return a.localeCompare(b);
    });
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

  // When arriving via a term link, scroll its index row into view. selectedSlug
  // is already set from the hash (above); this just brings it on-screen.
  useEffect(() => {
    if (typeof window === "undefined" || !selectedSlug) return;
    const t = window.setTimeout(() => {
      const row = document.getElementById(`gterm-${selectedSlug}`);
      row?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 140);
    return () => window.clearTimeout(t);
    // run once on mount for the initial hash target
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Default the detail pane to the first entry once results settle.
  useEffect(() => {
    if (selectedSlug) return;
    if (selected && filtered.some((e) => e.slug === selected.slug)) return;
    setSelectedSlug(filtered[0]?.slug ?? null);
  }, [filtered, selected, selectedSlug]);

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
          <button
            type="button"
            onClick={() => setIndexCollapsed((v) => !v)}
            aria-label={indexCollapsed ? "Show term list" : "Hide term list"}
            className="ml-auto hidden h-9 w-9 items-center justify-center rounded-full text-[hsl(var(--codex-ink-soft))] transition hover:bg-[hsl(var(--codex-vellum))] hover:text-foreground md:inline-flex"
          >
            {indexCollapsed ? (
              <PanelLeftOpen className="h-[18px] w-[18px]" />
            ) : (
              <PanelLeftClose className="h-[18px] w-[18px]" />
            )}
          </button>
        </div>
      </header>

      {/* ---------- Two-pane browser ---------- */}
      <div className="mx-auto flex w-full max-w-6xl flex-1 overflow-hidden px-0 md:px-8">
        {/* Index pane */}
        <div
          className={`glossary-index flex w-full flex-col border-r border-[hsl(var(--codex-rule)/0.6)] md:w-[22rem] lg:w-[24rem] ${
            indexCollapsed ? "md:hidden" : ""
          }`}
        >
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
                            id={`gterm-${entry.slug}`}
                            onClick={() => setSelectedSlug(entry.slug)}
                            className={`glossary-term-row ${isActive ? "is-active" : ""}`}
                          >
                            <Transliterated text={entry.title} />
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
          className={`glossary-azrail hidden flex-col items-center justify-center gap-0.5 px-1.5 ${
            indexCollapsed ? "" : "md:flex"
          }`}
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
        <div className="no-scrollbar hidden flex-1 overflow-y-auto md:block">
          {selected ? (
            <article className="mx-auto w-full max-w-3xl px-8 py-12 lg:px-12 lg:py-16">
              <div className="flex items-baseline gap-3 text-[0.7rem] uppercase tracking-[0.22em] text-[hsl(var(--codex-ink-soft))]">
                <span>Term</span>
                <span aria-hidden="true">·</span>
                <span className="text-primary">
                  {String(selected.index).padStart(3, "0")}
                </span>
              </div>
              <h2 className="masthead-title mt-4 text-[2rem] leading-tight sm:text-4xl">
                <Transliterated text={selected.title} />
              </h2>
              <hr className="mt-7 border-0 border-t border-[hsl(var(--codex-rule)/0.6)]" />
              <div
                className="chapter-prose glossary-entry-body mt-7 font-serif text-[1.05rem] leading-relaxed text-foreground/90"
                dangerouslySetInnerHTML={{ __html: selected.bodyHtml }}
              />
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
            <Transliterated text={selected.title} />
          </h2>
          <div
            className="mt-2 font-serif text-[0.95rem] leading-relaxed text-foreground/90"
            dangerouslySetInnerHTML={{ __html: selected.bodyHtml }}
          />
        </div>
      )}
    </div>
  );
}
