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
export type QuizQuestionType = "single" | "multiple";
export type QuizQuestion = {
  id: string;
  prompt: string;
  // type 省略時は "single"（従来どおり単一正答）。"multiple" は複数正答。
  type?: QuizQuestionType;
  choices: QuizChoice[];
  // single では answerId（choices のいずれか1つ）。
  answerId?: string;
  // multiple では answerIds（choices のうち 2〜choices-1 個）。
  answerIds?: string[];
  explanation?: string;
  // 設問単位のレビュー状態。"draft" の設問はビルド時に quiz-bank から除外される安全弁。
  reviewStatus?: "draft" | "reviewed";
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
