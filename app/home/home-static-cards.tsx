import Link from "next/link";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardHeader } from "../ui/card";
import type { HomeTheme } from "./home-types";
import { themeCatOf, themeNameOf } from "../lib/theme-category";
import type { UpcomingMeetingView } from "./upcoming-meeting";
import styles from "./home-dashboard.module.css";

// サーバーで確定する静的カード群。クライアント進捗に依存しないため
// page.tsx からスロットとして HomeDashboard に渡し、SSR のまま描画する。

export type HomeLatestArchive = {
  id: string;
  title: string;
  date: string;
  speaker: string;
  themeId: string;
};

type LatestArchivesCardProps = {
  archives: HomeLatestArchive[];
  themes: HomeTheme[];
};

export function LatestArchivesCard({ archives, themes }: LatestArchivesCardProps) {
  return (
    <Card className={styles.areaArchives}>
      <CardHeader
        title="最新アーカイブ"
        action={
          <Link className="text-link" href="/archives">
            すべて見る
          </Link>
        }
      />
      <ul className={styles.itemList}>
        {archives.map((archive) => (
          <li key={archive.id}>
            <div className={styles.itemBody}>
              <p className={styles.itemTitle}>{archive.title}</p>
              <p className={styles.itemMeta}>
                <Badge variant="theme" cat={themeCatOf(archive.themeId)}>
                  {themeNameOf(themes, archive.themeId)}
                </Badge>
                {archive.date ? <span>{archive.date}</span> : null}
                {archive.speaker ? <span>講師: {archive.speaker}</span> : null}
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              className={styles.itemAction}
              href={`/archives/${encodeURIComponent(archive.id)}`}
            >
              視聴
            </Button>
          </li>
        ))}
      </ul>
    </Card>
  );
}

type ConferenceCardProps = {
  meeting: UpcomingMeetingView | null;
};

export function ConferenceCard({ meeting }: ConferenceCardProps) {
  return (
    <Card className={styles.areaConf}>
      <p className={styles.eyebrow}>学会カレンダー</p>
      {meeting ? (
        <>
          <h2 className={styles.confTitle}>{meeting.eventName}</h2>
          <p className={styles.confMeta}>
            <span>{meeting.dateLabel}</span>
            {meeting.venue ? <span>{meeting.venue}</span> : null}
          </p>
          {meeting.openMilestoneLabel ? (
            <Badge variant="status" status="success">
              {meeting.openMilestoneLabel}
            </Badge>
          ) : null}
        </>
      ) : (
        <p className={styles.confEmpty}>直近の開催予定はありません。年間スケジュールはカレンダーで確認できます。</p>
      )}
      <div className={styles.confFoot}>
        <Link className="text-link" href="/calendar">
          学会カレンダーを見る →
        </Link>
      </div>
    </Card>
  );
}
