import { siteLegal } from "./site-legal";

export default function SiteFooter() {
  return (
    <footer className="panel site-footer">
      <div className="site-footer-copy">
        <div className="section-kicker">Site Policy</div>
        <strong>{siteLegal.audienceLabel}</strong>
        <p className="site-footer-note">
          本サイトは {siteLegal.siteName} の関係者向け学習アーカイブです。インターネット公開環境で運用しているため、
          個人情報や匿名化されていない症例情報は掲載、送信しないでください。
        </p>
        <p className="site-footer-meta">
          運営: {siteLegal.contactOffice} / 所在地: {siteLegal.location}
        </p>
      </div>
      <div className="site-footer-links" aria-label="法務リンク">
        <a className="topbar-link" href={siteLegal.termsUrl}>
          利用規約
        </a>
        <a className="topbar-link" href={siteLegal.privacyUrl}>
          プライバシーポリシー
        </a>
        <a className="topbar-link" href={siteLegal.contactUrl}>
          問い合わせ
        </a>
      </div>
    </footer>
  );
}
