export { volumeOneData } from "./content/volume1";
export { volumeOneWebExtensions } from "./content/volume1WebExtensions";
export { volumeTwoData } from "./content/volume2";
export { volumeThirteenData } from "./content/volume13";
export { volumeThirteenWebExtensions } from "./content/volume13WebExtensions";
export { volumeFourteenData } from "./content/volume14";
export { volumeFourteenWebExtensions } from "./content/volume14WebExtensions";
export { volumeFifteenData } from "./content/volume15";
export { volumeFifteenWebExtensions } from "./content/volume15WebExtensions";
export { volumeSixteenData } from "./content/volume16";
export { volumeSixteenWebExtensions } from "./content/volume16WebExtensions";
export { volumeSeventeenData } from "./content/volume17";
export { volumeSeventeenWebExtensions } from "./content/volume17WebExtensions";
export { volumeEighteenData } from "./content/volume18";
export { volumeEighteenWebExtensions } from "./content/volume18WebExtensions";
export { volumeNineteenBibliography } from "./content/volume19Bibliography";

export function hasRenderableContent(html: string | null | undefined): boolean {
  if (!html) return false;
  const stripped = html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  return stripped.length > 0;
}
