"use client";

import { useProgress } from "../learning/progress-context";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardHeader } from "../ui/card";
import { EmptyState } from "../ui/empty-state";
import { ProgressBar } from "../ui/progress-bar";
import type { DashboardArchive, DashboardTheme } from "./dashboard-types";
import styles from "./theme-progress.module.css";

type ThemeProgressProps = {
  themes: DashboardTheme[];
  archives: DashboardArchive[];
};

export default function ThemeProgress({ themes, archives }: ThemeProgressProps) {
  const { state } = useProgress();
  const hasAnyProgress = Object.keys(state.lessons).length > 0;

  const rows = themes.map((theme) => {
    const themeArchives = archives.filter((archive) => archive.themeId === theme.id);
    const total = themeArchives.length;
    const completedCount = themeArchives.filter((archive) => state.lessons[archive.id]?.status === "completed").length;
    return { ...theme, total, completedCount };
  });

  return (
    <Card>
      <CardHeader title="テーマ別進捗" />
      {hasAnyProgress ? (
        <ul className={styles.list}>
          {rows.map((row) => (
            <li key={row.id} className={styles.row}>
              <div className={styles.rowHead}>
                <Badge variant={row.cat ? "theme" : "neutral"} cat={row.cat}>
                  {row.name}
                </Badge>
                <span className={styles.rowCount}>
                  {row.total > 0
                    ? `${row.completedCount}/${row.total}件（${Math.round((row.completedCount / row.total) * 100)}%）`
                    : "対象なし"}
                </span>
              </div>
              {row.total > 0 ? (
                <ProgressBar
                  mode="continuous"
                  value={row.completedCount}
                  max={row.total}
                  label={`${row.name} 進捗 ${row.total}件中${row.completedCount}件`}
                />
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          title="まだ学習記録がありません"
          description="アーカイブを視聴すると、ここに進捗が表示されるようになります。"
          action={
            <Button href="/archives" variant="primary">
              アーカイブ一覧を見る
            </Button>
          }
        />
      )}
    </Card>
  );
}
