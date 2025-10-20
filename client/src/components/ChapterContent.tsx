import { useEffect, useRef } from "react";
import type { Section, Footnote } from "@shared/schema";
import OrnamentalDivider from "./OrnamentalDivider";

interface ChapterContentProps {
  section: Section;
  chapterTitle: string;
  textSize: number;
  highlightTerm: string | null;
  onFootnoteClick: (footnote: Footnote) => void;
}

export default function ChapterContent({
  section,
  chapterTitle,
  textSize,
  highlightTerm,
  onFootnoteClick,
}: ChapterContentProps) {
  const contentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = contentRef.current;
    if (!container) return;

    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target) return;
      const footnoteEl = target.closest<HTMLElement>("[data-footnote]");
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

    container.addEventListener("click", handleClick);
    container.addEventListener("keydown", handleKeyDown);
    return () => {
      container.removeEventListener("click", handleClick);
      container.removeEventListener("keydown", handleKeyDown);
    };
  }, [section, onFootnoteClick]);

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
    };

    clearHighlights();

    const term = highlightTerm?.trim();
    if (!term) return;

    const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (!escapedTerm) return;

    const regex = new RegExp(escapedTerm, "gi");
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
    const createdMarks: HTMLElement[] = [];

    while (walker.nextNode()) {
      const textNode = walker.currentNode as Text;
      const { textContent } = textNode;
      if (!textContent) continue;
      if (textNode.parentElement?.closest("sup[data-footnote]")) {
        continue;
      }
      if (!regex.test(textContent)) {
        regex.lastIndex = 0;
        continue;
      }

      const frag = document.createDocumentFragment();
      let lastIndex = 0;
      textContent.replace(regex, (match, offset) => {
        const start = Number(offset);
        if (start > lastIndex) {
          frag.appendChild(document.createTextNode(textContent.slice(lastIndex, start)));
        }
        const mark = document.createElement("mark");
        mark.dataset.highlight = "true";
        mark.textContent = match;
        frag.appendChild(mark);
        createdMarks.push(mark);
        lastIndex = start + match.length;
        return match;
      });

      if (lastIndex < textContent.length) {
        frag.appendChild(document.createTextNode(textContent.slice(lastIndex)));
      }

      const parent = textNode.parentNode;
      parent?.replaceChild(frag, textNode);
      regex.lastIndex = 0;
    }

    if (createdMarks.length > 0) {
      createdMarks[0].scrollIntoView({ behavior: "smooth", block: "center" });
    }

    return clearHighlights;
  }, [highlightTerm, section.id]);

  return (
    <article className="max-w-3xl mx-auto px-6 py-10">
      <div className="mb-6">
        <h1 className="text-4xl md:text-5xl font-heading font-semibold mb-1">
          {chapterTitle}
        </h1>
        {section.title !== chapterTitle && (
          <p className="text-muted-foreground font-sans text-base">
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
