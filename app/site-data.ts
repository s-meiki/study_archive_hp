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
  detail?: {
    overview?: string;
    keyPoints?: string[];
    chapters?: Array<{ label?: string; time?: string }>;
    materials?: Array<{ label?: string; url?: string }>;
  };
};

export type SiteContent = {
  themes: SiteTheme[];
  archives: SiteArchive[];
};

export type AnnualMeetingSource = {
  label?: string;
  url?: string;
};

export type AnnualMeetingMilestone = {
  id: string;
  label?: string;
  category?: "abstract" | "registration" | "deadline" | "info";
  startDate?: string;
  endDate?: string;
  note?: string;
};

export type AnnualMeeting = {
  id: string;
  eventName: string;
  society: string;
  status?: "confirmed" | "pending" | "past";
  scope?: "local" | "national";
  displayMonth?: number;
  primaryUrl?: string;
  imageUrl?: string;
  imageFit?: "cover" | "contain";
  startDate?: string;
  endDate?: string;
  sortDate?: string;
  city?: string;
  venue?: string;
  theme?: string;
  leadLabel?: string;
  lead?: string;
  archivedAt?: string;
  note?: string;
  sources?: AnnualMeetingSource[];
  milestones?: AnnualMeetingMilestone[];
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
  new vm.Script(raw, { filename: relativePath }).runInContext(context, { timeout: 1000 });

  return (context.window as Record<string, T>)[propertyName];
}

export const loadSiteContent = createDataLoader<SiteContent>(
  "public/data/site-content.js", "window.STUDY_ARCHIVE_DATA",
  (data) => isRecord(data) && Array.isArray(data.themes) && Array.isArray(data.archives)
);

export const loadAnnualMeetingsData = createDataLoader<AnnualMeetingsData>(
  "public/data/annual-meetings-2026.js", "window.ANNUAL_MEETINGS_2026_DATA",
  (data) => isRecord(data) && Array.isArray(data.meetings) && isRecord(data.period)
);

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function hasText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function validCourse(value: unknown) {
  if (!isRecord(value)) return false;
  return [value.id, value.themeId, value.title, value.updatedAt].every(hasText)
    && typeof value.summary === "string"
    && Number.isFinite(value.order)
    && Array.isArray(value.lessons)
    && value.lessons.every((lesson) => isRecord(lesson) && hasText(lesson.archiveId)
      && Number.isFinite(lesson.order)
      && (lesson.optional === undefined || typeof lesson.optional === "boolean")
      && (lesson.labelOverride === undefined || typeof lesson.labelOverride === "string"));
}

function validQuiz(value: unknown) {
  if (!isRecord(value) || !hasText(value.archiveId) || !hasText(value.updatedAt)
    || value.reviewStatus !== "reviewed"
    || typeof value.passThreshold !== "number" || !Number.isFinite(value.passThreshold)
    || value.passThreshold < 0 || value.passThreshold > 1
    || !Array.isArray(value.questions) || value.questions.length === 0) return false;
  return value.questions.every((question) => {
    if (!isRecord(question) || !hasText(question.id) || !hasText(question.prompt)
      || !Array.isArray(question.choices) || question.choices.length < 2
      || !question.choices.every((choice) => isRecord(choice) && hasText(choice.id) && hasText(choice.text))) return false;
    const ids = question.choices.map((choice) => choice.id);
    if (new Set(ids).size !== ids.length) return false;
    if (question.type === "multiple") {
      return Array.isArray(question.answerIds) && question.answerIds.length >= 2
        && question.answerIds.length < ids.length
        && new Set(question.answerIds).size === question.answerIds.length
        && question.answerIds.every((id) => ids.includes(id));
    }
    return (question.type === undefined || question.type === "single") && ids.includes(question.answerId);
  });
}

// A rejected promise must be evicted so the next request can retry after recovery.
function createDataLoader<T>(relativePath: string, variableName: string, validate: (value: unknown) => boolean) {
  let pending: Promise<T> | null = null;
  return (): Promise<T> => {
    pending ??= readWindowAssignedJson<T>(relativePath, variableName)
      .then((data) => {
        if (!validate(data)) throw new Error(`Invalid data schema: ${relativePath}`);
        return data;
      })
      .catch((error: unknown) => {
        pending = null;
        console.error(`[site-data] Unable to load ${relativePath}`, error);
        throw new Error("教材データを読み込めませんでした。時間をおいて再度お試しください。");
      });
    return pending;
  };
}

export const loadLearningContent = createDataLoader<LearningContent>(
  "public/data/learning-content.js", "window.LEARNING_CONTENT",
  (data) => isRecord(data) && data.schemaVersion === 1 && Array.isArray(data.courses)
    && data.courses.every(validCourse)
    && new Set(data.courses.map((course) => course.id)).size === data.courses.length
);

export const loadQuizBank = createDataLoader<QuizBank>(
  "public/data/quiz-bank.js", "window.QUIZ_BANK",
  (data) => isRecord(data) && data.schemaVersion === 1 && Array.isArray(data.quizzes)
    && data.quizzes.every(validQuiz)
    && new Set(data.quizzes.map((quiz) => quiz.archiveId)).size === data.quizzes.length
);

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
