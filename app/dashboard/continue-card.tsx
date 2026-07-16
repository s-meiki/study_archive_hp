"use client";

import { useProgress } from "../learning/progress-context";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import type { DashboardArchive, DashboardTheme } from "./dashboard-types";
import styles from "./continue-card.module.css";

type ContinueCardProps = {
  archives: DashboardArchive[];
  themes: DashboardTheme[];
};

function archiveHref(archiveId: string, courseId?: string) {
  const query = courseId ? `?courseId=${encodeURIComponent(courseId)}` : "";
  return `/archives/${encodeURIComponent(archiveId)}${query}`;
}

export default function ContinueCard({ archives, themes }: ContinueCardProps) {
  const { state } = useProgress();
  const archiveById = new Map(archives.map((archive) => [archive.id, archive]));
  const continueArchive = state.lastVisited ? archiveById.get(state.lastVisited.archiveId) : undefined;

  if (!continueArchive) {
    return null;
  }

  const theme = themes.find((item) => item.id === continueArchive.themeId);

  return (
    <Card className={styles.card}>
      <p className={styles.eyebrow}>続きから</p>
      <h2 className={styles.title}>{continueArchive.title}</h2>
      <div className={styles.meta}>
        {theme ? (
          <Badge variant={theme.cat ? "theme" : "neutral"} cat={theme.cat}>
            {theme.name}
          </Badge>
        ) : null}
        {continueArchive.date ? <span>{continueArchive.date}</span> : null}
      </div>
      <Button href={archiveHref(continueArchive.id, state.lastVisited?.courseId)} variant="primary">
        続きを見る
      </Button>
    </Card>
  );
}
