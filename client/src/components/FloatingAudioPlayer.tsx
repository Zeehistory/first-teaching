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
  const remaining = Math.max(controller.duration - controller.elapsed, 0);

  return (
    <div
      className="pointer-events-none fixed bottom-6 z-40 flex justify-center"
      style={{ left: style.left, width: style.width }}
    >
      <div
        className={cn(
          "pointer-events-auto w-full rounded-[28px] border border-primary/25 bg-gradient-to-br from-white via-primary/5 to-primary/15 px-6 py-5 shadow-[0_35px_55px_rgba(6,70,70,0.18)]",
          "backdrop-blur supports-[backdrop-filter]:backdrop-blur-lg",
          "ring-1 ring-primary/10",
          animState === "enter"
            ? "animate-in fade-in slide-in-from-bottom-4 duration-300 ease-out"
            : "animate-out fade-out slide-out-to-bottom-2 duration-200 ease-in"
        )}
        data-floating-audio
        aria-live="polite"
      >
        <div className="flex items-center justify-between text-[11px] font-mono tracking-widest text-primary/70">
          <span>{formatDuration(controller.elapsed)}</span>
          <span>-{formatDuration(remaining)}</span>
        </div>

        <div className="relative mt-3 h-2 w-full overflow-hidden rounded-full bg-primary/15">
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-primary/70 transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
          <span
            className="absolute top-1/2 h-3 w-3 -translate-y-1/2 translate-x-1/2 rounded-full border-2 border-white bg-primary shadow-md transition-all duration-300"
            style={{ left: `${progress}%` }}
            aria-hidden="true"
          />
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.45em] text-primary/60 line-clamp-1">
              {chapterTitle}
            </p>
            <p className="text-sm font-heading text-foreground line-clamp-1">{sectionTitle}</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Hide floating audio player"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/80 text-muted-foreground transition hover:bg-white hover:text-foreground"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Rewind 10 seconds"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-primary transition hover:shadow-md"
              onClick={() => controller.seekBy(-10)}
            >
              <RotateCcw className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label={controller.isPlaying ? "Pause audio companion" : "Resume audio companion"}
              className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg ring-2 ring-primary/60 transition hover:brightness-105"
              onClick={controller.togglePlay}
            >
              {controller.isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 translate-x-[1px]" />}
            </button>
            <button
              type="button"
              aria-label="Forward 10 seconds"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-primary transition hover:shadow-md"
              onClick={() => controller.seekBy(10)}
            >
              <RotateCw className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
