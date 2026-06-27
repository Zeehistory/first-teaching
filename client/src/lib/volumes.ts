import type { Volume } from "@shared/schema";
import { volumeOneData, volumeTwoData, volumeEighteenData } from "./content";

const placeholderDescription =
  "Detailed commentary and teaching materials for this volume are currently in preparation. Check back soon for updates as the manuscript is edited and prepared for digital release.";

const generatedVolumes: Volume[] = [
  {
    number: 1,
    title: "Syntopicon 1",
    subtitle: volumeOneData.volumeTitle,
    description: volumeOneData.introduction,
    status: "available",
    data: volumeOneData,
  },
  {
    number: 2,
    title: "Volume 2",
    subtitle: volumeTwoData.volumeTitle,
    description: volumeTwoData.introduction,
    status: "available",
    data: volumeTwoData,
  },
  {
    number: 18,
    title: "Syntopicon 18",
    subtitle: volumeEighteenData.volumeTitle,
    description: volumeEighteenData.introduction,
    status: "available",
    data: volumeEighteenData,
  },
];

for (let number = 3; number <= 19; number += 1) {
  if (number === 18) continue;
  generatedVolumes.push({
    number,
    title: `Volume ${number}`,
    subtitle: "In Development",
    description: placeholderDescription,
    status: "coming-soon",
  });
}

generatedVolumes.sort((a, b) => a.number - b.number);

export const volumes: Volume[] = generatedVolumes;

export const seriesOverview = {
  title: volumeOneData.seriesTitle,
  subtitle: volumeOneData.seriesSubtitle,
  author: volumeOneData.author,
  totalVolumes: 19,
  mission: "The First Teaching of the Last Message unfolds across nineteen volumes, guiding reader-listeners through the Divine Science and its pillars with rigorous scholarship, lived devotion, and pedagogical clarity.",
  invitation:
    "Each installment builds upon the last, nurturing functional certitude and rekindling the classical Teacher-Student relationship for contemporary seekers.",
};
