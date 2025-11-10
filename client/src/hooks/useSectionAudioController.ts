import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export interface SectionAudioController {
  isPlaying: boolean;
  elapsed: number;
  duration: number;
  togglePlay: () => void;
  play: () => void;
  pause: () => void;
  seekTo: (seconds: number) => void;
  seekBy: (delta: number) => void;
  reset: () => void;
}

interface UseSectionAudioControllerArgs {
  sectionId: string;
  duration: number;
}

export function useSectionAudioController({
  sectionId,
  duration,
}: UseSectionAudioControllerArgs): SectionAudioController {
  const safeDuration = useMemo(() => Math.max(1, Math.floor(duration || 0)), [duration]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<number | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    clearTimer();
    setElapsed(0);
    setIsPlaying(false);
  }, [sectionId, safeDuration, clearTimer]);

  useEffect(() => {
    if (!isPlaying) {
      clearTimer();
      return;
    }

    timerRef.current = window.setInterval(() => {
      setElapsed((prev) => {
        const next = Math.min(prev + 1, safeDuration);
        if (next >= safeDuration) {
          clearTimer();
          setIsPlaying(false);
          return 0;
        }
        return next;
      });
    }, 1000);

    return clearTimer;
  }, [isPlaying, safeDuration, clearTimer]);

  useEffect(() => clearTimer, [clearTimer]);

  const togglePlay = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  const play = useCallback(() => setIsPlaying(true), []);
  const pause = useCallback(() => setIsPlaying(false), []);

  const clamp = useCallback(
    (value: number) => Math.min(Math.max(0, Math.round(value)), safeDuration),
    [safeDuration]
  );

  const seekTo = useCallback(
    (value: number) => {
      setElapsed(clamp(value));
    },
    [clamp]
  );

  const seekBy = useCallback(
    (delta: number) => {
      setElapsed((prev) => clamp(prev + delta));
    },
    [clamp]
  );

  const reset = useCallback(() => {
    clearTimer();
    setElapsed(0);
    setIsPlaying(false);
  }, [clearTimer]);

  return {
    isPlaying,
    elapsed,
    duration: safeDuration,
    togglePlay,
    play,
    pause,
    seekTo,
    seekBy,
    reset,
  };
}
