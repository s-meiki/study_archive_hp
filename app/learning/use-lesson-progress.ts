"use client";

import { useEffect, useRef } from "react";
import { useProgress } from "./progress-context";
import type { LessonProgress, LessonStatus } from "./types";

const UNWATCHED_STATUS: LessonStatus = "unwatched";

export function useLessonProgress(archiveId: string) {
  const { state, update } = useProgress();
  const progress: LessonProgress | undefined = state.lessons[archiveId];
  const status: LessonStatus = progress?.status ?? UNWATCHED_STATUS;

  function markWatched(): void {
    update((current) => {
      const existing = current.lessons[archiveId];
      const now = new Date().toISOString();
      const nextLesson: LessonProgress = {
        ...existing,
        status: "watched",
        watchedAt: existing?.watchedAt ?? now
      };

      return {
        ...current,
        lessons: { ...current.lessons, [archiveId]: nextLesson }
      };
    });
  }

  function markCompleted(): void {
    update((current) => {
      const existing = current.lessons[archiveId];
      const now = new Date().toISOString();
      const nextLesson: LessonProgress = {
        ...existing,
        status: "completed",
        watchedAt: existing?.watchedAt ?? now,
        completedAt: now
      };

      return {
        ...current,
        lessons: { ...current.lessons, [archiveId]: nextLesson }
      };
    });
  }

  function resetToUnwatched(): void {
    update((current) => ({
      ...current,
      lessons: { ...current.lessons, [archiveId]: { status: "unwatched" } }
    }));
  }

  return { status, progress, markWatched, markCompleted, resetToUnwatched };
}

export function useRecordVisit(archiveId: string | undefined): void {
  const { update } = useProgress();
  const hasRecordedRef = useRef(false);

  useEffect(() => {
    if (!archiveId || hasRecordedRef.current) {
      return;
    }
    hasRecordedRef.current = true;

    update((current) => ({
      ...current,
      lastVisited: { archiveId, at: new Date().toISOString() }
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [archiveId]);
}
