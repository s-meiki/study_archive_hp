"use client";

import { useProgress } from "../learning/progress-context";
import { buildBadgeDefs, type CourseBadgeSource } from "../learning/badge-engine";
import { ProgressBar } from "../ui/progress-bar";
import { Stat } from "../ui/stat";
import type { DashboardArchive } from "./dashboard-types";
import styles from "./dashboard-stats.module.css";

type DashboardStatsProps = {
  archives: DashboardArchive[];
  badgeSources: CourseBadgeSource[];
};

export default function DashboardStats({ archives, badgeSources }: DashboardStatsProps) {
  const { state } = useProgress();

  const lessonEntries = Object.entries(state.lessons);
  const completedCount = lessonEntries.filter(([, lesson]) => lesson.status === "completed").length;
  const totalArchives = archives.length;

  const scores = lessonEntries
    .map(([, lesson]) => lesson.quizBestScore)
    .filter((score): score is number => typeof score === "number");
  const avgScorePercent =
    scores.length > 0 ? Math.round((scores.reduce((sum, score) => sum + score, 0) / scores.length) * 100) : null;

  const badgeDefs = buildBadgeDefs(badgeSources);
  const earnedBadgeCount = badgeDefs.filter((def) => state.earnedBadges[def.id] != null).length;

  return (
    <div className={styles.grid}>
      <Stat
        label="連続学習"
        value={state.streak.current}
        unit="日"
        foot={state.streak.longest > 0 ? `最長 ${state.streak.longest}日` : "今日から記録を始めましょう"}
      />
      <Stat label="完了レッスン" value={completedCount} unit="件" foot={`全${totalArchives}レッスン中`} />
      <Stat
        label="クイズ平均正答"
        value={avgScorePercent ?? "―"}
        unit={avgScorePercent !== null ? "%" : undefined}
        foot={avgScorePercent !== null ? `${scores.length}件の記録から算出` : "まだクイズの挑戦がありません"}
      >
        {avgScorePercent !== null ? (
          <ProgressBar
            mode="continuous"
            tone="accent"
            value={avgScorePercent}
            max={100}
            label={`クイズ平均正答率 ${avgScorePercent}%`}
          />
        ) : null}
      </Stat>
      <Stat label="獲得バッジ" value={earnedBadgeCount} unit="個" foot={`全${badgeDefs.length}種のうち`} />
    </div>
  );
}
