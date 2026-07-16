"use client";

import { useProgress } from "../learning/progress-context";
import type { CourseBadgeSource } from "../learning/badge-engine";
import BadgesPanel from "./badges-panel";
import ContinueCard from "./continue-card";
import CourseProgressPanel from "./course-progress-panel";
import DashboardStats from "./dashboard-stats";
import DataPortability from "./data-portability";
import ThemeProgress from "./theme-progress";
import type { DashboardArchive, DashboardCourse, DashboardTheme } from "./dashboard-types";
import styles from "./dashboard-body.module.css";

type DashboardBodyProps = {
  themes: DashboardTheme[];
  archives: DashboardArchive[];
  courses: DashboardCourse[];
  badgeSources: CourseBadgeSource[];
};

export default function DashboardBody({ themes, archives, courses, badgeSources }: DashboardBodyProps) {
  const { hydrated } = useProgress();

  if (!hydrated) {
    return (
      <div className={styles.loading} aria-busy="true" aria-live="polite">
        学習記録を確認中…
      </div>
    );
  }

  return (
    <div className={styles.stack}>
      <DashboardStats archives={archives} badgeSources={badgeSources} />
      <ContinueCard archives={archives} themes={themes} />
      <div className={styles.progressGrid}>
        <ThemeProgress themes={themes} archives={archives} />
        <CourseProgressPanel courses={courses} />
      </div>
      <BadgesPanel courses={badgeSources} />
      <DataPortability />
      <p className={styles.storageNote}>進捗はこの端末のブラウザに保存されます。</p>
    </div>
  );
}
