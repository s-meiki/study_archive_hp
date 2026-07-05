import type { BadgeDef } from "./types";

export const BADGE_DEFS: BadgeDef[] = [
  {
    id: "first-lesson",
    title: "はじめの一歩",
    description: "最初のアーカイブを視聴した",
    criteria: { type: "first-lesson" }
  },
  {
    id: "streak-3",
    title: "3日連続で学習",
    description: "3日連続で学習を記録した",
    criteria: { type: "streak", days: 3 }
  },
  {
    id: "streak-7",
    title: "7日連続で学習",
    description: "7日連続で学習を記録した",
    criteria: { type: "streak", days: 7 }
  }
];
