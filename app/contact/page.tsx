import type { Metadata } from "next";
import SiteFooter from "../site-footer";
import { siteLegal, siteNavigation } from "../site-legal";
import { absoluteSiteUrl } from "../site-url";
import ContactForm from "./contact-form";

export const metadata: Metadata = {
  title: `問い合わせ | ${siteLegal.shortSiteName}`,
  description: `${siteLegal.shortSiteName}への問い合わせフォームです。`,
  alternates: absoluteSiteUrl("/contact")
    ? {
        canonical: absoluteSiteUrl("/contact") ?? undefined
      }
    : undefined
};

export default function ContactPage() {
  const siteKey = process.env.NEXT_PUBLIC_CF_SITE_KEY ?? "";

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
        </div>
      </header>

      <main className="contact-main">
        <section className="contact-simple" aria-labelledby="contact-title">
          <div className="panel contact-panel contact-simple-panel">
            <div className="section-kicker">Contact Form</div>
            <h1 id="contact-title">問い合わせ</h1>
            <p className="contact-simple-copy">
              勉強会アーカイブに関する連絡だけを受け付けます。内容確認後、必要に応じてメールで返信します。
            </p>
            <div className="notice contact-simple-note" role="note">
              <strong>注意</strong>
              <span>個人情報や匿名化されていない症例情報は入力しないでください。</span>
            </div>
            <div className="notice contact-simple-note" role="note">
              <strong>外部サービス</strong>
              <span>
                送信時は Cloudflare Turnstile でボット判定を行い、内容は Discord Webhook に通知されます。
                <span className="contact-note-tail">
                  詳細は <a href={siteLegal.privacyUrl}>プライバシーポリシー</a> を確認してください。
                </span>
              </span>
            </div>
            <p className="contact-required-note">赤い ** が付いた項目は必須です。</p>
            <ContactForm siteKey={siteKey} />
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
