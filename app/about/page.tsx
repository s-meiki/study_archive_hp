import type { Metadata } from "next";
import SiteFooter from "../site-footer";
import { siteLegal, siteNavigation } from "../site-legal";
import { absoluteSiteUrl } from "../site-url";

const openChatName = "臨床学術WG_SET.Ph";
const openChatUrl =
  "https://line.me/ti/g2/SPaVzas9vc10ud3xYYKBoNOpnkXyMz40DHDFOg?utm_source=invitation&utm_medium=link_copy&utm_campaign=default";

const pageTitle = `臨床学術ワーキンググループについて | ${siteLegal.shortSiteName}`;
const pageDescription =
  "薬剤師・医療従事者向けの勉強会アーカイブと参加案内。過去回の録画・資料、直近予定、オープンチャット参加方法を確認できます。";
const canonicalUrl = absoluteSiteUrl(siteNavigation.aboutUrl);
const ogImageUrl = absoluteSiteUrl("/images/ogp.png");

const upcomingMeetings = [
  {
    id: "meeting-20260710",
    dateLabel: "2026.07.10",
    weekday: "金",
    time: "17:30",
    title: "ワクチン完全攻略",
    theme: "ワクチン",
    format: "ハイブリッド",
    recordingPlanned: true,
    materialsPlanned: true
  },
  {
    id: "meeting-20260724",
    dateLabel: "2026.07.24",
    weekday: "金",
    time: "17:30",
    title: "薬物動態 ~基礎編~",
    theme: "薬物動態",
    format: "ハイブリッド",
    recordingPlanned: true,
    materialsPlanned: true
  }
];

const themeSummaries = [
  ["循環器", "虚血性心疾患や不整脈など、薬物治療の整理に使いやすいテーマ。"],
  ["脳神経", "脳梗塞・脳卒中など、病態と薬物療法をつなげて確認。"],
  ["感染症", "抗菌薬選択や肺炎など、現場で迷いやすい判断点を復習。"],
  ["基礎レクチャー", "病院薬剤師の仕事、薬物動態、輸液などの土台づくり。"],
  ["研究・認定", "臨床研究、学会、認定制度などキャリアに関わる学び。"],
  ["AI活用", "情報整理や業務改善など、医療者の実務に近いAI活用。"]
];

const archiveFeatures = [
  ["テーマから探せる", "関心分野に近い過去回から、勉強会の雰囲気を確認できます。"],
  ["録画・資料を確認できる", "録画、スライド、要点メモ、参考資料の有無を一覧で見られます。"],
  ["参加前に見られる", "いきなり参加する前に、気になる回を1本見て判断できます。"],
  ["最新情報につながる", "日程や参加URLはオープンチャットで受け取れます。"]
];

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: canonicalUrl
    ? {
        canonical: canonicalUrl
      }
    : undefined,
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true
    }
  },
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

