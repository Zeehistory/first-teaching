const READING_RETURN_STATE_KEY = "reading-return-state";

interface ReadingReturnState {
  path: string;
  scrollTop: number;
  savedAt: number;
}

function getScrollContainer(): HTMLElement | null {
  if (typeof document === "undefined") return null;
  return document.querySelector<HTMLElement>("[data-reader-scroll-container]");
}

export function captureReadingReturnState(path?: string) {
  if (typeof window === "undefined") return;

  const container = getScrollContainer();
  const state: ReadingReturnState = {
    path: path ?? `${window.location.pathname}${window.location.search}`,
    scrollTop: container?.scrollTop ?? 0,
    savedAt: Date.now(),
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
  if (!state || state.path !== path) return false;

  const container = getScrollContainer();
  if (!container) return false;

  container.scrollTo({ top: state.scrollTop, behavior: "auto" });
  clearReadingReturnState();
  return true;
}
