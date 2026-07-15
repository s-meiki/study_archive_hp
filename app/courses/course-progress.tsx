"use client";

import { useProgress } from "../learning/progress-context";
import type { LessonStatus } from "../learning/types";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { ProgressBar } from "../ui/progress-bar";
import { ProgressRing } from "../ui/progress-ring";
import styles from "./course-progress.module.css";

export type CourseLessonView = {
  archiveId: string;
  order: number;
  optional: boolean;
  title: string;
  available: boolean;
};

function archiveHref(archiveId: string, courseId: string) {
  return `/archives/${encodeURIComponent(archiveId)}?courseId=${encodeURIComponent(courseId)}`;
}

/** コース一覧カード用の進捗リング（分母は必修レッスンのみ）。 */
export function CourseProgressRing({ courseArchiveIds }: { courseArchiveIds: string[] }) {
  const { state } = useProgress();
  const total = courseArchiveIds.length;

  if (total === 0) {
    return <span className={styles.noTarget}>対象なし</span>;
  }

  const completedCount = courseArchiveIds.filter(
    (archiveId) => state.lessons[archiveId]?.status === "completed"
  ).length;

  return (
    <ProgressRing
      value={completedCount}
      max={total}
      label={`進捗 ${total}レッスン中${completedCount}件修了`}
    />
  );
}

/** レッスン一覧行の視聴状態バッジ。completed のみ status色、それ以外は中立表示。 */
export function LessonStatusBadge({ archiveId }: { archiveId: string }) {
  const { state } = useProgress();
  const status: LessonStatus = state.lessons[archiveId]?.status ?? "unwatched";

  if (status === "completed") {
    return (
      <Badge variant="status" status="success">
        修了
      </Badge>
    );
  }

  if (status === "watched") {
    return <Badge>視聴済み</Badge>;
  }

  return <Badge>未視聴</Badge>;
}

/** コースシラバス冒頭の「続きから」導線。必修レッスンのうち最初の未修了回へ誘導する。 */
export function CourseContinueSection({
  courseId,
  lessons
}: {
  courseId: string;
  lessons: CourseLessonView[];
}) {
  const { state } = useProgress();
  const requiredLessons = lessons.filter((lesson) => !lesson.optional && lesson.available);
  const nextLesson = requiredLessons.find((lesson) => state.lessons[lesson.archiveId]?.status !== "completed");

  if (requiredLessons.length === 0) {
    return null;
  }

  if (!nextLesson) {
    return (
      <Card className={styles.continueCard}>
        <p className={styles.eyebrow}>続きから</p>
        <h2 className={styles.continueTitle}>このコースは修了しました</h2>
      </Card>
    );
  }

  return (
    <Card className={styles.continueCard}>
      <p className={styles.eyebrow}>続きから</p>
      <h2 className={styles.continueTitle}>{nextLesson.title}</h2>
      <Button href={archiveHref(nextLesson.archiveId, courseId)} variant="primary">
        続きを見る
      </Button>
    </Card>
  );
}

/** コース全体の進捗（セグメント式バー）。分母は必修レッスンのみ（optional 除外済みの配列を渡すこと）。 */
export function CourseProgressSummary({ courseArchiveIds }: { courseArchiveIds: string[] }) {
  const { state } = useProgress();
  const total = courseArchiveIds.length;

  if (total === 0) {
    return <p className={styles.noTarget}>進捗の対象となるレッスンがありません。</p>;
  }

  const completedCount = courseArchiveIds.filter(
    (archiveId) => state.lessons[archiveId]?.status === "completed"
  ).length;
  const rate = Math.round((completedCount / total) * 100);

  return (
    <div className={styles.summary}>
      <div className={styles.summaryHead}>
        <span className={styles.summaryCount}>
          {completedCount}/{total}件 修了
        </span>
        <span className={styles.summaryRate}>{rate}%</span>
      </div>
      <ProgressBar
        mode="segmented"
        value={completedCount}
        max={total}
        label={`コース進捗 ${total}レッスン中${completedCount}件修了`}
      />
    </div>
  );
}
