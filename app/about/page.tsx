import { Fragment } from "react";
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

// 見出し文字列の "|" は文節区切り。kw() が改行可能位置として展開する。
const concerns = [
  [
    "一人だと続かない",
    "月2回、|仲間と|続けられる",
    "最低月2回、同じ関心を持つ薬剤師・医療従事者が集まります。日程はオープンチャットで届くので、忘れずに参加できます。"
  ],
  [
    "ついていけるか不安",
    "初学者向けの|基礎から",
    "病院薬剤師の仕事、薬物動態、輸液などの基礎レクチャーを6本用意。土台づくりから始められます。"
  ],
  [
    "時間が合わない",
    "録画と|アーカイブで|後追い",
    "Zoomを使ったハイブリッド開催に加え、過去回の録画8本とスライドを公開。当日参加できなくても追いつけます。"
  ]
];

const joinSteps = [
  ["オープンチャットに|登録", `QRコードまたはリンクから「${openChatName}」に参加します。`],
  ["日程と|参加URLが|届く", "開催日程と当日のZoom参加URLは、オープンチャットで共有します。"],
  ["気になる回だけ|参加", "毎回の参加は必須ではありません。関心のあるテーマの回だけ選べます。"]
];

// 見出しを文節単位の inline-block spans に分割し、語中改行を防ぐ。
function kw(text: string) {
  return text.split("|").map((part, index) => (
    <span className="about-kw" key={index}>
      {part}
    </span>
  ));
}

const stats = [
  ["24", "開催回数（2024〜2026）"],
  ["6", "テーマ領域"],
  ["8", "録画（YouTube）"]
];

const themeSummaries: [string, string, boolean][] = [
  ["循環器", "虚血性心疾患や不整脈など、薬物治療の整理に使いやすいテーマ。", false],
  ["脳神経", "脳梗塞・脳卒中など、病態と薬物療法をつなげて確認。", false],
  ["感染症", "抗菌薬選択や肺炎など、現場で迷いやすい判断点を復習。", false],
  ["基礎レクチャー", "病院薬剤師の仕事、薬物動態、輸液などの土台づくり。全6本。", true],
  ["研究・認定", "臨床研究、学会、認定制度などキャリアに関わる学び。", false],
  ["AI活用", "情報整理や業務改善など、医療者の実務に近いAI活用。", false]
];

const learnFlow = ["アーカイブ", "コース", "クイズ", "進捗・バッジ"];

