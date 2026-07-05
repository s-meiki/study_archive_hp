import type { BadgeDef, BadgeId, ProgressState } from "./types";
import { BADGE_DEFS } from "./badges";

// コース修了バッジを合成するための最小入力。
// requiredArchiveIds は「そのコースの必修レッスン（optional=true を除外済み）」の archiveId 一覧を想定する。
export type CourseBadgeSource = {
  courseId: string;
  title: string;
  requiredArchiveIds: string[];
};

// buildBadgeDefs が返す BadgeDef の拡張形。course-complete の判定に必要な
// requiredArchiveIds を任意フィールドとして持たせる（BadgeDef としても有効）。
// これにより evaluateBadges を隠れたグローバル状態に依存しない純関数に保てる。
export type ResolvedBadgeDef = BadgeDef & { requiredArchiveIds?: string[] };

export function courseCompleteBadgeId(courseId: string): BadgeId {
  return `course-complete-${courseId}`;
}

// 静的な BADGE_DEFS に、コースごとの course-complete バッジを合成して返す純関数。
export function buildBadgeDefs(courses: CourseBadgeSource[]): ResolvedBadgeDef[] {
  const courseBadges: ResolvedBadgeDef[] = courses.map((course) => ({
    id: courseCompleteBadgeId(course.courseId),
    title: `${course.title} 修了`,
    description: `「${course.title}」の必修レッスンをすべて修了した`,
    criteria: { type: "course-complete", courseId: course.courseId },
    requiredArchiveIds: course.requiredArchiveIds
  }));

  return [...BADGE_DEFS, ...courseBadges];
}

// 新規に獲得条件を満たした（earnedBadges に未登録の）バッジ id を返す純関数。
export function evaluateBadges(
  state: ProgressState,
  defs: ResolvedBadgeDef[],
  today: string
): BadgeId[] {
  void today; // 現行の criteria 評価に today は不要。将来の日付依存条件のためシグネチャに残す。

  const newlyEarned: BadgeId[] = [];

  for (const def of defs) {
    if (state.earnedBadges[def.id] != null) {
      continue;
    }
    if (satisfiesCriteria(state, def)) {
      newlyEarned.push(def.id);
    }
  }

  return newlyEarned;
}

function satisfiesCriteria(state: ProgressState, def: ResolvedBadgeDef): boolean {
  const { criteria } = def;

  switch (criteria.type) {
    case "first-lesson":
      return hasAnyWatchedLesson(state);
    case "streak":
      return state.streak.current >= criteria.days;
    case "course-complete":
      return isCourseComplete(state, def.requiredArchiveIds);
    case "theme-complete":
      // theme-complete は本 WP の対象外。判定材料を持たないため未獲得のままにする。
      return false;
    default:
      return false;
  }
}

function hasAnyWatchedLesson(state: ProgressState): boolean {
  for (const lesson of Object.values(state.lessons)) {
    if (lesson.status === "watched" || lesson.status === "completed") {
      return true;
    }
  }
  return false;
}

// requiredArchiveIds が1件以上あり、その全てが completed のときだけ true。
function isCourseComplete(state: ProgressState, requiredArchiveIds: string[] | undefined): boolean {
  if (!requiredArchiveIds || requiredArchiveIds.length === 0) {
    return false;
  }
  return requiredArchiveIds.every((archiveId) => state.lessons[archiveId]?.status === "completed");
}
