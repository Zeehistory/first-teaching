import { useEffect, useRef } from "react";
import type { Section, Footnote } from "@shared/schema";
import OrnamentalDivider from "./OrnamentalDivider";
import { glossary } from "@shared/glossary";

interface ChapterContentProps {
  section: Section;
  chapterTitle: string;
  textSize: number;
  highlightTerm: string | null;
  sectionTrail: Section[];
  currentHighlightIndex: number | null;
  onHighlightMatches?: (count: number) => void;
  onFootnoteClick: (footnote: Footnote) => void;
}

export default function ChapterContent({
  section,
  chapterTitle,
  textSize,
  highlightTerm,
  sectionTrail,
  currentHighlightIndex,
  onHighlightMatches,
  onFootnoteClick,
}: ChapterContentProps) {
  const contentRef = useRef<HTMLDivElement | null>(null);
  const highlightRefs = useRef<HTMLElement[]>([]);
  const glossaryBuilt = useRef(false);

  useEffect(() => {
    const container = contentRef.current;
    if (!container) return;

    const paragraphs = Array.from(
      container.querySelectorAll<HTMLParagraphElement>("p.auto-blockquote")
    );
    paragraphs.forEach((paragraph) => paragraph.classList.remove("auto-blockquote"));

    const candidates = Array.from(container.querySelectorAll<HTMLParagraphElement>("p"));
    const shouldElevate = (paragraph: HTMLParagraphElement): boolean => {
      const text = (paragraph.textContent || "").trim();
      if (!text || text.length < 40) return false;

      const hasQuote = /[“”"]/.test(text);
      if (!hasQuote) return false;

      if (/^["“].+[”"]$/.test(text)) {
        return true;
      }

      const previous = paragraph.previousElementSibling;
      if (previous) {
        const prevText = (previous.textContent || "").trim();
        if (prevText && /[:：]\s*$/.test(prevText)) {
          return true;
        }
      }

      return false;
    };

    candidates.forEach((paragraph) => {
      if (shouldElevate(paragraph)) {
        paragraph.classList.add("auto-blockquote");
      }
    });
  }, [section.id]);

  useEffect(() => {
    const container = contentRef.current;
    if (!container) return;

    const findFootnoteHost = (e: Event): HTMLElement | null => {
      const path = (e.composedPath?.() || []) as Array<EventTarget>;
      for (const node of path) {
        if (node && node instanceof HTMLElement) {
          const el = node.closest?.("[data-footnote]") as HTMLElement | null;
          if (el && container.contains(el)) return el;
        }
      }
      return null;
    };

    const handleClick = (event: MouseEvent) => {
      const footnoteEl = findFootnoteHost(event);
      if (!footnoteEl) return;
      const footnoteNumber = parseInt(footnoteEl.dataset.footnote ?? "", 10);
      if (Number.isNaN(footnoteNumber)) return;
      const footnote = section.footnotes.find((f) => f.number === footnoteNumber);
      if (footnote) {
        event.preventDefault();
        onFootnoteClick(footnote);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (!target) return;
      if (target.matches("sup[data-footnote]") && (event.key === "Enter" || event.key === " ")) {
        event.preventDefault();
        const footnoteNumber = parseInt(target.dataset.footnote ?? "", 10);
        if (Number.isNaN(footnoteNumber)) return;
        const footnote = section.footnotes.find((f) => f.number === footnoteNumber);
        if (footnote) {
          onFootnoteClick(footnote);
        }
      }
    };

    const markers = container.querySelectorAll<HTMLElement>("sup[data-footnote]");
    markers.forEach((marker) => {
      marker.setAttribute("role", "button");
      marker.setAttribute("tabindex", "0");
      marker.setAttribute("aria-label", `Read footnote ${marker.dataset.footnote}`);
    });

    // Capture on document to ensure it works in production regardless of bubbling quirks
    document.addEventListener("click", handleClick, true);
    container.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("click", handleClick, true);
      container.removeEventListener("keydown", handleKeyDown);
    };
  }, [section, onFootnoteClick]);

  // Inject glossary markers by appending numbered chips after term occurrences
  useEffect(() => {
    const container = contentRef.current;
    if (!container) return;
    if (glossaryBuilt.current) return;

    // Build matchers for both full title and a shortened variant (strip parenthetical
    // parts like transliterations), since the text often uses the short form
    // (e.g., "Functional Certitude").
    const stripParens = (s: string) => s.replace(/\s*\([^)]*\)\s*/g, " ").replace(/\s+/g, " ").trim();
    const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const terms = glossary.map((g) => {
      const full = g.title.trim();
      const short = stripParens(full);
      const variants = Array.from(new Set([full, short]));
      const res = variants.map((v) =>
        new RegExp(`(^|[^A-Za-z])(${escape(v)})(?=[^A-Za-z]|$)`, "gi"),
      );
      return { slug: g.slug, index: g.index, title: g.title, res };
    });

    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
    const toProcess: Text[] = [];
    while (walker.nextNode()) {
      const node = walker.currentNode as Text;
      if (!node.data.trim()) continue;
      if (node.parentElement?.closest("sup[data-footnote], sup[data-glossary], mark[data-highlight]")) continue;
      toProcess.push(node);
    }

    toProcess.forEach((textNode) => {
      const txt = textNode.data;
      let changed = false;
      const frag = document.createDocumentFragment();
      let cursor = 0;
      let found: { start: number; end: number; slug: string; text: string; index: number } | null = null;

      const findNext = (startAt: number) => {
        let best: { start: number; end: number; slug: string; text: string; index: number } | null = null;
        terms.forEach((t) => {
          t.res.forEach((re) => {
            re.lastIndex = startAt;
            const m = re.exec(txt);
            if (m) {
              const s = m.index + (m[1] ? m[1].length : 0);
              const e = s + m[2].length;
              if (!best || s < best.start) best = { start: s, end: e, slug: t.slug, text: m[2], index: t.index };
            }
          });
        });
        return best;
      };

      while ((found = findNext(cursor))) {
        const { start, end, slug, text, index } = found;
        if (start > cursor) frag.appendChild(document.createTextNode(txt.slice(cursor, start)));
        // Keep the original text, then add a numbered chip
        frag.appendChild(document.createTextNode(text));
        const sup = document.createElement("sup");
        sup.dataset.glossary = slug;
        sup.textContent = String(index);
        frag.appendChild(sup);
        cursor = end;
        changed = true;
      }

      if (changed) {
        if (cursor < txt.length) frag.appendChild(document.createTextNode(txt.slice(cursor)));
        textNode.parentNode?.replaceChild(frag, textNode);
      }
    });

    glossaryBuilt.current = true;

    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const el = target.closest("sup[data-glossary]") as HTMLElement | null;
      if (!el) return;
      const slug = el.dataset.glossary;
      if (!slug) return;
      e.preventDefault();
      e.stopPropagation();
      window.location.assign(`/glossary#${slug}`);
    };

    container.addEventListener("click", onClick);
    return () => {
      container.removeEventListener("click", onClick);
      // Reset so a new section rebuilds markers
      glossaryBuilt.current = false;
    };
  }, [section.id]);

  useEffect(() => {
    const container = contentRef.current;
    if (!container) return;

    const clearHighlights = () => {
      const marks = container.querySelectorAll("mark[data-highlight]");
      marks.forEach((mark) => {
        const textNode = document.createTextNode(mark.textContent || "");
        const parent = mark.parentNode;
        if (!parent) return;
        parent.replaceChild(textNode, mark);
        parent.normalize();
      });
      highlightRefs.current = [];
      onHighlightMatches?.(0);
    };

    clearHighlights();

    const term = highlightTerm?.trim();
    if (!term) {
      console.log(`[ChapterContent] No highlight term provided`);
      return;
    }

    console.log(`[ChapterContent] Highlighting term: "${term.substring(0, 100)}..."`);
    const normalizedTerm = term.replace(/[\s\u00A0]+/g, " ").trim();
    if (!normalizedTerm) {
      console.log(`[ChapterContent] Normalized term is empty`);
      return;
    }
    
    console.log(`[ChapterContent] Normalized term: "${normalizedTerm.substring(0, 100)}..."`);

    const pattern = normalizedTerm
      .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
      .replace(/\s+/g, "\\s+");

    const regex = new RegExp(pattern, "gi");
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
    const createdMarks: HTMLElement[] = [];

    while (walker.nextNode()) {
      const textNode = walker.currentNode as Text;
      const { textContent } = textNode;
      if (!textContent) continue;
      if (textNode.parentElement?.closest("sup[data-footnote]")) {
        continue;
      }

      regex.lastIndex = 0;
      const matches: Array<{ start: number; end: number }> = [];
      let match: RegExpExecArray | null;

      while ((match = regex.exec(textContent)) !== null) {
        matches.push({ start: match.index, end: match.index + match[0].length });
        if (match.index === regex.lastIndex) {
          regex.lastIndex += 1;
        }
      }

      if (!matches.length) continue;

      matches.sort((a, b) => a.start - b.start);
      const merged: Array<{ start: number; end: number }> = [];
      matches.forEach((range) => {
        const last = merged[merged.length - 1];
        if (!last || range.start >= last.end) {
          merged.push({ ...range });
        }
      });

      const frag = document.createDocumentFragment();
      let cursor = 0;

      merged.forEach(({ start, end }) => {
        if (start > cursor) {
          frag.appendChild(document.createTextNode(textContent.slice(cursor, start)));
        }
        const mark = document.createElement("mark");
        mark.dataset.highlight = "true";
        mark.textContent = textContent.slice(start, end);
        frag.appendChild(mark);
        createdMarks.push(mark);
        cursor = end;
      });

      if (cursor < textContent.length) {
        frag.appendChild(document.createTextNode(textContent.slice(cursor)));
      }

      const parent = textNode.parentNode;
      parent?.replaceChild(frag, textNode);
    }

    if (createdMarks.length > 0) {
      console.log(`[ChapterContent] Created ${createdMarks.length} highlight marks`);
      highlightRefs.current = createdMarks;
      onHighlightMatches?.(createdMarks.length);
    } else {
      console.log(`[ChapterContent] No highlight marks created - term not found in content`);
    }

    return clearHighlights;
  }, [highlightTerm, section.id, onHighlightMatches]);

  useEffect(() => {
    const marks = highlightRefs.current;
    if (!marks.length) return;

    marks.forEach((mark) => mark.classList.remove("is-active"));

    if (currentHighlightIndex === null) return;

    const index = Math.min(Math.max(currentHighlightIndex, 0), marks.length - 1);
    const active = marks[index];
    if (active) {
      active.classList.add("is-active");
      active.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [currentHighlightIndex]);

  return (
    <article className="max-w-3xl mx-auto px-6 py-10">
      <div className="mb-6 space-y-3">
        {sectionTrail.length > 0 && (
          <nav className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-sans uppercase tracking-[0.35em] text-muted-foreground">
            {sectionTrail.map((ancestor, index) => (
              <span key={ancestor.id} className="flex items-center gap-3">
                <span className="truncate max-w-[14rem] opacity-80">{ancestor.title}</span>
                {index < sectionTrail.length - 1 && (
                  <span className="h-px w-6 bg-muted opacity-60" />
                )}
              </span>
            ))}
          </nav>
        )}
        <h1 className="text-4xl md:text-5xl font-heading font-semibold mb-1">
          {chapterTitle}
        </h1>
        {section.title !== chapterTitle && (
          <p className="text-muted-foreground font-sans text-base md:text-lg">
            {section.title}
          </p>
        )}
      </div>

      <OrnamentalDivider className="my-6" />

      {section.pageReference && (
        <div className="mt-4 text-sm font-sans text-muted-foreground">
          Physical book p. {section.pageReference}
        </div>
      )}

      <div
        ref={contentRef}
        className="chapter-prose max-w-none leading-relaxed mt-4 space-y-6"
        style={{ fontSize: `${textSize}px` }}
        data-testid="chapter-text-content"
        dangerouslySetInnerHTML={{ __html: section.content }}
      />

      {section.footnotes.length > 0 && (
        <div className="mt-16 pt-8 border-t border-border">
          <h3 className="text-xl font-heading font-medium mb-6">Footnotes</h3>
          <div className="space-y-4">
            {section.footnotes.map((footnote) => (
              <div
                key={footnote.id}
                className="text-sm leading-relaxed"
                data-testid={`footnote-${footnote.number}`}
              >
                <span className="font-semibold text-primary mr-2">
                  {footnote.number}.
                </span>
                <span
                  className="text-muted-foreground"
                  dangerouslySetInnerHTML={{ __html: footnote.content }}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}
