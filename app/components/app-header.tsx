"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ThemeToggle } from "../theme/theme-toggle";
import styles from "./app-header.module.css";

const navItems = [
  { href: "/", label: "ホーム" },
  { href: "/archives", label: "アーカイブ" },
  { href: "/courses", label: "コース" },
  { href: "/calendar", label: "カレンダー" },
  { href: "/dashboard", label: "ダッシュボード" }
];

function isActivePath(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [menuOpen]);

  return (
    <header className={styles.header}>
      <a className={styles.skipLink} href="#main">
        本文へスキップ
      </a>
      <div className={`wrap ${styles.inner}`}>
        <Link className={styles.brand} href="/">
          <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true">
            <rect x="1" y="1" width="26" height="26" rx="7" fill="var(--primary)" />
            <path
              d="M6 15h4l2.5-6 3 9 2-5h4.5"
              fill="none"
              stroke="var(--on-primary)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span>臨床学術WG</span>
        </Link>

        <nav
          id="site-nav"
          className={menuOpen ? `${styles.nav} ${styles.navOpen}` : styles.nav}
          aria-label="メイン"
        >
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActivePath(pathname, item.href) ? "page" : undefined}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className={styles.actions}>
          <ThemeToggle />
          <button
            ref={menuButtonRef}
            type="button"
            className={styles.menuButton}
            aria-controls="site-nav"
            aria-expanded={menuOpen}
            aria-label="メニューを開閉"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? (
              <svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true">
                <path
                  d="M5 5l10 10M15 5 5 15"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true">
                <path
                  d="M3 5h14M3 10h14M3 15h14"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
