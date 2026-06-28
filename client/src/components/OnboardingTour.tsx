import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import TourVisual from "./TourVisuals";

const STORAGE_KEY_SEEN = "ft_onboarding_seen_v3";

type Slide = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
};

const SLIDES: Slide[] = [
  {
    id: "welcome",
    eyebrow: "Orientation",
    title: "A scholarly edition of the First Teaching.",
    description:
      "The nineteen-volume compendium, set for close reading: full critical apparatus, cross-references, and search, delivered in the browser.",
  },
  {
    id: "library",
    eyebrow: "The Library",
    title: "Nineteen volumes in one structured corpus.",
    description:
      "Each available Syntopicon is opened from the index. Volumes carry their complete text, ordered by chapter and section; further volumes are released as edited.",
  },
  {
    id: "reading",
    eyebrow: "The Reading Surface",
    title: "A single column, with type controls.",
    description:
      "Adjust type size and toggle light or dark. The layout is deliberately spare so the text, not the interface, holds attention.",
  },
  {
    id: "apparatus",
    eyebrow: "The Critical Apparatus",
    title: "Footnotes, web-extensions, and glossary.",
    description:
      "A reference marker opens its note in a side panel. Indexed terms resolve to glossary definitions; web-extensions hold material beyond the printed margin.",
  },
  {
    id: "search",
    eyebrow: "Concordance",
    title: "Search the chapter, volume, or corpus.",
    description:
      "Queries may be scoped to the current chapter, the whole volume, or every available volume. Each result links directly to its passage.",
  },
  {
    id: "audio",
    eyebrow: "Recitation",
    title: "A narration track for each section.",
    description:
      "Sections carry a synchronized audio reading. The present tracks are a preview; the authorized classroom recordings will follow.",
  },
  {
    id: "assistant",
    eyebrow: "Study Companion",
    title: "An assistant grounded in the text.",
    description:
      "Request clarification, summary, or citation. Responses are drawn from the Teaching itself and presented beside the passage at hand.",
  },
];

export default function OnboardingTour() {
  const [active, setActive] = useState(false);
  const [index, setIndex] = useState(0);
  const [entered, setEntered] = useState(false);

  const start = useCallback((step = 0) => {
    setIndex(Math.min(Math.max(step, 0), SLIDES.length - 1));
    setActive(true);
  }, []);

  const finish = useCallback(() => {
    setEntered(false);
    // let the exit transition play before unmounting
    window.setTimeout(() => setActive(false), 220);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY_SEEN, "true");
    }
  }, []);

  // Launch from the "Take a quick tour" button.
  useEffect(() => {
    const handleStart = (e: Event) => {
      const detail = (e as CustomEvent<{ step?: number }>).detail;
      start(typeof detail?.step === "number" ? detail.step : 0);
    };
    window.addEventListener("start-onboarding-tour", handleStart as EventListener);
    return () =>
      window.removeEventListener("start-onboarding-tour", handleStart as EventListener);
  }, [start]);

  // Auto-start once, on first visit.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const seen = window.localStorage.getItem(STORAGE_KEY_SEEN) === "true";
    if (seen) return;
    const t = window.setTimeout(() => start(0), 600);
    return () => window.clearTimeout(t);
  }, [start]);

  // Drive the enter transition.
  useEffect(() => {
    if (!active) return;
    const raf = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(raf);
  }, [active]);

  const next = useCallback(() => {
    setIndex((i) => {
      if (i < SLIDES.length - 1) return i + 1;
      finish();
      return i;
    });
  }, [finish]);

  const prev = useCallback(() => setIndex((i) => Math.max(0, i - 1)), []);

  // Keyboard controls.
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") finish();
      else if (e.key === "ArrowRight" || e.key === "Enter") next();
      else if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, finish, next, prev]);

  if (!active) return null;

  const slide = SLIDES[index];
  const isLast = index === SLIDES.length - 1;

  return (
    <div
      className={`tour-root ${entered ? "is-entered" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-label="Guided tour"
    >
      <button
        type="button"
        className="tour-scrim"
        aria-label="Close tour"
        onClick={finish}
      />

      <div className="tour-card">
        {/* Geometric heritage frame: corner rosettes + a hairline inner rule */}
        <span className="tour-rosette tour-rosette-tl" aria-hidden="true">
          <StarMotif />
        </span>
        <span className="tour-rosette tour-rosette-br" aria-hidden="true">
          <StarMotif />
        </span>

        <button type="button" className="tour-skip" onClick={finish}>
          Skip
        </button>

        {/* The visualization stage — re-mounts per slide to replay its motion */}
        <div className="tour-stage" key={`stage-${slide.id}`}>
          <TourVisual id={slide.id} />
        </div>

        <div className="tour-body" key={`body-${slide.id}`}>
          <div className="tour-eyebrow">
            <StarMotif className="tour-eyebrow-star" />
            {slide.eyebrow}
          </div>
          <h2 className="tour-title">{slide.title}</h2>
          <p className="tour-desc">{slide.description}</p>
        </div>

        <div className="tour-foot">
          <div className="tour-dots" aria-hidden="true">
            {SLIDES.map((s, i) => (
              <span
                key={s.id}
                className={`tour-dot ${i === index ? "is-active" : ""} ${
                  i < index ? "is-done" : ""
                }`}
              />
            ))}
          </div>

          <div className="tour-actions">
            {index > 0 && (
              <button type="button" className="tour-btn-ghost" onClick={prev}>
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
            )}
            <button type="button" className="tour-btn" onClick={next}>
              {isLast ? "Begin reading" : "Next"}
              {!isLast && <ArrowRight className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* An eight-point star (najmah) — the heritage signature, drawn as two squares. */
function StarMotif({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        d="M12 1 L15 9 L23 12 L15 15 L12 23 L9 15 L1 12 L9 9 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
      <rect
        x="5.7" y="5.7" width="12.6" height="12.6"
        transform="rotate(45 12 12)"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.7"
        opacity="0.5"
      />
    </svg>
  );
}
