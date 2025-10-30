export { volumeOneData } from "./content/volume1";
export { volumeTwoData } from "./content/volume2";

export function hasRenderableContent(html: string | null | undefined): boolean {
  if (!html) return false;
  const stripped = html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  return stripped.length > 0;
}
