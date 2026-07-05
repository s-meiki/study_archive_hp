import { readFile } from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";

import type { ArchiveQuiz, LearningContent, QuizBank } from "./learning/types";

export type SiteTheme = {
  id: string;
  name: string;
  summary?: string;
};

export type SiteArchive = {
  id: string;
  themeId: string;
  title: string;
  summary: string;
  speaker?: string;
  date?: string;
  startAt?: string;
  endAt?: string;
  updatedAt?: string;
  duration?: string;
  featured?: boolean;
  assets?: {
    recording?: boolean;
    slides?: boolean;
    notes?: boolean;
    references?: boolean;
  };
  links?: {
    recording?: string;
    slides?: string;
    notes?: string;
    references?: string;
  };
};

export type SiteContent = {
  themes: SiteTheme[];
  archives: SiteArchive[];
};

export type AnnualMeeting = {
  id: string;
  eventName: string;
  society: string;
  status?: "confirmed" | "pending" | "past";
  primaryUrl?: string;
  imageUrl?: string;
  startDate?: string;
  endDate?: string;
  archivedAt?: string;
  note?: string;
  milestones?: Array<{
    id: string;
    label: string;
    category?: "abstract" | "registration" | "deadline" | "info";
    startDate?: string;
    endDate?: string;
    note?: string;
  }>;
};

export type AnnualMeetingsData = {
  fiscalYear: string;
  period: {
    start: string;
    end: string;
  };
  verifiedAt: string;
  meetings: AnnualMeeting[];
};

async function readWindowAssignedJson<T>(relativePath: string, variableName: string) {
  const filePath = path.join(process.cwd(), relativePath);
  const raw = await readFile(filePath, "utf8");
  const propertyName = variableName.replace(/^window\./, "");
  const context = {
    window: {}
  };

  vm.createContext(context);
  new vm.Script(raw, { filename: relativePath }).runInContext(context);

  return (context.window as Record<string, T>)[propertyName];
}

let siteContentPromise: Promise<SiteContent> | null = null;
let annualMeetingsPromise: Promise<AnnualMeetingsData> | null = null;

export function loadSiteContent() {
  siteContentPromise ??= readWindowAssignedJson<SiteContent>("public/data/site-content.js", "window.STUDY_ARCHIVE_DATA");
  return siteContentPromise;
}

export function loadAnnualMeetingsData() {
  annualMeetingsPromise ??= readWindowAssignedJson<AnnualMeetingsData>(
    "public/data/annual-meetings-2026.js",
    "window.ANNUAL_MEETINGS_2026_DATA"
  );
  return annualMeetingsPromise;
}

const EMPTY_LEARNING_CONTENT: LearningContent = { schemaVersion: 1, courses: [] };
let learningContentPromise: Promise<LearningContent> | null = null;

async function readLearningContent(): Promise<LearningContent> {
  try {
    const data = await readWindowAssignedJson<LearningContent>(
      "public/data/learning-content.js",
      "window.LEARNING_CONTENT"
    );

    if (!data || !Array.isArray(data.courses)) {
      return EMPTY_LEARNING_CONTENT;
    }

    return { schemaVersion: 1, courses: data.courses };
  } catch {
    return EMPTY_LEARNING_CONTENT;
  }
}

export function loadLearningContent(): Promise<LearningContent> {
  learningContentPromise ??= readLearningContent();
  return learningContentPromise;
}

const EMPTY_QUIZ_BANK: QuizBank = { schemaVersion: 1, quizzes: [] };
let quizBankPromise: Promise<QuizBank> | null = null;

async function readQuizBank(): Promise<QuizBank> {
  try {
    const data = await readWindowAssignedJson<QuizBank>(
      "public/data/quiz-bank.js",
      "window.QUIZ_BANK"
    );

    if (!data || !Array.isArray(data.quizzes)) {
      return EMPTY_QUIZ_BANK;
    }

    return { schemaVersion: 1, quizzes: data.quizzes };
  } catch {
    return EMPTY_QUIZ_BANK;
  }
}

export function loadQuizBank(): Promise<QuizBank> {
  quizBankPromise ??= readQuizBank();
  return quizBankPromise;
}

export async function findQuizForArchive(archiveId: string): Promise<ArchiveQuiz | null> {
  if (!archiveId) {
    return null;
  }

  const bank = await loadQuizBank();
  return bank.quizzes.find((quiz) => quiz.archiveId === archiveId) ?? null;
}

export async function findArchiveById(archiveId: string) {
  if (!archiveId) {
    return null;
  }

  const data = await loadSiteContent();
  return data.archives.find((archive) => archive.id === archiveId) ?? null;
}
