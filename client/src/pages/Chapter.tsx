import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { useLocation, useRoute, useSearch } from "wouter";
import {
  Search as SearchIcon,
  ArrowLeft,
  ArrowRight,
  PenSquare,
  Menu,
  ChevronLeft,
  PanelLeftClose,
  Highlighter,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import ChapterSidebar from "@/components/ChapterSidebar";
import ChapterContent from "@/components/ChapterContent";
import SearchOverlay from "@/components/SearchOverlay";
import FootnotePanel from "@/components/FootnotePanel";
import SearchResultNavigator from "@/components/SearchResultNavigator";
import ReadingProgress from "@/components/ReadingProgress";
import ThemeToggle from "@/components/ThemeToggle";
import TextSizeControl from "@/components/TextSizeControl";
import PageReferenceInput from "@/components/PageReferenceInput";
import { buildFootnoteSelector } from "@/lib/footnotes";
import { captureReadingReturnState, restoreReadingReturnScroll } from "@/lib/readingReturn";
import { volumes } from "@/lib/volumes";
import { buildSectionHierarchy } from "@/lib/sectionHierarchy";
import { hasRenderableContent } from "@/lib/content";
import type { Footnote } from "@shared/schema";
import { cn } from "@/lib/utils";

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/* A minimalist home mark — a single open roofline over a doorway, drawn as
   thin strokes to sit quietly beside the Contents / Notes tabs. */
function HomeMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path
        d="M4 11.2 L12 5 L20 11.2 V19 a1 1 0 0 1 -1 1 h-4 v-5 h-6 v5 H5 a1 1 0 0 1 -1 -1 Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

interface ReaderNote {
  id: string;
  anchorId: string;
  volumeNumber: number;
  volumeTitle: string;
  chapterId: string;
  chapterTitle: string;
  sectionId: string;
  sectionTitle: string;
  sectionTrail: string[];
  excerpt: string;
  note: string;
  createdAt: number;
}

interface SelectionContext {
  sectionId: string;
  excerpt: string;
  rect: { top: number; left: number; width: number; height: number; bottom: number };
}

const createNoteId = () => `note-${Math.random().toString(36).slice(2, 8)}-${Date.now().toString(36)}`;

const ROMAN_NUMERAL_TABLE: Array<{ value: number; numeral: string }> = [
  { value: 1000, numeral: "M" },
  { value: 900, numeral: "CM" },
  { value: 500, numeral: "D" },
  { value: 400, numeral: "CD" },
  { value: 100, numeral: "C" },
  { value: 90, numeral: "XC" },
  { value: 50, numeral: "L" },
  { value: 40, numeral: "XL" },
  { value: 10, numeral: "X" },
  { value: 9, numeral: "IX" },
  { value: 5, numeral: "V" },
  { value: 4, numeral: "IV" },
  { value: 1, numeral: "I" },
];

const toRoman = (value: number): string => {
  if (value <= 0) return String(value);
  let remaining = value;
  let result = "";
  ROMAN_NUMERAL_TABLE.forEach(({ value: arabic, numeral }) => {
    while (remaining >= arabic) {
      result += numeral;
      remaining -= arabic;
    }
  });
  return result || String(value);
};

const formatNoteLocation = (note: ReaderNote) => {
  const volumeLabel = `Volume ${toRoman(note.volumeNumber)}`;
  const primary = `${volumeLabel} · ${note.volumeTitle}`;
  const trail = [note.chapterTitle, ...note.sectionTrail].filter(Boolean).join(" › ");
  return { primary, trail };
};

export default function Chapter() {
  const [, params] = useRoute("/v/:volumeNumber/:id");
  const [location, setLocation] = useLocation();
  const search = useSearch();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedFootnote, setSelectedFootnote] = useState<Footnote | null>(null);
  const [textSize, setTextSize] = useState(() => {
    const saved = localStorage.getItem("textSize");
    return saved ? parseInt(saved, 10) : 18;
  });
  const [highlightTerm, setHighlightTerm] = useState<string | null>(null);
  const [highlightMatches, setHighlightMatches] = useState(0);
  const [highlightLocalIndex, setHighlightLocalIndex] = useState<number | null>(null);
  const [highlightGlobalIndex, setHighlightGlobalIndex] = useState<number | null>(null);
  const [highlightSectionsMeta, setHighlightSectionsMeta] = useState<
    Array<{ sectionId: string; count: number; start: number }>
  >([]);
  const [showAssistantIntro, setShowAssistantIntro] = useState(false);
  const [leftPaneMode, setLeftPaneMode] = useState<"navigation" | "notes">("navigation");
  const [notes, setNotes] = useState<ReaderNote[]>([]);
  const [sectionMarkupOverrides, setSectionMarkupOverrides] = useState<Record<string, string>>({});
  const [studyPaneCollapsed, setStudyPaneCollapsed] = useState(false);
  const [selectionContext, setSelectionContext] = useState<SelectionContext | null>(null);
  const [pendingNote, setPendingNote] = useState<{
    sectionId: string;
    excerpt: string;
    rect: { top: number; left: number; width: number; height: number; bottom: number };
  } | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const pendingRangeRef = useRef<Range | null>(null);
  const pendingFootnoteRef = useRef<Footnote | null>(null);
  const pendingNoteFocusRef = useRef<string | null>(null);

  const clearSelection = useCallback(() => {
    pendingRangeRef.current = null;
    setSelectionContext(null);
    if (typeof window !== "undefined") {
      window.getSelection()?.removeAllRanges();
    }
  }, []);

  const searchParams = useMemo(() => new URLSearchParams(search), [search]);
  const sectionParam = searchParams.get("s");
  const highlightRawParam = searchParams.get("h");
  const highlightParam =
    highlightRawParam && highlightRawParam.trim().length > 0 ? highlightRawParam : null;
  const highlightInstanceParam = searchParams.get("hi");
  const highlightInstance = highlightInstanceParam ? parseInt(highlightInstanceParam, 10) : null;
  const noteParam = searchParams.get("note");
  console.log(`[Chapter] URL: ${location}`);
  console.log(`[Chapter] search: ?${search}`);
  console.log(`[Chapter] searchParams:`, Object.fromEntries(searchParams.entries()));

  const volumeNumber = params?.volumeNumber ? parseInt(params.volumeNumber, 10) : NaN;
  const chapterId = params?.id ?? null;

  const volume = volumes.find((entry) => entry.number === volumeNumber && entry.data);
  const bookData = volume?.data;
  const chapter = bookData?.chapters.find((c) => c.id === chapterId) ?? null;
  const availableBooks = useMemo(
    () => volumes.filter((entry) => entry.data).map((entry) => entry.data!),
    []
  );

  const sectionHierarchy = useMemo(
    () => buildSectionHierarchy(chapter?.sections ?? []),
    [chapter]
  );

  const firstSectionId =
    chapter?.sections.find((section) => hasRenderableContent(section.content))?.id ??
    chapter?.sections.find((section) => section.content.trim().length > 0)?.id ??
    chapter?.sections[0]?.id ??
    null;

  const [currentSectionId, setCurrentSectionId] = useState<string | null>(
    sectionParam || firstSectionId
  );

  useEffect(() => {
    console.log(`[Chapter] sectionParam:`, sectionParam);
    console.log(`[Chapter] firstSectionId:`, firstSectionId);
    if (sectionParam) {
      console.log(`[Chapter] Setting currentSectionId to:`, sectionParam);
      setCurrentSectionId(sectionParam);
    } else if (firstSectionId) {
      console.log(`[Chapter] Setting currentSectionId to firstSectionId:`, firstSectionId);
      setCurrentSectionId(firstSectionId);
    }
  }, [sectionParam, firstSectionId]);

  useEffect(() => {
    console.log(`[Chapter] highlightParam:`, highlightParam ? `"${highlightParam.substring(0, 50)}..."` : 'null');
    console.log(`[Chapter] highlightRawParam:`, highlightRawParam ? `"${highlightRawParam.substring(0, 50)}..."` : 'null');
    if (highlightParam && highlightParam.length > 0) {
      setHighlightTerm(highlightParam);
    } else {
      setHighlightTerm(null);
    }
  }, [highlightParam, highlightRawParam]);

  useEffect(() => {
    if (!highlightTerm || !chapter) {
      console.log("[Chapter] Clearing highlight metadata");
      setHighlightMatches(0);
      setHighlightSectionsMeta([]);
      setHighlightGlobalIndex(null);
      setHighlightLocalIndex(null);
      return;
    }

    if (typeof window === "undefined") return;

    const termRegex = new RegExp(escapeRegExp(highlightTerm), "gi");
    const parser = new DOMParser();
    let cumulative = 0;
    const meta: Array<{ sectionId: string; count: number; start: number }> = [];

    chapter.sections.forEach((section) => {
      const doc = parser.parseFromString(`<div>${section.content}</div>`, "text/html");
      const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT);
      let sectionCount = 0;
      let currentNode: Node | null = walker.nextNode();

      while (currentNode) {
        const textNode = currentNode as Text;
        const parentElement = textNode.parentElement;
        if (!parentElement?.closest("sup[data-footnote]")) {
          const matches = textNode.data.match(termRegex);
          if (matches) {
            sectionCount += matches.length;
          }
        }
        currentNode = walker.nextNode();
      }

      if (sectionCount > 0) {
        meta.push({ sectionId: section.id, count: sectionCount, start: cumulative });
        cumulative += sectionCount;
      }
    });

    setHighlightSectionsMeta(meta);
    setHighlightMatches(cumulative);

    if (cumulative === 0) {
      setHighlightGlobalIndex(null);
      setHighlightLocalIndex(null);
      return;
    }

    const targetMeta =
      (sectionParam && meta.find((entry) => entry.sectionId === sectionParam)) || meta[0];

    if (!targetMeta) {
      setHighlightGlobalIndex(0);
      setHighlightLocalIndex(0);
      return;
    }

    const localIndex =
      typeof highlightInstance === "number" && Number.isFinite(highlightInstance)
        ? Math.max(0, Math.min(highlightInstance, targetMeta.count - 1))
        : 0;

    const initialGlobalIndex = targetMeta.start + localIndex;

    console.log(
      `[Chapter] Highlight metadata computed: total=${cumulative}, section=${targetMeta.sectionId}, local=${localIndex}, global=${initialGlobalIndex}`
    );

    setHighlightLocalIndex(localIndex);
    setHighlightGlobalIndex(initialGlobalIndex);
  }, [highlightTerm, chapter, highlightInstance, sectionParam]);

  useEffect(() => {
    localStorage.setItem("textSize", textSize.toString());
  }, [textSize]);

  useEffect(() => {
    if (!bookData || !chapter) return;

    const path = `${window.location.pathname}${window.location.search}`;
    let cancelled = false;

    const attemptRestore = () => {
      if (cancelled) return;
      if (restoreReadingReturnScroll(path)) return;
      window.requestAnimationFrame(() => {
        if (!cancelled) {
          restoreReadingReturnScroll(path);
        }
      });
    };

    const frame = window.requestAnimationFrame(attemptRestore);
    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frame);
    };
  }, [bookData, chapter, location, search, currentSectionId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const seen = window.localStorage.getItem("assistant-intro-seen");
    if (!seen) {
      const timer = window.setTimeout(() => setShowAssistantIntro(true), 500);
      return () => window.clearTimeout(timer);
    }
    setShowAssistantIntro(false);
    return undefined;
  }, []);

  useEffect(() => {
    if (!pendingNote) return;
    const updateRect = () => {
      if (!pendingRangeRef.current) return;
      const rect = pendingRangeRef.current.getBoundingClientRect();
      if (!rect || Number.isNaN(rect.top)) return;
      setPendingNote((prev) => {
        if (!prev) return prev;
        const nextRect = {
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
          bottom: rect.bottom,
        };
        const same =
          Math.abs(prev.rect.top - nextRect.top) < 0.5 &&
          Math.abs(prev.rect.left - nextRect.left) < 0.5 &&
          Math.abs(prev.rect.width - nextRect.width) < 0.5 &&
          Math.abs(prev.rect.height - nextRect.height) < 0.5;
        return same ? prev : { ...prev, rect: nextRect };
      });
    };

    updateRect();
    window.addEventListener("scroll", updateRect, true);
    window.addEventListener("resize", updateRect);
    return () => {
      window.removeEventListener("scroll", updateRect, true);
      window.removeEventListener("resize", updateRect);
    };
  }, [pendingNote]);

  useEffect(() => {
    if (!selectionContext) return;
    const updateRect = () => {
      if (!pendingRangeRef.current) return;
      const rect = pendingRangeRef.current.getBoundingClientRect();
      if (!rect || Number.isNaN(rect.top)) return;
      setSelectionContext((prev) => {
        if (!prev) return prev;
        const nextRect = {
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
          bottom: rect.bottom,
        };
        const same =
          Math.abs(prev.rect.top - nextRect.top) < 0.5 &&
          Math.abs(prev.rect.left - nextRect.left) < 0.5 &&
          Math.abs(prev.rect.width - nextRect.width) < 0.5 &&
          Math.abs(prev.rect.height - nextRect.height) < 0.5;
        return same ? prev : { ...prev, rect: nextRect };
      });
    };

    updateRect();
    window.addEventListener("scroll", updateRect, true);
    window.addEventListener("resize", updateRect);
    return () => {
      window.removeEventListener("scroll", updateRect, true);
      window.removeEventListener("resize", updateRect);
    };
  }, [selectionContext]);

  const dismissAssistantIntro = useCallback(() => {
    setShowAssistantIntro(false);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("assistant-intro-seen", "true");
    }
  }, []);

  const handleAssistantButton = useCallback(() => {
    window.dispatchEvent(new CustomEvent("open-ask-assistant"));
    dismissAssistantIntro();
  }, [dismissAssistantIntro]);

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

  useEffect(() => {
    if (!selectedFootnote) return;
    const timer = window.setTimeout(() => focusFootnoteMarker(selectedFootnote), 80);
    return () => window.clearTimeout(timer);
  }, [selectedFootnote, focusFootnoteMarker, currentSectionId]);

  useEffect(() => {
    if (!selectedFootnote) return;
    if (selectedFootnote.sectionId !== currentSectionId) {
      setSelectedFootnote(null);
    }
  }, [currentSectionId, selectedFootnote]);

  useEffect(() => {
    if (!pendingFootnoteRef.current) return;
    const pending = pendingFootnoteRef.current;
    if (!pending) return;
    if (currentSectionId !== pending.sectionId) return;
    setSelectedFootnote(pending);
    pendingFootnoteRef.current = null;
  }, [currentSectionId]);

  const handleRequestNote = useCallback(
    (payload: {
      sectionId: string;
      excerpt: string;
      rect: { top: number; left: number; width: number; height: number; bottom: number };
      range: Range;
    }) => {
      try {
        pendingRangeRef.current = payload.range.cloneRange?.() ?? payload.range;
      } catch {
        pendingRangeRef.current = payload.range;
      }
      setSelectionContext({
        sectionId: payload.sectionId,
        excerpt: payload.excerpt,
        rect: payload.rect,
      });
      setPendingNote(null);
      setNoteDraft("");
    },
    []
  );

  const handleCancelNote = useCallback(() => {
    setPendingNote(null);
    setNoteDraft("");
    clearSelection();
  }, [clearSelection]);

  const applySelectionHighlight = useCallback(() => {
    const range = pendingRangeRef.current;
    if (!range || !selectionContext) return;
    try {
      const wrapper = document.createElement("mark");
      wrapper.dataset.userHighlight = "true";
      wrapper.classList.add("user-highlight");
      const contents = range.extractContents();
      wrapper.appendChild(contents);
      range.insertNode(wrapper);
    } catch (error) {
      console.error("[Chapter] Unable to apply highlight", error);
    }
    clearSelection();
  }, [selectionContext, clearSelection]);

  const handleStartNote = useCallback(() => {
    if (!selectionContext) return;
    setPendingNote(selectionContext);
    setSelectionContext(null);
    if (typeof window !== "undefined") {
      window.getSelection()?.removeAllRanges();
    }
  }, [selectionContext]);

  const handleSectionClick = useCallback(
    (
      volumeNo: number,
      chapId: string,
      sectionId: string,
      highlight?: string,
      highlightIndexOverride?: number,
      noteAnchorId?: string
    ) => {
      if (currentSectionId) {
        const container = document.querySelector<HTMLElement>(
          '[data-testid="chapter-text-content"]'
        );
        if (container) {
          setSectionMarkupOverrides((prev) => {
            if (prev[currentSectionId] === container.innerHTML) {
              return prev;
            }
            return {
              ...prev,
              [currentSectionId]: container.innerHTML,
            };
          });
        }
      }
      clearSelection();
      setPendingNote(null);
      setCurrentSectionId(sectionId);
      const params = new URLSearchParams();
      params.set("s", sectionId);
      if (noteAnchorId) {
        params.set("note", noteAnchorId);
      }
      const trimmedHighlight = highlight?.trim();
      if (trimmedHighlight) {
        params.set("h", trimmedHighlight);
        if (typeof highlightIndexOverride === "number" && highlightIndexOverride >= 0) {
          params.set("hi", String(highlightIndexOverride));
        }
      }
      const query = params.toString();
      const path = `/v/${volumeNo}/${chapId}${query ? `?${query}` : ""}`;
      setLocation(path);
      setHighlightTerm(trimmedHighlight ?? null);
      if (typeof highlightIndexOverride === "number") {
        if (highlightTerm) {
          const metaEntry = highlightSectionsMeta.find((entry) => entry.sectionId === sectionId);
          if (metaEntry) {
            const clampedLocal = Math.max(0, Math.min(highlightIndexOverride, metaEntry.count - 1));
            setHighlightLocalIndex(clampedLocal);
            setHighlightGlobalIndex(metaEntry.start + clampedLocal);
          } else {
            setHighlightLocalIndex(Math.max(0, highlightIndexOverride));
            setHighlightGlobalIndex(null);
          }
        } else {
          setHighlightLocalIndex(Math.max(0, highlightIndexOverride));
          setHighlightGlobalIndex(Math.max(0, highlightIndexOverride));
        }
      }
      const shouldScrollToTop =
        sectionId !== currentSectionId || Boolean(trimmedHighlight) || Boolean(noteAnchorId);
      if (shouldScrollToTop) {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    },
    [
      clearSelection,
      highlightSectionsMeta,
      highlightTerm,
      setHighlightGlobalIndex,
      setHighlightLocalIndex,
      setHighlightTerm,
      setLocation,
      currentSectionId,
      setSectionMarkupOverrides,
    ]
  );

  const scrollToNoteMarker = useCallback((anchorId: string) => {
    if (typeof document === "undefined") return false;
    const marker = document.querySelector<HTMLElement>(`mark[data-reader-note="${anchorId}"]`);
    if (!marker) return false;
    marker.scrollIntoView({ behavior: "smooth", block: "center" });
    marker.classList.add("note-highlight-focus");
    window.setTimeout(() => {
      marker.classList.remove("note-highlight-focus");
    }, 2200);
    return true;
  }, []);

  const focusNoteHighlight = useCallback((note: ReaderNote) => {
    if (!note) return;
    const isSameVolume = note.volumeNumber === bookData?.volumeNumber;
    const isSameChapter = note.chapterId === chapterId;

    if (!isSameVolume || !isSameChapter) {
      if (currentSectionId) {
        const container = document.querySelector<HTMLElement>(
          '[data-testid="chapter-text-content"]'
        );
        if (container) {
          setSectionMarkupOverrides((prev) => {
            if (prev[currentSectionId] === container.innerHTML) {
              return prev;
            }
            return {
              ...prev,
              [currentSectionId]: container.innerHTML,
            };
          });
        }
      }
      const params = new URLSearchParams();
      params.set("s", note.sectionId);
      params.set("note", note.anchorId);
      setLocation(`/v/${note.volumeNumber}/${note.chapterId}?${params.toString()}`);
      return;
    }

    if (note.sectionId !== currentSectionId) {
      pendingNoteFocusRef.current = note.anchorId;
      handleSectionClick(
        note.volumeNumber,
        note.chapterId,
        note.sectionId,
        undefined,
        undefined,
        note.anchorId
      );
      return;
    }

    const focused = scrollToNoteMarker(note.anchorId);
    if (!focused) {
      pendingNoteFocusRef.current = note.anchorId;
    }
  }, [
    bookData?.volumeNumber,
    chapterId,
    currentSectionId,
    handleSectionClick,
    scrollToNoteMarker,
    setLocation,
    setSectionMarkupOverrides,
  ]);

  const handleSaveNote = useCallback(() => {
    const draft = noteDraft.trim();
    if (!draft || !pendingNote || !pendingRangeRef.current || !bookData || !chapter) return;
    const range = pendingRangeRef.current;
    const noteId = createNoteId();

    try {
      const wrapper = document.createElement("mark");
      wrapper.dataset.readerNote = noteId;
      wrapper.id = noteId;
      wrapper.classList.add("note-highlight");
      const contents = range.extractContents();
      wrapper.appendChild(contents);
      range.insertNode(wrapper);
      const selection = typeof window !== "undefined" ? window.getSelection() : null;
      selection?.removeAllRanges();

      const sectionAncestors = sectionHierarchy.trails.get(pendingNote.sectionId) ?? [];
      const resolvedSection =
        chapter.sections.find((section) => section.id === pendingNote.sectionId) ?? null;
      const sectionTitle = resolvedSection?.title ?? pendingNote.sectionId;
      const sectionTrailTitles = [
        ...sectionAncestors.map((section) => section.title),
        sectionTitle,
      ].filter(Boolean);

      const newNote: ReaderNote = {
        id: noteId,
        anchorId: noteId,
        volumeNumber: bookData.volumeNumber,
        volumeTitle: bookData.volumeTitle,
        chapterId: chapter.id,
        chapterTitle: chapter.title,
        sectionId: pendingNote.sectionId,
        sectionTitle,
        sectionTrail: sectionTrailTitles,
        excerpt: pendingNote.excerpt,
        note: draft,
        createdAt: Date.now(),
      };

      setNotes((prev) => [newNote, ...prev]);
      setPendingNote(null);
      pendingRangeRef.current = null;
      setNoteDraft("");
      setLeftPaneMode("notes");

      const container = document.querySelector<HTMLElement>(
        '[data-testid="chapter-text-content"]'
      );
      if (container) {
        setSectionMarkupOverrides((prev) => {
          if (prev[pendingNote.sectionId] === container.innerHTML) {
            return prev;
          }
          return {
            ...prev,
            [pendingNote.sectionId]: container.innerHTML,
          };
        });
      }

      window.setTimeout(() => {
        wrapper.scrollIntoView({ behavior: "smooth", block: "center" });
        wrapper.classList.add("note-highlight-focus");
        window.setTimeout(() => wrapper.classList.remove("note-highlight-focus"), 2200);
      }, 60);
    } catch (error) {
      console.error("[Chapter] Unable to attach note highlight", error);
    } finally {
      clearSelection();
    }
  }, [
    noteDraft,
    pendingNote,
    setLeftPaneMode,
    setNotes,
    clearSelection,
    bookData,
    chapter,
    sectionHierarchy,
    setSectionMarkupOverrides,
  ]);

  useEffect(() => {
    if (!pendingNoteFocusRef.current) return;
    const anchorId = pendingNoteFocusRef.current;
    const timer = window.setTimeout(() => {
      if (scrollToNoteMarker(anchorId)) {
        pendingNoteFocusRef.current = null;
      }
    }, 100);
    return () => window.clearTimeout(timer);
  }, [currentSectionId, notes, scrollToNoteMarker]);

  useEffect(() => {
    if (!noteParam) return;
    pendingNoteFocusRef.current = noteParam;
    const timer = window.setTimeout(() => {
      if (scrollToNoteMarker(noteParam)) {
        pendingNoteFocusRef.current = null;
      }
    }, 120);
    return () => window.clearTimeout(timer);
  }, [noteParam, scrollToNoteMarker]);

  const clearHighlights = useCallback(() => {
    setHighlightTerm(null);
    setHighlightMatches(0);
    setHighlightGlobalIndex(null);
    setHighlightLocalIndex(null);
    setHighlightSectionsMeta([]);
    const params = new URLSearchParams(search);
    params.delete("h");
    params.delete("hi");
    if (currentSectionId) {
      params.set("s", currentSectionId);
    }
    const query = params.toString();
    setLocation(`/v/${bookData?.volumeNumber}/${chapter?.id}${query ? `?${query}` : ""}`);
  }, [search, currentSectionId, setLocation, bookData?.volumeNumber, chapter?.id]);

  const goToNextHighlight = useCallback(() => {
    setHighlightGlobalIndex((prev) => {
      if (prev === null || highlightMatches === 0) return prev;
      return (prev + 1) % highlightMatches;
    });
  }, [highlightMatches]);

  const goToPrevHighlight = useCallback(() => {
    setHighlightGlobalIndex((prev) => {
      if (prev === null || highlightMatches === 0) return prev;
      return (prev + highlightMatches - 1) % highlightMatches;
    });
  }, [highlightMatches]);

  useEffect(() => {
    if (highlightGlobalIndex === null || highlightSectionsMeta.length === 0) {
      setHighlightLocalIndex(null);
      return;
    }

    const target = highlightSectionsMeta.find(
      (entry) =>
        highlightGlobalIndex >= entry.start && highlightGlobalIndex < entry.start + entry.count
    );

    if (!target) {
      setHighlightLocalIndex(null);
      return;
    }

    const localIndex = highlightGlobalIndex - target.start;
    if (highlightLocalIndex !== localIndex) {
      setHighlightLocalIndex(localIndex);
    }

    if (!bookData || !chapter) return;

    if (currentSectionId !== target.sectionId) {
      setCurrentSectionId(target.sectionId);
    }

    const params = new URLSearchParams(search);
    const currentHi = params.get("hi");
    const desiredHi = String(localIndex);
    let needsUpdate = currentHi !== desiredHi;

    if (params.get("s") !== target.sectionId) {
      params.set("s", target.sectionId);
      needsUpdate = true;
    }

    if (highlightTerm) {
      if (params.get("h") !== highlightTerm) {
        params.set("h", highlightTerm);
        needsUpdate = true;
      }
      if (currentHi !== desiredHi) {
        params.set("hi", desiredHi);
      }
    }

    const query = params.toString();
    const nextPath = `/v/${bookData.volumeNumber}/${chapter.id}${query ? `?${query}` : ""}`;
    if (needsUpdate && location !== nextPath) {
      setLocation(nextPath);
    }
  }, [
    highlightGlobalIndex,
    highlightSectionsMeta,
    highlightLocalIndex,
    highlightTerm,
    search,
    setLocation,
    location,
    bookData,
    chapter,
    currentSectionId,
  ]);

  if (!bookData || !chapter) {
    return (
      <div className="flex items-center justify-center min-h-screen px-6 text-center">
        <div className="max-w-xl">
          <h1 className="text-3xl font-heading mb-4">Volume Content Unavailable</h1>
          <p className="text-muted-foreground mb-6">
            The chapter you&apos;re looking for resides in a volume that has not yet been
            released in this digital companion. Please select an available volume from
            the main library to continue reading.
          </p>
          <Button onClick={() => setLocation("/")}>Back to Volume Library</Button>
        </div>
      </div>
    );
  }
  const currentSection = chapter.sections.find((s) => s.id === currentSectionId) ?? null;
  const currentSectionIndex = chapter.sections.findIndex((s) => s.id === currentSectionId);
  
  console.log(`[Chapter] currentSectionId:`, currentSectionId);
  console.log(`[Chapter] currentSection:`, currentSection ? currentSection.title : 'null');
  console.log(`[Chapter] currentSectionIndex:`, currentSectionIndex);
  const prevSection =
    currentSectionIndex > 0 ? chapter.sections[currentSectionIndex - 1] : null;
  const nextSection =
    currentSectionIndex > -1 && currentSectionIndex < chapter.sections.length - 1
      ? chapter.sections[currentSectionIndex + 1]
      : null;

  const sectionTrail = currentSection
    ? sectionHierarchy.trails.get(currentSection.id) ?? []
    : [];

  const handleExtensionNavigate = useCallback(
    (
      volumeNo: number,
      chapId: string,
      sectionId: string,
      footnote: Footnote | null
    ) => {
      if (footnote) {
        pendingFootnoteRef.current = footnote;
        if (currentSectionId === footnote.sectionId) {
          pendingFootnoteRef.current = null;
          setSelectedFootnote(footnote);
        }
      } else {
        pendingFootnoteRef.current = null;
        setSelectedFootnote(null);
      }
      handleSectionClick(volumeNo, chapId, sectionId);
    },
    [handleSectionClick, currentSectionId]
  );

  const handleSubsectionClick = useCallback(
    (volumeNo: number, chapId: string, sectionId: string, subId: string) => {
      const scrollToSub = () => {
        const el = document.getElementById(subId);
        if (!el) return false;
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        el.classList.add("content-subhead-focus");
        window.setTimeout(() => el.classList.remove("content-subhead-focus"), 2000);
        return true;
      };
      if (sectionId === currentSectionId) {
        scrollToSub();
        return;
      }
      handleSectionClick(volumeNo, chapId, sectionId);
      // The new section needs a tick to render before the anchor exists.
      let tries = 0;
      const timer = window.setInterval(() => {
        tries += 1;
        if (scrollToSub() || tries > 20) window.clearInterval(timer);
      }, 60);
    },
    [currentSectionId, handleSectionClick]
  );

  return (
    <>
      <ReadingProgress />
      {highlightTerm && highlightMatches > 0 && highlightGlobalIndex !== null && (
        <SearchResultNavigator
          term={highlightTerm}
          currentIndex={highlightGlobalIndex}
          total={highlightMatches}
          onNext={goToNextHighlight}
          onPrev={goToPrevHighlight}
          onClose={clearHighlights}
        />
      )}

      <div className="chapter-shell relative flex h-screen overflow-hidden">
        {!studyPaneCollapsed && (
          <aside className="hidden lg:flex w-80 flex-shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
            <div className="flex items-center gap-4 px-5 pt-5">
              <div className="flex items-center gap-5" data-tour="notes-toggle">
                <button
                  type="button"
                  onClick={() => setLeftPaneMode("navigation")}
                  className={`relative pb-1 text-sm transition-colors ${
                    leftPaneMode === "navigation"
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Contents
                  {leftPaneMode === "navigation" && (
                    <span className="absolute inset-x-0 -bottom-px h-px bg-[hsl(var(--gilt))]" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setLeftPaneMode("notes")}
                  className={`relative pb-1 text-sm transition-colors ${
                    leftPaneMode === "notes"
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Notes
                  {leftPaneMode === "notes" && (
                    <span className="absolute inset-x-0 -bottom-px h-px bg-[hsl(var(--gilt))]" />
                  )}
                </button>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  aria-label="Volume contents"
                  title="Volume contents"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition hover:bg-sidebar-border/50 hover:text-foreground"
                  onClick={() => setLocation(`/v/${bookData.volumeNumber}`)}
                >
                  <HomeMark className="h-[1.05rem] w-[1.05rem]" />
                </button>
                <button
                  type="button"
                  aria-label="Collapse study pane"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition hover:bg-sidebar-border/50 hover:text-foreground"
                  onClick={() => setStudyPaneCollapsed(true)}
                >
                  <PanelLeftClose className="h-[18px] w-[18px]" />
                </button>
              </div>
            </div>
            <div className="mx-5 mt-4 border-t border-sidebar-border/70" />
            <div className="flex-1 min-h-0 overflow-hidden">
              {leftPaneMode === "navigation" ? (
                <div className="h-full">
                  <ChapterSidebar
                    volumeNumber={bookData.volumeNumber}
                    chapters={bookData.chapters}
                    currentChapterId={chapterId}
                    currentSectionId={currentSectionId}
                    onHomeClick={(volumeNo) => setLocation(`/v/${volumeNo}`)}
                    onSectionClick={(volumeNo, chapId, sectionId) =>
                      handleSectionClick(volumeNo, chapId, sectionId)
                    }
                    onSubsectionClick={handleSubsectionClick}
                  />
                </div>
              ) : (
                <div className="flex h-full flex-col">
                  <div className="minimal-scrollbar flex-1 overflow-y-auto px-4 py-4">
                    {notes.length === 0 ? (
                      <p className="text-sm leading-relaxed text-muted-foreground/80">
                        Highlight any sentence to capture a thought. We&apos;ll keep it here just while you&apos;re in this chapter.
                      </p>
                    ) : (
                      <ul className="space-y-4 text-sm">
                        {notes.map((note) => {
                          const { primary, trail } = formatNoteLocation(note);
                          const timeLabel = new Date(note.createdAt)
                            .toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                            ?.replace(" am", " AM")
                            ?.replace(" pm", " PM");
                          return (
                            <li key={note.id}>
                              <button
                                type="button"
                                onClick={() => focusNoteHighlight(note)}
                                title={trail ? `${primary} · ${trail}` : primary}
                                className="group w-full border-l-2 border-[hsl(var(--codex-rule))] pl-4 text-left transition-colors hover:border-[hsl(var(--gilt))] focus-visible:outline-none"
                              >
                                <div className="text-xs text-muted-foreground/60">
                                  {timeLabel}
                                </div>
                                <p className="mt-1.5 font-serif text-sm leading-relaxed text-foreground/90">
                                  {note.note}
                                </p>
                                <p className="mt-2 text-xs italic leading-relaxed text-muted-foreground/70 line-clamp-2">
                                  {note.excerpt}
                                </p>
                                <span className="mt-2.5 inline-flex items-center gap-1.5 text-xs text-primary/80 transition group-hover:text-[hsl(var(--gilt))]">
                                  Jump to highlight
                                  <ArrowRight className="h-3 w-3 transition-transform duration-200 group-hover:translate-x-0.5" />
                                </span>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                </div>
              )}
            </div>
          </aside>
        )}
        {studyPaneCollapsed && (
          <button
            type="button"
            aria-label="Expand study pane"
            className="hidden lg:flex absolute left-5 top-3.5 z-30 h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted/60 hover:text-foreground"
            onClick={() => setStudyPaneCollapsed(false)}
          >
            <Menu className="h-[18px] w-[18px]" />
          </button>
        )}
        <div className="flex-1 flex overflow-hidden">
          <div className="flex flex-1 flex-col overflow-hidden">
            <header className="flex items-center justify-between border-b border-border bg-background px-6 py-4">
              <div className={cn("flex items-center gap-3", studyPaneCollapsed && "lg:ml-16")}>
                <PageReferenceInput
                  volumeNumber={bookData.volumeNumber}
                  chapters={bookData.chapters}
                  onNavigate={handleExtensionNavigate}
                  matchNavigationButton={studyPaneCollapsed}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden"
                  aria-label="Show notes pane"
                  onClick={() => {
                    setLeftPaneMode("notes");
                    setStudyPaneCollapsed(false);
                  }}
                >
                  <PenSquare className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <div data-tour="text-size-control">
                  <TextSizeControl
                    textSize={textSize}
                    onIncrease={() => setTextSize((s) => Math.min(s + 2, 22))}
                    onDecrease={() => setTextSize((s) => Math.max(s - 2, 14))}
                  />
                </div>
              {highlightTerm && highlightMatches > 0 && highlightGlobalIndex !== null && (
                <div className="flex items-center gap-2 rounded-full border border-border bg-background/80 px-3 py-1 text-xs font-sans text-muted-foreground shadow-sm sm:hidden">
                  <span className="tracking-wide">
                    {highlightMatches === 1
                      ? `1 of 1`
                      : `${highlightGlobalIndex + 1} / ${highlightMatches}`}
                  </span>
                  {highlightMatches > 1 && (
                    <>
                      <button
                        type="button"
                        className="transition-colors hover:text-foreground"
                        onClick={goToPrevHighlight}
                        aria-label="Previous match"
                      >
                        ‹
                      </button>
                      <button
                        type="button"
                        className="transition-colors hover:text-foreground"
                        onClick={goToNextHighlight}
                        aria-label="Next match"
                      >
                        ›
                      </button>
                    </>
                  )}
                </div>
              )}
                <div className="relative">
                  <button
                    type="button"
                    onClick={handleAssistantButton}
                    aria-label="Open study assistant"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                    data-tour="assistant-button"
                  >
                    <AssistantMark className="h-4 w-4" />
                  </button>
                  {showAssistantIntro && (
                    <div className="absolute right-0 top-full z-30 mt-3 w-64 rounded-xl border border-border bg-background px-4 py-3 text-left shadow-2xl">
                      <span className="pointer-events-none absolute -top-2 right-6 block h-3 w-3 rotate-45 border border-border border-b-0 border-r-0 bg-background" />
                      <div className="font-heading text-base font-semibold text-foreground">
                        Meet Ask Al
                      </div>
                      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground/90">
                        Your guide for summaries, clarifications, and deeper context.
                      </p>
                      <div className="mt-3 flex items-center gap-4">
                        <button
                          type="button"
                          className="rounded-md bg-primary px-3.5 py-1.5 text-sm font-medium text-primary-foreground transition hover:brightness-105"
                          onClick={handleAssistantButton}
                        >
                          Try it
                        </button>
                        <button
                          type="button"
                          className="text-sm text-muted-foreground transition hover:text-foreground"
                          onClick={dismissAssistantIntro}
                        >
                          Later
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setIsSearchOpen(true)}
                  data-testid="button-search"
                  data-tour="chapter-search"
                  aria-label="Search"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                >
                  <SearchIcon className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    captureReadingReturnState();
                    setLocation("/glossary");
                  }}
                  className="hidden rounded-full px-3 py-1.5 text-sm text-muted-foreground transition hover:text-foreground sm:inline-flex"
                >
                  Glossary
                </button>
                <span data-tour="theme-toggle">
                  <ThemeToggle />
                </span>
              </div>
            </header>

            <main
              className="minimal-scrollbar flex-1 overflow-y-auto"
              data-reader-scroll-container
            >
              {currentSection && (
                <ChapterContent
                  section={currentSection}
                  chapterTitle={chapter.title}
                  textSize={textSize}
                  highlightTerm={highlightTerm}
                  sectionTrail={sectionTrail}
                  currentHighlightIndex={highlightLocalIndex}
                  onFootnoteClick={handleFootnoteOpen}
                  onRequestNote={handleRequestNote}
                  sectionMarkupOverride={sectionMarkupOverrides[currentSection.id]}
                />
              )}

              <div className="mx-auto max-w-3xl px-6 pb-12">
                <div className="flex items-center justify-between border-t border-border pt-8">
                  <div>
                    {prevSection && (
                      <Button
                        variant="outline"
                        onClick={() =>
                          handleSectionClick(bookData.volumeNumber, chapter.id, prevSection.id)
                        }
                        data-testid="button-prev-section"
                        className="gap-2"
                      >
                        <ArrowLeft className="h-4 w-4" />
                        <div className="text-left">
                          <div className="font-sans text-xs text-muted-foreground">Previous</div>
                          <div className="font-medium line-clamp-1">{prevSection.title}</div>
                        </div>
                      </Button>
                    )}
                  </div>
                  <div>
                    {nextSection && (
                      <Button
                        variant="outline"
                        onClick={() =>
                          handleSectionClick(bookData.volumeNumber, chapter.id, nextSection.id)
                        }
                        data-testid="button-next-section"
                        className="gap-2"
                      >
                        <div className="text-right">
                          <div className="font-sans text-xs text-muted-foreground">Next</div>
                          <div className="font-medium line-clamp-1">{nextSection.title}</div>
                        </div>
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </main>
          </div>

          <FootnotePanel
            footnote={selectedFootnote}
            onClose={() => setSelectedFootnote(null)}
          />
        </div>
      </div>

      <SearchOverlay
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        bookData={bookData}
        currentChapter={chapter}
        availableVolumes={availableBooks}
        onResultClick={(volumeNo, chapterId, sectionId, term) =>
          handleSectionClick(volumeNo, chapterId, sectionId, term)
        }
      />
      {selectionContext && !pendingNote && (
        <SelectionToolbar
          rect={selectionContext.rect}
          onHighlight={applySelectionHighlight}
          onAddNote={handleStartNote}
          onDismiss={clearSelection}
        />
      )}
      {pendingNote && (
        <NoteComposer
          rect={pendingNote.rect}
          excerpt={pendingNote.excerpt}
          value={noteDraft}
          onChange={(value) => setNoteDraft(value)}
          onCancel={handleCancelNote}
          onSave={handleSaveNote}
          disableSave={noteDraft.trim().length === 0}
        />
      )}
    </>
  );
}

interface NoteComposerProps {
  rect: { top: number; left: number; width: number; height: number; bottom: number };
  excerpt: string;
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  disableSave: boolean;
}

function NoteComposer({
  rect,
  excerpt,
  value,
  onChange,
  onSave,
  onCancel,
  disableSave,
}: NoteComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => textareaRef.current?.focus(), 80);
    return () => window.clearTimeout(timer);
  }, []);

  if (typeof document === "undefined" || typeof window === "undefined") return null;

  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const width = Math.min(360, viewportWidth - 32);
  const preferBelow = rect.bottom + 260 <= viewportHeight;
  const top = preferBelow ? rect.bottom + 16 : Math.max(16, rect.top - 240);
  const left = Math.min(
    Math.max(rect.left + rect.width / 2 - width / 2, 16),
    viewportWidth - width - 16
  );

  return createPortal(
    <div
      className="fixed z-50 w-[min(360px,calc(100vw-32px))] rounded-xl border border-[hsl(var(--codex-rule))] bg-background p-4 shadow-[0_16px_40px_-20px_rgba(40,30,20,0.45)]"
      style={{ top, left, width }}
      role="dialog"
      aria-label="Add a note"
    >
      <p className="border-l-2 border-[hsl(var(--gilt))] pl-3 text-xs italic leading-relaxed text-muted-foreground line-clamp-3">
        {excerpt}
      </p>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Write a note…"
        className="mt-3 min-h-[96px] w-full resize-none border-0 bg-transparent p-0 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-0"
      />
      <div className="mt-2 flex items-center justify-end gap-1 border-t border-[hsl(var(--codex-rule)/0.7)] pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition hover:text-foreground"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={disableSave}
          className="rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground transition hover:brightness-105 disabled:opacity-40"
        >
          Save note
        </button>
      </div>
    </div>,
    document.body
  );
}

interface SelectionToolbarProps {
  rect: { top: number; left: number; width: number; height: number; bottom: number };
  onHighlight: () => void;
  onAddNote: () => void;
  onDismiss: () => void;
}

function SelectionToolbar({ rect, onHighlight, onAddNote, onDismiss }: SelectionToolbarProps) {
  if (typeof document === "undefined" || typeof window === "undefined") return null;

  const viewportWidth = window.innerWidth;
  const toolbarWidth = 240;
  const preferredTop = rect.top - 56;
  const top = preferredTop > 16 ? preferredTop : Math.min(rect.bottom + 12, window.innerHeight - 64);
  const centeredLeft = rect.left + rect.width / 2 - toolbarWidth / 2;
  const left = Math.min(Math.max(centeredLeft, 16), viewportWidth - toolbarWidth - 16);

  return createPortal(
    <div
      className="fixed z-50 flex h-10 items-center rounded-full border border-border bg-background/95 px-1 shadow-lg backdrop-blur"
      style={{ top, left, width: toolbarWidth }}
      role="toolbar"
    >
      <button
        type="button"
        onClick={onHighlight}
        className="flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-foreground transition hover:text-primary"
      >
        <Highlighter className="h-3.5 w-3.5" />
        Highlight
      </button>
      <span className="h-4 w-px bg-border" aria-hidden="true" />
      <button
        type="button"
        onClick={onAddNote}
        className="flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-foreground transition hover:text-primary"
      >
        <PenSquare className="h-3.5 w-3.5" />
        Note
      </button>
      <button
        type="button"
        onClick={onDismiss}
        className="ml-0.5 inline-flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition hover:text-foreground"
        aria-label="Dismiss selection"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>,
    document.body
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
