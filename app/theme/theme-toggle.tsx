"use client";

import { useTheme } from "./theme-provider";
import styles from "./theme-toggle.module.css";

export function ThemeToggle() {
  const { toggleTheme } = useTheme();

  return (
    <button
      type="button"
      className={styles.toggle}
      aria-label="ライト/ダークテーマを切り替え"
      onClick={toggleTheme}
    >
      <svg className={styles.iconMoon} width="18" height="18" viewBox="0 0 20 20" aria-hidden="true">
        <path
          d="M17 12.6A7.6 7.6 0 0 1 7.4 3 7.6 7.6 0 1 0 17 12.6Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </svg>
      <svg className={styles.iconSun} width="18" height="18" viewBox="0 0 20 20" aria-hidden="true">
        <circle cx="10" cy="10" r="3.6" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <path
          d="M10 1.5v2M10 16.5v2M1.5 10h2M16.5 10h2M4 4l1.4 1.4M14.6 14.6 16 16M16 4l-1.4 1.4M5.4 14.6 4 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    </button>
  );
}
