import { Book, Library, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Volume } from "@shared/schema";
import OrnamentalDivider from "./OrnamentalDivider";

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

const statusLabel: Record<Volume["status"], { label: string; tone: string }> = {
  available: { label: "Available", tone: "text-emerald-600" },
  "in-progress": { label: "In Progress", tone: "text-amber-600" },
  "coming-soon": { label: "Coming Soon", tone: "text-muted-foreground" },
};

export default function VolumesLanding({ overview, volumes, onSelectVolume }: VolumesLandingProps) {
  return (
    <div className="min-h-screen bg-background">
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-br from-background via-background to-muted/40">
        <div className="max-w-5xl mx-auto px-6 py-20 text-center">
          <div className="flex justify-center mb-6">
            <div className="p-4 rounded-full bg-primary/10">
              <Library className="h-12 w-12 text-primary" />
            </div>
          </div>

          <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground mb-4">
            Complete Digital Companion
          </p>

          <h1 className="text-4xl md:text-5xl font-heading font-semibold mb-4">
            {overview.title}
          </h1>
          <p className="text-xl md:text-2xl font-heading italic text-muted-foreground mb-6">
            {overview.subtitle}
          </p>

          <OrnamentalDivider className="my-6" />

          <p className="max-w-3xl mx-auto text-lg md:text-xl leading-relaxed text-muted-foreground">
            {overview.mission}
          </p>

          <p className="max-w-3xl mx-auto text-base md:text-lg leading-relaxed text-muted-foreground mt-4">
            {overview.invitation}
          </p>

          <div className="mt-8 text-sm text-muted-foreground">
            Authored by <span className="font-medium text-foreground">{overview.author}</span>
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 py-16">
        <div className="flex items-center gap-3 mb-10">
          <Sparkles className="h-6 w-6 text-primary" />
          <div>
            <h2 className="text-2xl font-heading font-semibold">The Nineteen-Volume Curriculum</h2>
            <p className="text-sm text-muted-foreground">
              Explore the structured roadmap of The First Teaching of the Last Message.
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {volumes.map((volume) => {
            const status = statusLabel[volume.status];
            const isAvailable = volume.status === "available" && volume.data;
            return (
              <Card key={volume.number} className="p-6 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-heading text-lg">
                      {volume.number}
                    </div>
                    <div>
                      <h3 className="text-xl font-heading font-medium">{volume.title}</h3>
                      {volume.subtitle && (
                        <p className="text-sm text-muted-foreground">{volume.subtitle}</p>
                      )}
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {volume.description}
                  </p>
                </div>

                <div className="mt-6 flex items-center justify-between">
                  <span className={`text-xs font-semibold uppercase tracking-wide ${status.tone}`}>
                    {status.label}
                  </span>
                  {isAvailable ? (
                    <Button onClick={() => onSelectVolume(volume.number)} size="sm" className="gap-2">
                      <Book className="h-4 w-4" />
                      Open Volume
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" disabled>
                      {status.label}
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}
