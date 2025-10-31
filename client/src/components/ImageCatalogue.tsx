import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { GalleryItem } from "@/data/imageCatalogue";

interface ImageCatalogueProps {
  items: GalleryItem[];
}

export default function ImageCatalogue({ items }: ImageCatalogueProps) {
  return (
    <section className="mt-12 space-y-12">
      {items.map((item) => (
        <GalleryCard key={item.id} item={item} />
      ))}
    </section>
  );
}

function GalleryCard({ item }: { item: GalleryItem }) {
  if (item.layout === "split") {
    return <SplitGalleryCard item={item} />;
  }
  if (item.layout === "floated") {
    return <FloatedGalleryCard item={item} />;
  }
  return (
    <DefaultGalleryCard item={item} />
  );
}

function DefaultGalleryCard({ item }: { item: GalleryItem }) {
  const [open, setOpen] = useState(false);
  const modalSrc = item.modalImageSrc ?? item.imageSrc;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <figure className="flex flex-col items-center rounded-3xl border border-border bg-muted/10 p-6 text-center shadow-sm">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="group relative w-full overflow-hidden rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          <img
            src={item.imageSrc}
            alt={item.subtitle ?? item.title}
            className="h-full w-full rounded-2xl object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          />
          <span className="pointer-events-none absolute bottom-3 right-3 inline-flex items-center rounded-full bg-background/80 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.35em] text-muted-foreground shadow-sm backdrop-blur">
            View
          </span>
        </button>
        <figcaption className="mt-6 space-y-2">
          <CaptionBlock item={item} />
        </figcaption>
      </figure>
      <GalleryLightbox item={item} modalSrc={modalSrc} />
    </Dialog>
  );
}

function SplitGalleryCard({ item }: { item: GalleryItem }) {
  const [open, setOpen] = useState(false);
  const modalSrc = item.modalImageSrc ?? item.imageSrc;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <article className="flex flex-col gap-6 rounded-3xl border border-border bg-muted/20 p-6 shadow-sm md:flex-row md:items-center">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="group relative overflow-hidden rounded-2xl shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 md:w-1/2"
        >
          <img
            src={item.imageSrc}
            alt={item.subtitle ?? item.title}
            className="w-full rounded-2xl object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          />
          <span className="pointer-events-none absolute bottom-3 right-3 inline-flex items-center rounded-full bg-background/85 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.35em] text-muted-foreground shadow-sm backdrop-blur">
            View
          </span>
        </button>
        <div className="md:w-1/2 md:pl-6">
          <CaptionBlock item={item} align="left" />
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="mt-6 inline-flex items-center gap-3 rounded-full border border-border/70 bg-background px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground transition hover:border-primary/50 hover:text-primary"
          >
            <span className="h-9 w-9 rounded-full bg-primary/10 text-primary/80 shadow-inner flex items-center justify-center font-serif text-sm">
              ⤢
            </span>
            View larger
          </button>
        </div>
      </article>
      <GalleryLightbox item={item} modalSrc={modalSrc} />
    </Dialog>
  );
}

function FloatedGalleryCard({ item }: { item: GalleryItem }) {
  const [open, setOpen] = useState(false);
  const modalSrc = item.modalImageSrc ?? item.imageSrc;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <figure className="relative rounded-3xl border border-border bg-muted/5 p-6 text-left shadow-sm after:clear-both after:content-['']">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="group relative mb-4 inline-flex overflow-hidden rounded-2xl shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 md:float-right md:ml-8 md:mb-4 md:w-64"
        >
          <img
            src={item.imageSrc}
            alt={item.subtitle ?? item.title}
            className="w-full object-cover transition duration-500 group-hover:scale-[1.02]"
          />
          <span className="pointer-events-none absolute bottom-3 right-3 inline-flex items-center rounded-full bg-background/85 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.35em] text-muted-foreground shadow-sm backdrop-blur">
            View
          </span>
        </button>
        <CaptionBlock item={item} align="left" />
      </figure>
      <GalleryLightbox item={item} modalSrc={modalSrc} />
    </Dialog>
  );
}

function CaptionBlock({ item, align = "center" }: { item: GalleryItem; align?: "center" | "left" }) {
  return (
    <div className={cn("space-y-2", align === "center" ? "text-center" : "text-left") }>
      <p className="text-sm font-semibold uppercase tracking-[0.3em] text-muted-foreground">
        {item.title}
      </p>
      {item.subtitle && (
        <p className="text-xl font-heading text-foreground">{item.subtitle}</p>
      )}
      {item.description && (
        <p className="text-sm leading-relaxed text-muted-foreground/90">
          {item.description}
        </p>
      )}
      {item.footnote && (
        <div className={cn("pt-2", align === "center" ? "justify-center" : "justify-start", "flex") }>
          <FootnoteChip footnote={item.footnote} />
        </div>
      )}
    </div>
  );
}

interface FootnoteChipProps {
  footnote: NonNullable<GalleryItem["footnote"]>;
}

function FootnoteChip({ footnote }: FootnoteChipProps) {
  return (
    <Dialog>
      <DialogTrigger
        className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground transition hover:border-primary/50 hover:text-primary"
      >
        {footnote.label}
      </DialogTrigger>
      <DialogContent className="max-w-xl rounded-3xl border border-border bg-background/95">
        <DialogHeader className="space-y-3 text-center">
          <DialogTitle className="text-base font-semibold tracking-wide uppercase text-muted-foreground">
            {footnote.label.toUpperCase()}
          </DialogTitle>
          <p className="text-sm leading-relaxed text-muted-foreground/90">{footnote.body}</p>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}

function GalleryLightbox({ item, modalSrc }: { item: GalleryItem; modalSrc: string }) {
  return (
    <DialogContent className="max-w-4xl overflow-hidden rounded-3xl border border-border bg-background/95 p-0">
      <DialogHeader className="space-y-2 px-6 pt-6">
        <DialogTitle className="text-sm font-semibold uppercase tracking-[0.3em] text-muted-foreground/80">
          {item.subtitle ?? item.title}
        </DialogTitle>
      </DialogHeader>
      <img
        src={modalSrc}
        alt={item.subtitle ?? item.title}
        className="w-full max-h-[70vh] object-contain bg-muted/40"
      />
      {item.description && (
        <div className="px-6 pb-6 pt-4 text-sm leading-relaxed text-muted-foreground/90">
          {item.description}
        </div>
      )}
    </DialogContent>
  );
}
