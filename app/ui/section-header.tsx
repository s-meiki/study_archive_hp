import type { ReactNode } from "react";
import styles from "./section-header.module.css";

type SectionHeaderProps = {
  title: string;
  description?: ReactNode;
  /** 右端アクション（テキストリンク・ボタン等） */
  action?: ReactNode;
};

export function SectionHeader({ title, description, action }: SectionHeaderProps) {
  return (
    <div className={styles.header}>
      <div className={styles.copy}>
        <h2 className={styles.title}>{title}</h2>
        {description ? <p className={styles.description}>{description}</p> : null}
      </div>
      {action ? <div className={styles.action}>{action}</div> : null}
    </div>
  );
}
