import { siteLegal } from "./site-legal";

export default function SiteFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="panel site-footer">
      <p className="site-footer-copy">© {currentYear} {siteLegal.shortSiteName}. All rights reserved.</p>
      <div className="site-footer-links" aria-label="法務リンク">
        <a className="site-footer-link" href={siteLegal.termsUrl}>
          利用規約
        </a>
        <a className="site-footer-link" href={siteLegal.privacyUrl}>
          プライバシーポリシー
        </a>
        <a className="site-footer-link" href={siteLegal.contactUrl}>
          問い合わせ
        </a>
      </div>
    </footer>
  );
}
