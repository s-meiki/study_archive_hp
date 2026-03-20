import type { Metadata } from "next";
import LegalPageShell from "../legal-page-shell";
import { siteLegal, siteNavigation } from "../site-legal";
import { absoluteSiteUrl } from "../site-url";

export const metadata: Metadata = {
  title: `プライバシーポリシー | ${siteLegal.shortSiteName}`,
  description: `${siteLegal.siteName} のプライバシーポリシーです。`,
  alternates: absoluteSiteUrl("/privacy")
    ? {
        canonical: absoluteSiteUrl("/privacy") ?? undefined
      }
    : undefined
};

const summaryCards = [
  {
    title: "取得する情報",
    description: "閲覧ログ、問い合わせ内容、公開アーカイブの運営情報など、サイト運営に必要な範囲の情報を扱います。"
  },
  {
    title: "利用目的",
    description: "表示、改善、問い合わせ対応、権利処理、不正利用対策など、学習アーカイブを安全に運営するために利用します。"
  },
  {
    title: "外部送信",
    description: "動画再生、Bot 対策、通知、配信基盤のために YouTube、Cloudflare、Discord、Vercel 等を利用します。"
  }
];

const navItems = [
  { href: "#privacy-basic-policy", label: "1. 基本方針" },
  { href: "#privacy-collected-data", label: "2. 扱う情報" },
  { href: "#privacy-purposes", label: "3. 利用目的" },
  { href: "#privacy-third-party-services", label: "4. 外部サービスと外部送信" },
  { href: "#privacy-sharing", label: "5. 第三者提供と委託" },
  { href: "#privacy-security", label: "6. 安全管理" },
  { href: "#privacy-rights", label: "7. 開示・訂正・削除等" },
  { href: "#privacy-operator", label: "8. 運営者情報" }
];

const linkGroups = [
  {
    kicker: "Related",
    title: "関連ページ",
    links: [
      { href: siteLegal.termsUrl, label: "利用規約" },
      { href: siteLegal.contactUrl, label: "問い合わせフォーム" },
      { href: siteNavigation.archiveUrl, label: "勉強会アーカイブ一覧" }
    ]
  }
];

