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

export function restoreReadingReturnScroll(path: string) {
  const state = readReadingReturnState();
  if (!state || state.path !== toRouterPath(path)) return false;

  const container = getScrollContainer();
  if (!container) return false;

  container.scrollTo({ top: state.scrollTop, behavior: "auto" });
  const slug = state.glossarySlug;
  clearReadingReturnState();

  // Glow the glossary term the reader had opened, so the eye relands on it.
  if (slug && typeof document !== "undefined") {
    let tries = 0;
    const tick = () => {
      const el = document.querySelector<HTMLElement>(
        `[data-glossary="${CSS.escape(slug)}"]`,
      );
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
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
