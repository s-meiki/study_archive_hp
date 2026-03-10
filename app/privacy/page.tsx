import type { Metadata } from "next";
import SiteFooter from "../site-footer";
import { siteLegal, siteNavigation } from "../site-legal";

export const metadata: Metadata = {
  title: `プライバシーポリシー | ${siteLegal.shortSiteName}`,
  description: `${siteLegal.siteName} のプライバシーポリシーです。`
};

export default function PrivacyPage() {
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
        <section className="panel legal-panel legal-hero" aria-labelledby="privacy-title">
          <div className="section-kicker">Privacy Policy</div>
          <h1 id="privacy-title">プライバシーポリシー</h1>
          <p className="legal-copy">
            このページは、{siteLegal.siteName} がどの情報を扱い、何のために使い、どの外部サービスへ送られることがあるかを説明するものです。
          </p>
          <div className="hero-stats" aria-label="ポリシーの基本情報">
            <span className="stat-chip">対象: {siteLegal.audienceLabel}</span>
            <span className="stat-chip">問い合わせ窓口: {siteLegal.contactOffice}</span>
            <span className="stat-chip">最終更新: {siteLegal.updatedDate}</span>
          </div>
        </section>

        <div className="notice" role="note">
          <strong>情報最小化</strong>
          <span>
            本サイトは関係者向けの学習アーカイブです。患者情報、匿名化されていない症例情報、不要な個人情報は扱わない前提で運用します。
          </span>
        </div>

        <section className="legal-grid">
          <div className="legal-stack">
            <article className="panel legal-panel">
              <div className="section-kicker">1. 基本方針</div>
              <h2>個人情報を必要最小限で扱います</h2>
              <p className="legal-copy">
                {siteLegal.contactOffice} は、個人情報の保護に関する法律その他の関係法令及びガイドラインを遵守し、個人情報を適切に取り扱います。
              </p>
              <p className="legal-copy">
                特に、医療・薬学分野の教育アーカイブを扱うため、患者情報、登壇者情報、資料内記載情報については必要最小限・安全重視で運用します。
              </p>
            </article>

            <article className="panel legal-panel">
              <div className="section-kicker">2. 扱う情報</div>
              <h2>どんな情報を扱うか</h2>
              <ul className="legal-list">
                <li>閲覧時に自動で処理される IP アドレス、ブラウザ、端末、閲覧日時、参照元等の技術情報</li>
                <li>公開アーカイブとして掲載するタイトル、開催日、録画 URL、資料 URL、登壇者名等の運営情報</li>
                <li>問い合わせフォームで入力された氏名、メールアドレス、問い合わせ内容</li>
                <li>ボット判定のために Turnstile が処理するブラウザ情報、端末情報、通信情報等</li>
              </ul>
            </article>

            <article className="panel legal-panel">
              <div className="section-kicker">3. 利用目的</div>
              <h2>なぜその情報を使うのか</h2>
              <ul className="legal-list">
                <li>本サイトの表示、運営、保守、改善のため</li>
                <li>アーカイブ、資料、録画、問い合わせ導線を提供するため</li>
                <li>著作権、匿名化、掲載ミス、削除依頼その他の権利処理に対応するため</li>
                <li>不正アクセス、スパム送信、過剰アクセス等への対策を行うため</li>
                <li>問い合わせ内容を担当者へ通知し、返信又は対応判断を行うため</li>
              </ul>
            </article>

            <article className="panel legal-panel">
              <div className="section-kicker">4. 外部サービスと外部送信</div>
              <h2>外部サービスへ送られることがある情報</h2>

              <h3>YouTube</h3>
              <p className="legal-copy">
                詳細ページで `再生する` を押した場合、YouTube の埋め込みプレーヤーを読み込みます。このとき、IP アドレス、ブラウザ情報、端末情報、閲覧ページ情報、再生操作情報等が Google LLC 又は YouTube に送信される場合があります。
              </p>
              <p className="legal-copy">主な目的は、動画表示、再生機能の提供、不正利用防止、サービス改善等です。</p>

              <h3>Cloudflare Turnstile</h3>
              <p className="legal-copy">
                問い合わせフォームでは、ボット対策のため Cloudflare Turnstile を利用します。フォーム表示時や認証時に、IP アドレス、ブラウザ情報、端末情報、チャレンジ処理に必要な通信情報等が Cloudflare, Inc. に送信される場合があります。
              </p>
              <p className="legal-copy">主な目的は、スパム送信防止、不正利用防止、フォーム送信の安全性確保です。</p>

              <h3>Discord Webhook</h3>
              <p className="legal-copy">
                問い合わせフォームが正常送信された場合、入力された氏名、メールアドレス、問い合わせ内容は、担当者確認のため Discord へ通知されます。
              </p>
              <p className="legal-copy">主な目的は、問い合わせ受付、担当者共有、一次対応の迅速化です。</p>

              <h3>Vercel 等のホスティング基盤</h3>
              <p className="legal-copy">
                本サイトは Vercel 等のホスティング基盤で配信される場合があります。その場合、アクセスに伴う通信情報やログ情報が当該ホスティング事業者により処理されることがあります。
              </p>
            </article>

            <article className="panel legal-panel">
              <div className="section-kicker">5. 第三者提供と委託</div>
              <h2>第三者への提供について</h2>
              <p className="legal-copy">
                法令に基づく場合その他法令上認められる場合を除き、本人の同意なく個人情報を第三者へ提供しません。
              </p>
              <p className="legal-copy">
                ただし、ホスティング、配信、Bot 判定、通知その他の業務のため、必要な範囲で外部事業者へ取扱いを委託することがあります。
              </p>
            </article>

            <article className="panel legal-panel">
              <div className="section-kicker">6. 安全管理</div>
              <h2>情報を守るための対策</h2>
              <ul className="legal-list">
                <li>編集権限を必要最小限に限定します</li>
                <li>公開前に患者情報、匿名化不備、権利侵害の有無を確認します</li>
                <li>シークレット値やWebhook URL は公開コードに含めません</li>
                <li>事故発生時は公開停止、調査、通知、再発防止を速やかに行います</li>
              </ul>
            </article>
          </div>

          <aside className="legal-stack">
            <article className="panel legal-panel">
              <div className="section-kicker">運営情報</div>
              <h2>運営者と窓口</h2>
              <ul className="legal-list legal-list-compact">
                <li>サイト名: {siteLegal.siteName}</li>
                <li>運営者名: {siteLegal.operatorName}</li>
                <li>窓口: {siteLegal.contactOffice}</li>
                <li>所在地: {siteLegal.location}</li>
                <li>連絡方法: <a href={siteLegal.contactUrl}>問い合わせフォーム</a></li>
              </ul>
            </article>

            <article className="panel legal-panel">
              <div className="section-kicker">外部ポリシー</div>
              <h2>外部サービスの規約等</h2>
              <div className="legal-link-list">
                <a href="https://policies.google.com/privacy" rel="noreferrer noopener" target="_blank">
                  Google Privacy Policy
                </a>
                <a href="https://jp.youtube.com/t/terms" rel="noreferrer noopener" target="_blank">
                  YouTube Terms of Service
                </a>
                <a href="https://developers.cloudflare.com/turnstile/" rel="noreferrer noopener" target="_blank">
                  Cloudflare Turnstile
                </a>
                <a href="https://discord.com/privacy" rel="noreferrer noopener" target="_blank">
                  Discord Privacy Policy
                </a>
                <a href="https://vercel.com/legal/privacy-policy" rel="noreferrer noopener" target="_blank">
                  Vercel Privacy Policy
                </a>
              </div>
            </article>

            <article className="panel legal-panel">
              <div className="section-kicker">請求対応</div>
              <h2>開示・訂正・削除</h2>
              <p className="legal-copy">
                法令に基づき、本人又は代理人から、保有個人データの開示、訂正、追加、削除、利用停止等の請求があった場合、適切に対応します。
              </p>
              <p className="legal-copy">
                連絡窓口は {siteLegal.contactOffice} です。請求や削除依頼は <a href={siteLegal.contactUrl}>問い合わせフォーム</a> から送ってください。
              </p>
            </article>
          </aside>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
