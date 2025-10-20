import type { Volume } from "@shared/schema";
import { completeBookData } from "./bookContent";

const placeholderDescription =
  "Detailed commentary and teaching materials for this volume are currently in preparation. Check back soon for updates as the manuscript is edited and prepared for digital release.";

export const volumes: Volume[] = Array.from({ length: 19 }, (_, index) => {
  const number = index + 1;

  if (number === 1) {
    return {
      number,
      title: `Volume ${number}`,
      subtitle: completeBookData.volumeTitle,
      description: completeBookData.introduction,
      status: "available",
      data: completeBookData,
    } satisfies Volume;
  }

  return {
    number,
    title: `Volume ${number}`,
    subtitle: "In Development",
    description: placeholderDescription,
    status: "coming-soon",
  } satisfies Volume;
});

export const seriesOverview = {
  title: completeBookData.seriesTitle,
  subtitle: completeBookData.seriesSubtitle,
  author: completeBookData.author,
  totalVolumes: 19,
  mission: "The First Teaching of the Last Message unfolds across nineteen volumes, guiding reader-listeners through the Divine Science and its pillars with rigorous scholarship, lived devotion, and pedagogical clarity.",
  invitation:
    "Each installment builds upon the last, nurturing functional certitude and rekindling the classical Teacher-Student relationship for contemporary seekers.",
};

