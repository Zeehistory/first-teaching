/**
 * Transliteration italics.
 *
 * Academic convention: transliterated Arabic (and other non-English) terms are
 * set in italics. We detect them by their romanization signature — a long-vowel
 * macron or an emphatic/diacritic consonant (ā ī ū ē ō ḥ ṣ ḍ ṭ ẓ ġ ḏ ḫ ṯ ẖ),
 * or an `al-` article segment — which the content's existing usage shows is a
 * reliable signal with effectively no English false positives (the curly
 * apostrophe in English possessives like "God's" is deliberately NOT a trigger).
 *
 * The numerals of footnote markers, links, and already-emphasised text are left
 * untouched.
 */

// A run of characters that may belong to a single transliterated token: letters
// (incl. diacritics), apostrophes/hamza, and internal hyphens (al-Ghazālī).
const TOKEN = "[A-Za-zĀĪŪāīūĒŌēōḤḥṢṣḌḍṬṭẒẓĠġḎḏḪḫṮṯẖʿʾ’‘'-]+";

// The diacritics / segments that mark a token as a transliteration.
const SIGNATURE = /[ĀĪŪāīūĒŌēōḤḥṢṣḌḍṬṭẒẓĠġḎḏḪḫṮṯẖ]|(?:^|-)[Aa]l-/;

const TOKEN_RE = new RegExp(TOKEN, "g");

export function isTransliterated(token: string): boolean {
  const t = token.replace(/[’‘']s$/, ""); // ignore English possessive suffix
  if (t.length < 2) return false;
  return SIGNATURE.test(t);
}

/** Wrap transliterated tokens of a plain string in <em class="translit">…</em>. */
export function italicizeTransliterationsHtml(text: string): string {
  return text.replace(TOKEN_RE, (tok) =>
    isTransliterated(tok) ? `<em class="translit">${tok}</em>` : tok,
  );
}

/**
 * Split a plain string into parts, marking which are transliterated, for
 * rendering titles/headings in React (where we can't use innerHTML safely).
 */
export function splitTransliteration(
  text: string,
): Array<{ text: string; translit: boolean }> {
  const parts: Array<{ text: string; translit: boolean }> = [];
  let last = 0;
  TOKEN_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = TOKEN_RE.exec(text))) {
    if (!isTransliterated(m[0])) continue;
    if (m.index > last) parts.push({ text: text.slice(last, m.index), translit: false });
    parts.push({ text: m[0], translit: true });
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push({ text: text.slice(last), translit: false });
  return parts.length ? parts : [{ text, translit: false }];
}

const SKIP_TAGS = new Set(["EM", "I", "A", "SUP", "CODE", "SCRIPT", "STYLE"]);

/**
 * Walk a container and italicize transliterated tokens in its text nodes,
 * skipping markers (SUP), links (A), and already-italic spans (EM/I) as well as
 * glossary/web-extension chips. Idempotent: a node already inside a
 * `.translit` is skipped, and runs only once per element via a data flag.
 */
export function italicizeTransliterations(root: HTMLElement): void {
  if (typeof document === "undefined") return;
  if (root.dataset.translitDone === "true") return;
  root.dataset.translitDone = "true";

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = (node as Text).parentElement;
      if (!parent) return NodeFilter.FILTER_REJECT;
      // Skip inside markers, links, existing italics, chips.
      for (let el: HTMLElement | null = parent; el && el !== root; el = el.parentElement) {
        if (SKIP_TAGS.has(el.tagName)) return NodeFilter.FILTER_REJECT;
        if (el.classList.contains("translit")) return NodeFilter.FILTER_REJECT;
        if (el.classList.contains("web-extension-chip")) return NodeFilter.FILTER_REJECT;
        if (el.dataset && el.dataset.glossaryTerm === "true") return NodeFilter.FILTER_REJECT;
      }
      return /[ĀĪŪāīūĒŌēōḤḥṢṣḌḍṬṭẒẓĠġḎḏḪḫṮṯẖ]|(?:^|[\s(])[Aa]l-/.test(node.nodeValue ?? "")
        ? NodeFilter.FILTER_ACCEPT
        : NodeFilter.FILTER_REJECT;
    },
  });

  const targets: Text[] = [];
  let n = walker.nextNode();
  while (n) {
    targets.push(n as Text);
    n = walker.nextNode();
  }

  for (const textNode of targets) {
    const value = textNode.nodeValue ?? "";
    let lastIndex = 0;
    let matched = false;
    const frag = document.createDocumentFragment();
    TOKEN_RE.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = TOKEN_RE.exec(value))) {
      const tok = m[0];
      if (!isTransliterated(tok)) continue;
      matched = true;
      if (m.index > lastIndex) {
        frag.appendChild(document.createTextNode(value.slice(lastIndex, m.index)));
      }
      const em = document.createElement("em");
      em.className = "translit";
      em.textContent = tok;
      frag.appendChild(em);
      lastIndex = m.index + tok.length;
    }
    if (!matched) continue;
    if (lastIndex < value.length) {
      frag.appendChild(document.createTextNode(value.slice(lastIndex)));
    }
    textNode.parentNode?.replaceChild(frag, textNode);
  }
}
