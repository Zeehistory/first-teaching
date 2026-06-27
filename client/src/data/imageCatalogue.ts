export type GalleryFootnote = {
  id: string;
  label: string;
  body: string;
};

export type GalleryItem = {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  imageSrc: string;
  modalImageSrc?: string;
  layout?: "default" | "split" | "floated";
  footnote?: GalleryFootnote;
};

// Prefix bundled public assets with the build base path so they resolve under
// sub-path hosting (GitHub Pages /first-teaching/). On Vercel BASE_URL is "/",
// so this is a no-op.
const asset = (p: string) =>
  `${(import.meta.env.BASE_URL ?? "/").replace(/\/$/, "")}${p}`;

export const imageCatalogue: GalleryItem[] = [
  {
    id: "image-1",
    title: "Image 1",
    subtitle: "Small Garland of Many Thanks",
    description:
      "Tokens of gratitude woven together for those who made this work possible.",
    imageSrc:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=80",
  },
  {
    id: "image-tarbha",
    title: "Inserted Portrait",
    subtitle: "Image 2",
    description:
      "Al-Sayyid ‘Abd-al-Shakūr, compliments of Ithar Abusheikha.",
    imageSrc: asset("/images/tarbha-waale-baba.jpg"),
    modalImageSrc: asset("/images/tarbha-waale-baba.jpg"),
  },
  {
    id: "[EXAMPLE]image-2",
    title: "[EXAMPLE] Image 2",
    subtitle: "Al-Sayyid ‘Abd-al-Shakūr",
    description:
      "A portrait of the beloved teacher whose humility and presence anchored the community.",
    imageSrc:
      "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "image-3",
    title: "Image 3",
    subtitle: "Wonder & Wisdom",
    description:
      "“Wonder is the beginning of wisdom.” — Socrates. Curiosity becomes the doorway to understanding.",
    imageSrc:
      "https://images.unsplash.com/photo-1477414348463-c0eb7f1359b6?auto=format&fit=crop&w=1400&q=80",
  },
  {
    id: "image-13",
    title: "[EXAMPLE] Image 13",
    subtitle: "Cornell over Cayuga Valley",
    description:
      "“The unexamined life is not worth having any man live it.” — Socrates. Reflections across Cayuga Lake at dawn.",
    imageSrc: asset("/images/cayuga-valley.jpg"),
    modalImageSrc: asset("/images/cayuga-valley-detail.jpg"),
    layout: "floated",
    footnote: {
      id: "fn-13",
      label: "fn 13",
      body:
        "This photograph was taken during the author’s years at Cornell, overlooking the Cayuga Lake Valley where many of the defining questions of his spiritual journey first emerged.",
    },
  },
];
