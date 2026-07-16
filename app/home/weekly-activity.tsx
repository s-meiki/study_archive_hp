"use client";

import { useMemo } from "react";
import type { LessonProgress } from "../learning/types";
import { buildWeeklyActivity } from "./activity-data";
import styles from "./home-dashboard.module.css";

type WeeklyActivityProps = {
  lessons: Record<string, LessonProgress>;
};

// チャート座標（モック home-a.html の viewBox 340x170 を踏襲）
const CHART = {
  top: 20,
  baseline: 140,
  axisX: 36,
  axisEndX: 330,
  labelX: 28,
  firstBarX: 47,
  barWidth: 20,
  step: 42
};

function niceMax(maxCount: number): number {
  if (maxCount <= 2) {
    return 2;
  }
  if (maxCount <= 4) {
    return 4;
  }
  return Math.ceil(maxCount / 2) * 2;
}

function barPath(x: number, count: number, yMax: number): string {
  const plotHeight = CHART.baseline - CHART.top;
  const height = (count / yMax) * plotHeight;
  const radius = Math.min(4, height);
  const top = Number((CHART.baseline - height).toFixed(1));
  const shoulder = Number((top + radius).toFixed(1));
  const right = x + CHART.barWidth;
  return [
    `M${x},${CHART.baseline}`,
    `V${shoulder}`,
    `Q${x},${top} ${x + radius},${top}`,
    `H${right - radius}`,
    `Q${right},${top} ${right},${shoulder}`,
    `V${CHART.baseline}`,
    "Z"
  ].join(" ");
}

export function WeeklyActivity({ lessons }: WeeklyActivityProps) {
  const days = useMemo(() => buildWeeklyActivity(lessons, new Date()), [lessons]);
  const yMax = niceMax(Math.max(...days.map((day) => day.count)));
  const mid = yMax / 2;

  return (
    <>
      <svg className={styles.activityChart} viewBox="0 0 340 170" aria-hidden="true">
        {[CHART.top, (CHART.top + CHART.baseline) / 2, CHART.baseline].map((y) => (
          <line key={y} className={styles.gridLine} x1={CHART.axisX} y1={y} x2={CHART.axisEndX} y2={y} />
        ))}
        <text x={CHART.labelX} y={CHART.top + 4} textAnchor="end">
          {yMax}
        </text>
        <text x={CHART.labelX} y={(CHART.top + CHART.baseline) / 2 + 4} textAnchor="end">
          {mid}
        </text>
        <text x={CHART.labelX} y={CHART.baseline + 4} textAnchor="end">
          0
        </text>
        {days.map((day, index) =>
          day.count > 0 ? (
            <path
              key={day.key}
              className={styles.activityBar}
              d={barPath(CHART.firstBarX + index * CHART.step, day.count, yMax)}
            />
          ) : null
        )}
        {days.map((day, index) => (
          <text
            key={day.key}
            x={CHART.firstBarX + index * CHART.step + CHART.barWidth / 2}
            y={158}
            textAnchor="middle"
          >
            {day.weekdayLabel}
          </text>
        ))}
      </svg>
      <table className="visually-hidden">
        <caption>直近7日間に学習したレッスン数</caption>
        <thead>
          <tr>
            <th scope="col">日付</th>
            <th scope="col">レッスン数</th>
          </tr>
        </thead>
        <tbody>
          {days.map((day) => (
            <tr key={day.key}>
              <th scope="row">{`${day.key}（${day.weekdayLabel}）`}</th>
              <td>{day.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
