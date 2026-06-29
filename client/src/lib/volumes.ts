import type { Volume } from "@shared/schema";
import {
  volumeOneData,
  volumeTwoData,
  volumeThirteenData,
  volumeFourteenData,
  volumeFifteenData,
  volumeSixteenData,
  volumeSeventeenData,
  volumeEighteenData,
  volumeNineteenBibliography,
} from "./content";

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
    number: 13,
    title: "Syntopicon 13",
    subtitle: volumeThirteenData.volumeTitle,
    description: volumeThirteenData.introduction,
    status: "available",
    data: volumeThirteenData,
  },
  {
    number: 14,
    title: "Syntopicon 14",
    subtitle: volumeFourteenData.volumeTitle,
    description: volumeFourteenData.introduction,
    status: "available",
    data: volumeFourteenData,
  },
  {
    number: 15,
    title: "Syntopicon 15",
    subtitle: volumeFifteenData.volumeTitle,
    description: volumeFifteenData.introduction,
    status: "available",
    data: volumeFifteenData,
  },
  {
    number: 16,
    title: "Syntopicon 16",
    subtitle: volumeSixteenData.volumeTitle,
    description: volumeSixteenData.introduction,
    status: "available",
    data: volumeSixteenData,
  },
  {
    number: 17,
    title: "Syntopicon 17",
    subtitle: volumeSeventeenData.volumeTitle,
    description: volumeSeventeenData.introduction,
    status: "available",
    data: volumeSeventeenData,
  },
  {
    number: 18,
    title: "Syntopicon 18",
    subtitle: volumeEighteenData.volumeTitle,
    description: volumeEighteenData.introduction,
    status: "available",
    data: volumeEighteenData,
  },
  {
    number: 19,
    title: "Volume 19",
    subtitle: volumeNineteenBibliography.title,
    description: volumeNineteenBibliography.introduction,
    status: "available",
    bibliography: volumeNineteenBibliography,
  },
];

for (let number = 3; number <= 19; number += 1) {
  if ([13, 14, 15, 16, 17, 18, 19].includes(number)) continue;
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
