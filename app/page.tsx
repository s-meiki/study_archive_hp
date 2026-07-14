import type { Metadata } from "next";
import SiteFooter from "./site-footer";
import { siteLegal, siteNavigation } from "./site-legal";
import { absoluteSiteUrl } from "./site-url";
import { loadLearningContent, loadQuizBank, loadSiteContent } from "./site-data";
import HomeLearning from "./home/home-learning";
import type { HomeLearningData } from "./home/home-types";

const pageTitle = `復習ホーム | ${siteLegal.shortSiteName}`;
const pageDescription =
  "前回の続き、確認クイズ、テーマ別コースから学び直せる薬剤師向け勉強会アーカイブです。";
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

function formatToday() {
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    month: "long",
    day: "numeric",
    weekday: "short"
  }).format(new Date());
}

export default async function HomePage() {
  const [siteContent, learningContent, quizBank] = await Promise.all([
    loadSiteContent(),
    loadLearningContent(),
    loadQuizBank()
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

  return (
    <div className="page-shell home-page-shell">
      <header className="topbar home-topbar">
        <a className="brand" href="/" aria-label={`${siteLegal.shortSiteName} ホーム`}>
          <span className="brand-mark" aria-hidden="true"></span>
          <span className="brand-copy">
            <span className="brand-label">Learning Archive</span>
            <span className="brand-name">{siteLegal.shortSiteName}</span>
          </span>
        </a>
        <nav className="home-nav" aria-label="メインナビゲーション">
          <a className="is-current" href="/" aria-current="page">
            ホーム
          </a>
          <a href="/learn">学ぶ</a>
          <a href="#archive-explorer">探す</a>
          <a href={`${siteNavigation.aboutUrl}#openchat`}>参加する</a>
        </nav>
      </header>

      <HomeLearning data={homeData} dateLabel={formatToday()} />

      <SiteFooter />
    </div>
  );
}
