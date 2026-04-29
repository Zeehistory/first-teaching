import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Image as ImageIcon, Minus, Plus, RotateCcw, X } from "lucide-react";
import type { TimelineEvent } from "@shared/schema";
import type { PointerEvent as ReactPointerEvent, WheelEvent as ReactWheelEvent } from "react";

interface TimelineOverlayProps {
  isOpen: boolean;
  activeEvent: TimelineEvent | null;
  events: TimelineEvent[];
  onClose: () => void;
  onJumpToEvent: (event: TimelineEvent) => void;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const panelVariants = {
  hidden: { opacity: 0, y: 14, scale: 0.99 },
  visible: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: 10, scale: 0.99 },
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const formatYear = (year: number) => {
  if (!Number.isFinite(year)) return "";
  if (year < 0) return `${Math.abs(Math.round(year))} BCE`;
  return `${Math.round(year)}`;
};

const getTickStep = (rangeYears: number, targetTicks = 9) => {
  const raw = Math.max(1, Math.round(rangeYears / targetTicks));
  const pow10 = Math.pow(10, Math.floor(Math.log10(raw)));
  const scaled = raw / pow10;
  const nice = scaled <= 1 ? 1 : scaled <= 2 ? 2 : scaled <= 5 ? 5 : 10;
  return nice * pow10;
};

type Bucket = {
  bucketYear: number;
  labelYear: number;
  events: TimelineEvent[];
};

const floorToBin = (value: number, bin: number) => {
  // Keep negative years stable when binning.
  const scaled = value / bin;
  const floored = scaled >= 0 ? Math.floor(scaled) : Math.ceil(scaled - 1e-9);
  return floored * bin;
};

export default function TimelineOverlay({
  isOpen,
  activeEvent,
  events,
  onClose,
  onJumpToEvent,
}: TimelineOverlayProps) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const [viewportWidth, setViewportWidth] = useState(0);
  const [scale, setScale] = useState(1);
  const [translateX, setTranslateX] = useState(0);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const dragRef = useRef<{ isDragging: boolean; startX: number; startTranslate: number }>({
    isDragging: false,
    startX: 0,
    startTranslate: 0,
  });

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };

    document.body.classList.add("timeline-open");
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.classList.remove("timeline-open");
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  useLayoutEffect(() => {
    const node = viewportRef.current;
    if (!node) return;

    let raf = 0;

    const measure = () => {
      const width = node.getBoundingClientRect().width;
      if (width > 0) {
        setViewportWidth(width);
      } else {
        raf = window.requestAnimationFrame(measure);
      }
    };

    measure();

    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(() => {
        const width = node.getBoundingClientRect().width;
        if (width > 0) setViewportWidth(width);
      });
      observer.observe(node);
      return () => {
        window.cancelAnimationFrame(raf);
        observer.disconnect();
      };
    }

    return () => window.cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    if (!activeEvent) return;
    setSelectedEventId((prev) => prev ?? activeEvent.id);
  }, [isOpen, activeEvent]);

  const selectedEvent = useMemo(() => {
    if (selectedEventId) {
      return events.find((event) => event.id === selectedEventId) ?? activeEvent;
    }
    return activeEvent;
  }, [activeEvent, events, selectedEventId]);

  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => a.sortKey - b.sortKey || a.readingOrder - b.readingOrder);
  }, [events]);

  const rawYears = useMemo(() => {
    const list: number[] = [];
    sortedEvents.forEach((event) => {
      const year = Math.round(event.sortKey);
      if (!Number.isFinite(year)) return;
      if (Math.abs(year) > 20000) return; // safety: ignore pathological values
      list.push(year);
    });
    return list;
  }, [sortedEvents]);

  const minYear = rawYears.length ? Math.min(...rawYears) : 0;
  const maxYear = rawYears.length ? Math.max(...rawYears) : 1;
  const rangeYears = Math.max(1, maxYear - minYear);

  const PX_PER_YEAR = 6;
  const worldWidth = rangeYears * PX_PER_YEAR;
  const minScale = viewportWidth ? Math.max(0.12, Math.min(1, viewportWidth / worldWidth)) : 1;
  const maxScale = Math.max(2.5, minScale * 18);

  const pxPerYear = PX_PER_YEAR * scale;
  const visibleYears = viewportWidth ? viewportWidth / Math.max(0.0001, pxPerYear) : rangeYears;
  const visibleStartYear = minYear + (-translateX / Math.max(0.0001, pxPerYear));
  const visibleEndYear = visibleStartYear + visibleYears;

  const binSize = useMemo(() => {
    if (pxPerYear >= 3.2) return 1;
    if (pxPerYear >= 1.6) return 2;
    if (pxPerYear >= 1.2) return 5;
    if (pxPerYear >= 0.8) return 10;
    if (pxPerYear >= 0.5) return 25;
    if (pxPerYear >= 0.3) return 50;
    return 100;
  }, [pxPerYear]);

  const buckets = useMemo(() => {
    const map = new Map<number, TimelineEvent[]>();
    sortedEvents.forEach((event) => {
      const year = Math.round(event.sortKey);
      if (!Number.isFinite(year)) return;
      if (Math.abs(year) > 20000) return;
      const bucketYear = floorToBin(year, binSize);
      const list = map.get(bucketYear);
      if (list) list.push(event);
      else map.set(bucketYear, [event]);
    });

    const result: Bucket[] = [];
    map.forEach((list, bucketYear) => {
      const eventsSorted = list.sort((a, b) => a.readingOrder - b.readingOrder);
      const labelYear = Math.round(eventsSorted[0]?.sortKey ?? bucketYear);
      result.push({ bucketYear, labelYear, events: eventsSorted });
    });
    return result.sort((a, b) => a.bucketYear - b.bucketYear);
  }, [sortedEvents, binSize]);

  const clampTranslate = (nextTranslate: number, nextScale: number) => {
    if (!viewportWidth) return nextTranslate;
    const contentWidth = worldWidth * nextScale;
    if (contentWidth <= viewportWidth) {
      return (viewportWidth - contentWidth) / 2;
    }
    const minTranslate = viewportWidth - contentWidth;
    return clamp(nextTranslate, minTranslate, 0);
  };

  const setZoomState = (nextScale: number, nextTranslate: number) => {
    const clampedScale = clamp(nextScale, minScale, maxScale);
    const clampedTranslate = clampTranslate(nextTranslate, clampedScale);
    setScale(clampedScale);
    setTranslateX(clampedTranslate);
  };

  const fitToView = () => {
    if (!viewportWidth) return;
    setZoomState(minScale, clampTranslate(translateX, minScale));
  };

  useEffect(() => {
    if (!isOpen) return;
    if (!viewportWidth) return;
    // Default to "fully visible": fit entire range inside the viewport.
    setZoomState(minScale, clampTranslate(translateX, minScale));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, viewportWidth, minScale]);

  const getWorldX = (year: number) => (year - minYear) * PX_PER_YEAR;
  const toScreenX = (worldXValue: number) => worldXValue * scale + translateX;

  const majorTickStep = getTickStep(visibleYears, 6);
  const minorTickStep =
    majorTickStep >= 100 ? majorTickStep / 5 : majorTickStep >= 20 ? majorTickStep / 4 : majorTickStep;

  const ticks = useMemo(() => {
    if (!viewportWidth) return [];
    const start = Math.floor(visibleStartYear / majorTickStep) * majorTickStep;
    const result: Array<{ year: number; x: number }> = [];
    for (let y = start; y <= visibleEndYear + majorTickStep; y += majorTickStep) {
      const screenX = toScreenX(getWorldX(y));
      if (screenX < -80 || screenX > viewportWidth + 80) continue;
      result.push({ year: y, x: screenX });
    }
    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewportWidth, scale, translateX, minYear, majorTickStep, visibleStartYear, visibleEndYear]);

  const minorTicks = useMemo(() => {
    if (!viewportWidth) return [];
    if (minorTickStep === majorTickStep) return [];
    const start = Math.floor(visibleStartYear / minorTickStep) * minorTickStep;
    const result: Array<{ year: number; x: number }> = [];
    for (let y = start; y <= visibleEndYear + minorTickStep; y += minorTickStep) {
      if (y % majorTickStep === 0) continue;
      const screenX = toScreenX(getWorldX(y));
      if (screenX < -80 || screenX > viewportWidth + 80) continue;
      result.push({ year: y, x: screenX });
    }
    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    viewportWidth,
    scale,
    translateX,
    minYear,
    minorTickStep,
    majorTickStep,
    visibleStartYear,
    visibleEndYear,
  ]);

  const layout = useMemo(() => {
    const lanes: number[] = [];
    const laneCount = 6;
    for (let i = 0; i < laneCount; i += 1) lanes.push(Number.NEGATIVE_INFINITY);
    const minGapWorld = 42 / Math.max(0.2, scale);
    const laneOffset = (laneIndex: number) => {
      const band = Math.floor(laneIndex / 2);
      const sign = laneIndex % 2 === 0 ? -1 : 1;
      return sign * (18 + band * 18);
    };

    const points = buckets.map((bucket, index) => {
      const worldXValue = getWorldX(bucket.bucketYear);
      const candidates = lanes
        .map((lastX, laneIndex) => ({
          laneIndex,
          lastX,
          gap: worldXValue - lastX,
          absOffset: Math.abs(laneOffset(laneIndex)),
        }))
        .sort((a, b) => {
          const aOk = a.gap >= minGapWorld ? 0 : 1;
          const bOk = b.gap >= minGapWorld ? 0 : 1;
          if (aOk !== bOk) return aOk - bOk;
          if (a.absOffset !== b.absOffset) return a.absOffset - b.absOffset;
          return a.lastX - b.lastX;
        });
      const laneIndex = candidates[0]?.laneIndex ?? (index % laneCount);
      lanes[laneIndex] = worldXValue;

      const yOffset = laneOffset(laneIndex);
      return { bucket, x: toScreenX(worldXValue), yOffset };
    });

    if (!viewportWidth) return points.slice(0, 120);
    return points.filter((pt) => pt.x > -120 && pt.x < viewportWidth + 120);
  }, [buckets, scale, translateX, viewportWidth, minYear]);

  const braces = useMemo(() => {
    const pattern = /(\d{3,4})\s*[–-]\s*(\d{2,4})/;
    const items: Array<{ id: string; label: string; x1: number; x2: number }> = [];
    const seen = new Set<string>();

    sortedEvents.forEach((event) => {
      const match = event.displayDate.match(pattern);
      if (!match) return;

      const startYear = Number(match[1]);
      const endRaw = match[2];
      const endYear =
        endRaw.length === 2 ? Number(`${Math.floor(startYear / 100)}${endRaw}`) : Number(endRaw);
      if (!Number.isFinite(startYear) || !Number.isFinite(endYear)) return;
      if (endYear <= startYear) return;

      const x1 = toScreenX(getWorldX(startYear));
      const x2 = toScreenX(getWorldX(endYear));
      if (viewportWidth && (x2 < -120 || x1 > viewportWidth + 120)) return;

      const key = `${startYear}:${endYear}`;
      if (seen.has(key)) return;
      seen.add(key);

      items.push({
        id: `${event.id}:brace`,
        label: `{ ${event.displayDate.replace("-", "–")} }`,
        x1,
        x2,
      });
    });

    return items
      .sort((a, b) => (b.x2 - b.x1) - (a.x2 - a.x1))
      .slice(0, 8);
  }, [sortedEvents, scale, translateX, viewportWidth]);

  const handlePointerDown = (event: ReactPointerEvent) => {
    if (!viewportRef.current) return;
    dragRef.current = {
      isDragging: true,
      startX: event.clientX,
      startTranslate: translateX,
    };
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: ReactPointerEvent) => {
    if (!dragRef.current.isDragging) return;
    const delta = event.clientX - dragRef.current.startX;
    setZoomState(scale, dragRef.current.startTranslate + delta);
  };

  const handlePointerUp = (event: ReactPointerEvent) => {
    dragRef.current.isDragging = false;
    (event.currentTarget as HTMLElement).releasePointerCapture(event.pointerId);
  };

  const handleWheel = (event: ReactWheelEvent) => {
    if (!viewportRef.current) return;
    // Default wheel pans horizontally; ctrl/meta+wheel zooms.
    if (!event.ctrlKey && !event.metaKey) {
      event.preventDefault();
      const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
      setZoomState(scale, translateX - delta);
      return;
    }

    event.preventDefault();
    const rect = viewportRef.current.getBoundingClientRect();
    const cursorX = event.clientX - rect.left;
    const worldXAtCursor = (cursorX - translateX) / scale;
    const zoomFactor = Math.exp(-event.deltaY * 0.0022);
    const nextScale = clamp(scale * zoomFactor, minScale, maxScale);
    const nextTranslate = cursorX - worldXAtCursor * nextScale;
    setZoomState(nextScale, nextTranslate);
  };

  const zoomBy = (direction: 1 | -1) => {
    if (!viewportRef.current) return;
    const centerX = viewportWidth ? viewportWidth / 2 : 0;
    const worldAtCenter = (centerX - translateX) / scale;
    const zoomFactor = direction === 1 ? 1.18 : 1 / 1.18;
    const nextScale = clamp(scale * zoomFactor, minScale, maxScale);
    const nextTranslate = centerX - worldAtCenter * nextScale;
    setZoomState(nextScale, nextTranslate);
  };

  const locateSelected = () => {
    if (!selectedEvent || !viewportWidth) return;
    const year = Math.round(selectedEvent.sortKey);
    const worldXValue = getWorldX(floorToBin(year, binSize));
    const targetX = viewportWidth / 2 - worldXValue * scale;
    setZoomState(scale, targetX);
  };

  const showNodeLabels = binSize <= 10;

  return (
    <AnimatePresence>
      {isOpen && activeEvent && (
        <motion.div
          className="timeline-overlay fixed inset-0 z-[80] flex items-stretch justify-center px-3 py-3 md:px-6 md:py-6"
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={containerVariants}
          transition={{ duration: 0.22, ease: "easeOut" }}
        >
          <button
            type="button"
            className="absolute inset-0"
            aria-label="Close timeline"
            onClick={onClose}
          />

          <motion.div
            className="timeline-shell relative flex h-full w-full max-w-7xl flex-col overflow-hidden rounded-[1.5rem] border border-[hsl(32,18%,78%)] bg-[hsl(37,30%,96%)] shadow-[0_22px_70px_rgba(24,18,8,0.22)]"
            variants={panelVariants}
            transition={{ duration: 0.26, ease: "easeOut" }}
          >
            <header className="timeline-header flex items-center justify-between border-b border-[hsl(32,18%,84%)] px-4 py-3 md:px-6">
              <div className="flex items-center gap-3">
                <div className="font-heading text-base tracking-wide text-[hsl(24,28%,18%)] md:text-lg">
                  First Teaching Timeline
                </div>
                <div className="hidden text-xs text-[hsl(24,18%,40%)] md:block">
                  Drag or scroll to pan · Ctrl/⌘ + scroll to zoom · Double-click to focus
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="timeline-control"
                  onClick={() => zoomBy(-1)}
                  aria-label="Zoom out"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <input
                  type="range"
                  min={minScale}
                  max={maxScale}
                  step={0.01}
                  value={scale}
                  onChange={(e) => {
                    const next = Number(e.target.value);
                    const centerX = viewportWidth ? viewportWidth / 2 : 0;
                    const worldAtCenter = (centerX - translateX) / scale;
                    setZoomState(next, centerX - worldAtCenter * next);
                  }}
                  className="timeline-zoom"
                  aria-label="Timeline zoom"
                />
                <button
                  type="button"
                  className="timeline-control"
                  onClick={() => zoomBy(1)}
                  aria-label="Zoom in"
                >
                  <Plus className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  className="timeline-control"
                  onClick={fitToView}
                  aria-label="Fit timeline"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  className="timeline-control"
                  onClick={onClose}
                  aria-label="Close timeline"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </header>

            <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[1fr_22rem]">
              <div className="min-h-0 border-b border-[hsl(32,18%,86%)] lg:border-b-0 lg:border-r">
                <div
                  ref={viewportRef}
                  className="timeline-viewport relative h-full min-h-[22rem] w-full select-none bg-[linear-gradient(180deg,hsla(36,70%,96%,1),hsla(36,38%,94%,1))]"
                  data-node-labels={showNodeLabels ? "on" : "off"}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerCancel={handlePointerUp}
                  onWheel={handleWheel}
                  role="application"
                  aria-label="Timeline viewport"
                >
                  <div className="absolute inset-0">
                    <div className="timeline-axis absolute left-0 right-0 top-1/2 h-px bg-[hsla(28,24%,52%,0.34)]" />
                    {ticks.map((tick) => (
                      <div
                        key={tick.year}
                        className="absolute inset-y-0"
                        style={{ left: `${tick.x}px` }}
                      >
                        <div className="timeline-gridline -translate-x-1/2">
                          <div className="timeline-gridline-bar" />
                          <div className="timeline-gridline-label">{formatYear(tick.year)}</div>
                        </div>
                      </div>
                    ))}

                    {minorTicks.map((tick) => (
                      <div
                        key={tick.year}
                        className="absolute inset-y-0"
                        style={{ left: `${tick.x}px` }}
                        aria-hidden="true"
                      >
                        <div className="timeline-gridline minor -translate-x-1/2">
                          <div className="timeline-gridline-bar" />
                        </div>
                      </div>
                    ))}

                    {braces.map((brace, index) => {
                      const width = Math.max(0, brace.x2 - brace.x1);
                      if (width < 18) return null;
                      const top = `calc(50% - ${96 + (index % 3) * 18}px)`;
                      return (
                        <div
                          key={brace.id}
                          className="timeline-brace"
                          style={{ left: `${brace.x1}px`, width: `${width}px`, top }}
                          aria-hidden="true"
                        >
                          <div className="timeline-brace-label">{brace.label}</div>
                        </div>
                      );
                    })}

                    {layout.map((pt) => {
                      const firstEvent = pt.bucket.events[0];
                      const bucketCount = pt.bucket.events.length;
                      const isSelected =
                        !!selectedEvent &&
                        floorToBin(Math.round(selectedEvent.sortKey), binSize) === pt.bucket.bucketYear;
                      const top = `calc(50% + ${pt.yOffset}px)`;
                      const stemTop = pt.yOffset < 0 ? `calc(50% + ${pt.yOffset}px)` : "50%";
                      const stemHeight = Math.abs(pt.yOffset);
                      return (
                        <div key={pt.bucket.bucketYear}>
                          {stemHeight > 0 && (
                            <div
                              className="timeline-stem"
                              style={{ left: `${pt.x}px`, top: stemTop, height: `${stemHeight}px` }}
                              aria-hidden="true"
                            />
                          )}
                          <button
                            type="button"
                            className={`timeline-node ${isSelected ? "is-selected" : ""}`}
                            style={{ left: `${pt.x}px`, top }}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (
                                selectedEvent &&
                                floorToBin(Math.round(selectedEvent.sortKey), binSize) ===
                                  pt.bucket.bucketYear
                              ) {
                                return;
                              }
                              setSelectedEventId(firstEvent?.id ?? null);
                            }}
                            onDoubleClick={(e) => {
                              e.stopPropagation();
                              const nextScale = clamp(scale * 1.45, minScale, maxScale);
                              const centerX = viewportWidth ? viewportWidth / 2 : 0;
                              const worldXValue = getWorldX(pt.bucket.bucketYear);
                              setSelectedEventId(firstEvent?.id ?? null);
                              setZoomState(nextScale, centerX - worldXValue * nextScale);
                            }}
                            title={
                              bucketCount === 1
                                ? `${firstEvent.displayDate} — ${firstEvent.title}`
                                : `${formatYear(pt.bucket.labelYear)} — ${bucketCount} entries`
                            }
                            aria-label={`Timeline entry ${formatYear(pt.bucket.labelYear)}`}
                          >
                            <span className="timeline-node-dot" />
                            <span className="timeline-node-label">
                              {formatYear(pt.bucket.labelYear)}
                              {bucketCount > 1 ? ` · ${bucketCount}` : ""}
                            </span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-[hsl(32,18%,86%)] px-4 py-2 text-xs text-[hsl(24,18%,38%)]">
                  <div>
                    {events.length} {events.length === 1 ? "entry" : "entries"} · {formatYear(minYear)} to{" "}
                    {formatYear(maxYear)}
                  </div>
                  <button
                    type="button"
                    className="timeline-locate"
                    onClick={locateSelected}
                    disabled={!selectedEvent}
                  >
                    Locate
                  </button>
                </div>
              </div>

              <aside className="minimal-scrollbar min-h-0 overflow-y-auto bg-[hsla(0,0%,100%,0.55)] p-4 md:p-5">
                {selectedEvent ? (
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-[hsl(32,18%,82%)] bg-[hsla(0,0%,100%,0.6)] p-4">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[hsl(24,18%,44%)]">
                        {selectedEvent.displayDate}
                      </div>
                      <div className="mt-2 font-heading text-2xl leading-tight text-[hsl(26,30%,16%)]">
                        {selectedEvent.title}
                      </div>
                      <div className="mt-3 text-sm leading-relaxed text-[hsl(24,18%,32%)]">
                        {selectedEvent.annotation}
                      </div>
                      <div className="mt-4 text-xs uppercase tracking-[0.22em] text-[hsl(24,18%,44%)]">
                        Volume {selectedEvent.volumeNumber} · {selectedEvent.chapterTitle}
                      </div>
                      <button
                        type="button"
                        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full border border-[hsl(32,22%,72%)] bg-[hsla(36,85%,92%,0.9)] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-[hsl(24,30%,20%)] transition hover:bg-[hsla(36,90%,90%,0.95)]"
                        onClick={() => onJumpToEvent(selectedEvent)}
                      >
                        Jump To Source <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>

                    {(() => {
                      const year = Math.round(selectedEvent.sortKey);
                      const bucketYear = floorToBin(year, binSize);
                      const bucket = buckets.find((item) => item.bucketYear === bucketYear);
                      if (!bucket || bucket.events.length <= 1) return null;
                      return (
                        <div className="rounded-2xl border border-[hsl(32,18%,82%)] bg-[hsla(0,0%,100%,0.6)] p-4">
                          <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[hsl(24,18%,44%)]">
                            {formatYear(bucket.labelYear)} · {bucket.events.length} entries
                          </div>
                          <div className="mt-3 space-y-2">
                            {bucket.events.slice(0, 12).map((event) => (
                              <button
                                key={event.id}
                                type="button"
                                className={`w-full rounded-xl border px-3 py-2 text-left text-xs leading-snug transition ${
                                  event.id === selectedEvent.id
                                    ? "border-[hsla(28,44%,48%,0.55)] bg-[hsla(36,85%,92%,0.65)]"
                                    : "border-[hsla(32,18%,82%,0.85)] bg-[hsla(0,0%,100%,0.45)] hover:bg-[hsla(0,0%,100%,0.62)]"
                                }`}
                                onClick={() => setSelectedEventId(event.id)}
                              >
                                <div className="font-semibold text-[hsl(24,20%,22%)]">
                                  {event.displayDate}
                                </div>
                                <div className="mt-1 text-[hsl(24,16%,36%)]">{event.title}</div>
                              </button>
                            ))}
                            {bucket.events.length > 12 && (
                              <div className="pt-1 text-[11px] uppercase tracking-[0.22em] text-[hsl(24,18%,44%)]">
                                + {bucket.events.length - 12} more
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })()}

                    <div className="timeline-image-placeholder h-44 rounded-2xl border border-[hsl(32,18%,82%)] bg-[linear-gradient(145deg,hsla(42,50%,97%,0.98),hsla(34,36%,91%,0.94))]">
                      <div className="flex h-full flex-col items-center justify-center gap-2 px-5 text-center text-[hsl(24,18%,40%)]">
                        <ImageIcon className="h-7 w-7" />
                        <div className="text-[10px] font-semibold uppercase tracking-[0.32em]">
                          Image Slot
                        </div>
                        <div className="font-heading text-lg text-[hsl(24,28%,22%)]">
                          {selectedEvent.imageSlot.label}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-[hsl(32,18%,82%)] bg-[hsla(0,0%,100%,0.6)] p-4 text-sm text-[hsl(24,18%,36%)]">
                    Select a point on the timeline to see details.
                  </div>
                )}
              </aside>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
