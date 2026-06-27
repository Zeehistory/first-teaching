import { useMemo, useRef, type MouseEvent as ReactMouseEvent } from "react";
import { Pause, Play } from "lucide-react";
import type { SectionAudioController } from "@/hooks/useSectionAudioController";
import { formatDuration } from "@/lib/time";

interface SectionAudioPlayerProps {
  sectionTitle: string;
  chapterTitle: string;
  controller: SectionAudioController;
}

export default function SectionAudioPlayer({
  sectionTitle,
  chapterTitle,
  controller,
}: SectionAudioPlayerProps) {
  const progressBarRef = useRef<HTMLDivElement | null>(null);

  const progressPercent = useMemo(() => {
    if (controller.duration === 0) return 0;
    return Math.min(100, Math.max(0, (controller.elapsed / controller.duration) * 100));
  }, [controller.elapsed, controller.duration]);

  const handleProgressClick = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const ratio = (event.clientX - rect.left) / rect.width;
    const clamped = Math.min(1, Math.max(0, ratio));
    controller.seekTo(Math.round(clamped * controller.duration));
  };

  return (
    <div className="flex items-center gap-5 py-1" data-tour="section-audio">
      <button
        type="button"
        onClick={controller.togglePlay}
        className="group relative inline-flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full text-primary transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        aria-label={controller.isPlaying ? "Pause narration" : "Play narration"}
      >
        <span
          className="pointer-events-none absolute inset-0 rounded-full border border-[hsl(var(--codex-rule))] transition-colors duration-300 group-hover:border-[hsl(var(--primary)/0.6)]"
          aria-hidden="true"
        />
        {controller.isPlaying ? (
          <Pause className="h-4 w-4" />
        ) : (
          <Play className="h-4 w-4 translate-x-[1px]" />
        )}
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <span className="font-serif text-sm italic text-[hsl(var(--codex-ink-soft))]">
            Narrated by Dr. Umar Faruq Abd-Allah
          </span>
          <span className="flex-shrink-0 font-heading text-base tabular-nums text-[hsl(var(--codex-ink-soft))]">
            {formatDuration(controller.elapsed)}
            <span className="px-1 text-[hsl(var(--codex-ink-soft)/0.5)]">·</span>
            {formatDuration(controller.duration)}
          </span>
        </div>

        {/* Scrubber — a hairline track with a slender caret marker */}
        <div
          ref={progressBarRef}
          className="group relative mt-2.5 h-3 w-full cursor-pointer"
          onClick={handleProgressClick}
          aria-label="Scrub narration"
        >
          <span className="absolute top-1/2 left-0 h-px w-full -translate-y-1/2 bg-[hsl(var(--codex-rule))]" />
          <span
            className="absolute top-1/2 left-0 h-px -translate-y-1/2 bg-[hsl(var(--gilt))] transition-[width] duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
          <span
            className="absolute top-1/2 h-3 w-px -translate-x-1/2 -translate-y-1/2 bg-[hsl(var(--gilt))] transition-opacity duration-200"
            style={{ left: `${progressPercent}%` }}
            aria-hidden="true"
          />
        </div>
      </div>
    </div>
  );
}
