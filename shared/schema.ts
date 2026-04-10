import { z } from "zod";

export interface Footnote {
  id: string;
  number: number;
  content: string;
  sectionId: string;
  displayNumber?: number;
  markerKey?: string;
  origin?: "syntopicon" | "web-extension";
}

export const insertUserSchema = z.object({
  username: z.string(),
  passwordHash: z.string(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;

export const userSchema = insertUserSchema.extend({
  id: z.string(),
});

export type User = z.infer<typeof userSchema>;

export interface Section {
  id: string;
  title: string;
  level: number;
  parentId: string | null;
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
  volumeNumber: number;
  volumeTitle: string;
  seriesTitle: string;
  seriesSubtitle: string;
  author: string;
  introduction: string;
  totalVolumes: number;
  chapters: Chapter[];
}

export interface WebExtensionEntry {
  id: string;
  markerCode: string;
  ordinal: number;
  volumeNumber: number;
  chapterId: string;
  chapterTitle: string;
  title: string;
  content: string;
  footnotes: Footnote[];
}

export type VolumeStatus = "available" | "in-progress" | "coming-soon";

export interface VolumeSummary {
  number: number;
  title: string;
  subtitle?: string;
  description: string;
  status: VolumeStatus;
  coverImage?: string;
}

export interface Volume extends VolumeSummary {
  data?: BookData;
}
