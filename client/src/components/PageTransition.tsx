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

const HOLD_MS = 1900;
const EXIT_MS = 850;

/** Strip query/hash and trailing slash, returning just the path. */
function cleanPath(loc: string): string {
  return loc.replace(/[?#].*$/, "").replace(/\/+$/, "") || "/";
}

interface VolumeRoute {
  volume: string;
  chapter: string | null;
  isWebExtension: boolean;
}

/** Parse a volume-area path, or null if it isn't one (home, glossary, …). */
function parseVolumeRoute(path: string): VolumeRoute | null {
  const m = path.match(/^\/v\/([^/]+)(?:\/([^/]+))?(\/web-extension)?$/);
  if (!m) return null;
  return { volume: m[1], chapter: m[2] ?? null, isWebExtension: Boolean(m[3]) };
}

/**
 * The veil should only play when the reader moves *forward* into volume
 * content: entering a volume, opening a chapter, or moving chapter→chapter.
 * It must NOT play on back/up moves (chapter→volume, →home, →glossary,
 * web-extension→chapter) or on same-chapter section/query changes.
 */
function shouldAnimate(fromPath: string, toPath: string): boolean {
  // Reading → Teaching Glossary is an explicit, animated move.
  if (toPath === "/glossary") return parseVolumeRoute(fromPath) !== null;

  const to = parseVolumeRoute(toPath);
  if (!to) return false; // destination isn't volume content (home, glossary…)
  if (to.isWebExtension) return false; // web-extension is out of scope

  const from = parseVolumeRoute(fromPath);

  // Entering the volume area from outside it (home/library, glossary).
  if (!from) return true;

  // Different volume → treat as entering a volume.
  if (from.volume !== to.volume) return true;

  // Same volume:
  if (!to.chapter) return false; // landing on the volume index = an "up" move
  if (!from.chapter) return true; // volume index → a chapter = entering content
  // chapter → chapter: animate only when it's a *different* chapter, not just
  // a section/query change within the same one.
  return from.chapter !== to.chapter;
}

export default function PageTransition() {
  const [location] = useLocation();
  const [phase, setPhase] = useState<Phase>("idle");
  const prevLocation = useRef(location);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const fromPath = cleanPath(prevLocation.current);
    const toPath = cleanPath(location);
    if (location === prevLocation.current) return;
    prevLocation.current = location;

    if (!shouldAnimate(fromPath, toPath)) return;

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
      <GeometricRosette />
    </div>
  );
}

const C = 120; // center
const R = 120; // viewbox is 240×240

/** Points of a regular {n}-gon (optionally a star by skipping vertices). */
function polyPoints(n: number, radius: number, rotation = 0): string {
  const pts: string[] = [];
  for (let i = 0; i < n; i++) {
    const a = (Math.PI * 2 * i) / n - Math.PI / 2 + rotation;
    pts.push(`${(C + radius * Math.cos(a)).toFixed(2)},${(C + radius * Math.sin(a)).toFixed(2)}`);
  }
  return pts.join(" ");
}

/** A star polygon path {n/step} drawn as one continuous interlaced loop. */
function starPath(n: number, step: number, radius: number, rotation = 0): string {
  const pts: Array<[number, number]> = [];
  for (let i = 0; i < n; i++) {
    const a = (Math.PI * 2 * ((i * step) % n)) / n - Math.PI / 2 + rotation;
    pts.push([C + radius * Math.cos(a), C + radius * Math.sin(a)]);
  }
  return (
    "M " +
    pts.map(([x, y]) => `${x.toFixed(2)} ${y.toFixed(2)}`).join(" L ") +
    " Z"
  );
}

/**
 * A complex, symmetric Islamic geometric rosette: concentric 12- and 8-fold
 * star polygons, a petalled rosette ring, and a radiating spoke lattice.
 * Layered in five harmonious (non-yellow) hues that fade/draw in sequence.
 */
function GeometricRosette() {
  return (
    <svg
      className="page-transition-star"
      viewBox="0 0 240 240"
      width="200"
      height="200"
      fill="none"
    >
      {/* Outer guide rings */}
      <circle cx={C} cy={C} r={R - 4} className="pt-ring pt-ink" strokeWidth="0.75" />
      <circle cx={C} cy={C} r={R - 22} className="pt-ring pt-teal" strokeWidth="0.75" />

      {/* Petalled rosette: 24 small arcs around the rim */}
      <g className="pt-rosette pt-plum">
        {Array.from({ length: 24 }).map((_, i) => {
          const a = (Math.PI * 2 * i) / 24 - Math.PI / 2;
          const r1 = R - 22;
          const r2 = R - 6;
          const x1 = C + r1 * Math.cos(a);
          const y1 = C + r1 * Math.sin(a);
          const x2 = C + r2 * Math.cos(a);
          const y2 = C + r2 * Math.sin(a);
          return (
            <line
              key={i}
              x1={x1.toFixed(2)} y1={y1.toFixed(2)}
              x2={x2.toFixed(2)} y2={y2.toFixed(2)}
              strokeWidth="0.7"
              style={{ animationDelay: `${i * 22}ms` }}
            />
          );
        })}
      </g>

      {/* Twelve-fold interlaced star {12/5} */}
      <path d={starPath(12, 5, R - 30)} className="pt-star pt-teal" strokeWidth="1.4" />
      {/* Counter-rotated twelve-fold {12/5} for the interlace lattice */}
      <path
        d={starPath(12, 5, R - 30)}
        className="pt-star pt-indigo"
        strokeWidth="1.4"
        transform={`rotate(15 ${C} ${C})`}
      />

      {/* Eight-pointed khatim from two squares */}
      <polygon points={polyPoints(4, R - 52)} className="pt-square pt-terracotta" strokeWidth="1.5" />
      <polygon
        points={polyPoints(4, R - 52)}
        className="pt-square pt-teal"
        strokeWidth="1.5"
        transform={`rotate(45 ${C} ${C})`}
      />

      {/* Inner hexagram {6/2} */}
      <polygon points={polyPoints(3, R - 74)} className="pt-tri pt-indigo" strokeWidth="1.2" />
      <polygon
        points={polyPoints(3, R - 74)}
        className="pt-tri pt-sage"
        strokeWidth="1.2"
        transform={`rotate(60 ${C} ${C})`}
      />

      {/* Radiating spoke lattice */}
      <g className="pt-rays pt-ink">
        {Array.from({ length: 12 }).map((_, i) => (
          <line
            key={i}
            x1={C} y1={C}
            x2={C} y2={C - (R - 30)}
            strokeWidth="0.5"
            transform={`rotate(${i * 30} ${C} ${C})`}
            style={{ animationDelay: `${i * 30}ms` }}
          />
        ))}
      </g>

      {/* Core medallion */}
      <circle cx={C} cy={C} r="20" className="pt-core pt-terracotta" strokeWidth="1.1" />
      <circle cx={C} cy={C} r="9" className="pt-core pt-teal" strokeWidth="1" />
    </svg>
  );
}
