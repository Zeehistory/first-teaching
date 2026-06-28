import { ArrowUpRight, BookOpen, Bookmark, GraduationCap, ScrollText, Wand2 } from "lucide-react";
import type { Volume } from "@shared/schema";

interface VolumesLandingProps {
  overview: {
    title: string;
    subtitle: string;
    author: string;
    totalVolumes: number;
    mission: string;
    invitation: string;
  };
  volumes: Volume[];
  onSelectVolume: (volumeNumber: number) => void;
}

const statusLabel: Record<Volume["status"], string> = {
  available: "Open",
  "in-progress": "In progress",
  "coming-soon": "In preparation",
};

const referenceTiles = [
  {
    id: "index",
    title: "Index",
    description: "Jump to ideas, names, and topics across every volume.",
    icon: Bookmark,
  },
  {
    id: "bibliography",
    title: "Bibliography",
    description: "Trace the scholarly scaffolding beneath the teaching.",
    icon: ScrollText,
  },
  {
    id: "glossary",
    title: "Teaching Glossary",
    description: "Refined definitions and hover-ready terms throughout.",
    icon: GraduationCap,
  },
];

export default function VolumesLanding({ overview, volumes, onSelectVolume }: VolumesLandingProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* ---------- Masthead ---------- */}
      <header className="border-b border-[hsl(var(--codex-rule)/0.7)]">
        <div className="mx-auto max-w-5xl px-6 pt-16 pb-12 md:pt-24 md:pb-16">
          <h1 className="masthead-title text-[2.7rem] leading-[0.95] sm:text-6xl md:text-7xl">
            <span className="block">The First Teaching</span>
            <span className="block text-[hsl(var(--codex-ink-soft))]">of the Last Message</span>
          </h1>

          <p className="mt-6 max-w-2xl font-heading text-2xl italic text-[hsl(var(--codex-ink-soft))]">
            {overview.subtitle}
          </p>

          <div className="codex-rule-gilt mt-10 w-24" />

          <p className="mt-8 max-w-2xl text-lg leading-relaxed text-foreground/85 versal">
            {overview.mission}
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-x-8 gap-y-3">
            <div className="codex-label">
              Authored by{" "}
              <span className="font-serif text-sm font-normal normal-case tracking-normal text-foreground">
                {overview.author}
              </span>
            </div>
            <button
              type="button"
              onClick={() =>
                window.dispatchEvent(
                  new CustomEvent("start-onboarding-tour", { detail: { step: 0 } })
                )
              }
              className="group inline-flex items-center gap-2 text-sm font-medium text-primary transition hover:text-[hsl(var(--gilt))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 rounded-sm"
            >
              <Wand2 className="h-4 w-4" />
              Take a quick tour
              <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </button>
          </div>
        </div>
      </header>

      {/* ---------- The ledger of volumes ---------- */}
      <section className="mx-auto max-w-5xl px-6 py-16">
        <div className="mb-2 flex items-end justify-between">
          <h2 className="codex-label">The Syntopicons</h2>
          <span className="codex-label text-[hsl(var(--codex-ink-soft))]/70">
            {overview.totalVolumes} volumes
          </span>
        </div>

        <div role="list">
          {volumes.map((volume) => {
            const isAvailable = volume.status === "available" && Boolean(volume.data);
            return (
              <button
                key={volume.number}
                type="button"
                role="listitem"
                disabled={!isAvailable}
                data-disabled={!isAvailable}
                data-tour={isAvailable ? "open-volume" : undefined}
                onClick={() => isAvailable && onSelectVolume(volume.number)}
                className="ledger-row group"
              >
                <span className="ledger-index">
                  {String(volume.number).padStart(2, "0")}
                </span>

                <span className="min-w-0">
                  <span
                    className={`block font-heading text-xl font-medium leading-snug md:text-2xl ${
                      isAvailable ? "text-foreground" : "text-[hsl(var(--codex-ink-soft))]"
                    }`}
                  >
                    {volume.subtitle && volume.subtitle !== "In Development"
                      ? volume.subtitle
                      : `Volume ${volume.number}`}
                  </span>
                  {isAvailable && (
                    <span className="mt-1 line-clamp-1 block text-sm text-[hsl(var(--codex-ink-soft))]">
                      {volume.description}
                    </span>
                  )}
                </span>

                <span className="flex items-center gap-2 self-center whitespace-nowrap">
                  <span
                    className={`codex-label text-sm ${
                      isAvailable
                        ? "text-primary group-hover:text-[hsl(var(--gilt))]"
                        : "text-[hsl(var(--codex-ink-soft))]/60"
                    }`}
                  >
                    {statusLabel[volume.status]}
                  </span>
                  {isAvailable && (
                    <ArrowUpRight className="h-4 w-4 text-primary opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100" />
                  )}
                </span>
              </button>
            );
          })}
          <div className="border-t border-[hsl(var(--codex-rule)/0.7)]" />
        </div>
      </section>

      {/* ---------- Apparatus / reference suite ---------- */}
      <section className="border-t border-[hsl(var(--codex-rule)/0.7)] bg-[hsl(var(--codex-vellum)/0.5)]">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <div className="flex items-baseline gap-3">
            <BookOpen className="h-4 w-4 translate-y-0.5 text-[hsl(var(--gilt))]" />
            <h2 className="codex-label">The Apparatus</h2>
          </div>
          <p className="mt-3 max-w-xl font-heading text-2xl text-foreground">
            Index, Bibliography &amp; Teaching Glossary
          </p>

          <div className="mt-10 grid gap-px overflow-hidden rounded-sm border border-[hsl(var(--codex-rule)/0.7)] bg-[hsl(var(--codex-rule)/0.5)] md:grid-cols-3">
            {referenceTiles.map((tile) => {
              const Icon = tile.icon;
              return (
                <div
                  key={tile.id}
                  className="flex flex-col gap-3 bg-background p-6"
                >
                  <div className="flex items-center justify-between">
                    <Icon className="h-5 w-5 text-primary" />
                    <span className="codex-label text-xs text-[hsl(var(--codex-ink-soft))]/60">
                      Soon
                    </span>
                  </div>
                  <h3 className="font-heading text-xl font-medium">{tile.title}</h3>
                  <p className="text-sm leading-relaxed text-[hsl(var(--codex-ink-soft))]">
                    {tile.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
