export type HomeTheme = {
  id: string;
  name: string;
  summary: string;
};
export type HomeArchive = {
  id: string;
  themeId: string;
  title: string;
  summary: string;
  overview: string;
  keyPoints: string[];
  speaker: string;
  date: string;
  duration: string;
  assets: {
    recording: boolean;
    slides: boolean;
    notes: boolean;
    references: boolean;
  };
  quiz: {
    questionCount: number;
    passThreshold: number;
  } | null;
};

export type HomeCourseLesson = {
  archiveId: string;
  order: number;
  optional: boolean;
  label: string;
};

export type HomeCourse = {
  id: string;
  themeId: string;
  title: string;
  summary: string;
  level: string;
  order: number;
  lessons: HomeCourseLesson[];
};

export type HomeLearningData = {
  themes: HomeTheme[];
  archives: HomeArchive[];
  courses: HomeCourse[];
};
