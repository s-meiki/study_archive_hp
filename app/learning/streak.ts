import type { ProgressState } from "./types";

// today は YYYY-MM-DD（ローカルタイム）を想定した純関数。
// - lastActiveDate === today: 同日再訪なので何もせず同一参照を返す
// - lastActiveDate が today の前日: 連続日数を +1
// - それ以外（初回・途切れ）: current を 1 にリセット
// longest は常に current との最大値で更新する。
export function bumpStreak(state: ProgressState, today: string): ProgressState {
  const { streak } = state;

  if (streak.lastActiveDate === today) {
    return state;
  }

  const isConsecutive = streak.lastActiveDate !== "" && isPreviousDay(streak.lastActiveDate, today);
  const current = isConsecutive ? streak.current + 1 : 1;
  const longest = Math.max(streak.longest, current);

  return {
    ...state,
    streak: { current, longest, lastActiveDate: today }
  };
}

// previous が today の「前日」なら true。YYYY-MM-DD をUTC正午基準で比較し、
// タイムゾーン・夏時間の影響を避けつつ暦日差を安定して求める。
function isPreviousDay(previous: string, today: string): boolean {
  const previousUtc = toUtcNoon(previous);
  const todayUtc = toUtcNoon(today);
  if (previousUtc === null || todayUtc === null) {
    return false;
  }

  const oneDayMs = 24 * 60 * 60 * 1000;
  return todayUtc - previousUtc === oneDayMs;
}

function toUtcNoon(date: string): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) {
    return null;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  return Date.UTC(year, month - 1, day, 12, 0, 0, 0);
}
