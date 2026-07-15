import Link from "next/link";
import { siteLegal } from "../site-legal";
import styles from "./app-footer.module.css";

const footerLinks = [
  { href: "/about", label: "About" },
  { href: siteLegal.termsUrl, label: "利用規約" },
  { href: siteLegal.privacyUrl, label: "プライバシーポリシー" },
  { href: siteLegal.contactUrl, label: "問い合わせ" }
];

export function AppFooter() {
  return (
    <footer className={styles.footer}>
      <div className={`wrap ${styles.inner}`}>
        <nav className={styles.nav} aria-label="フッター">
          {footerLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>
        <p className={styles.note}>運営: {siteLegal.shortSiteName}</p>
      </div>
    </footer>
  );
}
