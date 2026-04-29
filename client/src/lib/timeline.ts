import type {
  TimelineContainerType,
  TimelineEvent,
  TimelineEventSource,
} from "@shared/schema";
import { volumes } from "@/lib/volumes";
import { volumeEighteenWebExtensions } from "@/lib/content";

type TimelineSourceDescriptor = {
  key: string;
  sourceType: TimelineEventSource;
  containerType: TimelineContainerType;
  volumeNumber: number;
  volumeTitle: string;
  chapterId: string;
  chapterTitle: string;
  sectionId: string;
  sectionTitle: string;
  html: string;
};

type TimelineRuntime = {
  events: TimelineEvent[];
  eventsById: Map<string, TimelineEvent>;
  eventsBySourceKey: Map<string, TimelineEvent[]>;
};

const DATE_PATTERNS = [
  /\b(?:d\.\s*)?(?:ca\.\s*)?\d{1,4}\s*\/\s*\d{2,4}\b/gi,
  /\b(?:ca\.\s*)?\d{3,4}\s*(?:BCE|CE)\b/gi,
  /\b(?:ca\.\s*)?\d{3,4}\s*[–-]\s*\d{2,4}(?:\s*(?:BCE|CE))?\b/gi,
  /\b\d{4}\b/gi,
] as const;

let cachedRuntime: TimelineRuntime | null = null;

function normalizeText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function buildSnippet(value: string, limit = 220) {
  const clean = normalizeText(value);
  if (clean.length <= limit) return clean;
  const clipped = clean.slice(0, limit);
  const lastSpace = clipped.lastIndexOf(" ");
  return `${clipped.slice(0, lastSpace > 120 ? lastSpace : limit).trimEnd()}…`;
}

function extractSortKey(displayDate: string): number | null {
  const normalized = displayDate.replace(/\s+/g, " ").trim();

  if (/BCE/i.test(normalized)) {
    const year = Number(normalized.match(/(\d{1,4})/)?.[1] ?? NaN);
    return Number.isFinite(year) ? -year : null;
  }

  if (normalized.includes("/")) {
    const parts = normalized.match(/(\d{1,4})\s*\/\s*(\d{2,4})/);
    const year = Number(parts?.[2] ?? NaN);
    return Number.isFinite(year) ? year : null;
  }

  if (/[–-]/.test(normalized)) {
    const parts = normalized.match(/(\d{3,4})\s*[–-]\s*(\d{2,4})/);
    const year = Number(parts?.[1] ?? NaN);
    return Number.isFinite(year) ? year : null;
  }

  const year = Number(normalized.match(/(\d{4})/)?.[1] ?? NaN);
  return Number.isFinite(year) ? year : null;
}

function getTimelineContainerSelector() {
  return [
    "sup[data-footnote]",
    "sup[data-footnote-key]",
    "[data-glossary-term]",
    "[data-web-extension-link]",
    "[data-timeline-id]",
    "script",
    "style",
  ].join(", ");
}

function findDateMatches(text: string) {
  const matches: Array<{ start: number; end: number; text: string; sortKey: number }> = [];

  DATE_PATTERNS.forEach((pattern) => {
    Array.from(text.matchAll(pattern)).forEach((match) => {
      const displayDate = match[0];
      const start = match.index ?? -1;
      const end = start + displayDate.length;
      if (start < 0) return;

      if (matches.some((entry) => start < entry.end && end > entry.start)) {
        return;
      }

      if (/^\d{4}$/.test(displayDate)) {
        const before = text[start - 1] ?? "";
        const after = text[end] ?? "";
        if (before === ":" || after === ":" || before === "/" || after === "/") {
          return;
        }
      }

      const sortKey = extractSortKey(displayDate);
      if (sortKey === null) return;

      matches.push({ start, end, text: displayDate, sortKey });
    });
  });

  return matches.sort((a, b) => a.start - b.start);
}

