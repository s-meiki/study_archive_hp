import type { Metadata } from "next";
import Script from "next/script";
import SiteFooter from "../site-footer";
import { siteLegal, siteNavigation } from "../site-legal";
import { absoluteSiteUrl } from "../site-url";
import { findQuizForArchive, loadLearningContent } from "../site-data";
import ArchiveQuiz from "./archive-quiz";
import LessonProgressControls from "./lesson-progress-controls";

type ArchivePageProps = {
  searchParams: Promise<{
    id?: string | string[];
    courseId?: string | string[];
  }>;
};

function firstQueryValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export async function generateMetadata({ searchParams }: ArchivePageProps): Promise<Metadata> {
  const params = await searchParams;
  const archiveId = firstQueryValue(params.id) ?? "";
  const canonicalPath = archiveId ? `/archive?id=${encodeURIComponent(archiveId)}` : "/archive";
  const canonicalUrl = absoluteSiteUrl(canonicalPath);
  const ogImageUrl = absoluteSiteUrl("/images/ogp.png");
  const title = `勉強会アーカイブ詳細 | ${siteLegal.shortSiteName}`;
  const description = "勉強会アーカイブの詳細ページです。動画、資料、要点を確認できます。";

  return {
    title,
    description,
    alternates: canonicalUrl
      ? {
          canonical: canonicalUrl
        }
      : undefined,
    openGraph: {
      title,
      description,
      type: "article",
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
      title,
      description,
      images: ogImageUrl ? [ogImageUrl] : undefined
    }
  };
}

export default async function ArchivePage({ searchParams }: ArchivePageProps) {
  const params = await searchParams;
  const archiveId = firstQueryValue(params.id);
  const requestedCourseId = firstQueryValue(params.courseId);
  const [quiz, learningContent] = await Promise.all([
    archiveId ? findQuizForArchive(archiveId) : Promise.resolve(null),
    requestedCourseId ? loadLearningContent() : Promise.resolve(null)
  ]);
  const course =
    archiveId && requestedCourseId
      ? learningContent?.courses.find(
          (candidate) =>
            candidate.id === requestedCourseId &&
            candidate.lessons.some((lesson) => lesson.archiveId === archiveId)
        ) ?? null
      : null;
  const courseLesson = course?.lessons.find((lesson) => lesson.archiveId === archiveId);

  return (
    <div className="page-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true"></span>
          <div className="brand-copy">
            <span className="brand-label">Clinical Academic Working Group</span>
            <span className="brand-name">{siteLegal.shortSiteName}</span>
          </div>
        </div>
        <div className="topbar-actions">
          <a className="topbar-link" href={siteNavigation.archiveUrl}>
            アーカイブ一覧へ戻る
          </a>
          <a className="topbar-link" href={siteLegal.contactUrl}>
            問い合わせ
          </a>
        </div>
      </header>

      <main>
        <nav className="detail-breadcrumb" aria-label="パンくず">
          <a href={siteNavigation.archiveUrl}>勉強会アーカイブ</a>
          <span>/</span>
          <span id="detail-breadcrumb-current">詳細</span>
        </nav>

        {course && courseLesson ? (
          <nav className="detail-breadcrumb learn-course-context-strip" aria-label="コース学習の位置">
            <span>コース学習</span>
            <span>/</span>
            <a href={`/courses/${encodeURIComponent(course.id)}`}>← {course.title}へ戻る</a>
            <span>/</span>
            <span>
              第{courseLesson.order}回 / 全{course.lessons.length}回
            </span>
          </nav>
        ) : null}

        <div className="status-panel" id="detail-status" hidden></div>

        <section className="panel detail-hero" id="detail-hero" hidden>
          <div className="section-kicker">Archive Detail</div>
          <h1 id="detail-title">勉強会アーカイブ詳細</h1>
          <p className="detail-lead" id="detail-lead"></p>
          <div className="detail-meta" id="detail-meta"></div>
        </section>

        <LessonProgressControls archiveId={archiveId} courseId={course?.id} />

        <div className="detail-layout" id="detail-layout" hidden>
          <section className="detail-main">
            <article className="panel detail-section" id="detail-overview-panel">
              <div className="section-kicker">Overview</div>
              <h2>概要</h2>
              <div className="detail-body" id="detail-overview"></div>
            </article>

            <article className="panel detail-section" id="detail-video-panel">
              <div className="section-kicker">Video</div>
              <h2>録画</h2>
              <div className="detail-video-player" id="detail-video-player"></div>
            </article>

            <article className="panel detail-section" id="detail-keypoints-panel" hidden>
              <div className="section-kicker">Key Points</div>
              <h2>学習ポイント</h2>
              <ul className="detail-keypoint-list" id="detail-keypoints"></ul>
            </article>

            <article className="panel detail-section" id="detail-chapters-panel" hidden>
              <div className="section-kicker">Chapters</div>
              <h2>目次</h2>
              <ul className="detail-chapter-list" id="detail-chapters"></ul>
            </article>
          </section>

          <aside className="detail-aside">
            <article className="panel detail-section" id="detail-materials-panel">
              <div className="section-kicker">Materials</div>
              <h2>資料</h2>
              <div className="detail-link-list" id="detail-materials"></div>
            </article>

            <article className="panel detail-section" id="detail-related-panel">
              <div className="section-kicker">Related</div>
              <h2>関連アーカイブ</h2>
              <div className="detail-related-list" id="detail-related"></div>
            </article>

            <div className="notice detail-notice" role="note">
              <strong>教育用コンテンツ</strong>
              <span>個別診療の代替ではなく、症例情報は匿名化前提で扱う方針です。</span>
            </div>
          </aside>
        </div>

        {archiveId ? <ArchiveQuiz archiveId={archiveId} quiz={quiz} /> : null}

        <div className="empty-state detail-empty" id="detail-empty" hidden>
          <h2>アーカイブを表示できませんでした</h2>
          <p>一覧ページから対象の回を選んで、もう一度開いてください。</p>
        </div>
      </main>

      <SiteFooter />

      <Script src="/assets/site-data-utils.js" strategy="lazyOnload" />
      <Script src="/data/site-content.js" strategy="lazyOnload" />
      <Script src="/assets/archive-detail.js" strategy="lazyOnload" />
    </div>
  );
}
