import styles from "./progress-ring.module.css";

type ProgressRingProps = {
  /** 達成数 */
  value: number;
  /** 分母 */
  max: number;
  label?: string;
};

const RADIUS = 18;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function ProgressRing({ value, max, label }: ProgressRingProps) {
  const safeMax = Math.max(max, 1);
  const clamped = Math.min(Math.max(value, 0), safeMax);
  const ratio = clamped / safeMax;

  return (
    <svg
      className={styles.ring}
      viewBox="0 0 44 44"
      role="img"
      aria-label={label ?? `進捗 ${clamped}/${safeMax}`}
    >
      <circle className={styles.track} cx="22" cy="22" r={RADIUS} />
      {ratio > 0 ? (
        /* 0進捗時は弧を描かない（stroke-linecap によるドットアーティファクト回避） */
        <circle
          className={styles.fill}
          cx="22"
          cy="22"
          r={RADIUS}
          strokeDasharray={`${(ratio * CIRCUMFERENCE).toFixed(1)} ${CIRCUMFERENCE.toFixed(1)}`}
        />
      ) : null}
      <text className={styles.value} x="22" y="26" textAnchor="middle">
        {`${clamped}/${safeMax}`}
      </text>
    </svg>
  );
}
