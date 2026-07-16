"use client";

import { useEffect, useMemo } from "react";
import { CheckCircleIcon, LockIcon } from "@phosphor-icons/react";
import { useProgress } from "../learning/progress-context";
import {
  buildBadgeDefs,
  evaluateBadges,
  type CourseBadgeSource,
  type ResolvedBadgeDef
} from "../learning/badge-engine";
import { Card, CardHeader } from "../ui/card";
import styles from "./badges-panel.module.css";

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
  // ロジックは app/learn/badges-panel.tsx から変更していない。
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
    <Card>
      <CardHeader title="獲得バッジ" sub={`獲得済みは ${earnedDefs.length} / ${defs.length} 件です。`} />
      <ul className={styles.grid}>
        {earnedDefs.map((def) => (
          <li key={def.id} className={`${styles.badgeCard} ${styles.earned}`}>
            <span className={styles.badgeIcon} aria-hidden="true">
              <CheckCircleIcon weight="fill" />
            </span>
            <span className={styles.badgeTitle}>{def.title}</span>
            <span className={styles.badgeDesc}>{def.description}</span>
            <span className={styles.badgeDate}>獲得日: {formatEarnedDate(state.earnedBadges[def.id])}</span>
          </li>
        ))}
        {lockedDefs.map((def) => (
          <li key={def.id} className={`${styles.badgeCard} ${styles.locked}`}>
            <span className={styles.badgeIcon} aria-hidden="true">
              <LockIcon />
            </span>
            <span className={styles.badgeTitle}>{def.title}</span>
            <span className={styles.badgeDesc}>{def.description}</span>
            <span className={styles.badgeDate}>未獲得</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
