import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, BookOpen, ChevronRight, Search, X } from "lucide-react";
import type {
  BibliographyData,
  BibliographySection,
  BibliographySourceType,
} from "@shared/schema";

interface BibliographyProps {
  data: BibliographyData;
  onBack: () => void;
}

const PAGE_SIZE = 120;

function sourceLabel(sourceType: BibliographySourceType) {
  return sourceType === "primary" ? "Primary sources" : "Secondary sources";
}

function normalizeSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export default function Bibliography({ data, onBack }: BibliographyProps) {
  const [sourceType, setSourceType] = useState<BibliographySourceType>("primary");
  const [selectedCode, setSelectedCode] = useState("PS1");
  const [query, setQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const sourceSections = useMemo(
    () => data.sections.filter((section) => section.sourceType === sourceType),
    [data.sections, sourceType],
  );

  const selectedSection =
    sourceSections.find((section) => section.code === selectedCode) ?? sourceSections[0];
  const normalizedQuery = normalizeSearch(query.trim());

  const resultSections = useMemo<Array<BibliographySection>>(() => {
    if (!normalizedQuery) return selectedSection ? [selectedSection] : [];
    return sourceSections
      .map((section) => ({
        ...section,
        entries: section.entries.filter((entry) =>
          normalizeSearch(entry.text).includes(normalizedQuery),
        ),
      }))
      .filter((section) => section.entries.length > 0);
  }, [normalizedQuery, selectedSection, sourceSections]);

  const matchingEntries = resultSections.reduce(
    (total, section) => total + section.entries.length,
    0,
  );

  const visibleSections = useMemo(() => {
    let remaining = visibleCount;
    return resultSections
      .map((section) => {
        if (remaining <= 0) return { ...section, entries: [] };
        const entries = section.entries.slice(0, remaining);
        remaining -= entries.length;
        return { ...section, entries };
      })
      .filter((section) => section.entries.length > 0);
  }, [resultSections, visibleCount]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [normalizedQuery, selectedCode, sourceType]);

  const chooseSource = (nextSource: BibliographySourceType) => {
    const first = data.sections.find((section) => section.sourceType === nextSource);
    setSourceType(nextSource);
    setSelectedCode(first?.code ?? "");
  };

  return (
    <div className="codex-page-bg min-h-screen bg-background">
      <header className="border-b border-[hsl(var(--codex-rule)/0.7)]">
        <div className="mx-auto max-w-6xl px-5 pb-10 pt-8 md:px-8 md:pb-14 md:pt-12">
          <div className="flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={onBack}
              className="group inline-flex items-center gap-2 codex-label transition hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
              The Library
            </button>
            <span className="codex-label text-sm">Volume 19 / 19</span>
          </div>

          <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-end">
            <div>
              <p className="codex-label">The scholarly apparatus</p>
              <h1 className="masthead-title mt-3 text-5xl leading-none sm:text-6xl">
                {data.title}
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-foreground/80">
                {data.introduction}
              </p>
            </div>
            <dl className="grid grid-cols-2 gap-px overflow-hidden border border-[hsl(var(--codex-rule)/0.65)] bg-[hsl(var(--codex-rule)/0.5)]">
              <div className="bg-background p-4">
                <dt className="codex-label text-[0.65rem]">Citations</dt>
                <dd className="mt-2 font-heading text-3xl">{data.totalEntries.toLocaleString()}</dd>
              </div>
              <div className="bg-background p-4">
                <dt className="codex-label text-[0.65rem]">Subjects</dt>
                <dd className="mt-2 font-heading text-3xl">{data.sections.length}</dd>
              </div>
            </dl>
          </div>

          <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-xs text-[hsl(var(--codex-ink-soft))]">
            {data.notes.map((note) => (
              <span key={note}>{note}</span>
            ))}
          </div>
        </div>
      </header>

      <div className="sticky top-0 z-20 border-b border-[hsl(var(--codex-rule)/0.65)] bg-[hsl(var(--codex-vellum)/0.94)] backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-3 md:flex-row md:items-center md:justify-between md:px-8">
          <div className="flex items-center gap-1" aria-label="Bibliography source type">
            {(["primary", "secondary"] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => chooseSource(type)}
                className={`px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] transition ${
                  sourceType === type
                    ? "bg-foreground text-background"
                    : "text-[hsl(var(--codex-ink-soft))] hover:text-foreground"
                }`}
              >
                {sourceLabel(type)}
              </button>
            ))}
          </div>

          <label className="flex min-w-0 items-center gap-2 border-b border-[hsl(var(--codex-rule))] px-1 py-2 md:w-80">
            <Search className="h-4 w-4 flex-none text-[hsl(var(--codex-ink-soft))]" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={`Search ${sourceLabel(sourceType).toLowerCase()}…`}
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[hsl(var(--codex-ink-soft))]/70"
            />
            {query && (
              <button type="button" onClick={() => setQuery("")} aria-label="Clear search">
                <X className="h-4 w-4 text-[hsl(var(--codex-ink-soft))]" />
              </button>
            )}
          </label>
        </div>
      </div>

      <main className="mx-auto grid max-w-6xl gap-10 px-5 py-10 md:px-8 lg:grid-cols-[17rem_minmax(0,1fr)] lg:py-14">
        <aside className="no-scrollbar lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto lg:pr-4">
          <div className="mb-3 flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" />
            <h2 className="codex-label">Subject ledger</h2>
          </div>
          <div className="hidden lg:block">
            {sourceSections.map((section) => (
              <button
                key={section.code}
                type="button"
                onClick={() => {
                  setQuery("");
                  setSelectedCode(section.code);
                }}
                className={`group flex w-full items-start gap-3 border-t border-[hsl(var(--codex-rule)/0.55)] py-3 text-left last:border-b ${
                  section.code === selectedSection?.code && !query ? "text-foreground" : "text-[hsl(var(--codex-ink-soft))]"
                }`}
              >
                <span className="mt-0.5 w-9 flex-none font-mono text-[0.68rem] text-primary">
                  {section.code}
                </span>
                <span className="min-w-0 flex-1 text-sm leading-snug group-hover:text-foreground">
                  {section.title}
                </span>
                <span className="text-[0.65rem] tabular-nums opacity-60">{section.entries.length}</span>
              </button>
            ))}
          </div>
          <select
            value={selectedSection?.code ?? ""}
            onChange={(event) => {
              setQuery("");
              setSelectedCode(event.target.value);
            }}
            className="w-full border border-[hsl(var(--codex-rule))] bg-background px-3 py-3 text-sm lg:hidden"
          >
            {sourceSections.map((section) => (
              <option key={section.code} value={section.code}>
                {section.code} — {section.title}
              </option>
            ))}
          </select>
        </aside>

        <section className="min-w-0">
          <header className="mb-8 border-b border-[hsl(var(--codex-rule)/0.7)] pb-7">
            <p className="codex-label text-primary">
              {normalizedQuery ? `${matchingEntries.toLocaleString()} search results` : selectedSection?.code}
            </p>
            <h2 className="mt-3 font-heading text-3xl leading-tight md:text-4xl">
              {normalizedQuery ? `Results for “${query.trim()}”` : selectedSection?.title}
            </h2>
          </header>

          {visibleSections.length ? (
            <div>
              {visibleSections.map((section) => (
                <div key={section.code} className="mb-12">
                  {normalizedQuery && (
                    <div className="mb-4 flex items-center gap-3">
                      <span className="font-mono text-xs text-primary">{section.code}</span>
                      <h3 className="font-heading text-xl">{section.title}</h3>
                    </div>
                  )}
                  <ol className="border-t border-[hsl(var(--codex-rule)/0.65)]">
                    {section.entries.map((entry, index) => (
                      <li
                        key={entry.id}
                        className="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-3 border-b border-[hsl(var(--codex-rule)/0.5)] py-4"
                      >
                        <span className="pt-0.5 font-mono text-[0.68rem] tabular-nums text-[hsl(var(--codex-ink-soft))]/70">
                          {String(index + 1).padStart(3, "0")}
                        </span>
                        <div
                          className="bibliography-citation font-serif text-[0.98rem] leading-relaxed text-foreground/88 [&_p]:m-0"
                          dangerouslySetInnerHTML={{ __html: entry.html }}
                        />
                      </li>
                    ))}
                  </ol>
                </div>
              ))}

              {visibleCount < matchingEntries && (
                <button
                  type="button"
                  onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
                  className="group inline-flex items-center gap-2 border-b border-primary/40 pb-1 text-sm font-medium text-primary transition hover:border-primary"
                >
                  Show {Math.min(PAGE_SIZE, matchingEntries - visibleCount)} more citations
                  <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </button>
              )}
            </div>
          ) : (
            <div className="border-y border-[hsl(var(--codex-rule)/0.65)] py-16 text-center">
              <p className="font-heading text-2xl">No citations found</p>
              <p className="mt-2 text-sm text-[hsl(var(--codex-ink-soft))]">
                Try a broader author, title, or subject search.
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
