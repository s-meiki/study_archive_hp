import type { Metadata } from "next";
import Script from "next/script";
import SiteFooter from "../site-footer";
import { siteLegal, siteNavigation } from "../site-legal";
import { absoluteSiteUrl } from "../site-url";
import { loadAnnualMeetingsData } from "../site-data";

const pageTitle = `2026年度 学会年会一覧 | ${siteLegal.shortSiteName}`;
const pageDescription = "2026年度の主要学会年会情報を、公式サイトベースで一覧化したページです。";

export async function generateMetadata(): Promise<Metadata> {
  const data = await loadAnnualMeetingsData();
  const canonicalUrl = absoluteSiteUrl("/annual-meetings-2026");
  const ogImageUrl = absoluteSiteUrl("/images/ogp.png");
  const description = `${data.fiscalYear}（${data.period.start}〜${data.period.end}）の主要学会年会情報を、${data.verifiedAt}時点の公式情報で一覧化したページです。`;

  return {
    title: pageTitle,
    description,
    alternates: canonicalUrl
      ? {
          canonical: canonicalUrl
        }
      : undefined,
    openGraph: {
      title: pageTitle,
      description,
      type: "website",
      siteName: siteLegal.shortSiteName,
      url: canonicalUrl ?? undefined,
      images: ogImageUrl
        ? [
            {
              url: ogImageUrl,
              width: 1536,
              height: 1024,
              alt: `${siteLegal.shortSiteName} のOGP画像`
            }
          ]
        : undefined
    },
    twitter: {
      card: ogImageUrl ? "summary_large_image" : "summary",
      title: pageTitle,
      description,
      images: ogImageUrl ? [ogImageUrl] : undefined
    }
  };
}

export default async function AnnualMeetingsPage() {
  const data = await loadAnnualMeetingsData();

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
          <div className="topbar-note">{data.fiscalYear} 学会一覧</div>
          <a className="topbar-link" href={siteNavigation.archiveUrl}>
            勉強会アーカイブへ戻る
          </a>
          <a className="topbar-link" href={siteLegal.contactUrl}>
            問い合わせ
          </a>
        </div>
      </header>

      <main>
        <section className="panel meeting-simple-header" aria-labelledby="page-title">
          <p className="meeting-period">
            {data.fiscalYear} | {data.period.start.replace(/-/g, ".")} - {data.period.end.replace(/-/g, ".")}
          </p>
          <h1 id="page-title">{data.fiscalYear} 学会年会一覧</h1>
          <p className="meeting-simple-copy">{data.verifiedAt}時点の公式情報で整理しています。</p>
        </section>

        <div className="notice meeting-simple-note" role="note">
          <strong>確認日</strong>
          <span id="meeting-last-verified"></span>
        </div>

        <div className="notice meeting-simple-note" id="meeting-pending-note" role="note" hidden></div>

        <section className="panel calendar-panel calendar-panel-expanded" aria-labelledby="meeting-calendar-heading">
          <div className="calendar-panel-header">
            <div>
              <div className="section-kicker">Calendar</div>
              <h2 id="meeting-calendar-heading">学会カレンダー</h2>
              <p className="calendar-panel-copy">開催日と主要な募集日程を、月ごとに確認できます。</p>
            </div>
            <div className="calendar-legend" aria-label="カレンダー凡例">
              <span className="calendar-legend-chip is-event">開催</span>
              <span className="calendar-legend-chip is-abstract">演題募集</span>
            </div>
          </div>
          <div className="notice calendar-inline-note" id="meeting-window-summary" role="note"></div>
          <div className="calendar-browser" id="meeting-calendar" aria-live="polite"></div>
        </section>

        <section className="meeting-groups" id="meeting-groups" aria-live="polite">
          <div className="status-panel" id="meeting-status-panel" hidden></div>
        </section>
      </main>

      <SiteFooter />

      <Script src="/data/annual-meetings-2026.js" strategy="lazyOnload" />
      <Script src="/assets/annual-meetings-2026.js" strategy="lazyOnload" />
    </div>
  );
}
