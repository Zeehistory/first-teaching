import { useEffect, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, CalendarDays, Image as ImageIcon, ScrollText, Sparkles, X } from "lucide-react";
import type { TimelineEvent } from "@shared/schema";

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
  hidden: { opacity: 0, y: 24, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: 18, scale: 0.985 },
};

export default function TimelineOverlay({
  isOpen,
  activeEvent,
  events,
  onClose,
  onJumpToEvent,
}: TimelineOverlayProps) {
  const itemCount = events.length;
  const activeIndex = useMemo(
    () => (activeEvent ? events.findIndex((event) => event.id === activeEvent.id) : -1),
    [activeEvent, events]
  );

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
            className="timeline-shell relative flex h-full w-full max-w-7xl flex-col overflow-hidden rounded-[2rem] border border-[hsl(36,24%,74%)] bg-[hsl(38,36%,96%)] shadow-[0_35px_120px_rgba(35,24,8,0.34)]"
            variants={panelVariants}
            transition={{ duration: 0.26, ease: "easeOut" }}
          >
            <header className="timeline-header border-b border-[hsl(36,24%,78%)] px-5 py-5 md:px-8 md:py-6">
              <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-2 rounded-full border border-[hsl(35,46%,72%)] bg-[hsl(35,100%,94%)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.34em] text-[hsl(22,54%,28%)]">
                    <Sparkles className="h-3.5 w-3.5" />
                    First Teaching Timeline
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-3 text-[hsl(24,20%,34%)]">
                      <CalendarDays className="h-5 w-5" />
                      <span className="text-sm font-medium">
                        {itemCount} dated {itemCount === 1 ? "entry" : "entries"} through this point
                      </span>
                    </div>
                    <h1 className="font-heading text-3xl leading-tight text-[hsl(26,34%,18%)] md:text-4xl">
                      {activeEvent.displayDate}
                    </h1>
                    <p className="max-w-3xl text-sm leading-relaxed text-[hsl(24,18%,36%)] md:text-base">
                      {activeEvent.annotation}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-start">
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-full border border-[hsl(36,24%,76%)] bg-[hsla(0,0%,100%,0.55)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-[hsl(24,22%,28%)] transition hover:border-[hsl(32,38%,62%)] hover:text-[hsl(24,32%,18%)]"
                    onClick={() => onJumpToEvent(activeEvent)}
                  >
                    <ScrollText className="h-3.5 w-3.5" />
                    Jump To Source
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[hsl(36,24%,76%)] bg-[hsla(0,0%,100%,0.55)] text-[hsl(24,22%,28%)] transition hover:border-[hsl(32,38%,62%)] hover:text-[hsl(24,32%,18%)]"
                    aria-label="Close timeline"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </header>

            <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[minmax(20rem,25rem)_1fr]">
              <aside className="timeline-active-panel border-b border-[hsl(36,22%,82%)] p-5 lg:border-b-0 lg:border-r lg:p-8">
                <div className="timeline-image-placeholder h-52 rounded-[1.75rem] border border-[hsl(35,26%,74%)] bg-[linear-gradient(145deg,hsla(44,48%,97%,0.96),hsla(35,42%,90%,0.94))] shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]">
                  <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-[hsl(25,18%,40%)]">
                    <ImageIcon className="h-8 w-8" />
                    <div className="space-y-1 px-6">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.36em]">
                        Image Archive
                      </p>
                      <p className="font-heading text-xl text-[hsl(24,28%,24%)]">
                        {activeEvent.imageSlot.label}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-[hsl(24,16%,45%)]">
                      Active Entry
                    </p>
                    <h2 className="mt-2 font-heading text-2xl text-[hsl(26,34%,18%)]">
                      {activeEvent.title}
                    </h2>
                  </div>

                  <div className="rounded-[1.5rem] border border-[hsl(36,22%,80%)] bg-[hsla(0,0%,100%,0.45)] p-4">
                    <p className="text-sm leading-relaxed text-[hsl(24,18%,34%)]">
                      {activeEvent.annotation}
                    </p>
                    <div className="mt-4 text-xs uppercase tracking-[0.28em] text-[hsl(24,16%,46%)]">
                      Volume {activeEvent.volumeNumber} · {activeEvent.chapterTitle}
                    </div>
                  </div>

                  <div className="text-sm text-[hsl(24,18%,34%)]">
                    Entry {activeIndex + 1} of {itemCount}
                  </div>
                </div>
              </aside>

              <main className="minimal-scrollbar min-h-0 overflow-y-auto px-5 py-6 md:px-8">
                <div className="relative mx-auto max-w-4xl pb-12">
                  <div className="timeline-spine absolute bottom-0 left-[1.1rem] top-3 hidden w-px bg-[linear-gradient(180deg,hsla(34,44%,66%,0),hsla(34,44%,58%,0.9)_12%,hsla(34,44%,58%,0.86)_88%,hsla(34,44%,66%,0))] sm:block" />
                  <div className="space-y-6">
                    {events.map((event, index) => {
                      const isActive = event.id === activeEvent.id;
                      return (
                        <motion.article
                          key={event.id}
                          className={`timeline-card relative grid gap-4 rounded-[1.75rem] border p-5 shadow-[0_16px_40px_rgba(63,42,14,0.08)] sm:grid-cols-[2.75rem_1fr] sm:items-start ${
                            isActive
                              ? "border-[hsl(32,54%,58%)] bg-[linear-gradient(180deg,hsla(36,100%,96%,0.98),hsla(34,72%,91%,0.96))]"
                              : "border-[hsl(36,20%,82%)] bg-[hsla(0,0%,100%,0.58)]"
                          }`}
                          initial={{ opacity: 0, y: 18 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.025, duration: 0.24 }}
                        >
                          <div className="hidden sm:flex sm:justify-center">
                            <div
                              className={`timeline-node mt-2 h-5 w-5 rounded-full border ${
                                isActive
                                  ? "border-[hsl(28,58%,42%)] bg-[hsl(33,92%,72%)] shadow-[0_0_0_8px_rgba(237,194,130,0.22)]"
                                  : "border-[hsl(34,26%,62%)] bg-[hsl(40,44%,92%)]"
                              }`}
                            />
                          </div>

                          <div className="space-y-4">
                            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                              <div>
                                <div className="text-[11px] font-semibold uppercase tracking-[0.34em] text-[hsl(24,16%,45%)]">
                                  {event.displayDate}
                                </div>
                                <h3 className="mt-2 font-heading text-2xl leading-tight text-[hsl(26,30%,18%)]">
                                  {event.title}
                                </h3>
                              </div>
                              {isActive && (
                                <div className="inline-flex self-start rounded-full border border-[hsl(31,46%,62%)] bg-[hsla(255,255,255,0.55)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.32em] text-[hsl(22,46%,30%)]">
                                  Current Focus
                                </div>
                              )}
                            </div>

                            <div className="grid gap-4 md:grid-cols-[11rem_1fr]">
                              <div className="timeline-image-placeholder min-h-[8.5rem] rounded-[1.35rem] border border-[hsl(35,24%,76%)] bg-[linear-gradient(145deg,hsla(42,50%,97%,0.98),hsla(34,36%,91%,0.94))]">
                                <div className="flex h-full flex-col items-center justify-center gap-2 px-4 text-center text-[hsl(24,18%,40%)]">
                                  <ImageIcon className="h-6 w-6" />
                                  <p className="text-[10px] font-semibold uppercase tracking-[0.34em]">
                                    Reserved Image
                                  </p>
                                </div>
                              </div>

                              <div className="space-y-4">
                                <p className="text-sm leading-relaxed text-[hsl(24,18%,34%)] md:text-[15px]">
                                  {event.annotation}
                                </p>

                                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                  <div className="text-xs uppercase tracking-[0.24em] text-[hsl(24,16%,45%)]">
                                    Volume {event.volumeNumber} · {event.chapterTitle}
                                  </div>
                                  <button
                                    type="button"
                                    className="inline-flex items-center gap-2 self-start rounded-full border border-[hsl(34,24%,74%)] bg-[hsla(255,255,255,0.52)] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-[hsl(24,24%,28%)] transition hover:border-[hsl(31,42%,58%)] hover:text-[hsl(22,42%,20%)]"
                                    onClick={() => onJumpToEvent(event)}
                                  >
                                    Jump To Source
                                    <ArrowRight className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.article>
                      );
                    })}
                  </div>
                </div>
              </main>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
