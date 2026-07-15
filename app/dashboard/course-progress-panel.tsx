"use client";

import Link from "next/link";
import { useProgress } from "../learning/progress-context";
import { Badge } from "../ui/badge";
import { Card, CardHeader } from "../ui/card";
import { ProgressRing } from "../ui/progress-ring";
import type { DashboardCourse } from "./dashboard-types";
import styles from "./course-progress-panel.module.css";

type CourseProgressPanelProps = {
  courses: DashboardCourse[];
};

export default function CourseProgressPanel({ courses }: CourseProgressPanelProps) {
  const { state } = useProgress();

  return (
    <Card>
      <CardHeader
        title="コース進捗"
        action={
          <Link className="text-link" href="/courses">
            コース一覧
          </Link>
        }
      />
      <ul className={styles.list}>
        {courses.map((course) => {
          const total = course.requiredArchiveIds.length;
          const completedCount = course.requiredArchiveIds.filter(
            (archiveId) => state.lessons[archiveId]?.status === "completed"
          ).length;

          return (
            <li key={course.id} className={styles.row}>
              <ProgressRing
                value={completedCount}
                max={total}
                label={`${course.title} 進捗 ${total}レッスン中${completedCount}件`}
              />
              <div className={styles.body}>
                <Link className={styles.name} href={`/courses/${encodeURIComponent(course.id)}`}>
                  {course.title}
                </Link>
                <div className={styles.meta}>
                  <Badge variant={course.themeCat ? "theme" : "neutral"} cat={course.themeCat}>
                    {course.themeName}
                  </Badge>
                  {course.level ? <Badge>{course.level}</Badge> : null}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
