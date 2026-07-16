import type { LessonProgress } from "../learning/types";

export type DayActivity = {
  key: string;
  weekdayLabel: string;
  count: number;
};

const weekdayFormat = new Intl.DateTimeFormat("ja-JP", { weekday: "short" });

export function toLocalDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// 進捗ストアの watchedAt / completedAt から「その日に学習したレッスン数」を数える。
// 同じレッスンを同日に視聴・修了した場合は1件と数える（Set で重複排除）。
export function buildWeeklyActivity(
  lessons: Record<string, LessonProgress>,
  now: Date
): DayActivity[] {
  const lessonsByDay = new Map<string, Set<string>>();

  for (const [archiveId, lesson] of Object.entries(lessons)) {
    for (const timestamp of [lesson.watchedAt, lesson.completedAt]) {
      if (!timestamp) {
        continue;
      }
      const parsed = new Date(timestamp);
      if (Number.isNaN(parsed.getTime())) {
        continue;
      }
      const key = toLocalDateKey(parsed);
      const set = lessonsByDay.get(key) ?? new Set<string>();
      set.add(archiveId);
      lessonsByDay.set(key, set);
    }
  }

  const days: DayActivity[] = [];
  for (let offset = 6; offset >= 0; offset -= 1) {
    const date = new Date(now);
    date.setDate(date.getDate() - offset);
    const key = toLocalDateKey(date);
    days.push({
      key,
      weekdayLabel: weekdayFormat.format(date),
      count: lessonsByDay.get(key)?.size ?? 0
    });
  }
  return days;
}
