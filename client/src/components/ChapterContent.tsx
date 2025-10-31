import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Section, Footnote } from "@shared/schema";
import { glossary } from "@shared/glossary";
import OrnamentalDivider from "./OrnamentalDivider";
import SectionAudioPlayer from "./SectionAudioPlayer";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { imageCatalogue } from "@/data/imageCatalogue";
import type { GalleryItem } from "@/data/imageCatalogue";

const ENABLE_GLOSSARY_CHIPS = false;

const INLINE_IMAGE_CONFIG: Record<string, { itemId: string; variant: "default" | "floated" }> = {
  "2": { itemId: "image-tarbha", variant: "default" },
  "13": { itemId: "image-13", variant: "floated" },
};
const IMAGE_SECTION_ID = "list-of-images";

function htmlToPlainText(content: string) {
  const text = (() => {
    if (typeof window !== "undefined") {
      const temp = window.document.createElement("div");
      temp.innerHTML = content;
      return temp.textContent ?? "";
    }
    return content.replace(/<[^>]+>/g, " ");
  })();
  return text.replace(/\s+/g, " ").trim();
}

function extractFootnoteSnippet(content: string, limit = 180) {
  const text = htmlToPlainText(content);

  if (text.length <= limit) return text;
  return `${text.slice(0, limit).trimEnd()}…`;
}

