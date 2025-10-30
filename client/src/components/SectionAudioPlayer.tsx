import { useEffect, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent } from "react";
import { Headphones, Pause, Play } from "lucide-react";
import { cn } from "@/lib/utils";

interface SectionAudioPlayerProps {
  sectionId: string;
  sectionTitle: string;
  chapterTitle: string;
  estimatedDuration: number; // seconds
}

function formatTime(totalSeconds: number) {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const mins = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${remainder.toString().padStart(2, "0")}`;
}

export default function SectionAudioPlayer({
  sectionId,
  sectionTitle,
  chapterTitle,
  estimatedDuration,
}: SectionAudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<number | null>(null);
  const progressBarRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setElapsed(0);
    setIsPlaying(false);
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [sectionId, estimatedDuration]);

  useEffect(() => {
    if (!isPlaying) {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = window.setInterval(() => {
      setElapsed((prev) => {
        const next = Math.min(prev + 1, estimatedDuration);
        if (next >= estimatedDuration) {
          window.clearInterval(intervalRef.current ?? 0);
          intervalRef.current = null;
          setIsPlaying(false);
          return 0;
        }
        return next;
      });
    }, 1000);

    return () => {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isPlaying, estimatedDuration]);

  const progressPercent = useMemo(() => {
    if (estimatedDuration === 0) return 0;
    return Math.min(100, Math.max(0, (elapsed / estimatedDuration) * 100));
  }, [elapsed, estimatedDuration]);

  const handleProgressClick = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const ratio = (event.clientX - rect.left) / rect.width;
    const clamped = Math.min(1, Math.max(0, ratio));
    setElapsed(Math.round(clamped * estimatedDuration));
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
          onClick={() => setIsPlaying((prev) => !prev)}
          className="inline-flex h-14 w-14 items-center justify-center rounded-full border border-border/70 bg-background/90 text-primary shadow-md transition hover:border-primary/40 hover:text-primary"
          aria-label={isPlaying ? "Pause narration preview" : "Play narration preview"}
        >
          {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 translate-x-[2px]" />}
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
          <span>{formatTime(elapsed)}</span>
          <span className="opacity-70">/{formatTime(estimatedDuration)}</span>
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
            isPlaying ? "shadow-[0_0_12px_rgba(45,140,140,0.35)]" : "shadow-none"
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
