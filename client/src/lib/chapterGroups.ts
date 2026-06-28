import type { Chapter } from "@shared/schema";

/**
 * Chapter grouping shared by the nav sidebar and the Contents/TOC.
 *
 * A "Book …" chapter is a subsection that nests under the most recent thematic
 * chapter (a Part). Anything that isn't a "Book" — descriptive thematic
 * titles, Introduction, Conclusion — is a Part header in its own right. The
 * flat chapter list is grouped so both surfaces read as Parts with their
 * Books indented beneath.
 */
export const isBookChapter = (chapter: Chapter) =>
  /^\s*book\b/i.test(chapter.title);

export interface ChapterGroup {
  part: { chapter: Chapter; index: number } | null;
  books: Array<{ chapter: Chapter; index: number }>;
}

export function groupChapters(chapters: Chapter[]): ChapterGroup[] {
  const groups: ChapterGroup[] = [];
  chapters.forEach((chapter, index) => {
    if (isBookChapter(chapter)) {
      // A Book with no preceding Part stands on its own (no parent).
      const current = groups[groups.length - 1];
      if (current && current.part) {
        current.books.push({ chapter, index });
      } else {
        groups.push({ part: null, books: [{ chapter, index }] });
      }
    } else {
      groups.push({ part: { chapter, index }, books: [] });
    }
  });
  return groups;
}
