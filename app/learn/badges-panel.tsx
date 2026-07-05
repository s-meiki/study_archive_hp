"use client";

import { useEffect, useMemo } from "react";
import { useProgress } from "../learning/progress-context";
import {
  buildBadgeDefs,
  evaluateBadges,
  type CourseBadgeSource,
  type ResolvedBadgeDef
} from "../learning/badge-engine";

type BadgesPanelProps = {
  courses: CourseBadgeSource[];
};

function todayLocalDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatEarnedDate(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function BadgesPanel({ courses }: BadgesPanelProps) {
  const { state, update } = useProgress();

  const defs: ResolvedBadgeDef[] = useMemo(() => buildBadgeDefs(courses), [courses]);

  // 新規獲得バッジを検出したら earnedBadges に追記する。
  // - 既登録は上書きしない（earnedBadges[id] が存在するものは evaluateBadges が除外）
  // - 新規ゼロなら update を呼ばない（無限ループ防止）
  useEffect(() => {
    const newlyEarned = evaluateBadges(state, defs, todayLocalDate());
    if (newlyEarned.length === 0) {
      return;
    }

    update((current) => {
      const nextEarned = { ...current.earnedBadges };
      const now = new Date().toISOString();
      let changed = false;
      for (const badgeId of newlyEarned) {
        if (nextEarned[badgeId] == null) {
          nextEarned[badgeId] = now;
          changed = true;
        }
      }
      if (!changed) {
        return current;
      }
      return { ...current, earnedBadges: nextEarned };
    });
  }, [state, defs, update]);

  const earnedDefs = defs.filter((def) => state.earnedBadges[def.id] != null);
  const lockedDefs = defs.filter((def) => state.earnedBadges[def.id] == null);

  return (
    <section className="panel learn-badges-panel" aria-labelledby="learn-badges-heading">
      <div className="section-kicker">Badges</div>
      <h2 id="learn-badges-heading">獲得バッジ</h2>
      <p className="learn-badges-intro">
        学習を続けると獲得できるバッジです。獲得済みは {earnedDefs.length} / {defs.length} 件です。
      </p>

      <ul className="learn-badge-grid">
        {earnedDefs.map((def) => (
          <li key={def.id} className="learn-badge-card">
            <span className="learn-badge-title">{def.title}</span>
            <span className="learn-badge-desc">{def.description}</span>
            <span className="learn-badge-date">獲得日: {formatEarnedDate(state.earnedBadges[def.id])}</span>
          </li>
        ))}
        {lockedDefs.map((def) => (
          <li key={def.id} className="learn-badge-card learn-badge-card--locked">
            <span className="learn-badge-title">{def.title}</span>
            <span className="learn-badge-desc">{def.description}</span>
            <span className="learn-badge-date">未獲得</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
