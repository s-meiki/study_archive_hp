import type { Metadata } from "next";
import { loadAnnualMeetingsData } from "../site-data";
import { siteLegal } from "../site-legal";
import { absoluteSiteUrl } from "../site-url";
import { formatJaDate, formatPeriodLabel, todayInTokyo } from "./meetings-lib";
import { MeetingsView } from "./meetings-view";
import styles from "./page.module.css";

const pageTitle = `学会年会カレンダー | ${siteLegal.shortSiteName}`;

export async function generateMetadata(): Promise<Metadata> {
  const data = await loadAnnualMeetingsData();
  const canonicalUrl = absoluteSiteUrl("/calendar");
  const description = `${data.fiscalYear}の主要学会年会の開催日程・演題募集・参加登録期間を、${data.verifiedAt}時点の公式情報でまとめたカレンダーです。`;

  return {
    title: pageTitle,
    description,
    alternates: canonicalUrl
      ? {
          canonical: canonicalUrl
        }
      : undefined
  };
}

export default async function CalendarPage() {
  const data = await loadAnnualMeetingsData();
  const pendingMeetings = data.meetings.filter((meeting) => meeting.status === "pending");

  return (
    <div className={styles.page}>
      <header className={styles.head}>
        <p className={styles.kicker}>Calendar</p>
        <h1>学会年会カレンダー</h1>
        <p className={styles.lead}>
          {data.fiscalYear}（
          <span className="tabular-nums">{formatPeriodLabel(data.period.start, data.period.end)}</span>
          ）の主要学会の開催日程と募集期間をまとめています。
        </p>
        <p className={styles.verified} role="note">
          <span className="tabular-nums">{formatJaDate(data.verifiedAt)}</span>
          時点で確認。公開後に変更される可能性があります。
        </p>
      </header>

      {pendingMeetings.length > 0 ? (
        <div className={styles.pendingNote} role="note">
          <strong>未公表</strong>
          <ul className={styles.pendingList}>
            {pendingMeetings.map((meeting) => (
              <li key={meeting.id}>
                {meeting.society}
                {meeting.note ? `: ${meeting.note}` : ""}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <MeetingsView data={data} initialToday={todayInTokyo()} />
    </div>
  );
}
