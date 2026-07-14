"use client";

import { useEffect, useRef } from "react";
import { useProgress } from "./progress-context";
import { bumpStreak } from "./streak";
import type { LessonProgress, LessonStatus } from "./types";

const UNWATCHED_STATUS: LessonStatus = "unwatched";

// ローカルタイムの YYYY-MM-DD を返す（ストリーク判定の基準日）。
function todayLocalDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

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

      const next = {
        ...current,
        lessons: { ...current.lessons, [archiveId]: nextLesson }
      };
      return bumpStreak(next, todayLocalDate());
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

      const next = {
        ...current,
        lessons: { ...current.lessons, [archiveId]: nextLesson }
      };
      return bumpStreak(next, todayLocalDate());
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

export function useRecordVisit(archiveId: string | undefined, courseId?: string): void {
  const { update } = useProgress();
  const recordedVisitRef = useRef<string | null>(null);

  useEffect(() => {
    if (!archiveId) {
      return;
    }

    const visitKey = `${archiveId}\u0000${courseId ?? ""}`;
    if (recordedVisitRef.current === visitKey) {
      return;
    }
    recordedVisitRef.current = visitKey;

    update((current) => ({
      ...current,
      lastVisited: {
        archiveId,
        ...(courseId ? { courseId } : {}),
        at: new Date().toISOString()
      }
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [archiveId, courseId]);
}
