"use client";

import { useProgress } from "../learning/progress-context";

type CourseLessonView = {
  archiveId: string;
  optional: boolean;
  title: string;
  available: boolean;
};

type CourseAwareContinueCardProps = {
  courseId: string;
  lessons: CourseLessonView[];
};

function archiveHref(archiveId: string, courseId: string) {
  return `/archive?id=${encodeURIComponent(archiveId)}&courseId=${encodeURIComponent(courseId)}`;
}

export default function CourseAwareContinueCard({ courseId, lessons }: CourseAwareContinueCardProps) {
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
      <a
        className="button button-primary learn-course-continue-link"
        href={archiveHref(nextLesson.archiveId, courseId)}
      >
        続きを見る
      </a>
    </section>
  );
}
