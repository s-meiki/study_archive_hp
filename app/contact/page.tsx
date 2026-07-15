import type { Metadata } from "next";
import { Card } from "../ui/card";
import { siteLegal } from "../site-legal";
import { absoluteSiteUrl } from "../site-url";
import ContactForm from "./contact-form";
import styles from "./contact.module.css";

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
    <div className={styles.page}>
      <div className={styles.head}>
        <p className={styles.eyebrow}>Contact Form</p>
        <h1>問い合わせ</h1>
        <p className={styles.lead}>勉強会アーカイブに関する連絡だけを受け付けます。内容確認後、必要に応じてメールで返信します。</p>
      </div>

      <Card className={styles.panel}>
        <div className={styles.notice} role="note">
          <strong>注意</strong>
          <span>個人情報や匿名化されていない症例情報は入力しないでください。</span>
        </div>
        <div className={styles.notice} role="note">
          <strong>外部サービス</strong>
          <span>
            送信時は Cloudflare Turnstile でボット判定を行い、内容は Discord Webhook に通知されます。
            <span className={styles.noticeTail}>
              詳細は <a className="text-link" href={siteLegal.privacyUrl}>プライバシーポリシー</a> を確認してください。
            </span>
          </span>
        </div>
        <p className={styles.requiredNote}>赤い ** が付いた項目は必須です。</p>
        <ContactForm siteKey={siteKey} />
      </Card>
    </div>
  );
}
