import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpenText,
  Highlighter,
  Library,
  type LucideIcon,
  MessageCircleQuestion,
  Headphones,
  Search,
  Sparkles,
} from "lucide-react";

const STORAGE_KEY_SEEN = "ft_onboarding_seen_v2";

type Slide = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  icon: LucideIcon;
};

const SLIDES: Slide[] = [
  {
    id: "welcome",
    eyebrow: "Welcome",
    title: "The First Teaching, made to be read closely.",
    description:
      "A digital home for the nineteen-volume Syntopicon — typeset for study, with the apparatus of a scholarly edition and the ease of the web.",
    icon: Sparkles,
  },
  {
    id: "library",
    eyebrow: "The Library",
    title: "Nineteen volumes, one continuous curriculum.",
    description:
      "Open any available Syntopicon from the landing ledger. Each volume carries its full text, chapter by chapter, with more arriving as they are prepared.",
    icon: Library,
  },
  {
    id: "reading",
    eyebrow: "Reading",
    title: "A clean leaf of vellum for every chapter.",
    description:
      "Adjust the text size, switch between light and dark, and read without clutter. The page is built to disappear so the words can stay.",
    icon: BookOpenText,
  },
  {
    id: "apparatus",
    eyebrow: "The Apparatus",
    title: "Footnotes, web-extensions & a living glossary.",
    description:
      "Tap a marker to open its note in a quiet side panel. Highlighted terms reveal glossary definitions — the scholarly apparatus, one tap away.",
    icon: Highlighter,
  },
  {
    id: "search",
    eyebrow: "Search",
    title: "Find any passage across the whole corpus.",
    description:
      "Search within a chapter, a volume, or every available volume at once. Results carry you straight to the line.",
    icon: Search,
  },
  {
    id: "audio",
    eyebrow: "Listen",
    title: "A soft audio companion for each section.",
    description:
      "Prefer to listen? A calm narration preview accompanies the text — lovely for exploration while the final recordings are prepared.",
    icon: Headphones,
  },
  {
    id: "assistant",
    eyebrow: "Ask",
    title: "A focused study companion beside the text.",
    description:
      "Summon the assistant for clarifications, summaries, and citations — context drawn from the Teaching itself, right where you are reading.",
    icon: MessageCircleQuestion,
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
  const Icon = slide.icon;
  const isLast = index === SLIDES.length - 1;

  return (
    <div
      className={`tour-root ${entered ? "is-entered" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-label="Quick tour"
    >
      <button
        type="button"
        className="tour-scrim"
        aria-label="Close tour"
        onClick={finish}
      />

      <div className="tour-card" key={slide.id}>
        <div className="tour-card-glow" aria-hidden="true">
          <Icon className="h-full w-full" strokeWidth={1.1} />
        </div>

        <button type="button" className="tour-skip" onClick={finish}>
          Skip
        </button>

        <div className="tour-icon">
          <Icon className="h-5 w-5" strokeWidth={1.6} />
        </div>

        <p className="tour-eyebrow">{slide.eyebrow}</p>
        <h2 className="tour-title">{slide.title}</h2>
        <p className="tour-desc">{slide.description}</p>

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
