import type { LessonProgress, LessonStatus, ProgressState } from "./types";

export const PROGRESS_STORAGE_KEY = "cawg.learning.progress.v1";

const LESSON_STATUSES: LessonStatus[] = ["unwatched", "watched", "completed"];

export function createDefaultProgressState(): ProgressState {
  return {
    schemaVersion: 1,
    updatedAt: new Date().toISOString(),
    lessons: {},
    streak: { current: 0, longest: 0, lastActiveDate: "" },
    earnedBadges: {}
  };
}

// Stable module-level default so server renders share one reference (useSyncExternalStore).
const SERVER_DEFAULT_STATE: ProgressState = createDefaultProgressState();

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function salvageLesson(value: unknown): LessonProgress | undefined {
  if (!isPlainObject(value)) {
    return undefined;
  }

  const status = value.status;
  if (typeof status !== "string" || !LESSON_STATUSES.includes(status as LessonStatus)) {
    return undefined;
  }

  const lesson: LessonProgress = { status: status as LessonStatus };

  if (typeof value.watchedAt === "string") lesson.watchedAt = value.watchedAt;
  if (typeof value.completedAt === "string") lesson.completedAt = value.completedAt;
  if (typeof value.lastPositionSec === "number") lesson.lastPositionSec = value.lastPositionSec;
  if (typeof value.quizBestScore === "number") lesson.quizBestScore = value.quizBestScore;

  return lesson;
}

export function migrateProgressState(raw: unknown): ProgressState {
  const next = createDefaultProgressState();

  if (!isPlainObject(raw)) {
    return next;
  }

  if (isPlainObject(raw.lessons)) {
    for (const [archiveId, value] of Object.entries(raw.lessons)) {
      const lesson = salvageLesson(value);
      if (lesson) {
        next.lessons[archiveId] = lesson;
      }
    }
  }

  if (isPlainObject(raw.lastVisited) && typeof raw.lastVisited.archiveId === "string") {
    const at = typeof raw.lastVisited.at === "string" ? raw.lastVisited.at : new Date().toISOString();
    next.lastVisited = { archiveId: raw.lastVisited.archiveId, at };
    if (typeof raw.lastVisited.courseId === "string") {
      next.lastVisited.courseId = raw.lastVisited.courseId;
    }
  }

  if (isPlainObject(raw.streak)) {
    const current = typeof raw.streak.current === "number" ? raw.streak.current : 0;
    const longest = typeof raw.streak.longest === "number" ? raw.streak.longest : 0;
    const lastActiveDate = typeof raw.streak.lastActiveDate === "string" ? raw.streak.lastActiveDate : "";
    next.streak = { current, longest, lastActiveDate };
  }

  if (isPlainObject(raw.earnedBadges)) {
    for (const [badgeId, earnedAt] of Object.entries(raw.earnedBadges)) {
      if (typeof earnedAt === "string") {
        next.earnedBadges[badgeId] = earnedAt;
      }
    }
  }

  return next;
}

export interface ProgressStore {
  get(): ProgressState;
  set(next: ProgressState): void;
  update(mutator: (current: ProgressState) => ProgressState): void;
  subscribe(listener: () => void): () => void;
  exportJson(): string;
  importJson(json: string): { ok: boolean; error?: string };
  reset(): void;
  // Loads localStorage (if not yet loaded) and notifies. Lets the provider surface
  // persisted state after hydration without a spurious write. See progress-context.tsx.
  hydrate(): void;
}

function readStorage(): string | null {
  try {
    return window.localStorage.getItem(PROGRESS_STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeStorage(value: string, onWarn: () => void): void {
  try {
    window.localStorage.setItem(PROGRESS_STORAGE_KEY, value);
  } catch {
    onWarn();
  }
}

function clearStorage(onWarn: () => void): void {
  try {
    window.localStorage.removeItem(PROGRESS_STORAGE_KEY);
  } catch {
    onWarn();
  }
}

export function createProgressStore(): ProgressStore {
  const listeners = new Set<() => void>();
  let snapshot: ProgressState = SERVER_DEFAULT_STATE;
  let loaded = false;
  let warned = false;

  function warnOnce(): void {
    if (!warned) {
      warned = true;
      console.warn("学習進捗をローカル保存できませんでした。この機能はこのセッション中のみ動作します。");
    }
  }

  function notify(): void {
    for (const listener of listeners) {
      listener();
    }
  }

  function ensureLoaded(): void {
    if (loaded || typeof window === "undefined") {
      return;
    }
    loaded = true;
    const raw = readStorage();
    if (raw === null) {
      snapshot = createDefaultProgressState();
      return;
    }
    let parsed: unknown = null;
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = null;
    }
    snapshot = migrateProgressState(parsed);
  }

  function persist(next: ProgressState): void {
    snapshot = { ...next, updatedAt: new Date().toISOString() };
    if (typeof window !== "undefined") {
      writeStorage(JSON.stringify(snapshot), warnOnce);
    }
    notify();
  }

  return {
    get() {
      if (typeof window === "undefined") {
        return SERVER_DEFAULT_STATE;
      }
      ensureLoaded();
      return snapshot;
    },
    set(next) {
      persist(next);
    },
    update(mutator) {
      ensureLoaded();
      persist(mutator(this.get()));
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    exportJson() {
      return JSON.stringify(this.get(), null, 2);
    },
    importJson(json) {
      let parsed: unknown;
      try {
        parsed = JSON.parse(json);
      } catch {
        return { ok: false, error: "JSON の形式が正しくありません。" };
      }
      if (!isPlainObject(parsed)) {
        return { ok: false, error: "進捗データの形式が正しくありません。" };
      }
      persist(migrateProgressState(parsed));
      return { ok: true };
    },
    reset() {
      loaded = true;
      if (typeof window !== "undefined") {
        clearStorage(warnOnce);
      }
      snapshot = createDefaultProgressState();
      notify();
    },
    hydrate() {
      if (typeof window === "undefined") {
        return;
      }
      const before = snapshot;
      ensureLoaded();
      if (snapshot !== before) {
        notify();
      }
    }
  };
}
