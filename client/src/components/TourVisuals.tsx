/**
 * Onboarding visualizations: clean, looping, high-fidelity recreations of the
 * actual site UI for each slide. Pure CSS/SVG (no deps) so they stay crisp and
 * GPU-light. Each is keyed by slide id and re-mounts on step change so its
 * entrance replays. They mirror the real codex palette, type, and components.
 */

function Najmah({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        d="M12 1 L15 9 L23 12 L15 15 L12 23 L9 15 L1 12 L9 9 Z"
        fill="currentColor"
      />
    </svg>
  );
}

/* Welcome — the masthead sets itself: title lines rise, a gilt rule draws, a
   najmah twinkles. */
function WelcomeViz() {
  return (
    <div className="tv2 tv2-welcome">
      <div className="tv2-mast">
        <span className="tv2-eyebrow">The First Teaching</span>
        <span className="tv2-title">of the Last Message</span>
        <span className="tv2-rule" />
        <Najmah className="tv2-star" />
      </div>
    </div>
  );
}

/* Library — the ledger of volumes. Rows rise in; the top row takes the hover
   treatment: a gilt edge, and its "Open" underlines as the arrow lifts in. */
function LibraryViz() {
  const rows = [
    { n: "01", t: "Speaking the Truth with Love" },
    { n: "02", t: "Plurality & the Covenanted World" },
    { n: "03", t: "The Divine Science" },
  ];
  return (
    <div className="tv2 tv2-library">
      {rows.map((r, i) => (
        <div className="tv2-lrow" style={{ ["--i" as string]: String(i) }} key={r.n}>
          <span className="tv2-lbar" />
          <span className="tv2-lnum">{r.n}</span>
          <span className="tv2-ltitle">{r.t}</span>
          <span className="tv2-lopen">
            Open
            <svg viewBox="0 0 24 24" className="tv2-lopen-arrow" aria-hidden="true">
              <path d="M7 17 L17 7 M9 7 H17 V15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="tv2-lopen-ul" />
          </span>
        </div>
      ))}
    </div>
  );
}

/* Reading — the single-column surface with type controls. The size ticks up and
   the lines breathe wider; a sun/moon toggle warms the leaf. */
function ReadingViz() {
  return (
    <div className="tv2 tv2-reading">
      <div className="tv2-toolbar">
        <span className="tv2-tsize">
          <span className="tv2-tminus">–</span>
          <span className="tv2-tnum">
            <span className="tv2-tnum-roll">
              <i>18</i>
              <i>19</i>
              <i>20</i>
            </span>
          </span>
          <span className="tv2-tplus">+</span>
        </span>
        <svg viewBox="0 0 24 24" className="tv2-theme" aria-hidden="true">
          <circle cx="12" cy="12" r="5" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <path className="tv2-theme-moon" d="M16 12 a4 4 0 0 1 -5 4 a5 5 0 0 0 5 -4 Z" fill="currentColor" />
        </svg>
      </div>
      <div className="tv2-leaf">
        <span className="tv2-leaf-h" />
        {[92, 100, 78, 96, 64].map((w, i) => (
          <span className="tv2-leaf-l" style={{ width: `${w}%`, ["--i" as string]: String(i) }} key={i} />
        ))}
      </div>
    </div>
  );
}

/* Apparatus — a reference marker pulses in the text, then its note slides in
   from the right as a side panel. */
function ApparatusViz() {
  return (
    <div className="tv2 tv2-apparatus">
      <div className="tv2-ap-text">
        {[94, 100].map((w, i) => (
          <span className="tv2-ap-l" style={{ width: `${w}%` }} key={i} />
        ))}
        <span className="tv2-ap-l tv2-ap-l-marked">
          <span className="tv2-ap-line" />
          <span className="tv2-ap-marker">12</span>
          <span className="tv2-ap-line tv2-ap-line-end" />
        </span>
        {[88, 72].map((w, i) => (
          <span className="tv2-ap-l" style={{ width: `${w}%` }} key={`b${i}`} />
        ))}
      </div>
      <div className="tv2-ap-panel">
        <span className="tv2-ap-panel-eyebrow">
          <Najmah className="tv2-ap-panel-star" />
          Footnote 12
        </span>
        {[96, 88, 92, 60].map((w, i) => (
          <span className="tv2-ap-panel-l" style={{ width: `${w}%`, ["--i" as string]: String(i) }} key={i} />
        ))}
      </div>
    </div>
  );
}

/* Search — a query types into the bar, the scope underline glides to Volume,
   and results rise with the matched term lit. */
function SearchViz() {
  return (
    <div className="tv2 tv2-search">
      <div className="tv2-sbar">
        <svg viewBox="0 0 24 24" className="tv2-slens" aria-hidden="true">
          <circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" strokeWidth="2" />
          <line x1="15.5" y1="15.5" x2="21" y2="21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <span className="tv2-squery">translation<span className="tv2-scaret" /></span>
      </div>
      <div className="tv2-sscope">
        <span className="tv2-sscope-label">Within</span>
        <span className="tv2-sscope-tab">Chapter</span>
        <span className="tv2-sscope-tab tv2-sscope-active">Volume</span>
        <span className="tv2-sscope-tab">Corpus</span>
      </div>
      <div className="tv2-sresults">
        {[0, 1].map((i) => (
          <div className="tv2-sresult" style={{ ["--i" as string]: String(i) }} key={i}>
            <span className="tv2-sresult-t" />
            <span className="tv2-sresult-b">
              <span className="tv2-sresult-line" />
              <span className="tv2-sresult-hit" />
              <span className="tv2-sresult-line" style={{ width: "30%" }} />
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* Audio — the narration plays: the play head fills, an equalizer breathes. */
function AudioViz() {
  return (
    <div className="tv2 tv2-audio">
      <div className="tv2-au-row">
        <span className="tv2-au-btn">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path className="tv2-au-play" d="M8 5 L19 12 L8 19 Z" fill="currentColor" />
          </svg>
        </span>
        <div className="tv2-au-meta">
          <span className="tv2-au-label" />
          <span className="tv2-au-track">
            <span className="tv2-au-fill" />
            <span className="tv2-au-head" />
          </span>
        </div>
        <span className="tv2-au-time" />
      </div>
      <div className="tv2-au-eq">
        {Array.from({ length: 13 }).map((_, i) => (
          <span className="tv2-au-bar" style={{ ["--i" as string]: String(i) }} key={i} />
        ))}
      </div>
    </div>
  );
}

/* Assistant — a question is posed; the reply types itself in beneath it. */
function AssistantViz() {
  return (
    <div className="tv2 tv2-assistant">
      <div className="tv2-as-eyebrow">
        <Najmah className="tv2-as-star" />
        Ask AI
      </div>
      <div className="tv2-as-bubble tv2-as-q">
        <span style={{ width: "70%" }} />
      </div>
      <div className="tv2-as-bubble tv2-as-a">
        <span className="tv2-as-typing">
          <i />
          <i />
          <i />
        </span>
        <span className="tv2-as-a-l" style={{ width: "88%" }} />
        <span className="tv2-as-a-l" style={{ width: "96%" }} />
        <span className="tv2-as-a-l" style={{ width: "54%" }} />
      </div>
    </div>
  );
}

const MAP: Record<string, () => JSX.Element> = {
  welcome: WelcomeViz,
  library: LibraryViz,
  reading: ReadingViz,
  apparatus: ApparatusViz,
  search: SearchViz,
  audio: AudioViz,
  assistant: AssistantViz,
};

export default function TourVisual({ id }: { id: string }) {
  const Viz = MAP[id];
  if (!Viz) return null;
  return <Viz />;
}
