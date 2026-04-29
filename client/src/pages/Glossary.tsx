import { useEffect } from "react";
import { useLocation } from "wouter";
import { glossary } from "@shared/glossary";
import { ArrowLeft } from "lucide-react";
import { readReadingReturnState } from "@/lib/readingReturn";

export default function Glossary() {
  const [, setLocation] = useLocation();
  const returnState = readReadingReturnState();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash.replace(/^#/, "");
    if (!hash) return;
    const el = document.getElementById(hash);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <header className="mb-8">
        <div className="mb-3 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              if (typeof window !== "undefined" && window.history.length > 1) {
                window.history.back();
              } else {
                setLocation("/v/1");
              }
            }}
            className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground transition hover:border-primary/50 hover:text-primary"
            aria-label="Back"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </button>
        </div>
        <h1 className="text-3xl text-center font-heading font-semibold">The Teaching Glossary</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Titles only. Entries’ bodies are placeholders and will be replaced later.
        </p>
      </header>

      <div className="space-y-4">
        {glossary.map((entry) => (
          <article
            key={entry.slug}
            id={entry.slug}
            className="rounded-xl border border-border bg-background/80 p-4 shadow-sm"
          >
            <div className="flex items-start gap-3">
              <span className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-border bg-amber-100 text-amber-900 font-heading text-sm">
                {entry.index}
              </span>
              <div>
                <h2 className="text-lg font-heading font-medium">{entry.title}</h2>
                <div className="mt-1 text-xs text-muted-foreground">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer feugiat, mi nec faucibus mattis, ligula magna fringilla lectus, a viverra eros arcu in nunc. Suspendisse potenti. Donec sed nunc at arcu cursus varius.
                </div>
              </div>
            </div>

            <div className="mt-3 text-right">
              <button
                type="button"
                onClick={() => setLocation(returnState?.path ?? "/v/1")}
                className="text-xs text-muted-foreground underline decoration-dotted hover:text-foreground"
              >
                Back to reading
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
