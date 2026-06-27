export { volumeOneData } from "./content/volume1";
export { volumeOneWebExtensions } from "./content/volume1WebExtensions";
export { volumeTwoData } from "./content/volume2";
export { volumeEighteenData } from "./content/volume18";
export { volumeEighteenWebExtensions } from "./content/volume18WebExtensions";

export function hasRenderableContent(html: string | null | undefined): boolean {
  if (!html) return false;
  const stripped = html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  return stripped.length > 0;
}
