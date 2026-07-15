"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeftIcon, CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react";
import { useLessonProgress, useRecordVisit } from "../../learning/use-lesson-progress";
import type { LessonStatus } from "../../learning/types";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import styles from "./lesson-context.module.css";

export type CourseLessonView = {
  archiveId: string;
  order: number;
  optional: boolean;
  title: string;
  available: boolean;
};

export type CourseView = {
  id: string;
  title: string;
  lessons: CourseLessonView[];
};

type LessonContextProps = {
  archiveId: string;
  courses: CourseView[];
};

const STATUS_LABEL: Record<LessonStatus, string> = {
  unwatched: "未視聴",
  watched: "視聴済み",
  completed: "修了"
};

function lessonHref(archiveId: string, courseId: string) {
  return `/archives/${encodeURIComponent(archiveId)}?courseId=${encodeURIComponent(courseId)}`;
}

// ?courseId= を読み、このアーカイブを含むコースの現在地（前後レッスン）を解決する。
function useCourseContext(archiveId: string, courses: CourseView[]) {
  const searchParams = useSearchParams();
  const courseId = searchParams.get("courseId") ?? "";
  const course = courseId ? courses.find((candidate) => candidate.id === courseId) ?? null : null;

  if (!course) {
    return null;
  }

  const availableLessons = course.lessons.filter((lesson) => lesson.available);
  const index = availableLessons.findIndex((lesson) => lesson.archiveId === archiveId);

  if (index < 0) {
    return null;
  }

  return {
    course,
    current: availableLessons[index],
    previous: index > 0 ? availableLessons[index - 1] : null,
    next: index < availableLessons.length - 1 ? availableLessons[index + 1] : null,
    totalCount: course.lessons.length
  };
}

// コース経由（?courseId=）で開いたときだけ表示する、コース内の現在地ストリップ。
export function CourseContextStrip({ archiveId, courses }: LessonContextProps) {
  const context = useCourseContext(archiveId, courses);

  if (!context) {
    return null;
  }

  return (
    <nav className={styles.strip} aria-label="コース学習の位置">
      <Link className={styles.stripBack} href={`/courses/${encodeURIComponent(context.course.id)}`}>
        <ArrowLeftIcon aria-hidden="true" />
        {context.course.title}
      </Link>
      <span className={`${styles.stripPosition} tabular-nums`}>
        第{context.current.order}回 / 全{context.totalCount}回
      </span>
      <span className={styles.stripNav}>
        {context.previous ? (
          <Link className={styles.stripNavLink} href={lessonHref(context.previous.archiveId, context.course.id)}>
            <CaretLeftIcon aria-hidden="true" />
            前のレッスン
          </Link>
        ) : null}
        {context.next ? (
          <Link className={styles.stripNavLink} href={lessonHref(context.next.archiveId, context.course.id)}>
            次のレッスン
            <CaretRightIcon aria-hidden="true" />
          </Link>
        ) : null}
      </span>
    </nav>
  );
}

// レッスン進捗コントロール。状態遷移は旧 lesson-progress-controls と同一:
// unwatched → 視聴済みにする / watched → 修了にする・未視聴に戻す / completed → 未視聴に戻す。
export function LessonProgressPanel({ archiveId, courses }: LessonContextProps) {
  const context = useCourseContext(archiveId, courses);
  useRecordVisit(archiveId, context?.course.id);
  const { status, markWatched, markCompleted, resetToUnwatched } = useLessonProgress(archiveId);

  return (
    <section className={styles.panel} aria-label="レッスン進捗">
      <div className={styles.panelHead}>
        <h2 className={styles.panelTitle}>学習の記録</h2>
        {status === "completed" ? (
          <Badge variant="status" status="success">
            {STATUS_LABEL.completed}
          </Badge>
        ) : (
          <Badge>{STATUS_LABEL[status]}</Badge>
        )}
      </div>

      <div className={styles.panelActions}>
        {status === "unwatched" ? <Button onClick={markWatched}>視聴済みにする</Button> : null}

        {status === "watched" ? (
          <>
            <Button onClick={markCompleted}>修了にする</Button>
            <Button variant="ghost" onClick={resetToUnwatched}>
              未視聴に戻す
            </Button>
          </>
        ) : null}

        {status === "completed" ? (
          <>
            {context?.next ? (
              <Button href={lessonHref(context.next.archiveId, context.course.id)}>次のレッスンへ</Button>
            ) : null}
            {context && !context.next ? (
              <Button href={`/courses/${encodeURIComponent(context.course.id)}`}>コースへ戻る</Button>
            ) : null}
            <Button variant="ghost" onClick={resetToUnwatched}>
              未視聴に戻す
            </Button>
          </>
        ) : null}
      </div>

      <p className={styles.panelNote}>この進捗はこの端末のブラウザにのみ保存されます。</p>
    </section>
  );
}
