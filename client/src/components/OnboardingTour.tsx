import { useEffect, useMemo, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { ArrowRight, Search, MoonStar, PenSquare } from "lucide-react";

type Step = {
  id: string;
  title: string;
  description: string;
  target?: string; // CSS selector
  ensureRoute?: (path: string) => boolean; // gate by route
  autoClickTarget?: boolean; // click the target when user hits Next
};

const STORAGE_KEY_ACTIVE = "ft_onboarding_active_v1";
const STORAGE_KEY_STEP = "ft_onboarding_step_v1";
const STORAGE_KEY_SEEN = "ft_onboarding_seen_v1";

function isElementVisible(el: Element | null) {
  if (!el) return false;
  const rect = (el as HTMLElement).getBoundingClientRect();
  return (
    rect.width > 0 &&
    rect.height > 0 &&
    rect.bottom >= 0 &&
    rect.right >= 0 &&
    rect.top <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.left <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

export default function OnboardingTour() {
  const [active, setActive] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    // if already seen, don’t auto-start
    const seen = window.localStorage.getItem(STORAGE_KEY_SEEN) === "true";
    if (seen) return false;
    // resume if previously active
    return window.localStorage.getItem(STORAGE_KEY_ACTIVE) === "true";
  });
  const [index, setIndex] = useState<number>(() => {
    if (typeof window === "undefined") return 0;
    const saved = window.localStorage.getItem(STORAGE_KEY_STEP);
    const parsed = saved ? parseInt(saved, 10) : 0;
    return Number.isFinite(parsed) ? parsed : 0;
  });

  // Allow manual start via custom event from UI
  useEffect(() => {
    const handleStart = (e: Event) => {
      const custom = e as CustomEvent<{ step?: number; resetSeen?: boolean }>;
      if (typeof window !== "undefined") {
        if (custom.detail?.resetSeen) window.localStorage.removeItem(STORAGE_KEY_SEEN);
        window.localStorage.setItem(STORAGE_KEY_ACTIVE, "true");
      }
      setIndex(typeof custom.detail?.step === "number" ? custom.detail!.step! : 0);
      setActive(true);
    };
    window.addEventListener("start-onboarding-tour", handleStart as EventListener);
    return () => window.removeEventListener("start-onboarding-tour", handleStart as EventListener);
  }, []);

  // Define steps. Some steps are route-gated and/or target elements.
  const steps: Step[] = useMemo(
    () => [
      {
        id: "welcome",
        title: "Welcome to First Teaching",
        description:
          "Let's take a quick, elegant tour of the library and its reading tools.",
        ensureRoute: () => true,
      },
      {
        id: "open-volume",
        title: "Open a Volume",
        description:
          "Browse the curriculum and open a volume to begin.",
        target: '[data-tour="open-volume"]',
        ensureRoute: (path) => path === "/",
        autoClickTarget: true,
      },
      {
        id: "search-volume",
        title: "Search the Volume",
        description:
          "Use powerful search to find passages across all chapters.",
        target: '[data-tour="home-search"]',
        ensureRoute: (path) => /^\/v\/[\d]+$/.test(path),
      },
      {
        id: "open-chapter",
        title: "Open a Chapter",
        description:
          "Chapters are organized with concise summaries—click one to start reading.",
        target: '[data-testid^="chapter-card-"]',
        ensureRoute: (path) => /^\/v\/[\d]+$/.test(path),
        autoClickTarget: true,
      },
      {
        id: "reading-tools",
        title: "Reading Tools",
        description:
          "In any chapter, use search, the notes pane, theme toggle, and text size controls to tailor your study.",
        target: '[data-tour="chapter-search"], [data-tour="theme-toggle"], [data-tour="text-size-control"]',
        ensureRoute: (path) => /^\/v\/[\d]+\/.+/.test(path),
      },
      {
        id: "ask-ai",
        title: "Ask AI Companion",
        description:
          "The Ask AI button summons a focused assistant for clarifications, summaries, and citations right beside the text.",
        target: '[data-tour="assistant-button"]',
        ensureRoute: (path) => /^\/v\/[\d]+\/.+/.test(path),
      },
      {
        id: "audio-preview",
        title: "Listen While Reading",
        description:
          "Each section now offers a soft audio companion. It's a calm preview—lovely for exploration, but not yet the final classroom recording.",
        target: '[data-tour="section-audio"]',
        ensureRoute: (path) => /^\/v\/[\d]+\/.+/.test(path),
      },
      {
        id: "notes-preview",
        title: "Demo Notes",
        description:
          "Highlight any sentence to open the notes pane. Capture thoughts on the fly and revisit them alongside the text.",
        target: '[data-tour="notes-toggle"]',
        ensureRoute: (path) => /^\/v\/[\d]+\/.+/.test(path),
      },
    ],
    []
  );

  const currentStep = steps[index];
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);

  // Keep localStorage in sync
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY_ACTIVE, active ? "true" : "false");
    window.localStorage.setItem(STORAGE_KEY_STEP, String(index));
  }, [active, index]);

  // Recompute target rect when step changes or on resize/scroll
  useEffect(() => {
    const compute = () => {
      if (!currentStep?.target) {
        setTargetRect(null);
        return;
      }
      const el = document.querySelector(currentStep.target) as HTMLElement | null;
      if (el) {
        if (!isElementVisible(el)) {
          try {
            el.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
          } catch {}
        }
        setTargetRect(el.getBoundingClientRect());
      } else {
        setTargetRect(null);
      }
    };
    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(document.documentElement);
    window.addEventListener("scroll", compute, true);
    window.addEventListener("resize", compute);
    return () => {
      ro.disconnect();
      window.removeEventListener("scroll", compute, true);
      window.removeEventListener("resize", compute);
    };
  }, [currentStep?.target]);

  // Start tour automatically once authenticated and landing page loads (first visit only)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const seen = window.localStorage.getItem(STORAGE_KEY_SEEN) === "true";
    const authed = !!window.localStorage.getItem("ft_auth_b64");
    if (!seen && authed && !active) {
      // Start shortly after mount for a smooth entrance
      const t = window.setTimeout(() => setActive(true), 400);
      return () => window.clearTimeout(t);
    }
  }, []); // run once

  // Ensure we are on the right route for the current step; if not, just wait until navigation
  const onCorrectRoute = useMemo(() => {
    if (!currentStep || !currentStep.ensureRoute) return true;
    return currentStep.ensureRoute(window.location.pathname);
  }, [currentStep]);

  function handleSkip() {
    setActive(false);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY_SEEN, "true");
      window.localStorage.removeItem(STORAGE_KEY_ACTIVE);
    }
  }

  function gotoNext() {
    if (!currentStep) return;
    // If step wants to auto click its target to demonstrate navigation/action
    if (currentStep.autoClickTarget && currentStep.target) {
      const el = document.querySelector<HTMLElement>(currentStep.target);
      if (el) el.click();
    }
    if (index < steps.length - 1) {
      setIndex(index + 1);
    } else {
      // Done
      handleSkip();
    }
  }

  if (!active || !currentStep) return null;

  // Decide card placement: if targetRect present, place near it; else center
  const margin = 14;
  const cardWidth = 360;
  let cardStyle: React.CSSProperties = { maxWidth: cardWidth };
  if (targetRect) {
    const preferBelow = targetRect.bottom + 200 < window.innerHeight; // rough space check
    const top = preferBelow ? targetRect.bottom + margin : Math.max(margin, targetRect.top - 180);
    let left = Math.min(
      Math.max(margin, targetRect.left + targetRect.width / 2 - cardWidth / 2),
      window.innerWidth - cardWidth - margin
    );
    cardStyle = {
      position: "fixed",
      top,
      left,
      width: cardWidth,
      zIndex: 60,
    } as React.CSSProperties;
  } else {
    cardStyle = {
      position: "fixed",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      width: cardWidth,
      zIndex: 60,
    } as React.CSSProperties;
  }

  return (
    <div ref={overlayRef} className="pointer-events-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 bg-transparent pointer-events-none" />

      {/* Highlight ring over target */}
      {targetRect && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{
            top: targetRect.top - 8,
            left: targetRect.left - 8,
            width: targetRect.width + 16,
            height: targetRect.height + 16,
            borderRadius: 12,
            boxShadow:
              "0 0 0 9999px rgba(0,0,0,0.45), 0 0 0 2px rgba(99,102,241,0.65), 0 10px 30px rgba(0,0,0,0.25)",
            transition: "all 0.18s ease",
          }}
        />
      )}

      {/* Floating card */}
      <Card
        className="z-60 relative overflow-hidden rounded-lg border-border/70 bg-card shadow-xl"
        style={cardStyle}
      >
        <div className="absolute inset-x-0 top-0 h-px bg-[hsl(var(--gilt))]" />
        <div className="p-6">
          <div className="codex-label mb-4">Quick tour</div>
          <h3 className="mb-2 font-heading text-2xl font-semibold leading-tight">
            {currentStep.title}
          </h3>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {currentStep.description}
          </p>

          {/* Hints for the reading tools step */}
          {currentStep.id === "reading-tools" && (
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Search className="h-3.5 w-3.5" /> Search
              </span>
              <span className="inline-flex items-center gap-1.5">
                <PenSquare className="h-3.5 w-3.5" /> Notes
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MoonStar className="h-3.5 w-3.5" /> Theme
              </span>
              <span className="inline-flex items-center gap-1.5">A⇵ Text size</span>
            </div>
          )}

          <div className="mt-6 flex items-center justify-between border-t border-border/60 pt-4">
            <div className="codex-label text-sm">
              {index + 1} / {steps.length}
              {!onCorrectRoute && (
                <span className="ml-2 normal-case tracking-normal">navigate to continue…</span>
              )}
            </div>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={handleSkip}
                className="text-sm text-muted-foreground transition hover:text-foreground"
              >
                Skip
              </button>
              <button
                type="button"
                onClick={gotoNext}
                disabled={!onCorrectRoute}
                className="group inline-flex items-center gap-1.5 text-sm font-medium text-primary transition hover:text-[hsl(var(--gilt))] disabled:opacity-40"
              >
                {index < steps.length - 1 ? "Next" : "Finish"}
                {index < steps.length - 1 && (
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
