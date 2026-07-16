import type { CSSProperties } from "react";
import styles from "./progress-bar.module.css";

type ProgressBarProps = {
  /** 達成数（segmented）または現在値（continuous） */
  value: number;
  /** 分母 */
  max: number;
  /** segmented: n分割・2pxギャップ（モックA「続きから」準拠） / continuous: 連続メーター */
  mode?: "segmented" | "continuous";
  /** continuous のフィル色。スタットの補助メーターは accent を使う */
  tone?: "primary" | "accent";
  label?: string;
};

export function ProgressBar({ value, max, mode = "segmented", tone = "primary", label }: ProgressBarProps) {
  const safeMax = Math.max(max, 1);
  const clamped = Math.min(Math.max(value, 0), safeMax);
  const ariaProps = {
    role: "progressbar",
    "aria-valuemin": 0,
    "aria-valuemax": safeMax,
    "aria-valuenow": clamped,
    "aria-label": label ?? `進捗 ${clamped}/${safeMax}`
  } as const;

  if (mode === "continuous") {
    const meterClassName = tone === "accent" ? `${styles.meter} ${styles.accent}` : styles.meter;
    return (
      <div {...ariaProps} className={meterClassName}>
        <span className={styles.meterFill} style={{ width: `${(clamped / safeMax) * 100}%` }} />
      </div>
    );
  }

  const segmentStyle: CSSProperties = { gridTemplateColumns: `repeat(${safeMax}, 1fr)` };
  const doneCount = Math.round(clamped);

  return (
    <div {...ariaProps} className={styles.segments} style={segmentStyle}>
      {Array.from({ length: safeMax }, (_, index) => (
        <span key={index} className={index < doneCount ? styles.done : undefined} />
      ))}
    </div>
  );
}
