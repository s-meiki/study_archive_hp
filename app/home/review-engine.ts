import type { ProgressState } from "../learning/types";
import type { HomeArchive, HomeCourse, HomeLearningData } from "./home-types";

export type ReviewReason = "continue" | "review" | "refresh" | "next" | "start";

export type ReviewCandidate = {
  archiveId: string;
  courseId?: string;
  reason: ReviewReason;
  priority: number;
  score?: number;
};

export type CourseProgressView = HomeCourse & {
  completedCount: number;
  requiredCount: number;
  rate: number;
};

const reasonPriority: Record<ReviewReason, number> = {
  continue: 0,
  review: 1,
  next: 2,
  refresh: 3,
  start: 4
};

function hasMeaningfulProgress(state: ProgressState, archiveId: string) {
  const lesson = state.lessons[archiveId];
  return Boolean(
    lesson &&
      (lesson.status === "watched" ||
        lesson.status === "completed" ||
        typeof lesson.quizBestScore === "number")
  );
}

function firstCourseForArchive(courses: HomeCourse[], archiveId: string) {
  return courses.find((course) => course.lessons.some((lesson) => lesson.archiveId === archiveId));
}

export function buildReviewCandidates(data: HomeLearningData, state: ProgressState) {
  const archiveById = new Map(data.archives.map((archive) => [archive.id, archive]));
  const candidates = new Map<string, ReviewCandidate>();

  function enqueue(candidate: ReviewCandidate) {
    if (!archiveById.has(candidate.archiveId)) {
      return;
    }

    const existing = candidates.get(candidate.archiveId);
    if (!existing || candidate.priority < existing.priority) {
      candidates.set(candidate.archiveId, candidate);
    }
  }

  const lastVisited = state.lastVisited;
  if (lastVisited && archiveById.has(lastVisited.archiveId)) {
    const lesson = state.lessons[lastVisited.archiveId];
    const archive = archiveById.get(lastVisited.archiveId);
    const course =
      data.courses.find((item) => item.id === lastVisited.courseId) ??
      firstCourseForArchive(data.courses, lastVisited.archiveId);

    if (lesson?.status === "completed" && archive?.quiz && (lesson.quizBestScore ?? 0) < 1) {
      enqueue({
        archiveId: lastVisited.archiveId,
        courseId: course?.id,
        reason: "review",
        priority: 0,
        score: lesson.quizBestScore
      });
    } else if (lesson?.status !== "completed") {
      enqueue({
        archiveId: lastVisited.archiveId,
        courseId: course?.id,
        reason: "continue",
        priority: 0
      });
    }
  }

  for (const archive of data.archives) {
    const lesson = state.lessons[archive.id];
    const course = firstCourseForArchive(data.courses, archive.id);
    if (!lesson) {
      continue;
    }

    if (lesson.status === "watched") {
      enqueue({ archiveId: archive.id, courseId: course?.id, reason: "continue", priority: 10 });
    }

    if (
      archive.quiz &&
      (lesson.status === "completed" || typeof lesson.quizBestScore === "number") &&
      (lesson.quizBestScore ?? 0) < 1
    ) {
      enqueue({
        archiveId: archive.id,
        courseId: course?.id,
        reason: "review",
        priority: 20 + Math.round((lesson.quizBestScore ?? 0) * 10),
        score: lesson.quizBestScore
      });
    }
  }

  for (const course of [...data.courses].sort((a, b) => a.order - b.order)) {
    const hasCourseActivity =
      state.lastVisited?.courseId === course.id ||
      course.lessons.some((lesson) => hasMeaningfulProgress(state, lesson.archiveId));

    if (!hasCourseActivity) {
      continue;
    }

    const nextLesson = [...course.lessons]
      .sort((a, b) => a.order - b.order)
      .find(
        (lesson) =>
          !lesson.optional &&
          archiveById.has(lesson.archiveId) &&
          state.lessons[lesson.archiveId]?.status !== "completed"
      );

    if (nextLesson) {
      enqueue({ archiveId: nextLesson.archiveId, courseId: course.id, reason: "next", priority: 30 });
    }
  }

  const completedForRefresh = data.archives
    .filter((archive) => archive.quiz && state.lessons[archive.id]?.status === "completed")
    .sort((a, b) => {
      const aDate = state.lessons[a.id]?.completedAt ?? "";
      const bDate = state.lessons[b.id]?.completedAt ?? "";
      return aDate.localeCompare(bDate);
    });

  completedForRefresh.forEach((archive, index) => {
    enqueue({
      archiveId: archive.id,
      courseId: firstCourseForArchive(data.courses, archive.id)?.id,
      reason: "refresh",
      priority: 40 + index,
      score: state.lessons[archive.id]?.quizBestScore
    });
  });

  const ordered = [...candidates.values()].sort((a, b) => {
    const reasonOrder = reasonPriority[a.reason] - reasonPriority[b.reason];
    if (reasonOrder !== 0) {
      return reasonOrder;
    }
    return a.priority - b.priority;
  });

  if (ordered.length > 0) {
    return ordered;
  }

  const starterCourse = [...data.courses].sort((a, b) => a.order - b.order)[0];
  const starterLesson = starterCourse?.lessons
    .filter((lesson) => !lesson.optional && archiveById.has(lesson.archiveId))
    .sort((a, b) => a.order - b.order)[0];

  if (starterLesson) {
    return [
      {
        archiveId: starterLesson.archiveId,
        courseId: starterCourse.id,
        reason: "start" as const,
        priority: 90
      }
    ];
  }

  const firstArchive = [...data.archives].sort((a, b) => b.date.localeCompare(a.date))[0];
  return firstArchive
    ? [{ archiveId: firstArchive.id, reason: "start" as const, priority: 99 }]
    : [];
}

export function buildCourseProgress(data: HomeLearningData, state: ProgressState): CourseProgressView[] {
  return [...data.courses]
    .sort((a, b) => a.order - b.order)
    .map((course) => {
      const requiredLessons = course.lessons.filter((lesson) => !lesson.optional);
      const completedCount = requiredLessons.filter(
        (lesson) => state.lessons[lesson.archiveId]?.status === "completed"
      ).length;
      const requiredCount = requiredLessons.length;
      return {
        ...course,
        completedCount,
        requiredCount,
        rate: requiredCount > 0 ? Math.round((completedCount / requiredCount) * 100) : 0
      };
    });
}

export function hasAnyLearningProgress(data: HomeLearningData, state: ProgressState) {
  const lastVisitedIsAvailable = Boolean(
    state.lastVisited && data.archives.some((archive) => archive.id === state.lastVisited?.archiveId)
  );
  return lastVisitedIsAvailable || data.archives.some((archive) => hasMeaningfulProgress(state, archive.id));
}

export function archiveForCandidate(archives: HomeArchive[], candidate: ReviewCandidate | undefined) {
  return candidate ? archives.find((archive) => archive.id === candidate.archiveId) : undefined;
}
