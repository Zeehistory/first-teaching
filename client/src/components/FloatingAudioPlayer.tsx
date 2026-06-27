import { useEffect, useMemo, useState } from "react";
import { Pause, Play, RotateCcw, RotateCw, X } from "lucide-react";
import { formatDuration } from "@/lib/time";
import type { SectionAudioController } from "@/hooks/useSectionAudioController";
import { cn } from "@/lib/utils";

interface FloatingAudioPlayerProps {
  visible: boolean;
  controller: SectionAudioController;
  chapterTitle: string;
  sectionTitle: string;
  anchorRect: DOMRect | null;
  onClose: () => void;
}

export default function FloatingAudioPlayer({
  visible,
  controller,
  chapterTitle,
  sectionTitle,
  anchorRect,
  onClose,
}: FloatingAudioPlayerProps) {
  const [isRendered, setIsRendered] = useState(visible);
  const [animState, setAnimState] = useState<"enter" | "exit">("enter");

  useEffect(() => {
    if (visible) {
      setIsRendered(true);
      requestAnimationFrame(() => setAnimState("enter"));
      return;
    }
    setAnimState("exit");
    const timeout = window.setTimeout(() => setIsRendered(false), 220);
    return () => window.clearTimeout(timeout);
  }, [visible]);

  const style = useMemo(() => {
    if (!anchorRect || typeof window === "undefined") return null;
    const maxWidth = Math.min(640, anchorRect.width);
    const width = Math.max(320, Math.min(maxWidth, anchorRect.width));
    const left = anchorRect.left + anchorRect.width / 2 - width / 2;
    const clampedLeft = Math.max(16, Math.min(left, window.innerWidth - width - 16));
    return { width, left: clampedLeft };
  }, [anchorRect]);

  if (!isRendered || !style) return null;

  const progress =
    controller.duration === 0 ? 0 : Math.min(100, Math.max(0, (controller.elapsed / controller.duration) * 100));

  return (
    <div
      className="pointer-events-none fixed bottom-6 z-40 flex justify-center"
      style={{ left: style.left, width: style.width }}
    >
      <div
        className={cn(
          "pointer-events-auto w-full rounded-2xl border border-[hsl(var(--codex-rule))] bg-[hsl(var(--codex-vellum))] px-6 py-4 shadow-[0_24px_50px_-24px_rgba(40,30,20,0.5)]",
          animState === "enter"
            ? "animate-in fade-in slide-in-from-bottom-4 duration-300 ease-out"
            : "animate-out fade-out slide-out-to-bottom-2 duration-200 ease-in"
        )}
        data-floating-audio
        aria-live="polite"
      >
        <div className="flex items-center gap-4">
          <button
            type="button"
            aria-label="Rewind 10 seconds"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[hsl(var(--codex-ink-soft))] transition hover:text-primary"
            onClick={() => controller.seekBy(-10)}
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label={controller.isPlaying ? "Pause audio companion" : "Resume audio companion"}
            className="group relative inline-flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full text-primary transition"
            onClick={controller.togglePlay}
          >
            <span
              className="pointer-events-none absolute inset-0 rounded-full border border-[hsl(var(--gilt)/0.6)] transition-transform duration-300 group-hover:scale-105"
              aria-hidden="true"
            />
            {controller.isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 translate-x-[1px]" />}
          </button>
          <button
            type="button"
            aria-label="Forward 10 seconds"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[hsl(var(--codex-ink-soft))] transition hover:text-primary"
            onClick={() => controller.seekBy(10)}
          >
            <RotateCw className="h-4 w-4" />
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-3">
              <p className="font-heading text-base text-foreground line-clamp-1">{sectionTitle}</p>
              <span className="flex-shrink-0 font-heading text-sm tabular-nums text-[hsl(var(--codex-ink-soft))]">
                {formatDuration(controller.elapsed)}
                <span className="px-1 text-[hsl(var(--gilt))]">·</span>
                {formatDuration(controller.duration)}
              </span>
            </div>
            <div className="relative mt-2 h-3">
              <span className="absolute top-1/2 left-0 h-px w-full -translate-y-1/2 bg-[hsl(var(--codex-rule))]" />
              <span
                className="absolute top-1/2 left-0 h-px -translate-y-1/2 bg-[hsl(var(--gilt))] transition-[width] duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
              <span
                className="absolute top-1/2 h-3 w-px -translate-x-1/2 -translate-y-1/2 bg-[hsl(var(--gilt))]"
                style={{ left: `${progress}%` }}
                aria-hidden="true"
              />
            </div>
          </div>

          <button
            type="button"
            aria-label="Hide floating audio player"
            className="-mr-1 inline-flex h-8 w-8 flex-shrink-0 items-center justify-center self-start rounded-full text-[hsl(var(--codex-ink-soft))] transition hover:text-foreground"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