// 管理者に事実確認が取れた範囲のみを扱う。事実の追加・誇張はしない。
const faqs = [
  [
    "参加費はかかりますか？",
    "参加費は原則かかりません。オープンチャットで案内する回に、そのまま参加できます。"
  ],
  [
    "カメラはオンにする必要がありますか？",
    "カメラのオンは必須ではありません。オフのままでも参加できます。"
  ],
  [
    "発言や質問は必須ですか？",
    "発言の制限や強制はありません。聞くだけの参加もできます。"
  ],
  [
    "参加できる職種や経験年数に条件はありますか？",
    "職種や経験年数による参加制限はありません。薬剤師・医療従事者の勉強会として、どなたでも参加いただけます。"
  ]
];

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
            <p className="about-hero-eyebrow">薬剤師・医療従事者の勉強会</p>
            <h1 id="about-title">
              {kw("月2回、|オンラインで")}
              <br />
              {kw("つながって|学ぶ。")}
            </h1>
            <p>
              一人だと続かない勉強を、仲間と。臨床から基礎、研究、AI活用まで、Zoomを使ったハイブリッドで最低月2回開催しています。
            </p>
            <div className="about-hero-actions">
              <a className="button button-primary" href={openChatUrl} target="_blank" rel="noreferrer">
                オープンチャットに参加する
              </a>
              <a className="button button-secondary" href={siteNavigation.archiveUrl}>
                アーカイブを見てみる
              </a>
            </div>
            <div className="about-proof-list" aria-label="勉強会の特徴">
              <span>月2回以上</span>
              <span>ハイブリッド開催</span>
              <span>録画あり</span>
            </div>
          </div>
        </section>

        <section className="about-section about-answer-section" aria-labelledby="answer-heading">
          <div className="about-section-head">
            <div>
              <div className="section-kicker">For You</div>
              <h2 id="answer-heading">{kw("こんな|薬剤師のための|会です。")}</h2>
            </div>
          </div>
          <div className="about-answer-grid">
            {concerns.map(([worry, title, body]) => (
              <article className="about-answer-card" key={worry}>
                <p className="about-answer-worry">「{worry}」</p>
                <h3>{kw(title)}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="about-section about-steps-section" aria-labelledby="steps-heading">
          <div className="about-section-head">
            <div>
              <div className="section-kicker">How to Join</div>
              <h2 id="steps-heading">{kw("参加までは、|3ステップ。")}</h2>
            </div>
            <a className="button button-primary" href={openChatUrl} target="_blank" rel="noreferrer">
              オープンチャットに参加する
            </a>
          </div>
          <div className="about-step-grid">
            {joinSteps.map(([title, body], index) => (
              <article className="about-step" key={title}>
                <span className="about-step-num" aria-hidden="true">
                  {index + 1}
                </span>
                <h3>{kw(title)}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="about-section about-record-section" aria-labelledby="record-heading">
          <div className="about-section-head">
            <div>
              <div className="section-kicker">Track Record</div>
              <h2 id="record-heading">{kw("2024年から|積み重ねた、|24回。")}</h2>
            </div>
            <a className="button button-tertiary" href={siteNavigation.archiveUrl}>
              アーカイブを見る
            </a>
          </div>
          <p className="about-lead">
            循環器・脳神経・感染症から、基礎レクチャー、研究・認定、AI活用まで6テーマ。過去回の録画8本とスライドを公開しています。
          </p>
          <div className="about-stat-grid">
            {stats.map(([value, label]) => (
              <div className="about-stat" key={label}>
                <strong>{value}</strong>
                <span>{label}</span>
              </div>
            ))}
          </div>
          <div className="about-theme-grid">
            {themeSummaries.map(([name, summary, beginner]) => (
              <article className="about-theme-card" key={name}>
                <div className="about-theme-card-head">
                  <h3>{name}</h3>
                  {beginner ? <span className="about-tag">初学者向け</span> : null}
                </div>
                <p>{summary}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="about-section about-learn-section" aria-labelledby="learn-heading">
          <div className="about-section-head">
            <div>
              <div className="section-kicker">Keep Learning</div>
              <h2 id="learn-heading">{kw("参加して、|終わりにしない。")}</h2>
            </div>
          </div>
          <p className="about-lead">
            アーカイブで気になる回を見て、コースで体系的に学び、クイズで理解を確認。進捗やバッジも記録されます。登録・ログインは不要、ブラウザだけで今すぐ試せます（進捗はお使いのブラウザに保存されます）。
          </p>
          <div className="about-flow" aria-hidden="true">
            {learnFlow.map((label, index) => (
              <Fragment key={label}>
                {index > 0 ? <span className="about-flow-arrow">→</span> : null}
                <span className="about-flow-step">{label}</span>
              </Fragment>
            ))}
          </div>
          <div className="about-learn-actions">
            <a className="button button-primary" href="/learn">
              学習を始める
            </a>
            <a className="button button-tertiary" href="/courses">
              コース一覧を見る
            </a>
          </div>
        </section>

        <section className="about-section about-schedule-section" id="schedule" aria-labelledby="schedule-heading">
          <div className="about-section-head">
            <div>
              <div className="section-kicker">Schedule</div>
              <h2 id="schedule-heading">{kw("直近の|勉強会予定")}</h2>
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

        <section className="about-section about-faq-section" aria-labelledby="faq-heading">
          <div className="about-section-head">
            <div>
              <div className="section-kicker">FAQ</div>
              <h2 id="faq-heading">{kw("よくある|質問")}</h2>
            </div>
          </div>
          <div className="about-faq-list">
            {faqs.map(([question, answer]) => (
              <article className="about-faq-item" key={question}>
                <h3>{question}</h3>
                <p>{answer}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="about-section about-join-section" id="openchat" aria-labelledby="openchat-heading">
          <div className="about-join-copy">
            <div className="section-kicker">Join Us</div>
            <h2 id="openchat-heading">{kw("まずは、|オープンチャットへ。")}</h2>
            <p>
              「{openChatName}」では、開催日程・参加URL・資料の案内を共有しています。QRコードまたはリンクから参加できます。まず質問したい方は、問い合わせフォームもご利用ください。
            </p>
            <div className="about-join-actions">
              <a className="button button-primary" href={openChatUrl} target="_blank" rel="noreferrer">
                オープンチャットに参加する
              </a>
              <a className="button button-tertiary" href={siteLegal.contactUrl}>
                問い合わせフォーム
              </a>
            </div>
          </div>
          <div className="about-qr-block" aria-label={`${openChatName} の参加QRコード`}>
            <img src="/images/openchat-qr.png" alt={`${openChatName} 参加用QRコード`} width="590" height="590" />
            <p>{openChatName}</p>
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
