import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";

/**
 * A clean, minimalist Islamic-geometric interstitial shown briefly on route
 * changes. Two interlaced eight-pointed stars (khatim) draw themselves in,
 * hold, then the whole veil lifts to reveal the next page.
 *
 * Must be rendered inside the wouter <Router> so useLocation reflects the
 * (base-aware) app location.
 */

type Phase = "idle" | "enter" | "exit";

const HOLD_MS = 360;
const EXIT_MS = 520;

export default function PageTransition() {
  const [location] = useLocation();
  const [phase, setPhase] = useState<Phase>("idle");
  const prevLocation = useRef(location);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    if (location === prevLocation.current) return;
    prevLocation.current = location;

    // Respect reduced-motion preferences: skip the veil entirely.
    if (
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];

    setPhase("enter");
    timers.current.push(window.setTimeout(() => setPhase("exit"), HOLD_MS));
    timers.current.push(
      window.setTimeout(() => setPhase("idle"), HOLD_MS + EXIT_MS)
    );

    return () => {
      timers.current.forEach((t) => window.clearTimeout(t));
      timers.current = [];
    };
  }, [location]);

  if (phase === "idle") return null;

  return (
    <div
      className={`page-transition-veil ${phase === "exit" ? "is-exiting" : ""}`}
      aria-hidden="true"
    >
      <svg
        className="page-transition-star"
        viewBox="0 0 200 200"
        width="132"
        height="132"
        fill="none"
      >
        {/* Outer rosette ring */}
        <circle
          cx="100"
          cy="100"
          r="92"
          className="pt-ring"
          stroke="currentColor"
          strokeWidth="1"
        />
        {/* Two squares rotated 45° → eight-pointed star (khatim) */}
        <rect
          x="38"
          y="38"
          width="124"
          height="124"
          className="pt-star pt-star-a"
          stroke="currentColor"
          strokeWidth="2"
        />
        <rect
          x="38"
          y="38"
          width="124"
          height="124"
          className="pt-star pt-star-b"
          stroke="currentColor"
          strokeWidth="2"
          transform="rotate(45 100 100)"
        />
        {/* Inner interlace */}
        <circle
          cx="100"
          cy="100"
          r="34"
          className="pt-core"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        {Array.from({ length: 8 }).map((_, i) => (
          <line
            key={i}
            x1="100"
            y1="100"
            x2="100"
            y2="8"
            className="pt-ray"
            stroke="currentColor"
            strokeWidth="0.75"
            transform={`rotate(${i * 45} 100 100)`}
            style={{ animationDelay: `${i * 40}ms` }}
          />
        ))}
      </svg>
    </div>
  );
}