export default function AboutPage() {
  return (
    <div className="page-shell about-page">
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
            アーカイブ
          </a>
          <a className="topbar-link" href="#schedule">
            直近予定
          </a>
          <a className="topbar-link" href={siteNavigation.annualMeetingsUrl}>
            学会年会一覧
          </a>
          <a className="topbar-link" href={siteLegal.contactUrl}>
            問い合わせ
          </a>
        </div>
      </header>

      <main className="about-main">
        <section className="about-hero" aria-labelledby="about-title">
          <div className="about-hero-content">
            <h1 id="about-title">
              学び合う場の雰囲気を、
              <br />
              まずはアーカイブから。
            </h1>
            <p>
              {siteLegal.shortSiteName}は、薬剤師・医療従事者が臨床、研究、基礎レクチャー、AI活用を学び合う勉強会です。
              最低月2回、ハイブリッドで開催し、録画と資料も共有しています。
            </p>
            <div className="about-hero-actions">
              <a className="button button-primary" href={siteNavigation.archiveUrl}>
                アーカイブを見る
              </a>
              <a className="button button-secondary" href={openChatUrl} target="_blank" rel="noreferrer">
                オープンチャットに参加する
              </a>
            </div>
            <div className="about-proof-list" aria-label="勉強会の特徴">
              <span>月2回以上</span>
              <span>ハイブリッド</span>
              <span>録画あり</span>
              <span>資料共有あり</span>
            </div>
          </div>
        </section>

        <section className="about-intro about-section" aria-labelledby="about-site-heading">
          <div>
            <div className="section-kicker">About</div>
            <h2 id="about-site-heading">このサイトは、勉強会の学びを見返せる公開アーカイブです。</h2>
          </div>
          <p>
            過去の勉強会をテーマ、開催日、資料種別ごとに整理しています。初めての方は参加前に雰囲気を確認する入口として、
            参加中の方は復習や資料確認の場所として使えます。
          </p>
        </section>

        <section className="about-section" aria-labelledby="themes-heading">
          <div className="about-section-head">
            <div>
              <div className="section-kicker">Themes</div>
              <h2 id="themes-heading">気になるテーマから入れます。</h2>
            </div>
            <a className="button button-tertiary" href={`${siteNavigation.archiveUrl}#themes`}>
              テーマから見る
            </a>
          </div>
          <div className="about-theme-grid">
            {themeSummaries.map(([name, summary]) => (
              <article className="about-theme-card" key={name}>
                <h3>{name}</h3>
                <p>{summary}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="about-section about-feature-section" aria-labelledby="features-heading">
          <div className="about-section-head">
            <div>
              <div className="section-kicker">Archive</div>
              <h2 id="features-heading">アーカイブでできること。</h2>
            </div>
          </div>
          <div className="about-feature-list">
            {archiveFeatures.map(([title, body], index) => (
              <article className="about-feature-item" key={title}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <h3>{title}</h3>
                  <p>{body}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="about-section about-join-section" id="openchat" aria-labelledby="openchat-heading">
          <div className="about-join-copy">
            <div className="section-kicker">Open Chat</div>
            <h2 id="openchat-heading">参加の入口は、オープンチャットです。</h2>
            <p>
              参加条件は特にありません。{openChatName}
              では、勉強会の日程、参加URL、最新情報を共有しています。URLまたはQRコードから参加できます。
            </p>
            <div className="about-join-actions">
              <a className="button button-primary" href={openChatUrl} target="_blank" rel="noreferrer">
                オープンチャットに参加する
              </a>
              <a className="button button-tertiary" href="#schedule">
                直近予定を見る
              </a>
            </div>
          </div>
          <div className="about-qr-block" aria-label={`${openChatName} の参加QRコード`}>
            <img src="/images/openchat-qr.png" alt={`${openChatName} 参加用QRコード`} width="590" height="590" />
            <p>{openChatName}</p>
          </div>
        </section>

        <section className="about-section" id="schedule" aria-labelledby="schedule-heading">
          <div className="about-section-head">
            <div>
              <div className="section-kicker">Schedule</div>
              <h2 id="schedule-heading">直近の勉強会予定</h2>
            </div>
            <a className="button button-secondary" href={openChatUrl} target="_blank" rel="noreferrer">
              最新情報を受け取る
            </a>
          </div>
          <div className="about-meeting-grid">
            {upcomingMeetings.map((meeting) => (
              <article className="about-meeting-card" key={meeting.id}>
                <div className="about-meeting-date">
                  <span>{meeting.dateLabel}</span>
                  <strong>
                    {meeting.weekday} {meeting.time}
                  </strong>
                </div>
                <div className="about-meeting-body">
                  <h3>{meeting.title}</h3>
                  <p>{meeting.theme} / 参加URLと詳細はオープンチャットで共有します。</p>
                  <div className="about-meeting-tags" aria-label={`${meeting.title} の予定情報`}>
                    <span>{meeting.format}</span>
                    {meeting.recordingPlanned ? <span>録画予定あり</span> : null}
                    {meeting.materialsPlanned ? <span>資料共有あり</span> : null}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="about-section about-value-section" aria-labelledby="value-heading">
          <div>
            <div className="section-kicker">Study Together</div>
            <h2 id="value-heading">継続的に学びたい方へ。</h2>
          </div>
          <div className="about-value-copy">
            <p>
              臨床テーマの整理だけでなく、研究、認定、学会、AI活用など、薬剤師・医療従事者の学びを広く扱います。
              過去回を見て関心を持った方は、まずオープンチャットで最新情報を受け取ってください。
            </p>
            <a className="button button-primary" href={openChatUrl} target="_blank" rel="noreferrer">
              オープンチャットに参加する
            </a>
          </div>
        </section>

        <section className="notice about-notice" aria-labelledby="notice-heading">
          <strong id="notice-heading">教育用コンテンツ</strong>
          <span>
            本アーカイブは個別診療の判断を代替するものではありません。症例や患者情報を投稿する場合は個人が特定されない形にし、
            誹謗中傷、営業・勧誘目的の投稿、無断転載は控えてください。
          </span>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