function deriveAnchorText(text: string, start: number, fallback: string) {
  const before = normalizeText(text.slice(0, start))
    .replace(/[\s([{"“‘'`-]+$/g, "")
    .trim();

  if (!before) return fallback;

  const fragments = before.split(/[.!?;:]\s+/);
  const candidate = fragments[fragments.length - 1] ?? before;
  const words = candidate.split(/\s+/).filter(Boolean);
  const phrase = words
    .slice(-6)
    .join(" ")
    .replace(/^(?:and|or|the|a|an|in|on|at)\s+/i, "")
    .trim();

  return phrase.length >= 3 ? phrase : fallback;
}

function buildAnnotation(text: string, displayDate: string) {
  const clean = normalizeText(text);
  const index = clean.indexOf(displayDate);
  if (index === -1) return buildSnippet(clean, 200);

  const start = Math.max(0, index - 90);
  const end = Math.min(clean.length, index + displayDate.length + 120);
  const snippet = clean.slice(start, end);
  return `${start > 0 ? "…" : ""}${buildSnippet(snippet, 220)}${end < clean.length ? "…" : ""}`;
}

function collectTimelineSources() {
  const availableBooks = volumes
    .filter((entry) => entry.data)
    .map((entry) => entry.data!)
    .sort((a, b) => a.volumeNumber - b.volumeNumber);

  const sources: TimelineSourceDescriptor[] = [];

  availableBooks.forEach((book) => {
    book.chapters.forEach((chapter) => {
      chapter.sections.forEach((section) => {
        sources.push({
          key: buildTimelineSourceKey("chapter", book.volumeNumber, chapter.id, section.id),
          sourceType: "chapter",
          containerType: "chapter",
          volumeNumber: book.volumeNumber,
          volumeTitle: book.volumeTitle,
          chapterId: chapter.id,
          chapterTitle: chapter.title,
          sectionId: section.id,
          sectionTitle: section.title,
          html: section.content,
        });

        section.footnotes.forEach((footnote) => {
          sources.push({
            key: buildFootnoteTimelineSourceKey(footnote.id),
            sourceType: "footnote",
            containerType: "chapter",
            volumeNumber: book.volumeNumber,
            volumeTitle: book.volumeTitle,
            chapterId: chapter.id,
            chapterTitle: chapter.title,
            sectionId: section.id,
            sectionTitle: section.title,
            html: footnote.content,
          });
        });

        if (book.volumeNumber === 18) {
          const extension = volumeEighteenWebExtensions[chapter.id];
          if (!extension) return;

          sources.push({
            key: buildTimelineSourceKey(
              "web-extension",
              extension.volumeNumber,
              extension.chapterId,
              extension.id
            ),
            sourceType: "web-extension",
            containerType: "web-extension",
            volumeNumber: extension.volumeNumber,
            volumeTitle: book.volumeTitle,
            chapterId: extension.chapterId,
            chapterTitle: extension.chapterTitle,
            sectionId: extension.id,
            sectionTitle: extension.title,
            html: extension.content,
          });

          extension.footnotes.forEach((footnote) => {
            sources.push({
              key: buildFootnoteTimelineSourceKey(footnote.id),
              sourceType: "footnote",
              containerType: "web-extension",
              volumeNumber: extension.volumeNumber,
              volumeTitle: book.volumeTitle,
              chapterId: extension.chapterId,
              chapterTitle: extension.chapterTitle,
              sectionId: extension.id,
              sectionTitle: extension.title,
              html: footnote.content,
            });
          });
        }
      });
    });
  });

  return sources;
}

function buildTimelineRuntime(): TimelineRuntime {
  if (cachedRuntime) return cachedRuntime;

  if (typeof document === "undefined") {
    const empty: TimelineRuntime = {
      events: [],
      eventsById: new Map(),
      eventsBySourceKey: new Map(),
    };
    cachedRuntime = empty;
    return empty;
  }

  const parser = new DOMParser();
  const events: TimelineEvent[] = [];
  const eventsBySourceKey = new Map<string, TimelineEvent[]>();
  let readingOrder = 1;

  collectTimelineSources().forEach((source) => {
    const doc = parser.parseFromString(`<div>${source.html}</div>`, "text/html");
    const root = doc.body.firstElementChild;
    if (!root) return;

    const sourceEvents: TimelineEvent[] = [];
    const walker = doc.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let currentNode: Node | null = walker.nextNode();

    while (currentNode) {
      const textNode = currentNode as Text;
      const parentElement = textNode.parentElement;
      if (
        !parentElement ||
        parentElement.closest(getTimelineContainerSelector())
      ) {
        currentNode = walker.nextNode();
        continue;
      }

      const text = textNode.data;
      const matches = findDateMatches(text);
      if (!matches.length) {
        currentNode = walker.nextNode();
        continue;
      }

      const block = parentElement.closest("p, li, blockquote, h1, h2, h3, h4, h5, h6");
      const blockText = normalizeText(block?.textContent ?? text);

      matches.forEach((match) => {
        const anchorText = deriveAnchorText(text, match.start, source.sectionTitle);
        const title = anchorText || source.sectionTitle;
        const eventId = `${source.key}:${sourceEvents.length + 1}`;

        const event: TimelineEvent = {
          id: eventId,
          sourceKey: source.key,
          sourceType: source.sourceType,
          containerType: source.containerType,
          volumeNumber: source.volumeNumber,
          volumeTitle: source.volumeTitle,
          chapterId: source.chapterId,
          chapterTitle: source.chapterTitle,
          sectionId: source.sectionId,
          sectionTitle: source.sectionTitle,
          displayDate: match.text,
          sortKey: match.sortKey,
          readingOrder,
          title,
          annotation: buildAnnotation(blockText, match.text),
          imageSlot: {
            type: "placeholder",
            label: title,
          },
          anchorText,
        };

        sourceEvents.push(event);
        events.push(event);
        readingOrder += 1;
      });

      currentNode = walker.nextNode();
    }

    if (sourceEvents.length > 0) {
      eventsBySourceKey.set(source.key, sourceEvents);
    }
  });

  const runtime: TimelineRuntime = {
    events,
    eventsById: new Map(events.map((event) => [event.id, event])),
    eventsBySourceKey,
  };

  cachedRuntime = runtime;
  return runtime;
}

export function buildTimelineSourceKey(
  sourceType: Exclude<TimelineEventSource, "footnote">,
  volumeNumber: number,
  chapterId: string,
  sectionId: string
) {
  return `${sourceType}:${volumeNumber}:${chapterId}:${sectionId}`;
}

export function buildFootnoteTimelineSourceKey(footnoteId: string) {
  return `footnote:${footnoteId}`;
}

export function getTimelineSourceEvents(sourceKey: string) {
  return buildTimelineRuntime().eventsBySourceKey.get(sourceKey) ?? [];
}

export function getTimelineEventById(eventId: string) {
  return buildTimelineRuntime().eventsById.get(eventId) ?? null;
}

export function getTimelineEventsBefore(eventId: string) {
  const runtime = buildTimelineRuntime();
  const activeEvent = runtime.eventsById.get(eventId);
  if (!activeEvent) return [];

  return runtime.events
    .filter((event) => event.readingOrder <= activeEvent.readingOrder)
    .sort((a, b) => a.sortKey - b.sortKey || a.readingOrder - b.readingOrder);
}

export function decorateTimelineDatesInElement(
  root: HTMLElement,
  sourceKey: string
) {
  const sourceEvents = getTimelineSourceEvents(sourceKey);
  if (!sourceEvents.length) return;

  root.querySelectorAll("[data-timeline-id]").forEach((node) => {
    const textNode = document.createTextNode(node.textContent ?? "");
    node.parentNode?.replaceChild(textNode, node);
  });
  root.normalize();

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const textNodes: Text[] = [];
  let currentNode: Node | null = walker.nextNode();

  while (currentNode) {
    const textNode = currentNode as Text;
    const parentElement = textNode.parentElement;
    if (
      textNode.data.trim() &&
      parentElement &&
      !parentElement.closest(getTimelineContainerSelector())
    ) {
      textNodes.push(textNode);
    }
    currentNode = walker.nextNode();
  }

  let eventIndex = 0;

  textNodes.forEach((textNode) => {
    if (eventIndex >= sourceEvents.length) return;

    const text = textNode.data;
    const matches = findDateMatches(text);
    if (!matches.length) return;

    const frag = document.createDocumentFragment();
    let cursor = 0;

    matches.forEach((match) => {
      const event = sourceEvents[eventIndex];
      if (!event || event.displayDate !== match.text) return;

      if (match.start > cursor) {
        frag.appendChild(document.createTextNode(text.slice(cursor, match.start)));
      }

      const trigger = document.createElement("span");
      trigger.textContent = match.text;
      trigger.dataset.timelineId = event.id;
      trigger.className = "timeline-date-trigger";
      trigger.tabIndex = 0;
      trigger.setAttribute("role", "button");
      trigger.setAttribute("aria-label", `Open First Teaching Timeline for ${match.text}`);
      frag.appendChild(trigger);

      cursor = match.end;
      eventIndex += 1;
    });

    if (cursor === 0) return;
    if (cursor < text.length) {
      frag.appendChild(document.createTextNode(text.slice(cursor)));
    }

    textNode.parentNode?.replaceChild(frag, textNode);
  });
}
