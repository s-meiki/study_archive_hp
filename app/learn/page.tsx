import type { Metadata } from "next";
import SiteFooter from "../site-footer";
import { siteLegal, siteNavigation } from "../site-legal";
import { absoluteSiteUrl } from "../site-url";
import { loadSiteContent } from "../site-data";
import ProgressDashboard from "./progress-dashboard";

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
  const data = await loadSiteContent();

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
      </main>

      <SiteFooter />
    </div>
  );
}
