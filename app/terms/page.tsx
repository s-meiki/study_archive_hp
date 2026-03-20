import type { Metadata } from "next";
import LegalPageShell from "../legal-page-shell";
import { siteLegal, siteNavigation } from "../site-legal";
import { absoluteSiteUrl } from "../site-url";

export const metadata: Metadata = {
  title: `利用規約 | ${siteLegal.shortSiteName}`,
  description: `${siteLegal.siteName} の利用規約です。`,
  alternates: absoluteSiteUrl("/terms")
    ? {
        canonical: absoluteSiteUrl("/terms") ?? undefined
      }
    : undefined
};

const summaryCards = [
  {
    title: "このサイトの位置づけ",
    description: "教育用アーカイブとして録画や資料へアクセスしやすくするためのサイトで、個別の医療判断を置き換えるものではありません。"
  },
  {
    title: "主な禁止事項",
    description: "患者情報や機密情報の掲載、権利侵害、虚偽の問い合わせ、過剰アクセスや自動取得などを禁止します。"
  },
  {
    title: "外部サービスと連絡",
    description: "動画再生や問い合わせでは外部サービスを利用します。問題がある場合は問い合わせフォームから連絡できます。"
  }
];

const navItems = [
  { href: "#terms-purpose", label: "1. 目的" },
  { href: "#terms-conditions", label: "2. 利用条件" },
  { href: "#terms-third-party-services", label: "3. 外部サービス" },
  { href: "#terms-disclaimer", label: "4. 免責" },
  { href: "#terms-removal", label: "5. 修正・削除対応" },
  { href: "#terms-updates", label: "6. 規約変更と準拠法" },
  { href: "#terms-operator", label: "7. 運営者情報" }
];

const linkGroups = [
  {
    kicker: "Related",
    title: "関連ページ",
    links: [
      { href: siteLegal.privacyUrl, label: "プライバシーポリシー" },
      { href: siteLegal.contactUrl, label: "問い合わせフォーム" },
      { href: siteNavigation.archiveUrl, label: "勉強会アーカイブ一覧" }
    ]
  }
];

