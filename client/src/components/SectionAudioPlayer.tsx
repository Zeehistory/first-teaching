import { useMemo, useRef, type MouseEvent as ReactMouseEvent } from "react";
import { Headphones, Pause, Play } from "lucide-react";
import { cn } from "@/lib/utils";
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
    <div
      className="relative overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-br from-primary/15 via-primary/8 to-primary/18 p-5 shadow-sm backdrop-blur-sm"
      data-tour="section-audio"
    >
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <div className="absolute -bottom-16 -right-14 h-48 w-48 rounded-full bg-primary/25 blur-3xl" />
        <div className="absolute -top-12 -left-12 h-36 w-36 rounded-full bg-[hsl(185,70%,88%)] blur-3xl" />
      </div>

      <div className="relative flex items-center gap-5">
        <button
          type="button"
          onClick={controller.togglePlay}
          className="inline-flex h-14 w-14 items-center justify-center rounded-full border border-border/70 bg-background/90 text-primary shadow-md transition hover:border-primary/40 hover:text-primary"
          aria-label={controller.isPlaying ? "Pause narration preview" : "Play narration preview"}
        >
          {controller.isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 translate-x-[2px]" />}
        </button>

        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.35em] text-muted-foreground/70">
            <Headphones className="h-3.5 w-3.5" />
            <span>Audio Companion</span>
          </div>
          <div className="font-heading text-lg sm:text-xl text-foreground/90 line-clamp-1">
            {chapterTitle}
          </div>
          <p className="text-sm text-muted-foreground/80 line-clamp-2">
            {sectionTitle}
          </p>
        </div>

        <div className="flex flex-col items-end text-xs font-mono text-muted-foreground/80">
          <span>{formatDuration(controller.elapsed)}</span>
          <span className="opacity-70">/{formatDuration(controller.duration)}</span>
        </div>
      </div>

      <div
        ref={progressBarRef}
        className="relative mt-5 h-2 w-full cursor-pointer overflow-hidden rounded-full bg-foreground/10"
        onClick={handleProgressClick}
        aria-label="Scrub audio preview"
      >
        <div
          className={cn(
            "absolute left-0 top-0 h-full rounded-full bg-primary/80 transition-all duration-300 ease-out",
            controller.isPlaying ? "shadow-[0_0_12px_rgba(45,140,140,0.35)]" : "shadow-none"
          )}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="relative mt-3 flex text-[11px] font-semibold uppercase tracking-[0.3em] text-muted-foreground/60">
        <span>Narrated By: Dr. Umar Faruq Abd-Allah</span>
      </div>
    </div>
  );
}
