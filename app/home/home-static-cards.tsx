import Link from "next/link";
import { Badge } from "../ui/badge";
import type { HomeArchive, HomeTheme } from "./home-types";
import { themeCatOf, themeNameOf } from "../lib/theme-category";
import type { UpcomingMeetingView } from "./upcoming-meeting";
import styles from "./home-dashboard.module.css";

export function LatestArchivesCard({ archives, themes, recentNotes }: {
  archives: HomeArchive[];
  themes: HomeTheme[];
  recentNotes: HomeArchive[];
}) {
  return (
    <section aria-labelledby="latest-videos-title">
      <div className={styles.sectionHead}>
        <div><p className={styles.eyebrow}>見て学べる教材</p><h2 id="latest-videos-title">新着の録画</h2></div>
        <Link className="text-link" href="/archives?asset=recording">録画をすべて見る →</Link>
      </div>
      <ul className={styles.archiveGrid}>
        {archives.map((archive) => (
          <li key={archive.id}>
            <Link className={styles.archiveLink} href={`/archives/${encodeURIComponent(archive.id)}`}>
              {archive.thumbnailUrl ? <img className={styles.archiveImage} src={archive.thumbnailUrl} alt="" width={480} height={270} loading="lazy" /> : null}
              <div className={styles.archiveBody}>
                <div><Badge variant="theme" cat={themeCatOf(archive.themeId)}>{themeNameOf(themes, archive.themeId)}</Badge></div>
                <h3>{archive.title}</h3>
                <p className={styles.archiveOutcome}>{archive.learningOutcome}</p>
                <p className={styles.meta}><span>{archive.date}</span>{archive.speaker ? <span>講師: {archive.speaker}</span> : null}</p>
                <p className={styles.meta}>{archive.durationLabel ? <span>{archive.durationLabel}</span> : null}{archive.quiz ? <span>確認クイズ {archive.quiz.questionCount}問</span> : null}</p>
                <span className={styles.archiveAction}>録画・教材を見る <span aria-hidden="true">→</span></span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
      {recentNotes.length ? <div className={styles.recentNotes}><span>要点から学べる教材</span>{recentNotes.map((archive) => <Link key={archive.id} href={`/archives/${encodeURIComponent(archive.id)}`}>{archive.title} →</Link>)}</div> : null}
    </section>
  );
}

type ConferenceCardProps = {
  meeting: UpcomingMeetingView | null;
};

export function ConferenceCard({ meeting }: ConferenceCardProps) {
  return (
    <section aria-label="学会カレンダー">
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
    </section>
  );
}
