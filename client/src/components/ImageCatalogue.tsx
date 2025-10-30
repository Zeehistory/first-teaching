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
  return (
    <figure className="flex flex-col items-center rounded-3xl border border-border bg-muted/10 p-6 text-center shadow-sm">
      <div className="relative w-full overflow-hidden rounded-2xl">
        <img
          src={item.imageSrc}
          alt={item.subtitle ?? item.title}
          className="h-full w-full rounded-2xl object-cover transition-transform duration-500 hover:scale-[1.015]"
        />
      </div>
      <figcaption className="mt-6 space-y-2">
        <CaptionBlock item={item} />
      </figcaption>
    </figure>
  );
}

function SplitGalleryCard({ item }: { item: GalleryItem }) {
  return (
    <article className="flex flex-col gap-6 rounded-3xl border border-border bg-muted/20 p-6 shadow-sm md:flex-row md:items-center">
      <div className="md:w-1/2">
        <img
          src={item.imageSrc}
          alt={item.subtitle ?? item.title}
          className="w-full rounded-2xl object-cover shadow-md"
        />
      </div>
      <div className="md:w-1/2 md:pl-6">
        <CaptionBlock item={item} align="left" />
        {item.modalImageSrc && (
          <Dialog>
            <DialogTrigger className="mt-6 inline-flex items-center gap-3 rounded-full border border-border/70 bg-background px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground transition hover:border-primary/50 hover:text-primary">
              <img
                src={item.modalImageSrc}
                alt="Open larger view"
                className="h-14 w-20 rounded-lg object-cover shadow-sm"
              />
              View larger
            </DialogTrigger>
            <DialogContent className="max-w-3xl rounded-3xl border border-border bg-background/95 p-0">
              <DialogHeader className="px-6 pt-6">
                <DialogTitle className="text-sm font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                  {item.subtitle ?? item.title}
                </DialogTitle>
              </DialogHeader>
              <img
                src={item.modalImageSrc}
                alt={item.subtitle ?? item.title}
                className="w-full rounded-b-3xl object-cover"
              />
            </DialogContent>
          </Dialog>
        )}
      </div>
    </article>
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
