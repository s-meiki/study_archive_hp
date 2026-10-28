import type { ProgressState } from "./types";

export const PROGRESS_STORAGE_KEY = "cawg.learning.progress.v1";
export const PROGRESS_BACKUP_KEY = `${PROGRESS_STORAGE_KEY}.backup`;
const LOCK_NAME = `${PROGRESS_STORAGE_KEY}.write`;

export function createDefaultProgressState(): ProgressState {
  return { schemaVersion: 1, updatedAt: new Date().toISOString(), lessons: {},
    streak: { current: 0, longest: 0, lastActiveDate: "" }, earnedBadges: {} };
}
const SERVER_DEFAULT_STATE = createDefaultProgressState();
const object = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const count = (v: unknown): v is number => typeof v === "number" && Number.isSafeInteger(v) && v >= 0;
const date = (v: unknown): v is string => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) && Number.isFinite(Date.parse(v)) && new Date(v).toISOString().slice(0, 10) === v;
const timestamp = (v: unknown): v is string => typeof v === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(v) && date(v.slice(0, 10)) && Number.isFinite(Date.parse(v)) && new Date(v).toISOString().slice(0, 19) === v.slice(0, 19);
const id = (v: unknown): v is string => typeof v === "string" && v.trim().length > 0 && !["__proto__", "prototype", "constructor"].includes(v);
const keys = (v: Record<string, unknown>, allowed: string[]) => Object.keys(v).every((k) => allowed.includes(k));

export function validateProgressState(raw: unknown): raw is ProgressState {
  if (!object(raw) || !keys(raw, ["schemaVersion", "updatedAt", "lessons", "lastVisited", "streak", "earnedBadges"]) || raw.schemaVersion !== 1 || !timestamp(raw.updatedAt) || !object(raw.lessons) || !object(raw.streak) || !object(raw.earnedBadges)) return false;
  for (const [key, lesson] of Object.entries(raw.lessons)) {
    if (!id(key) || !object(lesson) || !keys(lesson, ["status", "watchedAt", "completedAt", "lastPositionSec", "quizBestScore"]) || typeof lesson.status !== "string" || !["unwatched", "watched", "completed"].includes(lesson.status)) return false;
    for (const field of ["watchedAt", "completedAt"]) if (field in lesson && !timestamp(lesson[field])) return false;
    if ("lastPositionSec" in lesson && !(typeof lesson.lastPositionSec === "number" && Number.isFinite(lesson.lastPositionSec) && lesson.lastPositionSec >= 0)) return false;
    if ("quizBestScore" in lesson && !(typeof lesson.quizBestScore === "number" && Number.isFinite(lesson.quizBestScore) && lesson.quizBestScore >= 0 && lesson.quizBestScore <= 1)) return false;
  }
  const s = raw.streak;
  if (!keys(s, ["current", "longest", "lastActiveDate"]) || !count(s.current) || !count(s.longest) || s.current > s.longest || !(s.lastActiveDate === "" || date(s.lastActiveDate))) return false;
  if (Object.entries(raw.earnedBadges).some(([key, value]) => !id(key) || !timestamp(value))) return false;
  if ("lastVisited" in raw) {
    const visit = raw.lastVisited;
    if (!object(visit) || !keys(visit, ["archiveId", "courseId", "at"]) || !id(visit.archiveId) || !timestamp(visit.at) || ("courseId" in visit && !id(visit.courseId))) return false;
  }
  return true;
}

export function migrateProgressState(raw: unknown): ProgressState {
  return validateProgressState(raw) ? structuredClone(raw) : createDefaultProgressState();
}
export type ProgressResult = { ok: boolean; error?: string };
export type ProgressPreview = ProgressResult & { lessons?: number; badges?: number };
export function previewProgressJson(json: string): ProgressPreview {
  try {
    const raw: unknown = JSON.parse(json);
    if (!validateProgressState(raw)) return { ok: false, error: "対応する進捗データではありません。形式・バージョン・数値・日付を確認してください。" };
    return { ok: true, lessons: Object.keys(raw.lessons).length, badges: Object.keys(raw.earnedBadges).length };
  } catch { return { ok: false, error: "JSON の形式が正しくありません。" }; }
}
export interface ProgressStore {
  get(): ProgressState;
  getError(): string | null;
  set(next: ProgressState): Promise<ProgressResult>;
  update(mutator: (current: ProgressState) => ProgressState): Promise<ProgressResult>;
  subscribe(listener: () => void): () => void;
  exportJson(): string;
  exportBackup(): string | null;
  importJson(json: string): Promise<ProgressResult>;
  reset(): Promise<ProgressResult>;
  hydrate(): void;
}