export default function PrivacyPage() {
  return (
    <LegalPageShell
      heroClassName="legal-hero-privacy"
      intro={`${siteLegal.siteName} がどの情報を扱い、何のために使い、どの外部サービスへ送られることがあるかを、要点から確認できる構成にしています。`}
      linkGroups={linkGroups}
      metaItems={[
        { label: "対象サイト", value: siteLegal.siteName },
        { label: "対象者", value: siteLegal.audienceLabel },
        { label: "窓口", value: siteLegal.contactOffice },
        { label: "連絡方法", value: <a href={siteLegal.contactUrl}>問い合わせフォーム</a> }
      ]}
      navItems={navItems}
      pageLabel="Privacy Policy"
      stats={[
        { label: "対象", value: siteLegal.audienceLabel },
        { label: "窓口", value: siteLegal.contactOffice },
        { label: "最終更新", value: siteLegal.updatedDate }
      ]}
      summaryCards={summaryCards}
      title="プライバシーポリシー"
      titleId="privacy-title"
    >
      <section className="legal-section" id="privacy-basic-policy">
        <div className="legal-section-heading">
          <span className="legal-section-index">01</span>
          <div>
            <h2>基本方針</h2>
            <p className="legal-section-lead">個人情報は必要最小限で扱い、教育アーカイブとしての安全性を優先します。</p>
          </div>
        </div>
        <p>{siteLegal.contactOffice} は、個人情報の保護に関する法律その他の関係法令及びガイドラインを遵守し、個人情報を適切に取り扱います。</p>
        <p>本サイトは関係者向けの学習アーカイブであり、患者情報、匿名化されていない症例情報、不要な個人情報は扱わない前提で運用します。</p>
      </section>

      <section className="legal-section" id="privacy-collected-data">
        <div className="legal-section-heading">
          <span className="legal-section-index">02</span>
          <div>
            <h2>扱う情報</h2>
            <p className="legal-section-lead">自動取得される技術情報と、運営や問い合わせに必要な情報を対象とします。</p>
          </div>
        </div>
        <ul className="legal-list">
          <li>閲覧時に自動で処理される IP アドレス、ブラウザ、端末、閲覧日時、参照元等の技術情報</li>
          <li>公開アーカイブとして掲載するタイトル、開催日、録画 URL、資料 URL、登壇者名等の運営情報</li>
          <li>問い合わせフォームで入力された氏名、メールアドレス、問い合わせ内容</li>
          <li>Cloudflare Turnstile が処理するブラウザ情報、端末情報、通信情報等</li>
        </ul>
      </section>

      <section className="legal-section" id="privacy-purposes">
        <div className="legal-section-heading">
          <span className="legal-section-index">03</span>
          <div>
            <h2>利用目的</h2>
            <p className="legal-section-lead">学習アーカイブの継続運営、問い合わせ対応、権利処理、安全対策のために利用します。</p>
          </div>
        </div>
        <ul className="legal-list">
          <li>本サイトの表示、運営、保守、改善のため</li>
          <li>アーカイブ、資料、録画、問い合わせ導線を提供するため</li>
          <li>著作権、匿名化、掲載ミス、削除依頼その他の権利処理に対応するため</li>
          <li>不正アクセス、スパム送信、過剰アクセス等への対策を行うため</li>
          <li>問い合わせ内容を担当者へ通知し、返信又は対応判断を行うため</li>
        </ul>
      </section>

      <section className="legal-section" id="privacy-third-party-services">
        <div className="legal-section-heading">
          <span className="legal-section-index">04</span>
          <div>
            <h2>外部サービスと外部送信</h2>
            <p className="legal-section-lead">機能提供や不正利用対策のため、必要な範囲で外部事業者のサービスを利用します。</p>
          </div>
        </div>
        <ul className="legal-list">
          <li>YouTube: 詳細ページで再生した場合、動画表示と再生機能提供のため、IP アドレス、ブラウザ情報、端末情報、閲覧ページ情報、再生操作情報等が Google LLC 又は YouTube に送信される場合があります。</li>
          <li>Cloudflare Turnstile: 問い合わせフォーム表示時や認証時に、スパム送信防止と不正利用防止のため、IP アドレス、ブラウザ情報、端末情報、通信情報等が Cloudflare, Inc. に送信される場合があります。</li>
          <li>Discord Webhook: 問い合わせ送信時に、氏名、メールアドレス、問い合わせ内容が担当者確認のため Discord に通知されます。</li>
          <li>Vercel 等のホスティング基盤: アクセスに伴う通信情報やログ情報が当該事業者により処理される場合があります。</li>
        </ul>
        <div className="legal-reference-block">
          <span className="legal-reference-label">参照先</span>
          <div className="legal-inline-links">
            <a href="https://policies.google.com/privacy" rel="noreferrer noopener" target="_blank">
              Google
            </a>
            <a href="https://jp.youtube.com/t/terms" rel="noreferrer noopener" target="_blank">
              YouTube
            </a>
            <a href="https://developers.cloudflare.com/turnstile/" rel="noreferrer noopener" target="_blank">
              Cloudflare Turnstile
            </a>
            <a href="https://discord.com/privacy" rel="noreferrer noopener" target="_blank">
              Discord
            </a>
            <a href="https://vercel.com/legal/privacy-policy" rel="noreferrer noopener" target="_blank">
              Vercel
            </a>
          </div>
        </div>
      </section>

      <section className="legal-section" id="privacy-sharing">
        <div className="legal-section-heading">
          <span className="legal-section-index">05</span>
          <div>
            <h2>第三者提供と委託</h2>
            <p className="legal-section-lead">法令上認められる場合を除き、本人の同意なく第三者提供は行いません。</p>
          </div>
        </div>
        <p>法令に基づく場合その他法令上認められる場合を除き、本人の同意なく個人情報を第三者へ提供しません。</p>
        <p>ただし、ホスティング、配信、Bot 判定、通知その他の業務のため、必要な範囲で外部事業者へ取扱いを委託することがあります。</p>
      </section>

      <section className="legal-section" id="privacy-security">
        <div className="legal-section-heading">
          <span className="legal-section-index">06</span>
          <div>
            <h2>安全管理</h2>
            <p className="legal-section-lead">公開運用に必要な確認とアクセス制御を行い、事故発生時は速やかに対応します。</p>
          </div>
        </div>
        <ul className="legal-list">
          <li>編集権限を必要最小限に限定します。</li>
          <li>公開前に患者情報、匿名化不備、権利侵害の有無を確認します。</li>
          <li>シークレット値や Webhook URL は公開コードに含めません。</li>
          <li>事故発生時は公開停止、調査、通知、再発防止を速やかに行います。</li>
        </ul>
      </section>

      <section className="legal-section" id="privacy-rights">
        <div className="legal-section-heading">
          <span className="legal-section-index">07</span>
          <div>
            <h2>開示・訂正・削除等</h2>
            <p className="legal-section-lead">法令に基づく請求や削除依頼には、窓口を通じて適切に対応します。</p>
          </div>
        </div>
        <p>法令に基づき、本人又は代理人から、保有個人データの開示、訂正、追加、削除、利用停止等の請求があった場合、適切に対応します。</p>
        <p>
          連絡窓口は {siteLegal.contactOffice} です。請求や削除依頼は <a href={siteLegal.contactUrl}>問い合わせフォーム</a> から送ってください。
        </p>
      </section>

      <section className="legal-section" id="privacy-operator">
        <div className="legal-section-heading">
          <span className="legal-section-index">08</span>
          <div>
            <h2>運営者情報</h2>
            <p className="legal-section-lead">運営主体と問い合わせ導線を、確認しやすい形で明示しています。</p>
          </div>
        </div>
        <dl className="legal-detail-grid">
          <div>
            <dt>サイト名</dt>
            <dd>{siteLegal.siteName}</dd>
          </div>
          <div>
            <dt>運営者名</dt>
            <dd>{siteLegal.operatorName}</dd>
          </div>
          <div>
            <dt>窓口</dt>
            <dd>{siteLegal.contactOffice}</dd>
          </div>
          <div>
            <dt>所在地</dt>
            <dd>{siteLegal.location}</dd>
          </div>
          <div>
            <dt>連絡方法</dt>
            <dd>
              <a href={siteLegal.contactUrl}>問い合わせフォーム</a>
            </dd>
          </div>
          <div>
            <dt>関連ページ</dt>
            <dd>
              <a href={siteNavigation.archiveUrl}>勉強会アーカイブ一覧</a> / <a href={siteLegal.termsUrl}>利用規約</a>
            </dd>
          </div>
        </dl>
      </section>
    </LegalPageShell>
  );
}
