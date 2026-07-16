import { Fragment } from "react";
import type { Metadata } from "next";
import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr";

import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { SectionHeader } from "../ui/section-header";
import { Stat } from "../ui/stat";
import buttonStyles from "../ui/button.module.css";
import { loadSiteContent } from "../site-data";
import { siteLegal, siteNavigation } from "../site-legal";
import { absoluteSiteUrl } from "../site-url";
import styles from "./about.module.css";

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
    <span className={styles.kw} key={index}>
      {part}
    </span>
  ));
}

type ThemeCat = 1 | 2 | 3 | 4 | 5 | 6;

const themeSummaries: Array<{ cat: ThemeCat; name: string; summary: string; beginner: boolean }> = [
  { cat: 1, name: "循環器", summary: "虚血性心疾患や不整脈など、薬物治療の整理に使いやすいテーマ。", beginner: false },
  { cat: 2, name: "脳神経", summary: "脳梗塞・脳卒中など、病態と薬物療法をつなげて確認。", beginner: false },
  { cat: 3, name: "感染症", summary: "抗菌薬選択や肺炎など、現場で迷いやすい判断点を復習。", beginner: false },
  { cat: 4, name: "基礎レクチャー", summary: "病院薬剤師の仕事、薬物動態、輸液などの土台づくり。全6本。", beginner: true },
  { cat: 5, name: "研究・認定", summary: "臨床研究、学会、認定制度などキャリアに関わる学び。", beginner: false },
  { cat: 6, name: "AI活用", summary: "情報整理や業務改善など、医療者の実務に近いAI活用。", beginner: false }
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

function ExternalButton({
  href,
  children,
  variant = "primary"
}: {
  href: string;
  children: string;
  variant?: "primary" | "secondary";
}) {
  return (
    <a
      className={`${buttonStyles.button} ${variant === "primary" ? buttonStyles.primary : buttonStyles.secondary}`}
      href={href}
      target="_blank"
      rel="noreferrer"
    >
      {children}
    </a>
  );
}

export default async function AboutPage() {
  const siteContent = await loadSiteContent();
  const stats: Array<[string, string]> = [
    [String(siteContent.archives.length), "開催回数（2024〜2026）"],
    [String(siteContent.themes.length), "テーマ領域"],
    [String(siteContent.archives.filter((archive) => archive.assets?.recording).length), "録画（YouTube）"]
  ];

  return (
    <div className={styles.page}>
      <section className={styles.hero} aria-labelledby="about-title">
        <p className={styles.heroEyebrow}>薬剤師・医療従事者の勉強会</p>
        <h1 id="about-title">
          {kw("月2回、|オンラインで")}
          <br />
          {kw("つながって|学ぶ。")}
        </h1>
        <p className={styles.heroLead}>
          一人だと続かない勉強を、仲間と。臨床から基礎、研究、AI活用まで、Zoomを使ったハイブリッドで最低月2回開催しています。
        </p>
        <div className={styles.heroActions}>
          <ExternalButton href={openChatUrl}>オープンチャットに参加する</ExternalButton>
          <Button variant="secondary" href="/archives">
            アーカイブを見てみる
          </Button>
        </div>
        <div className={styles.proofList} aria-label="勉強会の特徴">
          <Badge>月2回以上</Badge>
          <Badge>ハイブリッド開催</Badge>
          <Badge>録画あり</Badge>
        </div>
      </section>

      <section aria-label="こんな薬剤師のための会です" className={styles.section}>
        <SectionHeader title="こんな薬剤師のための会です。" />
        <div className={styles.answerGrid}>
          {concerns.map(([worry, title, body]) => (
            <Card className={styles.answerCard} key={worry}>
              <p className={styles.answerWorry}>「{worry}」</p>
              <h3>{kw(title)}</h3>
              <p>{body}</p>
            </Card>
          ))}
        </div>
      </section>

      <section aria-label="参加までは、3ステップ" className={styles.section}>
        <SectionHeader
          title="参加までは、3ステップ。"
          action={<ExternalButton href={openChatUrl}>オープンチャットに参加する</ExternalButton>}
        />
        <div className={styles.stepGrid}>
          {joinSteps.map(([title, body], index) => (
            <Card className={styles.stepCard} key={title}>
              <span className={styles.stepNum} aria-hidden="true">
                {index + 1}
              </span>
              <h3>{kw(title)}</h3>
              <p>{body}</p>
            </Card>
          ))}
        </div>
      </section>

      <section aria-label="2024年から積み重ねた、24回" className={styles.section}>
        <SectionHeader
          title="2024年から積み重ねた、24回。"
          action={
            <Button variant="secondary" href="/archives">
              アーカイブを見る
            </Button>
          }
        />
        <p className={styles.sectionLead}>
          循環器・脳神経・感染症から、基礎レクチャー、研究・認定、AI活用まで6テーマ。過去回の録画8本とスライドを公開しています。
        </p>
        <div className={styles.statRow}>
          {stats.map(([value, label]) => (
            <Stat key={label} label={label} value={<span className="tabular-nums">{value}</span>} />
          ))}
        </div>
        <div className={styles.themeGrid}>
          {themeSummaries.map((theme) => (
            <Card className={styles.themeCard} key={theme.name}>
              <div className={styles.themeCardHead}>
                <Badge variant="theme" cat={theme.cat}>
                  {theme.name}
                </Badge>
                {theme.beginner ? <Badge>初学者向け</Badge> : null}
              </div>
              <p>{theme.summary}</p>
            </Card>
          ))}
        </div>
      </section>

      <section aria-label="参加して、終わりにしない" className={styles.section}>
        <SectionHeader title="参加して、終わりにしない。" />
        <p className={styles.sectionLead}>
          アーカイブで気になる回を見て、コースで体系的に学び、クイズで理解を確認。進捗やバッジも記録されます。登録・ログインは不要、ブラウザだけで今すぐ試せます（進捗はお使いのブラウザに保存されます）。
        </p>
        <div className={styles.flow} aria-hidden="true">
          {learnFlow.map((label, index) => (
            <Fragment key={label}>
              {index > 0 ? (
                <span className={styles.flowArrow}>
                  <ArrowRightIcon weight="bold" />
                </span>
              ) : null}
              <span className={styles.flowStep}>{label}</span>
            </Fragment>
          ))}
        </div>
        <div className={styles.learnActions}>
          <Button variant="primary" href="/">
            学習を始める
          </Button>
          <Button variant="secondary" href="/courses">
            コース一覧を見る
          </Button>
        </div>
      </section>

      <section aria-label="直近の勉強会予定" className={styles.section} id="schedule">
        <SectionHeader
          title="直近の勉強会予定"
          action={<ExternalButton href={openChatUrl} variant="secondary">最新情報を受け取る</ExternalButton>}
        />
        <div className={styles.meetingGrid}>
          {upcomingMeetings.map((meeting) => (
            <Card className={styles.meetingCard} key={meeting.id}>
              <div className={styles.meetingDate}>
                <span>{meeting.dateLabel}</span>
                <strong>
                  {meeting.weekday} {meeting.time}
                </strong>
              </div>
              <div className={styles.meetingBody}>
                <h3>{meeting.title}</h3>
                <p>{meeting.theme} / 参加URLと詳細はオープンチャットで共有します。</p>
                <div className={styles.meetingTags} aria-label={`${meeting.title} の予定情報`}>
                  <Badge>{meeting.format}</Badge>
                  {meeting.recordingPlanned ? <Badge>録画予定あり</Badge> : null}
                  {meeting.materialsPlanned ? <Badge>資料共有あり</Badge> : null}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section aria-label="よくある質問" className={styles.section}>
        <SectionHeader title="よくある質問" />
        <Card className={styles.faqList}>
          {faqs.map(([question, answer]) => (
            <div className={styles.faqItem} key={question}>
              <h3>{question}</h3>
              <p>{answer}</p>
            </div>
          ))}
        </Card>
      </section>

      <section className={styles.section} id="openchat" aria-labelledby="openchat-heading">
        <Card className={styles.joinPanel}>
          <div className={styles.joinCopy}>
            <h2 id="openchat-heading">まずは、オープンチャットへ。</h2>
            <p>
              「{openChatName}」では、開催日程・参加URL・資料の案内を共有しています。QRコードまたはリンクから参加できます。まず質問したい方は、問い合わせフォームもご利用ください。
            </p>
            <div className={styles.joinActions}>
              <ExternalButton href={openChatUrl}>オープンチャットに参加する</ExternalButton>
              <Button variant="secondary" href={siteLegal.contactUrl}>
                問い合わせフォーム
              </Button>
            </div>
          </div>
          <div className={styles.qrBlock} aria-label={`${openChatName} の参加QRコード`}>
            <img alt={`${openChatName} 参加用QRコード`} height="160" src="/images/openchat-qr.png" width="160" />
            <p>{openChatName}</p>
          </div>
        </Card>
      </section>

      <section aria-labelledby="notice-heading" className={styles.notice}>
        <strong id="notice-heading">教育用コンテンツ</strong>
        <span>
          本アーカイブは個別診療の判断を代替するものではありません。症例や患者情報を投稿する場合は個人が特定されない形にし、
          誹謗中傷、営業・勧誘目的の投稿、無断転載は控えてください。
        </span>
      </section>
    </div>
  );
}