interface ChapterContentProps {
  section: Section;
  chapterTitle: string;
  textSize: number;
  highlightTerm: string | null;
  sectionTrail: Section[];
  currentHighlightIndex: number | null;
  onHighlightMatches?: (count: number) => void;
  onFootnoteClick: (footnote: Footnote) => void;
  onRequestNote?: (payload: {
    sectionId: string;
    excerpt: string;
    rect: { top: number; left: number; width: number; height: number; bottom: number };
    range: Range;
  }) => void;
  sectionMarkupOverride?: string;
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
  onRequestNote,
  sectionMarkupOverride,
}: ChapterContentProps) {
  const contentRef = useRef<HTMLDivElement | null>(null);
  const highlightRefs = useRef<HTMLElement[]>([]);
  const glossaryBuilt = useRef(false);
  const [hoveredFootnote, setHoveredFootnote] = useState<{
    footnote: Footnote;
    rect: DOMRect;
  } | null>(null);
  const hoverTimeoutRef = useRef<number | null>(null);
  const hoveredMarkerRef = useRef<HTMLElement | null>(null);
  const [inlineImageHosts, setInlineImageHosts] = useState<HTMLElement[]>([]);

  const inlineImageItems = useMemo(() => {
    const map = new Map<string, GalleryItem>();
    imageCatalogue.forEach((item) => {
      map.set(item.id, item);
    });
    return map;
  }, []);
  const estimatedAudioDuration = useMemo(() => {
    const text = htmlToPlainText(section.content);
    const wordCount = text ? text.split(/\s+/).filter(Boolean).length : 0;
    if (wordCount === 0) return 300;
    const seconds = Math.round((wordCount / 165) * 60);
    return Math.min(1200, Math.max(180, seconds));
  }, [section.content, section.id]);

  const showImageCatalogue = section.id === IMAGE_SECTION_ID;

  const baseContent = useMemo(() => {
    if (!showImageCatalogue) return section.content;
    return section.content.replace(/<p><em>Unused[^]+$/m, "");
  }, [section.content, showImageCatalogue]);

  const contentWithInlineImages = useMemo(() => {
    if (!showImageCatalogue) return baseContent;
    let html = baseContent;
    Object.entries(INLINE_IMAGE_CONFIG).forEach(([imageNumber, config]) => {
      const regex = new RegExp(`(<p[^>]*>\\s*Image\\s*${imageNumber}:)`, "i");
      if (!regex.test(html)) return;
      const placeholder = `<div class="inline-image-host" data-inline-image="${config.itemId}" data-inline-variant="${config.variant}"></div>`;
      html = html.replace(regex, `${placeholder}$1`);
    });
    return html;
  }, [baseContent, showImageCatalogue]);

  const sanitizedContent = useMemo(() => {
    if (sectionMarkupOverride) return sectionMarkupOverride;
    return contentWithInlineImages;
  }, [contentWithInlineImages, sectionMarkupOverride]);

  useEffect(() => {
    if (!showImageCatalogue) {
      setInlineImageHosts([]);
      return;
    }
    const container = contentRef.current;
    if (!container) return;
    const mounts = Array.from(
      container.querySelectorAll<HTMLElement>("[data-inline-image]")
    );
    setInlineImageHosts(mounts);
  }, [sanitizedContent, showImageCatalogue]);

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

    const cancelHoverTimeout = () => {
      if (hoverTimeoutRef.current !== null) {
        window.clearTimeout(hoverTimeoutRef.current);
        hoverTimeoutRef.current = null;
      }
    };

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

    function handleMouseEnter(this: HTMLElement) {
      cancelHoverTimeout();
      const footnoteNumber = parseInt(this.dataset.footnote ?? "", 10);
      if (Number.isNaN(footnoteNumber)) return;
      const footnote = section.footnotes.find((f) => f.number === footnoteNumber);
      if (!footnote) return;
      hoveredMarkerRef.current = this;
      setHoveredFootnote({
        footnote,
        rect: this.getBoundingClientRect(),
      });
    }

    function handleMouseLeave() {
      cancelHoverTimeout();
      hoverTimeoutRef.current = window.setTimeout(() => {
        hoveredMarkerRef.current = null;
        setHoveredFootnote(null);
        hoverTimeoutRef.current = null;
      }, 120);
    }

    function handleFocus(this: HTMLElement) {
      handleMouseEnter.call(this);
    }

    function handleBlur() {
      cancelHoverTimeout();
      hoverTimeoutRef.current = window.setTimeout(() => {
        hoveredMarkerRef.current = null;
        setHoveredFootnote(null);
        hoverTimeoutRef.current = null;
      }, 80);
    }

    const markers = container.querySelectorAll<HTMLElement>("sup[data-footnote]");
    markers.forEach((marker) => {
      marker.setAttribute("role", "button");
      marker.setAttribute("tabindex", "0");
      marker.setAttribute("aria-label", `Read footnote ${marker.dataset.footnote}`);
      marker.addEventListener("mouseenter", handleMouseEnter);
      marker.addEventListener("mouseleave", handleMouseLeave);
      marker.addEventListener("focus", handleFocus);
      marker.addEventListener("blur", handleBlur);
    });

    // Capture on document to ensure it works in production regardless of bubbling quirks
    document.addEventListener("click", handleClick, true);
    container.addEventListener("keydown", handleKeyDown);
    return () => {
      cancelHoverTimeout();
      document.removeEventListener("click", handleClick, true);
      container.removeEventListener("keydown", handleKeyDown);
      markers.forEach((marker) => {
        marker.removeEventListener("mouseenter", handleMouseEnter);
        marker.removeEventListener("mouseleave", handleMouseLeave);
        marker.removeEventListener("focus", handleFocus);
        marker.removeEventListener("blur", handleBlur);
      });
    };
  }, [section, onFootnoteClick]);

  useEffect(() => {
    if (!hoveredFootnote) return;
    const footnoteNumber = hoveredFootnote.footnote.number;

    const updateRect = () => {
      const container = contentRef.current;
      if (!container) return;
      const marker = container.querySelector<HTMLElement>(
        `sup[data-footnote="${footnoteNumber}"]`
      );
      if (!marker) {
        hoveredMarkerRef.current = null;
        setHoveredFootnote(null);
        return;
      }
      hoveredMarkerRef.current = marker;
      const rect = marker.getBoundingClientRect();
      setHoveredFootnote((prev) => {
        if (!prev || prev.footnote.number !== footnoteNumber) return prev;
        const sameRect =
          Math.abs(prev.rect.top - rect.top) < 0.5 &&
          Math.abs(prev.rect.left - rect.left) < 0.5 &&
          Math.abs(prev.rect.width - rect.width) < 0.5 &&
          Math.abs(prev.rect.height - rect.height) < 0.5;
        if (sameRect) return prev;
        return { ...prev, rect };
      });
    };

    updateRect();
    window.addEventListener("scroll", updateRect, true);
    window.addEventListener("resize", updateRect);
    return () => {
      window.removeEventListener("scroll", updateRect, true);
      window.removeEventListener("resize", updateRect);
    };
  }, [hoveredFootnote]);

  // Inject glossary markers by appending numbered chips after term occurrences
  useEffect(() => {
    if (!ENABLE_GLOSSARY_CHIPS) return;
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

    const usedSlugs = new Set<string>();

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
        // Keep the original text, then add a numbered chip only once per slug
        frag.appendChild(document.createTextNode(text));
        if (!usedSlugs.has(slug)) {
          const sup = document.createElement("sup");
          sup.dataset.glossary = slug;
          sup.textContent = String(index);
          frag.appendChild(sup);
          usedSlugs.add(slug);
          changed = true;
        }
        cursor = end;
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

  useEffect(() => {
    if (!onRequestNote) return;
    const container = contentRef.current;
    if (!container) return;

    const handleSelection = () => {
      if (typeof window === "undefined") return;
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) return;
      const anchorNode = selection.anchorNode;
      const focusNode = selection.focusNode;
      if (!anchorNode || !focusNode) return;
      if (!container.contains(anchorNode) || !container.contains(focusNode)) return;

      let range: Range;
      try {
        range = selection.getRangeAt(0).cloneRange();
      } catch {
        return;
      }

      const excerpt = range.toString().trim();
      if (!excerpt || excerpt.length < 3) return;

      const startAncestor =
        (range.startContainer as Element | null)?.closest?.("mark[data-reader-note]") ??
        range.startContainer.parentElement?.closest("mark[data-reader-note]");
      const endAncestor =
        (range.endContainer as Element | null)?.closest?.("mark[data-reader-note]") ??
        range.endContainer.parentElement?.closest("mark[data-reader-note]");
      if (startAncestor || endAncestor) return;

      const rect = range.getBoundingClientRect();
      if ((rect.width === 0 && rect.height === 0) || Number.isNaN(rect.top)) return;

      onRequestNote({
        sectionId: section.id,
        excerpt,
        rect: {
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
          bottom: rect.bottom,
        },
        range,
      });
    };

    const handleMouseUp = () => window.setTimeout(handleSelection, 20);
    const handleKeyUp = (event: KeyboardEvent) => {
      const navigationKeys = ["Shift", "Alt", "Meta", "Control", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"];
      if (navigationKeys.includes(event.key)) return;
      window.setTimeout(handleSelection, 20);
    };

    container.addEventListener("mouseup", handleMouseUp);
    container.addEventListener("keyup", handleKeyUp);
    return () => {
      container.removeEventListener("mouseup", handleMouseUp);
      container.removeEventListener("keyup", handleKeyUp);
    };
  }, [onRequestNote, section.id]);

  const hoverPreviewNode = useMemo(() => {
    if (!hoveredFootnote) return null;
    if (typeof window === "undefined") return null;

    const spacing = 12;
    const viewportWidth = window.innerWidth;
    const baseWidth = 320;
    const width = Math.min(baseWidth, Math.max(240, viewportWidth - 32));
    const centeredLeft =
      hoveredFootnote.rect.left + hoveredFootnote.rect.width / 2 - width / 2;
    const left = Math.min(Math.max(centeredLeft, 16), viewportWidth - width - 16);
    const top = hoveredFootnote.rect.bottom + spacing;
    const preview = extractFootnoteSnippet(hoveredFootnote.footnote.content);

    return createPortal(
      <div
        className="pointer-events-none fixed z-50 max-w-[90vw] rounded-xl border border-border bg-background/95 px-4 py-3 shadow-2xl backdrop-blur transition-opacity"
        style={{ top, left, width }}
        role="status"
        aria-live="polite"
      >
        <div className="text-[10px] font-semibold uppercase tracking-[0.35em] text-muted-foreground/70">
          Footnote {hoveredFootnote.footnote.number}
        </div>
        <p className="mt-2 text-sm leading-snug text-muted-foreground/90">{preview}</p>
      </div>,
      document.body
    );
  }, [hoveredFootnote]);

  const inlineImagePortals = showImageCatalogue
    ? inlineImageHosts
        .map((host) => {
          const itemId = host.dataset.inlineImage ?? "";
          const variant =
            (host.dataset.inlineVariant as "default" | "floated" | undefined) ?? "default";
          const item = inlineImageItems.get(itemId);
          if (!item) return null;
          return createPortal(
            <InlineImageFigure item={item} variant={variant} />,
            host
          );
        })
        .filter(Boolean)
    : [];

  return (
    <>
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

      <div className="mt-6">
        <SectionAudioPlayer
          sectionId={section.id}
          sectionTitle={section.title}
          chapterTitle={chapterTitle}
          estimatedDuration={estimatedAudioDuration}
        />
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
        dangerouslySetInnerHTML={{ __html: sanitizedContent }}
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
      {inlineImagePortals}
      {hoverPreviewNode}
    </>
  );
}

function InlineImageFigure({
  item,
  variant,
}: {
  item: GalleryItem;
  variant: "default" | "floated";
}) {
  const modalSrc = item.modalImageSrc ?? item.imageSrc;

  if (variant === "floated") {
    return (
      <Dialog>
        <DialogTrigger asChild>
          <button
            type="button"
            className="group relative float-right ml-6 mb-3 w-full max-w-[220px] overflow-hidden rounded-2xl border border-border/60 bg-background shadow-sm transition hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 md:max-w-xs"
          >
            <img
              src={item.imageSrc}
              alt={item.subtitle ?? item.title}
              className="w-full object-cover transition duration-500 group-hover:scale-[1.03]"
            />
          </button>
        </DialogTrigger>
        <InlineImageLightbox item={item} modalSrc={modalSrc} />
      </Dialog>
    );
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="group relative mx-auto mb-6 block max-w-xl overflow-hidden rounded-3xl border border-border/60 shadow-sm transition hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          <img
            src={item.imageSrc}
            alt={item.subtitle ?? item.title}
            className="w-full object-cover transition duration-500 group-hover:scale-[1.03]"
          />
        </button>
      </DialogTrigger>
      <InlineImageLightbox item={item} modalSrc={modalSrc} />
    </Dialog>
  );
}

function InlineImageLightbox({ item, modalSrc }: { item: GalleryItem; modalSrc: string }) {
  return (
    <DialogContent className="max-w-4xl overflow-hidden rounded-3xl border border-border bg-background/95 p-0">
      <DialogHeader className="space-y-2 px-6 pt-6">
        <DialogTitle className="text-sm font-semibold uppercase tracking-[0.3em] text-muted-foreground/80">
          {item.subtitle ?? item.title}
        </DialogTitle>
      </DialogHeader>
      <img
        src={modalSrc}
        alt={item.subtitle ?? item.title}
        className="w-full max-h-[70vh] object-contain bg-muted/40"
      />
      {item.description && (
        <div className="px-6 pb-6 pt-4 text-sm leading-relaxed text-muted-foreground/90">
          {item.description}
        </div>
      )}
    </DialogContent>
  );
}
