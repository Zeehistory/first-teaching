import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation } from "wouter";
import type { Section, Footnote } from "@shared/schema";
import { glossary, type GlossaryEntry } from "@shared/glossary";
import OrnamentalDivider from "./OrnamentalDivider";
import SectionAudioPlayer from "./SectionAudioPlayer";
import FloatingAudioPlayer from "./FloatingAudioPlayer";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { imageCatalogue } from "@/data/imageCatalogue";
import type { GalleryItem } from "@/data/imageCatalogue";
import { useSectionAudioController } from "@/hooks/useSectionAudioController";
import {
  getFootnoteDisplayNumber,
  getFootnoteMarkerKey,
  getFootnoteOrigin,
} from "@/lib/footnotes";
import { captureReadingReturnState } from "@/lib/readingReturn";
import { processSubsections } from "@/lib/subsections";
import { footnoteSummary, cleanPreview } from "@/lib/summaries";
import { italicizeTransliterations } from "@/lib/transliteration";
import Transliterated from "./Transliterated";

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

const OPEN_Q = /[“"«]/;
const CLOSE_Q = /[”"»]/;
const ATTRIBUTION = /^\s*(?:[~—–-]\s*\S|—)/; // "~ Emily Dickinson", "— T. S. Eliot"
const LEADIN_COLON = /[:：]\s*$/;
// A lead-in ending in a verb of saying + colon ("the Prophet said:", "the
// Qur'ān states:", "Muslim … transmit … that the Prophet said:") strongly
// introduces a quotation — even one with embedded dialogue/quote marks.
const SAYING_LEADIN =
  /\b(said|says|saying|state[sd]?|stating|transmit(?:s|ted)?|narrate[sd]?|report[sd]?|relate[sd]?|recite[sd]?|announce[sd]?|declare[sd]?|proclaim[sd]?|reads?|wrote|writes?|asks?|asked|replie[sd]|responded|continued|added|noted)\b[^:：]{0,40}[:：]\s*$/i;
// A paragraph ending in a parenthetical scripture/source citation, e.g.
// "(Scattering Winds, 51:13-14)" or "(The Momentous Announcement, 78:40)".
const TRAILING_CITATION = /\([^()]*\d+[:.,][^()]*\)[.”"»]?\s*$/;

function plain(el: Element | null): string {
  return (el?.textContent || "").replace(/ /g, " ").trim();
}

/**
 * Robust quotation + verse classifier.
 *
 * Rather than "starts with a quote mark → blockquote", we read several
 * structural signals and group consecutive lines into a single quote block:
 *
 *  - lead-in:  a paragraph ending in a colon introduces the quote/verse that
 *    follows (e.g. `T. S. Eliot says in the Four Quartets:`)
 *  - wrapped:  a paragraph whose quotation marks span most of its text (a
 *    genuine pull-quote) — NOT prose that merely opens with a quoted word
 *  - verse:    short, separate lines (a poem) — detected by line length and
 *    by following a colon lead-in
 *  - attribution: a trailing `~ Name` / `— Name (d. …)` binds to the block
 *
 * Marks: `.tt-quote` (prose quotation), `.tt-verse` (poem line),
 * `.tt-verse-start` / `.tt-verse-end` (bookends), `.tt-attribution`.
 */
function classifyQuotations(container: HTMLElement) {
  container
    .querySelectorAll(
      ".auto-blockquote, .tt-quote, .tt-verse, .tt-verse-start, .tt-verse-end, .tt-attribution"
    )
    .forEach((el) => {
      el.classList.remove(
        "auto-blockquote",
        "tt-quote",
        "tt-verse",
        "tt-verse-start",
        "tt-verse-end",
        "tt-attribution"
      );
    });

  const blocks = Array.from(container.children).filter(
    (el) => el.tagName === "P"
  ) as HTMLElement[];

  const wordCount = (t: string) => (t ? t.split(/\s+/).length : 0);

  const isWrappedQuote = (t: string) => {
    if (t.length < 24 || !OPEN_Q.test(t[0])) return false;
    const endsQuoted = /[”"»][.?!,;]?$/.test(t);
    if (!endsQuoted) return false;
    // The quoted span must cover most of the paragraph — reject prose that
    // only opens with a quoted word (e.g. “Syntopicon” is a neologism …).
    const firstClose = t.search(CLOSE_Q);
    return firstClose >= t.length * 0.6;
  };

  const isAttribution = (t: string) =>
    ATTRIBUTION.test(t) && wordCount(t) <= 12;

  // A line that reads as verse: short, and not a flowing prose sentence.
  // Prose paragraphs are long and end in a period; verse lines are short and
  // tend to end in a comma / question mark / dash / nothing, or are a fragment.
  const isVerseLine = (t: string) => {
    if (!t || t.length > 95 || wordCount(t) > 15) return false;
    if (isAttribution(t)) return false;
    return true;
  };

  for (let i = 0; i < blocks.length; i++) {
    const el = blocks[i];
    if (el.dataset.ttClassified === "done") continue;
    const text = plain(el);
    if (!text) continue;

    const prevText = plain(el.previousElementSibling);
    const afterLeadIn = LEADIN_COLON.test(prevText);

    // --- Verse held in a single <p> with <br> line breaks ----------------
    // Poems are often authored as one paragraph with hard breaks rather than
    // a paragraph per line. Treat ≥2 breaks as a verse block, and pull in a
    // following short attribution line ("~ Emily Dickinson (d. …)").
    const breakCount = el.querySelectorAll("br").length;
    if (breakCount >= 2 && !isAttribution(text)) {
      el.classList.add("tt-verse", "tt-verse-start", "tt-verse-end");
      el.dataset.ttClassified = "done";
      const attr = blocks[i + 1];
      if (attr && isAttribution(plain(attr))) {
        attr.classList.add("tt-attribution", "tt-verse");
        attr.dataset.ttClassified = "done";
        i += 1;
      }
      continue;
    }

    // --- Verse run -------------------------------------------------------
    // Collect consecutive verse-like lines. A run qualifies as verse when it
    // either follows a colon lead-in (≥2 lines) or stands alone as a cluster
    // of ≥3 short lines — so poems without a colon are still caught.
    if (isVerseLine(text) || (afterLeadIn && OPEN_Q.test(text[0]))) {
      const run: HTMLElement[] = [];
      let j = i;
      while (j < blocks.length) {
        const cand = blocks[j];
        const ct = plain(cand);
        if (!ct || !isVerseLine(ct)) break;
        run.push(cand);
        j++;
      }
      const qualifies =
        (afterLeadIn && run.length >= 2) || run.length >= 3;
      if (qualifies) {
        run.forEach((line, idx) => {
          line.classList.add("tt-verse");
          if (idx === 0) line.classList.add("tt-verse-start");
          if (idx === run.length - 1) line.classList.add("tt-verse-end");
          line.dataset.ttClassified = "done";
        });
        const attr = blocks[j];
        if (attr && isAttribution(plain(attr))) {
          attr.classList.add("tt-attribution", "tt-verse");
          attr.dataset.ttClassified = "done";
          j++;
        }
        i = j - 1;
        continue;
      }
    }

    // --- Prose pull-quote ------------------------------------------------
    // A quotation block is signalled by either:
    //   • a wrapped quotation (opens & closes with quote marks), or
    //   • a colon lead-in introducing a passage that is ITSELF a quotation.
    //
    // After a colon, only elevate when the paragraph is genuinely the quote —
    // i.e. it BEGINS with a quote mark, or it carries NO quote marks at all
    // (an unmarked citation like a hadith: `the Prophet said:` → the saying).
    // A paragraph that opens with the author's own words but contains embedded
    // quotes inside it (e.g. "When the Qur'ān speaks of …") is commentary, not
    // a quotation, and must stay as normal prose.
    const beginsQuoted = OPEN_Q.test(text[0]);
    const hasAnyQuoteMark = OPEN_Q.test(text) || CLOSE_Q.test(text);
    // A lead-in that explicitly points at "the following paragraph / example /
    // rule / dates" introduces an ILLUSTRATION, not a quotation — keep it prose.
    const EXAMPLE_LEADIN =
      /(following|above|below|preceding)\s+\w*\s*(paragraph|example|passage|sentence|rule|manner|way|cases?|dates?|illustration)\b/i;
    // A strong "X said:/states:" lead-in introduces a quotation even when the
    // passage carries embedded dialogue (a Hadith narration, a Qur'ān verse
    // with quoted speech). A trailing scripture citation is the same signal.
    const strongSayingLeadIn = SAYING_LEADIN.test(prevText);
    const endsWithCitation = TRAILING_CITATION.test(text);
    const leadInQuote =
      afterLeadIn &&
      text.length >= 40 &&
      !LEADIN_COLON.test(text) && // don't chain into a sub-lead-in
      !EXAMPLE_LEADIN.test(prevText) &&
      (beginsQuoted || !hasAnyQuoteMark || strongSayingLeadIn || endsWithCitation);
    if (isWrappedQuote(text) || leadInQuote) {
      el.classList.add("tt-quote");
      el.dataset.ttClassified = "done";
      const next = blocks[i + 1];
      if (next && isAttribution(plain(next))) {
        next.classList.add("tt-attribution", "tt-quote");
        next.dataset.ttClassified = "done";
        i += 1;
      }
      continue;
    }
  }
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
  /* "bare" omits the internal heading and article chrome so a host page
     (e.g. the web-extension leaf) can supply its own header and layout. */
  variant?: "default" | "bare";
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
  variant = "default",
}: ChapterContentProps) {
  const isBare = variant === "bare";
  const contentRef = useRef<HTMLDivElement | null>(null);
  const articleRef = useRef<HTMLElement | null>(null);
  // wouter-aware navigation for in-content links (e.g. web-extension chips) so
  // they respect the router base path on static (GitHub Pages) sub-path hosting.
  const [, navigate] = useLocation();
  const navigateRef = useRef(navigate);
  navigateRef.current = navigate;
  const highlightRefs = useRef<HTMLElement[]>([]);
  const glossaryBuilt = useRef(false);
  const [hoveredFootnote, setHoveredFootnote] = useState<{
    footnote: Footnote;
    rect: DOMRect;
  } | null>(null);
  const hoverTimeoutRef = useRef<number | null>(null);
  const hoveredMarkerRef = useRef<HTMLElement | null>(null);
  const glossaryHoverRef = useRef<HTMLElement | null>(null);
  const [inlineImageHosts, setInlineImageHosts] = useState<HTMLElement[]>([]);
  const [glossaryPreview, setGlossaryPreview] = useState<{ entry: GlossaryEntry; rect: DOMRect } | null>(null);
  const [articleRect, setArticleRect] = useState<DOMRect | null>(null);
  const [audioDismissed, setAudioDismissed] = useState(false);
  const [audioHasStarted, setAudioHasStarted] = useState(false);

  const inlineImageItems = useMemo(() => {
    const map = new Map<string, GalleryItem>();
    imageCatalogue.forEach((item) => {
      map.set(item.id, item);
    });
    return map;
  }, []);
  const glossaryMap = useMemo(() => {
    const map = new Map<string, GlossaryEntry>();
    glossary.forEach((entry) => map.set(entry.slug, entry));
    return map;
  }, []);
  const estimatedAudioDuration = useMemo(() => {
    const text = htmlToPlainText(section.content);
    const wordCount = text ? text.split(/\s+/).filter(Boolean).length : 0;
    if (wordCount === 0) return 300;
    const seconds = Math.round((wordCount / 165) * 60);
    return Math.min(1200, Math.max(180, seconds));
  }, [section.content, section.id]);
  const audioController = useSectionAudioController({
    sectionId: section.id,
    duration: estimatedAudioDuration,
  });

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
    const source = sectionMarkupOverride ?? contentWithInlineImages;
    // Tag crossheadings so the prose styles them and the nav can anchor here.
    return processSubsections(source, section.id).html;
  }, [contentWithInlineImages, sectionMarkupOverride, section.id]);

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
    if (audioController.isPlaying || audioController.elapsed > 0) {
      setAudioHasStarted(true);
    } else {
      setAudioHasStarted(false);
    }
  }, [audioController.isPlaying, audioController.elapsed]);

  useEffect(() => {
    if (!audioController.isPlaying && audioController.elapsed === 0) {
      setAudioDismissed(false);
    }
  }, [audioController.isPlaying, audioController.elapsed]);

  // Italicize transliterated terms (academic convention) before the quotation
  // and glossary passes run. Keyed on content so it re-applies per section.
  useEffect(() => {
    const container = contentRef.current;
    if (!container) return;
    container.dataset.translitDone = "";
    italicizeTransliterations(container);
  }, [sanitizedContent]);

  useEffect(() => {
    const container = contentRef.current;
    if (!container) return;
    classifyQuotations(container);
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

    const resolveFootnote = (element: HTMLElement) => {
      const markerKey = element.dataset.footnoteKey;
      if (markerKey) {
        return section.footnotes.find((footnote) => getFootnoteMarkerKey(footnote) === markerKey) ?? null;
      }
      const footnoteNumber = parseInt(element.dataset.footnote ?? "", 10);
      if (Number.isNaN(footnoteNumber)) return null;
      return section.footnotes.find((footnote) => getFootnoteDisplayNumber(footnote) === footnoteNumber) ?? null;
    };

    const handleClick = (event: MouseEvent) => {
      const footnoteEl = findFootnoteHost(event);
      if (!footnoteEl) return;
      const footnote = resolveFootnote(footnoteEl);
      if (footnote) {
        event.preventDefault();
        onFootnoteClick(footnote);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (!target) return;
      if (target.matches("sup[data-footnote], sup[data-footnote-key]") && (event.key === "Enter" || event.key === " ")) {
        event.preventDefault();
        const footnote = resolveFootnote(target);
        if (footnote) {
          onFootnoteClick(footnote);
        }
      }
    };

    function handleMouseEnter(this: HTMLElement) {
      cancelHoverTimeout();
      const footnote = resolveFootnote(this);
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

    const markers = container.querySelectorAll<HTMLElement>("sup[data-footnote], sup[data-footnote-key]");

    // Collapse doubled-up markers: when two footnote markers are separated by
    // nothing but whitespace/empty wrappers in the reading flow, group them so
    // they read as one tight cluster (e.g. ¹⁶¹⁷) instead of two stray
    // superscripts with a gap. Compares each marker to the next in document
    // order using a Range, so it works across nesting like </strong><sup>.
    const markerList = Array.from(markers);
    for (let m = 0; m < markerList.length - 1; m++) {
      const a = markerList[m];
      const bMarker = markerList[m + 1];
      try {
        const between = document.createRange();
        between.setStartAfter(a);
        between.setEndBefore(bMarker);
        // Only whitespace between the two markers → they're a doubled cluster.
        if (!between.toString().trim()) {
          // strip any pure-whitespace text nodes sitting between them
          const walker = document.createTreeWalker(
            between.commonAncestorContainer,
            NodeFilter.SHOW_TEXT
          );
          const toRemove: Node[] = [];
          let node = walker.nextNode();
          while (node) {
            if (
              between.intersectsNode(node) &&
              !(node.textContent || "").trim() &&
              node !== a &&
              node !== bMarker
            ) {
              toRemove.push(node);
            }
            node = walker.nextNode();
          }
          toRemove.forEach((n) => n.parentNode?.removeChild(n));
          bMarker.classList.add("footnote-marker-grouped-next");
        }
      } catch {
        /* non-contiguous markers — ignore */
      }
    }

    markers.forEach((marker) => {
      const footnote = resolveFootnote(marker);
      if (footnote) {
        marker.dataset.footnoteOrigin = getFootnoteOrigin(footnote);
        if (!marker.dataset.footnoteKey) {
          marker.dataset.footnoteKey = getFootnoteMarkerKey(footnote);
        }
      }
      marker.setAttribute("role", "button");
      marker.setAttribute("tabindex", "0");
      marker.setAttribute(
        "aria-label",
        footnote
          ? `Read ${getFootnoteOrigin(footnote) === "web-extension" ? "web extension" : "syntopicon"} footnote ${getFootnoteDisplayNumber(footnote)}`
          : `Read footnote ${marker.dataset.footnote ?? ""}`
      );
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
    const markerKey = getFootnoteMarkerKey(hoveredFootnote.footnote);

    const updateRect = () => {
      const container = contentRef.current;
      if (!container) return;
      const marker = container.querySelector<HTMLElement>(
        `sup[data-footnote-key="${CSS.escape(markerKey)}"]`
      );
      if (!marker) {
        hoveredMarkerRef.current = null;
        setHoveredFootnote(null);
        return;
      }
      hoveredMarkerRef.current = marker;
      const rect = marker.getBoundingClientRect();
      setHoveredFootnote((prev) => {
        if (!prev || getFootnoteMarkerKey(prev.footnote) !== markerKey) return prev;
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

  useEffect(() => {
    if (!glossaryPreview) return;

    const updateRect = () => {
      const host = glossaryHoverRef.current;
      if (!host) return;
      const rect = host.getBoundingClientRect();
      setGlossaryPreview((prev) => {
        if (!prev) return prev;
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
  }, [glossaryPreview]);

  const recomputeArticleRect = useCallback(() => {
    const el = articleRef.current;
    if (!el) {
      setArticleRect(null);
      return;
    }
    const rect = el.getBoundingClientRect();
    setArticleRect((prev) => {
      if (
        prev &&
        Math.abs(prev.left - rect.left) < 0.5 &&
        Math.abs(prev.width - rect.width) < 0.5
      ) {
        return prev;
      }
      return rect;
    });
  }, []);

  useEffect(() => {
    const el = articleRef.current;
    if (!el) {
      setArticleRect(null);
      return;
    }

    recomputeArticleRect();

    const observers: ResizeObserver[] = [];
    const articleObserver = new ResizeObserver(() => recomputeArticleRect());
    articleObserver.observe(el);
    observers.push(articleObserver);

    const parent = el.parentElement;
    if (parent) {
      // Watch the layout shell as well because side panes can change its width without
      // the article itself resizing (e.g., study pane toggles).
      const parentObserver = new ResizeObserver(() => recomputeArticleRect());
      parentObserver.observe(parent);
      observers.push(parentObserver);
    }

    window.addEventListener("resize", recomputeArticleRect);

    return () => {
      observers.forEach((observer) => observer.disconnect());
      window.removeEventListener("resize", recomputeArticleRect);
    };
  }, [recomputeArticleRect, section.id]);

  // Inject glossary markers by wrapping term occurrences in highlighted spans
  useEffect(() => {
    const container = contentRef.current;
    if (!container) return;
    if (glossaryBuilt.current) return;

    const stripParens = (s: string) => s.replace(/\s*\([^)]*\)\s*/g, " ").replace(/\s+/g, " ").trim();
    const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const terms = glossary.map((g) => {
      const full = g.title.trim();
      const short = stripParens(full);
      const variants = Array.from(
        new Set(
          [full, short].filter((entry) => entry.length > 0)
        )
      );
      const res = variants.map((v) =>
        new RegExp(`(^|[^A-Za-z])(${escape(v)})(?=[^A-Za-z]|$)`, "gi"),
      );
      return { slug: g.slug, title: g.title, res };
    });

    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
    const toProcess: Text[] = [];
    while (walker.nextNode()) {
      const node = walker.currentNode as Text;
      if (!node.data.trim()) continue;
      if (
        node.parentElement?.closest(
          "sup[data-footnote], mark[data-highlight], span[data-glossary-term]"
        )
      )
        continue;
      toProcess.push(node);
    }

    toProcess.forEach((textNode) => {
      const txt = textNode.data;
      let changed = false;
      const frag = document.createDocumentFragment();
      let cursor = 0;
      let found: { start: number; end: number; slug: string; text: string; title: string } | null = null;

      const findNext = (startAt: number) => {
        let best: { start: number; end: number; slug: string; text: string; title: string } | null = null;
        terms.forEach((t) => {
          t.res.forEach((re) => {
            re.lastIndex = startAt;
            const m = re.exec(txt);
            if (m) {
              const s = m.index + (m[1] ? m[1].length : 0);
              const e = s + m[2].length;
              if (!best || s < best.start) best = { start: s, end: e, slug: t.slug, text: m[2], title: t.title };
            }
          });
        });
        return best;
      };

      while ((found = findNext(cursor))) {
        const { start, end, slug, text, title } = found;
        if (start > cursor) frag.appendChild(document.createTextNode(txt.slice(cursor, start)));
        const span = document.createElement("span");
        span.textContent = text;
        span.dataset.glossaryTerm = "true";
        span.dataset.glossary = slug;
        span.dataset.glossaryTitle = title;
        span.classList.add("glossary-term-chip");
        span.tabIndex = 0;
        span.setAttribute("role", "button");
        span.setAttribute("aria-label", `Open glossary entry for ${title}`);
        frag.appendChild(span);
        cursor = end;
        changed = true;
      }

      if (changed) {
        if (cursor < txt.length) frag.appendChild(document.createTextNode(txt.slice(cursor)));
        textNode.parentNode?.replaceChild(frag, textNode);
      }
    });

    glossaryBuilt.current = true;

    const openGlossary = (slug: string) => {
      captureReadingReturnState(undefined, slug);
      // Route through wouter so the deployment base (/first-teaching on Pages)
      // is applied; carry the slug as a hash for the glossary page to focus.
      navigateRef.current(`/glossary#${slug}`);
    };

    const getTermHost = (target: EventTarget | null): HTMLElement | null => {
      if (!target || !(target instanceof HTMLElement)) return null;
      return target.closest("[data-glossary-term]") as HTMLElement | null;
    };

    const showPreview = (el: HTMLElement) => {
      const slug = el.dataset.glossary;
      if (!slug) return;
      const entry = glossaryMap.get(slug);
      if (!entry) return;
      glossaryHoverRef.current = el;
      setGlossaryPreview({ entry, rect: el.getBoundingClientRect() });
    };

    const hidePreview = () => {
      glossaryHoverRef.current = null;
      setGlossaryPreview(null);
    };

    const handleClick = (e: MouseEvent) => {
      const extensionLink =
        e.target instanceof HTMLElement
          ? (e.target.closest("[data-web-extension-link]") as HTMLAnchorElement | null)
          : null;
      if (extensionLink) {
        captureReadingReturnState();
        // The chip's href is an app-absolute path (e.g. "/v/1/dedication/web-extension").
        // Route it through wouter so the router base is applied — required for
        // static sub-path hosting (GitHub Pages) and a no-op on Vercel ("/").
        const target = extensionLink.getAttribute("href");
        if (target && target.startsWith("/") && !e.defaultPrevented) {
          e.preventDefault();
          navigateRef.current(target);
        }
        return;
      }

      const el = getTermHost(e.target);
      if (!el) return;
      const slug = el.dataset.glossary;
      if (!slug) return;
      e.preventDefault();
      e.stopPropagation();
      openGlossary(slug);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      const el = getTermHost(event.target);
      if (!el) return;
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      const slug = el.dataset.glossary;
      if (!slug) return;
      openGlossary(slug);
    };

    const handlePointerOver = (event: PointerEvent) => {
      const el = getTermHost(event.target);
      if (!el) return;
      showPreview(el);
    };

    const handlePointerOut = (event: PointerEvent) => {
      const el = getTermHost(event.target);
      if (!el) return;
      const related = event.relatedTarget as HTMLElement | null;
      if (related && el.contains(related)) return;
      hidePreview();
    };

    const handleFocusIn = (event: FocusEvent) => {
      const el = getTermHost(event.target);
      if (el) showPreview(el);
    };

    const handleFocusOut = (event: FocusEvent) => {
      const el = getTermHost(event.target);
      if (el) hidePreview();
    };

    container.addEventListener("click", handleClick);
    container.addEventListener("keydown", handleKeyDown);
    container.addEventListener("pointerover", handlePointerOver);
    container.addEventListener("pointerout", handlePointerOut);
    container.addEventListener("focusin", handleFocusIn);
    container.addEventListener("focusout", handleFocusOut);

    return () => {
      container.removeEventListener("click", handleClick);
      container.removeEventListener("keydown", handleKeyDown);
      container.removeEventListener("pointerover", handlePointerOver);
      container.removeEventListener("pointerout", handlePointerOut);
      container.removeEventListener("focusin", handleFocusIn);
      container.removeEventListener("focusout", handleFocusOut);
      setGlossaryPreview(null);
      glossaryHoverRef.current = null;
      glossaryBuilt.current = false;
    };
  }, [section.id, sanitizedContent, glossaryMap]);

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

  const footnotePreviewNode = useMemo(() => {
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
    // Prefer a pre-generated summary; fall back to a clean excerpt of the note.
    const preview =
      footnoteSummary(hoveredFootnote.footnote.id) ??
      cleanPreview(extractFootnoteSnippet(hoveredFootnote.footnote.content));

    return createPortal(
      <div
        className="footnote-preview pointer-events-none fixed z-50 max-w-[90vw]"
        style={{ top, left, width }}
        role="status"
        aria-live="polite"
      >
        <div className="footnote-preview-eyebrow">
          Footnote {hoveredFootnote.footnote.number}
        </div>
        <p className="footnote-preview-body">{preview}</p>
      </div>,
      document.body
    );
  }, [hoveredFootnote]);

  const glossaryPreviewNode = useMemo(() => {
    if (!glossaryPreview) return null;
    if (typeof window === "undefined") return null;
    const spacing = 10;
    const viewportWidth = window.innerWidth;
    const baseWidth = 320;
    const width = Math.min(baseWidth, Math.max(240, viewportWidth - 32));
    const centeredLeft =
      glossaryPreview.rect.left + glossaryPreview.rect.width / 2 - width / 2;
    const left = Math.min(Math.max(centeredLeft, 16), viewportWidth - width - 16);
    const top = glossaryPreview.rect.bottom + spacing;

    const abridged = extractFootnoteSnippet(glossaryPreview.entry.bodyHtml ?? "", 150);

    return createPortal(
      <div
        className="glossary-preview pointer-events-none fixed z-50 max-w-[90vw]"
        style={{ top, left, width }}
        role="status"
        aria-live="polite"
      >
        <div className="glossary-preview-eyebrow">Glossary</div>
        <p className="glossary-preview-title">{glossaryPreview.entry.title}</p>
        {abridged ? (
          <p className="glossary-preview-snippet">{abridged}</p>
        ) : null}
        <p className="glossary-preview-hint">Click to open the full entry</p>
      </div>,
      document.body
    );
  }, [glossaryPreview]);

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
      <article
        className={isBare ? "" : "max-w-3xl mx-auto px-6 py-10"}
        ref={articleRef}
      >
      {!isBare && (
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
            <Transliterated text={chapterTitle} />
          </h1>
          {section.title !== chapterTitle && (
            <p className="text-muted-foreground font-sans text-base md:text-lg">
              <Transliterated text={section.title} />
            </p>
          )}
        </div>
      )}

      <div className={isBare ? "mb-8" : "mt-6"}>
        <SectionAudioPlayer
          sectionTitle={section.title}
          chapterTitle={chapterTitle}
          controller={audioController}
        />
      </div>

      {!isBare && <OrnamentalDivider className="my-6" />}

      <div
        ref={contentRef}
        className="chapter-prose max-w-none leading-relaxed mt-4 space-y-6"
        style={{ fontSize: `${textSize}px` }}
        data-testid="chapter-text-content"
        dangerouslySetInnerHTML={{ __html: sanitizedContent }}
      />
    </article>
      <FloatingAudioPlayer
        visible={audioHasStarted && !audioDismissed}
        controller={audioController}
        chapterTitle={chapterTitle}
        sectionTitle={section.title}
        anchorRect={articleRect}
        onClose={() => setAudioDismissed(true)}
      />
      {inlineImagePortals}
      {footnotePreviewNode}
      {glossaryPreviewNode}
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
