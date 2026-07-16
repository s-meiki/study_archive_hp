import type { ReactNode } from "react";
import styles from "./stat.module.css";

type StatProps = {
  label: string;
  value: ReactNode;
  unit?: string;
  /** 補足行（例: 「全24レッスン中」） */
  foot?: ReactNode;
  /** 値と補足行の間の任意スロット（例: 補助メーター） */
  children?: ReactNode;
};

export function Stat({ label, value, unit, foot, children }: StatProps) {
  return (
    <div className={styles.stat}>
      <span className={styles.label}>{label}</span>
      <span className={styles.value}>
        {value}
        {unit ? <span className={styles.unit}>{unit}</span> : null}
      </span>
      {children ? <div className={styles.slot}>{children}</div> : null}
      {foot ? <span className={styles.foot}>{foot}</span> : null}
    </div>
  );
}
