import { volumeOneData } from "../../client/src/lib/content/volume1";
import { volumeOneWebExtensions } from "../../client/src/lib/content/volume1WebExtensions";

function stripTags(html: string) {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function assert(condition: unknown, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

const failures: string[] = [];

function record(condition: unknown, message: string) {
  if (!condition) failures.push(message);
}

for (const entry of Object.values(volumeOneWebExtensions)) {
  const markers = new Set(
    [...entry.content.matchAll(/data-footnote-key="([^"]+)"/g)].map((match) => match[1])
  );
  const footnotes = new Set(entry.footnotes.map((footnote) => footnote.markerKey ?? footnote.id));
  const missingMarkers = [...footnotes].filter((key) => !markers.has(key));
  const missingFootnotes = [...markers].filter((key) => !footnotes.has(key));

  record(
    missingMarkers.length === 0,
    `${entry.chapterId}: missing WebExtension markers for ${missingMarkers.join(", ")}`
  );
  record(
    missingFootnotes.length === 0,
    `${entry.chapterId}: missing WebExtension footnote entries for ${missingFootnotes.join(", ")}`
  );
}

for (const chapter of volumeOneData.chapters) {
  for (const section of chapter.sections) {
    const markerKeys = [
      ...section.content.matchAll(/data-footnote-key="([^"]+)"/g),
    ].map((match) => match[1]);
    const footnoteKeys = section.footnotes.map((footnote) => footnote.markerKey ?? footnote.id);
    const duplicateKeys = markerKeys.filter((key, index) => markerKeys.indexOf(key) !== index);
    const missingFootnoteEntries = markerKeys.filter((key) => !footnoteKeys.includes(key));
    const missingMarkers = footnoteKeys.filter((key) => !markerKeys.includes(key));
    const adjacentMarkers = [
      ...section.content.matchAll(
        /<sup data-footnote="\d+"[^>]*>[\s\S]*?<\/sup>\s*<sup data-footnote="\d+"/g
      ),
    ];
    const nestedStrong = section.content.match(/<strong>\s*<strong>|<\/strong>\s*<\/strong>/g) ?? [];
    const genericAnchors = [
      ...section.content.matchAll(
        /<strong>(to be|of|in|and|the|is|are|was|were)<\/strong><sup data-footnote="\d+"/gi
      ),
    ];

    record(
      duplicateKeys.length === 0,
      `${chapter.id}/${section.id}: duplicate marker keys ${[...new Set(duplicateKeys)].join(", ")}`
    );
    record(
      missingFootnoteEntries.length === 0,
      `${chapter.id}/${section.id}: markers without footnote entries ${missingFootnoteEntries.join(", ")}`
    );
    record(
      missingMarkers.length === 0,
      `${chapter.id}/${section.id}: footnote entries without markers ${missingMarkers.join(", ")}`
    );
    record(
      adjacentMarkers.length === 0,
      `${chapter.id}/${section.id}: adjacent doubled footnote markers found`
    );
    record(
      nestedStrong.length === 0,
      `${chapter.id}/${section.id}: nested/overlapping bold tags found`
    );
    record(
      genericAnchors.length === 0,
      `${chapter.id}/${section.id}: generic bold footnote anchors found`
    );
  }
}

const mainMarkerCount = volumeOneData.chapters
  .flatMap((chapter) => chapter.sections)
  .reduce((count, section) => count + (section.content.match(/data-footnote=/g) ?? []).length, 0);
const mainFootnoteCount = volumeOneData.chapters
  .flatMap((chapter) => chapter.sections)
  .reduce((count, section) => count + section.footnotes.length, 0);
const extensionMarkerCount = Object.values(volumeOneWebExtensions).reduce(
  (count, entry) => count + (entry.content.match(/data-footnote=/g) ?? []).length,
  0
);
const extensionFootnoteCount = Object.values(volumeOneWebExtensions).reduce(
  (count, entry) => count + entry.footnotes.length,
  0
);

assert(extensionMarkerCount === extensionFootnoteCount, "WebExtension marker count mismatch");
assert(mainMarkerCount === mainFootnoteCount, "Main marker count mismatch");

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log(
  JSON.stringify(
    {
      mainMarkerCount,
      mainFootnoteCount,
      extensionMarkerCount,
      extensionFootnoteCount,
      checkedChapters: volumeOneData.chapters.length,
      checkedWebExtensions: Object.keys(volumeOneWebExtensions).length,
      sampleMainFootnote: stripTags(volumeOneData.chapters[1].sections[0].footnotes[0]?.content ?? ""),
    },
    null,
    2
  )
);
