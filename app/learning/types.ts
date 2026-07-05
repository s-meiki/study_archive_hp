export type CourseLessonRef = {
  archiveId: string;
  order: number;
  optional?: boolean;
  labelOverride?: string;
};

export type Course = {
  id: string;
  themeId: string;
  title: string;
  summary: string;
  level?: "入門" | "標準" | "発展";
  order: number;
  lessons: CourseLessonRef[];
  updatedAt: string;
};

export type LearningContent = { schemaVersion: 1; courses: Course[] };

export type QuizChoice = { id: string; text: string };
export type QuizQuestion = {
  id: string;
  prompt: string;
  choices: QuizChoice[];
  answerId: string;
  explanation?: string;
};
export type ArchiveQuiz = {
  archiveId: string;
  passThreshold: number;
  questions: QuizQuestion[];
  reviewStatus: "draft" | "reviewed";
  generatedBy?: string;
  updatedAt: string;
};
export type QuizBank = { schemaVersion: 1; quizzes: ArchiveQuiz[] };

export type BadgeId = string;
export type BadgeCriteria =
  | { type: "course-complete"; courseId: string }
  | { type: "theme-complete"; themeId: string }
  | { type: "streak"; days: number }
  | { type: "first-lesson" };
export type BadgeDef = {
  id: BadgeId;
  title: string;
  description: string;
  criteria: BadgeCriteria;
};

export type LessonStatus = "unwatched" | "watched" | "completed";
export type LessonProgress = {
  status: LessonStatus;
  watchedAt?: string;
  completedAt?: string;
  lastPositionSec?: number;
  quizBestScore?: number;
};

export type ProgressState = {
  schemaVersion: 1;
  updatedAt: string;
  lessons: Record<string, LessonProgress>;
  lastVisited?: { archiveId: string; courseId?: string; at: string };
  streak: { current: number; longest: number; lastActiveDate: string };
  earnedBadges: Record<BadgeId, string>;
};
