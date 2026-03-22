import type { Metadata } from "next";
import Script from "next/script";
import SiteFooter from "./site-footer";
import { siteLegal, siteNavigation } from "./site-legal";
import { absoluteSiteUrl } from "./site-url";

const pageTitle = `勉強会アーカイブ | ${siteLegal.shortSiteName}`;
const pageDescription = "臨床学術ワーキンググループの勉強会アーカイブ。テーマ別に録画や参考資料のある回を探せます。";
const canonicalUrl = absoluteSiteUrl("/");
const ogImageUrl = absoluteSiteUrl("/images/ogp.png");

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: canonicalUrl
    ? {
        canonical: canonicalUrl
      }
    : undefined,
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
    description: pageDescription,
    images: ogImageUrl ? [ogImageUrl] : undefined
  }
};

export default function HomePage() {
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
            <div className="topbar-note">薬剤師向け勉強会アーカイブ</div>
          <a className="topbar-link" href={siteNavigation.annualMeetingsUrl}>
            学会年会一覧へ
          </a>
          <a className="topbar-link" href={siteLegal.contactUrl}>
            問い合わせ
          </a>
        </div>
      </header>

      <main>
        <section className="hero" aria-labelledby="page-title">
          <div className="panel hero-copy">
            <div className="eyebrow">Archive Library</div>
            <div className="hero-brandline">臨床学術ワーキンググループの学びを、公開アーカイブとして整理。</div>
            <h1 id="page-title">
              必要な勉強会に、
              <br />
              すぐ届く。
            </h1>
            <p className="lead">
              循環器、脳神経、基礎レクチャーなどをテーマ別に整理し、
              録画や参考資料のある回へ短時間でたどり着けるようにしています。
            </p>
            <div className="hero-actions">
              <a className="button button-primary" href="#entry-picks">
                おすすめから見る
              </a>
              <a className="button button-secondary" href="#themes">
                テーマから探す
              </a>
              <a className="button button-secondary" href={siteNavigation.annualMeetingsUrl}>
                2026年度学会年会一覧
              </a>
              <a className="button button-secondary" href={siteLegal.contactUrl}>
                問い合わせ
              </a>
            </div>
            <div className="hero-stats" id="hero-stats" aria-label="アーカイブの概要"></div>
          </div>

          <div className="panel hero-feature" id="featured-card" aria-live="polite"></div>
        </section>

        <div className="notice" role="note">
          <strong>教育用コンテンツ</strong>
          <span>個別診療の代替ではないことと、症例情報は匿名化前提で公開することを固定表示する想定です。</span>
        </div>

        <div className="meeting-tabs" aria-label="トップ表示切り替え">
          <div className="meeting-tab-list" role="tablist" aria-label="トップ表示タブ">
            <button
              className="meeting-tab-button is-active"
              id="home-tab-list"
              type="button"
              role="tab"
              aria-selected="true"
              aria-controls="home-panel-list"
              data-home-tab="list"
            >
              勉強会一覧
            </button>
            <button
              className="meeting-tab-button"
              id="home-tab-calendar"
              type="button"
              role="tab"
              aria-selected="false"
              aria-controls="home-panel-calendar"
              data-home-tab="calendar"
              tabIndex={-1}
            >
              勉強会カレンダー
            </button>
          </div>

          <div
            id="home-panel-list"
            className="meeting-tab-panel"
            role="tabpanel"
            aria-labelledby="home-tab-list"
            data-home-panel="list"
          >
            <form className="panel controls" id="filters" aria-label="検索と絞り込み">
              <label className="search-field">
                <span className="visually-hidden">キーワード検索</span>
                <input id="search-input" name="search" type="search" placeholder="キーワードで検索" />
              </label>

              <label className="select-field">
                <span className="visually-hidden">資料種別</span>
                <select id="asset-filter" name="asset" defaultValue="all">
                  <option value="all">資料種別</option>
                  <option value="recording">録画あり</option>
                  <option value="slides">スライドあり</option>
                  <option value="notes">要点メモあり</option>
                  <option value="references">参考文献あり</option>
                </select>
              </label>

              <label className="select-field">
                <span className="visually-hidden">年度</span>
                <select id="year-filter" name="year" defaultValue="all">
                  <option value="all">年度</option>
                </select>
              </label>

              <button className="button button-tertiary" type="button" id="clear-filters">
                リセット
              </button>
            </form>

            <div className="layout">
              <aside className="panel theme-panel" id="themes" aria-labelledby="theme-heading">
                <div className="section-kicker">Theme Library</div>
                <h2 id="theme-heading">分野から入る</h2>
                <p>テーマ一覧は短く保ち、アーカイブ一覧を主役にする構成です。</p>
                <div className="theme-list" id="theme-list" role="list"></div>
              </aside>

              <section className="archive-column" aria-labelledby="archive-heading">
                <div className="entry-picks" id="entry-picks" aria-label="おすすめの入口"></div>

                <div className="archive-header">
                  <div>
                    <div className="section-kicker">Archive Library</div>
                    <h2 id="archive-heading">勉強会アーカイブ</h2>
                    <p id="archive-description">テーマを選ぶと、ここに該当アーカイブを新しい順で並べます。</p>
                  </div>
                  <div className="archive-summary" id="archive-summary"></div>
                </div>

                <div className="status-panel" id="status-panel" hidden></div>
                <div className="archive-list" id="archive-list" aria-live="polite"></div>

                <div className="empty-state" id="empty-state" hidden>
                  <h3>該当するアーカイブがありません</h3>
                  <p>検索条件を緩めるか、別のテーマを選んでください。</p>
                </div>
              </section>
            </div>
          </div>

          <div
            id="home-panel-calendar"
            className="meeting-tab-panel"
            role="tabpanel"
            aria-labelledby="home-tab-calendar"
            data-home-panel="calendar"
            hidden
          >
            <section className="panel calendar-panel calendar-panel-expanded" aria-labelledby="archive-calendar-heading">
              <div className="calendar-panel-header">
                <div>
                  <div className="section-kicker">Study Calendar</div>
                  <h2 id="archive-calendar-heading">勉強会カレンダー</h2>
                  <p className="calendar-panel-copy">開催日ベースで、月ごとにアーカイブを確認できます。</p>
                </div>
              </div>
              <div className="calendar-browser" id="archive-calendar" aria-live="polite"></div>
            </section>
          </div>
        </div>
      </main>

      <SiteFooter />

      <Script src="/assets/site-data-utils.js" strategy="lazyOnload" />
      <Script src="/data/site-content.js" strategy="lazyOnload" />
      <Script src="/assets/app.js" strategy="lazyOnload" />
    </div>
  );
}