export default function TermsPage() {
  return (
    <LegalPageShell
      intro={`${siteLegal.siteName} を学習用アーカイブとして安全に利用するためのルールを、要点を先に確認できる構成で整理しています。`}
      linkGroups={linkGroups}
      metaItems={[
        { label: "対象サイト", value: siteLegal.siteName },
        { label: "対象者", value: siteLegal.audienceLabel },
        { label: "運営主体", value: siteLegal.operatorType },
        { label: "窓口", value: siteLegal.contactOffice }
      ]}
      navItems={navItems}
      pageLabel="Terms Of Use"
      stats={[
        { label: "対象", value: siteLegal.audienceLabel },
        { label: "運営", value: siteLegal.contactOffice },
        { label: "最終更新", value: siteLegal.updatedDate }
      ]}
      summaryCards={summaryCards}
      title="利用規約"
      titleId="terms-title"
    >
      <section className="legal-section" id="terms-purpose">
        <div className="legal-section-heading">
          <span className="legal-section-index">01</span>
          <div>
            <h2>目的</h2>
            <p className="legal-section-lead">本サイトは教育用アーカイブの整理と導線提供を目的とし、診療判断の代替を意図しません。</p>
          </div>
        </div>
        <p>本サイトは、勉強会、講義、研究会その他の教育用アーカイブを整理し、録画、資料、参考情報への導線を提供するためのものです。</p>
        <p>本サイト上の情報は教育・学習支援を目的とするものであり、個別の診断、治療、服薬指導その他の医療判断の代替を目的としません。</p>
      </section>

      <section className="legal-section" id="terms-conditions">
        <div className="legal-section-heading">
          <span className="legal-section-index">02</span>
          <div>
            <h2>利用条件</h2>
            <p className="legal-section-lead">公開環境で運用される前提で、公開してよい情報だけを扱い、運営を妨げる行為を禁止します。</p>
          </div>
        </div>
        <ul className="legal-list">
          <li>本サイトは関係者向けを想定していますが、インターネット公開環境で運用されています。公開してよい情報だけを扱ってください。</li>
          <li>患者情報、匿名化されていない症例情報、機密情報を掲載、送信、共有してはいけません。</li>
          <li>法令や公序良俗に反する利用、虚偽の問い合わせ、過剰アクセス、自動取得その他運営を妨げる行為をしてはいけません。</li>
          <li>本サイト上の文章、画像、構成、データ、配布資料その他のコンテンツを、権利者の許可なく転載、再配布、販売、改変してはいけません。</li>
        </ul>
      </section>

      <section className="legal-section" id="terms-third-party-services">
        <div className="legal-section-heading">
          <span className="legal-section-index">03</span>
          <div>
            <h2>外部サービス</h2>
            <p className="legal-section-lead">動画再生や問い合わせ機能では、配信や不正利用対策のために外部サービスを利用します。</p>
          </div>
        </div>
        <ul className="legal-list">
          <li>録画再生時には YouTube の埋め込みプレーヤーを読み込む場合があります。</li>
          <li>問い合わせフォームでは Cloudflare Turnstile によるボット判定を行います。</li>
          <li>問い合わせ内容は Discord Webhook に通知されます。</li>
          <li>本サイトは Vercel 等のホスティング基盤で配信される場合があります。</li>
        </ul>
        <p>
          詳細は <a href={siteLegal.privacyUrl}>プライバシーポリシー</a> を確認してください。
        </p>
      </section>

      <section className="legal-section" id="terms-disclaimer">
        <div className="legal-section-heading">
          <span className="legal-section-index">04</span>
          <div>
            <h2>免責</h2>
            <p className="legal-section-lead">掲載情報や外部リンクの継続性を保証せず、故意又は重過失を除き責任を負いません。</p>
          </div>
        </div>
        <ul className="legal-list">
          <li>本サイトの情報は公開時点の内容であり、常に最新、完全、正確であることを保証しません。</li>
          <li>外部リンク先、埋め込み先、配布資料は変更、削除、停止される場合があります。</li>
          <li>本サイトの利用により生じた損害について、運営者に故意又は重過失がある場合を除き、責任を負いません。</li>
        </ul>
      </section>

      <section className="legal-section" id="terms-removal">
        <div className="legal-section-heading">
          <span className="legal-section-index">05</span>
          <div>
            <h2>修正・削除対応</h2>
            <p className="legal-section-lead">権利侵害や掲載ミスなどの問題がある場合は、必要に応じて修正、非公開化、削除を行います。</p>
          </div>
        </div>
        <p>権利侵害、個人情報の掲載、匿名化不備、掲載ミスその他の問題がある場合、運営者は必要に応じて修正、非公開化又は削除を行います。</p>
        <p>
          連絡窓口は {siteLegal.contactOffice} です。連絡方法は <a href={siteLegal.contactUrl}>問い合わせフォーム</a> を使用してください。
        </p>
      </section>

      <section className="legal-section" id="terms-updates">
        <div className="legal-section-heading">
          <span className="legal-section-index">06</span>
          <div>
            <h2>規約変更と準拠法</h2>
            <p className="legal-section-lead">規約は必要に応じて更新され、日本法に基づいて解釈されます。</p>
          </div>
        </div>
        <p>本規約は必要に応じて変更されることがあります。変更後の規約は、本サイト上に掲載した時点又は別途定めた効力発生日から適用されます。</p>
        <p>本規約は日本法に準拠して解釈され、本サイト又は本規約に関する紛争については {siteLegal.jurisdictionCourt} を第一審の専属的合意管轄裁判所とします。</p>
      </section>

      <section className="legal-section" id="terms-operator">
        <div className="legal-section-heading">
          <span className="legal-section-index">07</span>
          <div>
            <h2>運営者情報</h2>
            <p className="legal-section-lead">運営主体、窓口、関連ページを一覧で確認できるようにしています。</p>
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
            <dt>運営主体</dt>
            <dd>{siteLegal.operatorType}</dd>
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
            <dt>関連ページ</dt>
            <dd>
              <a href={siteLegal.privacyUrl}>プライバシーポリシー</a> / <a href={siteNavigation.archiveUrl}>勉強会アーカイブ一覧</a>
            </dd>
          </div>
        </dl>
      </section>
    </LegalPageShell>
  );
}
