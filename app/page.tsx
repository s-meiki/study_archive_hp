import type { Metadata } from "next";
import { MagnifyingGlassIcon } from "@phosphor-icons/react/dist/ssr";
import { siteLegal } from "./site-legal";
import { absoluteSiteUrl } from "./site-url";
import {
  loadAnnualMeetingsData,
  loadLearningContent,
  loadQuizBank,
  loadSiteContent
} from "./site-data";
import { getArchivePresentation } from "./lib/archive-presentation";
import { Button } from "./ui/button";
import HomeDashboard from "./home/home-dashboard";
import { ConferenceCard, LatestArchivesCard } from "./home/home-static-cards";
import type { HomeLearningData } from "./home/home-types";
import { pickUpcomingMeeting } from "./home/upcoming-meeting";
import styles from "./home/home-dashboard.module.css";

const pageTitle = `学習ホーム | ${siteLegal.shortSiteName}`;
const pageDescription =
  "臨床・研究・AI活用の勉強会を、録画と学べる内容から探せる薬剤師向け学習アーカイブです。";
const canonicalUrl = absoluteSiteUrl("/");
const ogImageUrl = absoluteSiteUrl("/images/ogp.png");

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: canonicalUrl ? { canonical: canonicalUrl } : undefined,
  openGraph: {
    title: pageTitle,
    description: pageDescription,
    type: "website",
    siteName: siteLegal.shortSiteName,
    url: canonicalUrl ?? undefined,
    images: ogImageUrl
      ? [
          {
            url: ogImageUrl,
            width: 2400,
            height: 1260,
            alt: `${siteLegal.shortSiteName} のOGP画像`
          }
        ]
      : undefined
  },
  twitter: {
    card: ogImageUrl ? "summary_large_image" : "summary",
    title: pageTitle,
    description: pageDescription,
    images: ogImageUrl ? [ogImageUrl] : undefined
  }
};

function todayInTokyo(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date());
}

export default async function HomePage() {
  const [siteContent, learningContent, quizBank, annualMeetings] = await Promise.all([
    loadSiteContent(),
    loadLearningContent(),
    loadQuizBank(),
    loadAnnualMeetingsData()
  ]);
  const archiveById = new Map(siteContent.archives.map((archive) => [archive.id, archive]));
  const quizByArchiveId = new Map(quizBank.quizzes.map((quiz) => [quiz.archiveId, quiz]));

  const homeData: HomeLearningData = {
    themes: siteContent.themes.map((theme) => ({
      id: theme.id,
      name: theme.name,
      summary: theme.summary ?? ""
    })),
    archives: siteContent.archives.map((archive) => {
      const quiz = quizByArchiveId.get(archive.id);
      return {
        ...getArchivePresentation(archive),
        id: archive.id,
        themeId: archive.themeId,
        title: archive.title,
        summary: archive.summary,
        overview: archive.detail?.overview ?? archive.summary,
        keyPoints: archive.detail?.keyPoints ?? [],
        speaker: archive.speaker ?? "",
        date: archive.date ?? "",
        duration: archive.duration ?? "",
        assets: {
          recording: Boolean(archive.assets?.recording),
          slides: Boolean(archive.assets?.slides),
          notes: Boolean(archive.assets?.notes),
          references: Boolean(archive.assets?.references)
        },
        quiz: quiz
          ? {
              questionCount: quiz.questions.length,
              passThreshold: quiz.passThreshold
            }
          : null
      };
    }),
    courses: learningContent.courses.map((course) => ({
      id: course.id,
      themeId: course.themeId,
      title: course.title,
      summary: course.summary,
      level: course.level ?? "",
      order: course.order,
      lessons: course.lessons
        .filter((lesson) => archiveById.has(lesson.archiveId))
        .map((lesson) => ({
          archiveId: lesson.archiveId,
          order: lesson.order,
          optional: Boolean(lesson.optional),
          label: lesson.labelOverride ?? archiveById.get(lesson.archiveId)?.title ?? "この回"
        }))
    }))
  };

  const archivesByDateDesc = [...homeData.archives].sort((a, b) => b.date.localeCompare(a.date));
  const latestArchives = archivesByDateDesc.filter((archive) => archive.assets.recording).slice(0, 3);
  const recentNotes = archivesByDateDesc.filter((archive) => !archive.assets.recording).slice(0, 2);

  const quizQuestionCount = quizBank.quizzes.reduce((sum, quiz) => sum + quiz.questions.length, 0);
  const meeting = pickUpcomingMeeting(annualMeetings.meetings, todayInTokyo());

  return (
    <>
      <div className={styles.pageHead}>
        <div>
          <p className={styles.eyebrow}>臨床・研究・AI活用の学習アーカイブ</p>
          <h1>必要な勉強会に、すぐ届く。</h1>
          <p className={styles.siteTotals}>
            アーカイブ {homeData.archives.length}本 ・ コース {homeData.courses.length}本 ・ 確認クイズ{" "}
            {quizQuestionCount}問
          </p>
        </div>
        <div className={styles.headActions}>
          <Button href="/archives">
            <MagnifyingGlassIcon size={16} aria-hidden="true" />
            教材を探す
          </Button>
        </div>
      </div>

      <HomeDashboard
        data={homeData}
        archivesCard={<LatestArchivesCard archives={latestArchives} themes={homeData.themes} recentNotes={recentNotes} />}
        conferenceCard={<ConferenceCard meeting={meeting} />}
      />

      <p className={styles.disclaimer}>
        教育用コンテンツ: 本アーカイブは個別診療の判断を代替するものではありません。学習進捗はこの端末のブラウザにのみ保存されます。
      </p>
    </>
  );
}
