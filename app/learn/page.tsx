import type { Metadata } from "next";
import SiteFooter from "../site-footer";
import { siteLegal, siteNavigation } from "../site-legal";
import { absoluteSiteUrl } from "../site-url";
import { loadLearningContent, loadSiteContent } from "../site-data";
import type { CourseBadgeSource } from "../learning/badge-engine";
import ProgressDashboard from "./progress-dashboard";
import BadgesPanel from "./badges-panel";
import DataPortability from "./data-portability";

const pageTitle = `学習ダッシュボード | ${siteLegal.shortSiteName}`;
const pageDescription = "自分の学習進捗をテーマ別に確認できるダッシュボードです。";

export async function generateMetadata(): Promise<Metadata> {
  const canonicalUrl = absoluteSiteUrl("/learn");

  return {
    title: pageTitle,
    description: pageDescription,
    alternates: canonicalUrl
      ? {
          canonical: canonicalUrl
        }
      : undefined
  };
}

export default async function LearnPage() {
  const [data, learningContent] = await Promise.all([loadSiteContent(), loadLearningContent()]);

  const themes = data.themes.map((theme) => ({
    id: theme.id,
    name: theme.name
  }));

  const archives = data.archives.map((archive) => ({
    id: archive.id,
    themeId: archive.themeId,
    title: archive.title,
    date: archive.date
  }));

  const courses: CourseBadgeSource[] = learningContent.courses.map((course) => ({
    courseId: course.id,
    title: course.title,
    requiredArchiveIds: course.lessons.filter((lesson) => !lesson.optional).map((lesson) => lesson.archiveId)
  }));

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
            アーカイブ一覧へ
          </a>
          <a className="topbar-link" href={siteLegal.contactUrl}>
            問い合わせ
          </a>
        </div>
      </header>

      <main>
        <ProgressDashboard themes={themes} archives={archives} />
        <BadgesPanel courses={courses} />
        <DataPortability />
      </main>

      <SiteFooter />
    </div>
  );
}
