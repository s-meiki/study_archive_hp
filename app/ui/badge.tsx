import type { ReactNode } from "react";
import styles from "./badge.module.css";

type BadgeCat = 1 | 2 | 3 | 4 | 5 | 6;
type BadgeStatus = "success" | "warning" | "danger";

type BadgeProps = {
  variant?: "neutral" | "theme" | "status";
  /** variant="theme" のカテゴリ色番号（テーマ固定順 1〜6） */
  cat?: BadgeCat;
  /** variant="status" の状態 */
  status?: BadgeStatus;
  /** variant="status" のアイコンスロット（省略時はドット） */
  icon?: ReactNode;
  children: ReactNode;
};

const catClassName: Record<BadgeCat, string> = {
  1: styles.cat1,
  2: styles.cat2,
  3: styles.cat3,
  4: styles.cat4,
  5: styles.cat5,
  6: styles.cat6
};

const statusClassName: Record<BadgeStatus, string> = {
  success: styles.statusSuccess,
  warning: styles.statusWarning,
  danger: styles.statusDanger
};

export function Badge({ variant = "neutral", cat, status, icon, children }: BadgeProps) {
  const classes = [styles.badge];
  let marker: ReactNode = null;

  if (variant === "theme" && cat) {
    classes.push(catClassName[cat]);
    marker = <span className={styles.dot} aria-hidden="true" />;
  }

  if (variant === "status" && status) {
    classes.push(styles.status, statusClassName[status]);
    marker = icon ? (
      <span className={styles.icon} aria-hidden="true">
        {icon}
      </span>
    ) : (
      <span className={`${styles.dot} ${styles.statusDot}`} aria-hidden="true" />
    );
  }

  return (
    <span className={classes.join(" ")}>
      {marker}
      {children}
    </span>
  );
}
