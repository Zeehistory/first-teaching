/**
 * Visualizations for each onboarding slide.
 *
 * Primary path: a short, silent, looping screen-recording of the actual site
 * performing the interaction the slide describes (captured from the live app).
 * Each clip is keyed by slide id. The hand-drawn SVG/CSS panels below are kept
 * as a graceful fallback for any id without a recording.
 */
import welcomeClip from "@/assets/tour/welcome.mp4";
import libraryClip from "@/assets/tour/library.mp4";
import readingClip from "@/assets/tour/reading.mp4";
import apparatusClip from "@/assets/tour/apparatus.mp4";
import searchClip from "@/assets/tour/search.mp4";
import audioClip from "@/assets/tour/audio.mp4";
import assistantClip from "@/assets/tour/assistant.mp4";

const CLIPS: Record<string, string> = {
  welcome: welcomeClip,
  library: libraryClip,
  reading: readingClip,
  apparatus: apparatusClip,
  search: searchClip,
  audio: audioClip,
  assistant: assistantClip,
};

function ClipViz({ src }: { src: string }) {
  return (
    <div className="tour-viz tour-viz-clip">
      <video
        className="tour-viz-video"
        src={src}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        aria-hidden="true"
      />
    </div>
  );
}

function Stage({ children }: { children: React.ReactNode }) {
  return <div className="tour-viz">{children}</div>;
}

/* Welcome — a gilt rule draws itself, then a sparkle blooms (the "quill") */
function WelcomeViz() {
  return (
    <Stage>
      <svg viewBox="0 0 220 120" className="tour-viz-svg" aria-hidden="true">
        <path
          className="tv-draw"
          d="M28 86 C 70 40, 120 40, 150 64 S 196 78, 196 50"
          fill="none"
          stroke="hsl(var(--gilt))"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <g className="tv-spark" transform="translate(196 50)">
          <path
            d="M0 -11 L2.6 -2.6 L11 0 L2.6 2.6 L0 11 L-2.6 2.6 L-11 0 L-2.6 -2.6 Z"
            fill="hsl(var(--gilt))"
          />
        </g>
      </svg>
    </Stage>
  );
}

/* Library — book spines rise one by one onto a shelf */
function LibraryViz() {
  const spines = [0, 1, 2, 3, 4, 5];
  return (
    <Stage>
      <div className="tv-shelf">
        {spines.map((i) => (
          <span
            key={i}
            className="tv-spine"
            style={{ animationDelay: `${i * 120}ms`, height: `${58 + ((i * 37) % 34)}%` }}
          />
        ))}
        <span className="tv-shelf-base" />
      </div>
    </Stage>
  );
}

/* Reading — lines of text typeset onto a vellum leaf, line by line */
function ReadingViz() {
  const lines = [82, 96, 70, 90, 60];
  return (
    <Stage>
      <div className="tv-leaf">
        <span className="tv-leaf-title" />
        {lines.map((w, i) => (
          <span
            key={i}
            className="tv-leaf-line"
            style={{ width: `${w}%`, animationDelay: `${260 + i * 150}ms` }}
          />
        ))}
      </div>
    </Stage>
  );
}

/* Apparatus — a marker pulses in the text, then a note panel slides in */
function ApparatusViz() {
  return (
    <Stage>
      <div className="tv-apparatus">
        <div className="tv-app-lines">
          <span style={{ width: "90%" }} />
          <span style={{ width: "100%" }}>
            <i className="tv-marker">1</i>
          </span>
          <span style={{ width: "76%" }} />
        </div>
        <div className="tv-app-panel">
          <span className="tv-app-panel-n">1</span>
          <span className="tv-app-panel-l" style={{ width: "88%" }} />
          <span className="tv-app-panel-l" style={{ width: "70%" }} />
          <span className="tv-app-panel-l" style={{ width: "94%" }} />
        </div>
      </div>
    </Stage>
  );
}

/* Search — a magnifier sweeps across lines, lighting matches as it passes */
function SearchViz() {
  return (
    <Stage>
      <div className="tv-search">
        <div className="tv-search-lines">
          <span style={{ width: "92%" }} />
          <span className="tv-hit" style={{ width: "64%" }} />
          <span style={{ width: "84%" }} />
          <span className="tv-hit tv-hit-2" style={{ width: "72%" }} />
        </div>
        <svg viewBox="0 0 24 24" className="tv-lens" aria-hidden="true">
          <circle cx="10" cy="10" r="7" fill="none" stroke="hsl(var(--primary))" strokeWidth="2" />
          <line x1="15" y1="15" x2="21" y2="21" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
    </Stage>
  );
}

/* Audio — an equalizer of gilt bars breathing in a wave */
function AudioViz() {
  const bars = Array.from({ length: 11 });
  return (
    <Stage>
      <div className="tv-eq">
        {bars.map((_, i) => (
          <span key={i} className="tv-eq-bar" style={{ animationDelay: `${i * 90}ms` }} />
        ))}
      </div>
    </Stage>
  );
}

/* Assistant — a question bubble, then a reply bubble types in */
function AssistantViz() {
  return (
    <Stage>
      <div className="tv-chat">
        <div className="tv-bubble tv-bubble-q">
          <span style={{ width: "60%" }} />
        </div>
        <div className="tv-bubble tv-bubble-a">
          <span className="tv-typing">
            <i /><i /><i />
          </span>
          <span className="tv-bubble-a-l" style={{ width: "82%" }} />
          <span className="tv-bubble-a-l" style={{ width: "64%" }} />
        </div>
      </div>
    </Stage>
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
  const clip = CLIPS[id];
  if (clip) return <ClipViz src={clip} />;
  const Viz = MAP[id];
  if (!Viz) return null;
  return <Viz />;
}
