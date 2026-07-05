"use client";

import { useProgress } from "../learning/progress-context";
import type { LessonStatus } from "../learning/types";

type CourseLessonView = {
  archiveId: string;
  order: number;
  optional: boolean;
  title: string;
  available: boolean;
};

const STATUS_LABEL: Record<LessonStatus, string> = {
  unwatched: "未視聴",
  watched: "視聴済み",
  completed: "修了"
};

function archiveHref(archiveId: string) {
  return `/archive?id=${encodeURIComponent(archiveId)}`;
}

export function CourseProgressBadge({ courseArchiveIds }: { courseArchiveIds: string[] }) {
  const { state } = useProgress();

  const total = courseArchiveIds.length;
  if (total === 0) {
    return <span className="learn-course-progress-badge">対象なし</span>;
  }

  const completedCount = courseArchiveIds.filter((archiveId) => state.lessons[archiveId]?.status === "completed")
    .length;
  const rate = Math.round((completedCount / total) * 100);

  return (
    <span className="learn-course-progress-badge">
      {completedCount}/{total}（{rate}%）
    </span>
  );
}

export function LessonStatusBadge({ archiveId }: { archiveId: string }) {
  const { state } = useProgress();
  const status: LessonStatus = state.lessons[archiveId]?.status ?? "unwatched";

  return (
    <span
      className={`learn-status-badge${status === "completed" ? " learn-status-badge--completed" : ""}${
        status === "watched" ? " learn-status-badge--watched" : ""
      }`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

export function CourseContinueCard({ lessons }: { lessons: CourseLessonView[] }) {
  const { state } = useProgress();

  const requiredLessons = lessons.filter((lesson) => !lesson.optional && lesson.available);
  const nextLesson = requiredLessons.find((lesson) => state.lessons[lesson.archiveId]?.status !== "completed");

  if (requiredLessons.length === 0) {
    return null;
  }

  if (!nextLesson) {
    return (
      <section className="panel learn-course-continue" aria-labelledby="learn-course-continue-heading">
        <div className="section-kicker">続きから</div>
        <h2 id="learn-course-continue-heading" className="learn-course-continue-title">
          このコースは修了しました
        </h2>
      </section>
    );
  }

  return (
    <section className="panel learn-course-continue" aria-labelledby="learn-course-continue-heading">
      <div className="section-kicker">続きから</div>
      <h2 id="learn-course-continue-heading" className="learn-course-continue-title">
        {nextLesson.title}
      </h2>
      <a className="button button-primary learn-course-continue-link" href={archiveHref(nextLesson.archiveId)}>
        続きを見る
      </a>
    </section>
  );
}

export function CourseProgressSummary({ courseArchiveIds }: { courseArchiveIds: string[] }) {
  const { state } = useProgress();

  const total = courseArchiveIds.length;
  const completedCount = courseArchiveIds.filter((archiveId) => state.lessons[archiveId]?.status === "completed")
    .length;
  const rate = total > 0 ? Math.round((completedCount / total) * 100) : null;

  return (
    <section className="panel learn-course-progress" aria-labelledby="learn-course-progress-heading">
      <div className="section-kicker">進捗</div>
      <h2 id="learn-course-progress-heading" className="learn-visually-hidden">
        進捗
      </h2>
      <div className="learn-course-progress-head">
        <span className="learn-course-progress-count">
          {total > 0 ? `${completedCount}/${total}件 修了` : "対象なし"}
        </span>
        {total > 0 ? <span className="learn-course-progress-rate">{rate}%</span> : null}
      </div>
      {total > 0 ? (
        <div className="learn-progress-bar" role="presentation">
          <div className="learn-progress-bar-fill" style={{ width: `${rate}%` }} />
        </div>
      ) : null}
    </section>
  );
}