export function createProgressStore(): ProgressStore {
  const listeners = new Set<() => void>();
  let snapshot = SERVER_DEFAULT_STATE;
  let loaded = false;
  let error: string | null = null;
  let unsaved = false;
  let queue: Promise<unknown> = Promise.resolve();
  const notify = () => listeners.forEach((listener) => listener());
  function read(): ProgressState {
    const raw = window.localStorage.getItem(PROGRESS_STORAGE_KEY);
    if (raw === null) return createDefaultProgressState();
    const parsed: unknown = JSON.parse(raw);
    if (!validateProgressState(parsed)) throw new Error("invalid persisted progress");
    return parsed;
  }
  function load() {
    if (loaded || typeof window === "undefined") return;
    loaded = true;
    try { snapshot = read(); }
    catch { snapshot = createDefaultProgressState(); error = "保存済みの学習進捗を読み込めません。元のデータを保護するため保存を停止しています。"; }
  }
  function sync(event: StorageEvent) {
    if (event.key !== PROGRESS_STORAGE_KEY && event.key !== null) return;
    if (unsaved) return;
    try { snapshot = read(); error = null; }
    catch { error = "別の画面の学習進捗を読み込めませんでした。"; }
    notify();
  }
  function commit(mutator: (current: ProgressState) => ProgressState, replace = false): Promise<ProgressResult> {
    load();
    const work = async (): Promise<ProgressResult> => {
      let next: ProgressState | undefined;
      try {
        if (unsaved) throw new Error("Export unsaved changes before reloading");
        if (!window.navigator.locks) throw new Error("Web Locks unavailable");
        return await window.navigator.locks.request(LOCK_NAME, () => {
          // Every operation, including reset/import, shares this lock. Never merge a stale snapshot.
          const previousJson = window.localStorage.getItem(PROGRESS_STORAGE_KEY);
          let current: ProgressState;
          try {
            current = read();
          } catch (readError) {
            // An explicit import/reset can recover corrupt data, but the exact
            // original must be backed up before anything replaces it.
            if (!replace) throw readError;
            current = createDefaultProgressState();
          }
          next = { ...mutator(current), updatedAt: new Date().toISOString() };
          if (!validateProgressState(next)) throw new Error("invalid progress update");
          if (replace) window.localStorage.setItem(PROGRESS_BACKUP_KEY, previousJson ?? JSON.stringify(current));
          window.localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(next));
          snapshot = next;
          unsaved = false;
          error = null;
          notify();
          return { ok: true };
        });
      } catch {
        // Destructive operations never claim success or replace memory on persistence failure.
        if (!replace) {
          next ??= { ...mutator(snapshot), updatedAt: new Date().toISOString() };
          if (validateProgressState(next)) { snapshot = next; unsaved = true; }
        }
        error = "学習進捗を保存できませんでした。画面を閉じる前に進捗データを書き出してください。";
        notify();
        return { ok: false, error };
      }
    };
    const result = queue.then(work, work);
    queue = result;
    return result;
  }
  return {
    get() { load(); return typeof window === "undefined" ? SERVER_DEFAULT_STATE : snapshot; },
    getError() { return error; },
    set(next) { return commit(() => next, true); },
    update(mutator) { return commit(mutator); },
    subscribe(listener) {
      if (listeners.size === 0 && typeof window !== "undefined") window.addEventListener("storage", sync);
      listeners.add(listener);
      return () => { listeners.delete(listener); if (!listeners.size && typeof window !== "undefined") window.removeEventListener("storage", sync); };
    },
    exportJson() { load(); return JSON.stringify(snapshot, null, 2); },
    exportBackup() { try { return window.localStorage.getItem(PROGRESS_BACKUP_KEY); } catch { return null; } },
    async importJson(json) {
      const result = previewProgressJson(json);
      if (!result.ok) return result;
      return commit(() => JSON.parse(json) as ProgressState, true);
    },
    reset() { return commit(createDefaultProgressState, true); },
    hydrate() { load(); notify(); }
  };
}
