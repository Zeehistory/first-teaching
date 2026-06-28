const READING_RETURN_STATE_KEY = "reading-return-state";

interface ReadingReturnState {
  path: string;
  scrollTop: number;
  savedAt: number;
  /** Glossary term that was opened, so we can glow it on return. */
  glossarySlug?: string;
}

function getScrollContainer(): HTMLElement | null {
  if (typeof document === "undefined") return null;
  return document.querySelector<HTMLElement>("[data-reader-scroll-container]");
}

// Strip the deployment base (e.g. "/first-teaching") so stored paths are
// router-relative. wouter's setLocation re-applies the base on navigation, so
// keeping the base here would double it ("/first-teaching/first-teaching/...").
const BASE = (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");
function toRouterPath(fullPath: string): string {
  if (BASE && fullPath.startsWith(BASE)) {
    return fullPath.slice(BASE.length) || "/";
  }
  return fullPath;
}

export function captureReadingReturnState(path?: string, glossarySlug?: string) {
  if (typeof window === "undefined") return;

  const container = getScrollContainer();
  const state: ReadingReturnState = {
    path:
      path ??
      `${toRouterPath(window.location.pathname)}${window.location.search}`,
    scrollTop: container?.scrollTop ?? 0,
    savedAt: Date.now(),
    glossarySlug,
  };

  window.sessionStorage.setItem(READING_RETURN_STATE_KEY, JSON.stringify(state));
}

export function readReadingReturnState(): ReadingReturnState | null {
  if (typeof window === "undefined") return null;

  const raw = window.sessionStorage.getItem(READING_RETURN_STATE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as ReadingReturnState;
  } catch {
    window.sessionStorage.removeItem(READING_RETURN_STATE_KEY);
    return null;
  }
}

export function clearReadingReturnState() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(READING_RETURN_STATE_KEY);
}

/**
 * Briefly flash a soft band across the reading column at the viewport center,
 * marking where the reader left off. Works regardless of whether the original
 * glossary term can be located.
 */
function flashReadingPosition(container: HTMLElement) {
  if (typeof document === "undefined") return;
  const host = container.querySelector<HTMLElement>(
    '[data-testid="chapter-text-content"]',
  );
  const target = host ?? container;
  const cs = window.getComputedStyle(target);
  if (cs.position === "static") target.style.position = "relative";

  const band = document.createElement("div");
  band.className = "reading-return-band";
  // Place the band at the vertical center of the visible reading area,
  // relative to the (now positioned) content host.
  const hostRect = target.getBoundingClientRect();
  const centerY = window.innerHeight / 2 - hostRect.top;
  band.style.top = `${Math.max(0, centerY - 24)}px`;
  target.appendChild(band);
  window.setTimeout(() => band.remove(), 2000);
}

export function restoreReadingReturnScroll(path: string) {
  const state = readReadingReturnState();
  if (!state || state.path !== toRouterPath(path)) return false;

  const container = getScrollContainer();
  if (!container) return false;

  container.scrollTo({ top: state.scrollTop, behavior: "auto" });
  const slug = state.glossarySlug;
  clearReadingReturnState();

  // Primary cue: a transient band at the reading position.
  window.setTimeout(() => flashReadingPosition(container), 80);

  // If we can find the exact glossary term the reader opened, glow it too.
  if (slug && typeof document !== "undefined") {
    let tries = 0;
    const tick = () => {
      const el = document.querySelector<HTMLElement>(
        `[data-glossary="${CSS.escape(slug)}"]`,
      );
      if (el) {
        el.classList.add("glossary-term-return-focus");
        window.setTimeout(
          () => el.classList.remove("glossary-term-return-focus"),
          2200,
        );
        return;
      }
      if (tries++ < 25) window.setTimeout(tick, 80);
    };
    window.setTimeout(tick, 120);
  }
  return true;
}
