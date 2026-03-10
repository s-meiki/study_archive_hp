import type { Metadata } from "next";
import SiteFooter from "../site-footer";
import { siteLegal, siteNavigation } from "../site-legal";

export const metadata: Metadata = {
  title: `利用規約 | ${siteLegal.shortSiteName}`,
  description: `${siteLegal.siteName} の利用規約です。`
};

export default function TermsPage() {
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
          <a className="topbar-link" href={siteNavigation.annualMeetingsUrl}>
            学会年会一覧へ
          </a>
          <a className="topbar-link" href={siteLegal.contactUrl}>
            問い合わせ
          </a>
        </div>
      </header>

      <main className="legal-main">
        <section className="panel legal-panel legal-hero" aria-labelledby="terms-title">
          <div className="section-kicker">Terms Of Use</div>
          <h1 id="terms-title">利用規約</h1>
          <p className="legal-copy">
            このページは、{siteLegal.siteName} を利用する際のルールをまとめたものです。難しい言い方を避けると、
            「学習用の資料置き場として安全に使うための約束」です。
          </p>
          <div className="hero-stats" aria-label="規約の基本情報">
            <span className="stat-chip">対象: {siteLegal.audienceLabel}</span>
            <span className="stat-chip">運営: {siteLegal.contactOffice}</span>
            <span className="stat-chip">最終更新: {siteLegal.updatedDate}</span>
          </div>
        </section>

        <div className="notice" role="note">
          <strong>公開範囲の考え方</strong>
          <span>
            本サイトは関係者向けを想定していますが、インターネット上で配信されるため、公開してよい情報だけを扱う前提で利用してください。
          </span>
        </div>

        <section className="legal-grid">
          <div className="legal-stack">
            <article className="panel legal-panel">
              <div className="section-kicker">1. 目的</div>
              <h2>学習アーカイブとして使うためのサイトです</h2>
              <p className="legal-copy">
                本サイトは、勉強会、講義、研究会その他の教育用アーカイブを整理し、録画、資料、参考情報への導線を提供することを目的とします。
              </p>
              <p className="legal-copy">
                本サイト上の情報は教育・学習支援のためのものであり、個別の診断、治療、服薬指導その他の医療判断の代わりになるものではありません。
              </p>
            </article>

            <article className="panel legal-panel">
              <div className="section-kicker">2. 利用ルール</div>
              <h2>やってはいけないこと</h2>
              <ul className="legal-list">
                <li>法令や公序良俗に反する使い方をすること</li>
                <li>患者情報、匿名化されていない症例情報、機密情報を掲載、送信、共有すること</li>
                <li>資料やページの内容を、権利者の許可なく転載、再配布、販売、改変すること</li>
                <li>自動取得や大量アクセスで、本サイトや外部サービスに過度な負荷をかけること</li>
                <li>削除依頼や問い合わせ窓口へ虚偽の情報を送ること</li>
              </ul>
            </article>

            <article className="panel legal-panel">
              <div className="section-kicker">3. 権利</div>
              <h2>資料やページの権利について</h2>
              <p className="legal-copy">
                本サイトに掲載される文章、画像、構成、データ、配布資料その他のコンテンツに関する著作権その他の権利は、運営者又は正当な権利者に帰属します。
              </p>
              <p className="legal-copy">
                利用者は、法令上認められる範囲を超えて、本サイトのコンテンツを複製、転載、再配布、販売又は改変してはなりません。
              </p>
            </article>

            <article className="panel legal-panel">
              <div className="section-kicker">4. 外部サービス</div>
              <h2>動画再生や問い合わせでは外部サービスを使います</h2>
              <ul className="legal-list">
                <li>録画再生時には YouTube の埋め込みプレーヤーを読み込む場合があります</li>
                <li>問い合わせフォームでは Cloudflare Turnstile によるボット判定を行います</li>
                <li>問い合わせ内容は、担当者確認のため Discord Webhook に通知されます</li>
                <li>本サイトは Vercel 等のホスティング基盤で配信される場合があります</li>
              </ul>
              <p className="legal-copy">
                これらの外部サービスには、それぞれの利用規約、プライバシーポリシーその他の条件が適用されます。詳しくはプライバシーポリシーを確認してください。
              </p>
            </article>

            <article className="panel legal-panel">
              <div className="section-kicker">5. 免責</div>
              <h2>保証しないこと</h2>
              <ul className="legal-list">
                <li>本サイトの情報は、公開時点の内容であり、常に最新、完全、正確であることを保証しません</li>
                <li>外部リンク先、埋め込み先、配布資料は、変更、削除、停止される場合があります</li>
                <li>本サイトの利用により生じた損害について、運営者に故意又は重過失がある場合を除き、責任を負いません</li>
              </ul>
            </article>

            <article className="panel legal-panel">
              <div className="section-kicker">6. 削除依頼</div>
              <h2>修正や削除の連絡</h2>
              <p className="legal-copy">
                権利侵害、個人情報の掲載、匿名化不備、掲載ミスその他の問題がある場合、運営者は必要に応じてコンテンツの修正、非公開化又は削除を行います。
              </p>
              <p className="legal-copy">
                連絡窓口は {siteLegal.contactOffice} です。連絡方法は <a href={siteLegal.contactUrl}>問い合わせフォーム</a> を使用してください。
              </p>
            </article>
          </div>

          <aside className="legal-stack">
            <article className="panel legal-panel">
              <div className="section-kicker">運営情報</div>
              <h2>運営者</h2>
              <ul className="legal-list legal-list-compact">
                <li>サイト名: {siteLegal.siteName}</li>
                <li>運営者名: {siteLegal.operatorName}</li>
                <li>運営主体: {siteLegal.operatorType}</li>
                <li>窓口: {siteLegal.contactOffice}</li>
                <li>所在地: {siteLegal.location}</li>
              </ul>
            </article>

            <article className="panel legal-panel">
              <div className="section-kicker">適用</div>
              <h2>規約の変更と裁判所</h2>
              <p className="legal-copy">
                本規約は、必要に応じて変更されることがあります。変更後の規約は、本サイト上に掲載した時点又は別途定めた効力発生日から適用されます。
              </p>
              <p className="legal-copy">
                本規約は日本法に準拠して解釈され、本サイト又は本規約に関する紛争については、{siteLegal.jurisdictionCourt}
                を第一審の専属的合意管轄裁判所とします。
              </p>
            </article>

            <article className="panel legal-panel">
              <div className="section-kicker">関連ページ</div>
              <h2>あわせて見るページ</h2>
              <div className="legal-link-list">
                <a href={siteLegal.privacyUrl}>プライバシーポリシー</a>
                <a href={siteLegal.contactUrl}>問い合わせフォーム</a>
                <a href={siteNavigation.archiveUrl}>勉強会アーカイブ一覧</a>
              </div>
            </article>
          </aside>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
