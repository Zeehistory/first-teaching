import { z } from "zod";

export interface Footnote {
  id: string;
  number: number;
  content: string;
  sectionId: string;
}

export interface Section {
  id: string;
  title: string;
  content: string;
  pageReference?: number;
  footnotes: Footnote[];
}

export interface Chapter {
  id: string;
  number: number;
  title: string;
  description: string;
  sections: Section[];
}

export interface BookData {
  title: string;
  subtitle: string;
  introduction: string;
  chapters: Chapter[];
}
