import type { ThemeCat } from "../lib/theme-category";

export type DashboardTheme = {
  id: string;
  name: string;
  cat?: ThemeCat;
};

export type DashboardArchive = {
  id: string;
  themeId: string;
  title: string;
  date?: string;
};

export type DashboardCourse = {
  id: string;
  title: string;
  level?: string;
  themeName: string;
  themeCat?: ThemeCat;
  /** 必修レッスンの archiveId 一覧（optional 除外済み）。進捗の分母として使う。 */
  requiredArchiveIds: string[];
};
