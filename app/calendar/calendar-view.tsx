"use client";

import type { CSSProperties } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowSquareOutIcon, CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react";
import type { AnnualMeetingsData } from "../site-data";
import { Button } from "../ui/button";
import { EmptyState } from "../ui/empty-state";
import type { CalendarRowOverflow, CalendarSegment } from "./meetings-lib";
import {
  WEEKDAYS,
  buildCalendarMonth,
  buildMonthKeys,
  formatDateRange,
  formatMonthLabel,
  formatPeriodLabel,
  initialCalendarIndex,
  isVisibleMilestone,
  milestoneLabel,
  milestoneWindow,
  resolveMeetingUrl
} from "./meetings-lib";
import styles from "./calendar-view.module.css";

type CalendarViewProps = {
  data: AnnualMeetingsData;
  today: string;
};

const categoryClassName: Record<CalendarSegment["category"], string> = {
  event: "catEvent",
  abstract: "catAbstract",
  registration: "catRegistration",
  deadline: "catInfo",
  info: "catInfo"
};

function segmentPosition(
  segment: Pick<CalendarSegment, "rowIndex" | "startColumn" | "endColumn" | "laneIndex">
): CSSProperties {
  return {
    gridColumn: `${segment.startColumn + 1} / ${segment.endColumn + 2}`,
    gridRow: String(segment.rowIndex + 1),
    marginTop: `calc(var(--bar-offset) + ${segment.laneIndex} * var(--lane-step))`
  };
}

function segmentSelectionKey(segment: CalendarSegment) {
  return `${segment.meetingId}:${segment.milestoneId ?? "meeting"}`;
}

function defaultCalendarSegment(segments: CalendarSegment[], today: string) {
  const meetingSegments = segments
    .filter((segment) => segment.type === "meeting" && !segment.isContinuation && segment.endDate >= today)
    .sort((left, right) => left.startDate.localeCompare(right.startDate));

  return meetingSegments[0] ?? segments.find((segment) => !segment.isContinuation) ?? segments[0] ?? null;
}

function CalendarSpan({
  segment,
  selected,
  onSelect
}: {
  segment: CalendarSegment;
  selected: boolean;
  onSelect: () => void;
}) {
  const classes = [styles.span, styles[categoryClassName[segment.category]]];

  if (segment.isContinuation) {
    classes.push(styles.spanContinuation);
  }

  if (selected) {
    classes.push(styles.spanSelected);
  }

  const className = classes.join(" ");
  const style = segmentPosition(segment);

  return (
    <button
      type="button"
      className={className}
      style={style}
      title={segment.title}
      aria-label={segment.title}
      aria-pressed={selected}
      aria-controls="calendar-selection-detail"
      onClick={onSelect}
    >
      {segment.text}
    </button>
  );
}

function CalendarDetail({ data, segment }: { data: AnnualMeetingsData; segment: CalendarSegment | null }) {
  if (!segment) {
    return (
      <aside className={`${styles.detail} ${styles.detailEmpty}`} id="calendar-selection-detail">
        <p>この月の学会情報を追加すると、詳細がここに表示されます。</p>
      </aside>
    );
  }

  const meeting = data.meetings.find((item) => item.id === segment.meetingId);

  if (!meeting) {
    return null;
  }

  const milestone = segment.milestoneId
    ? (meeting.milestones ?? []).find((item) => item.id === segment.milestoneId)
    : undefined;
  const categoryLabel = milestone ? milestoneLabel(milestone) : "開催";
  const window = milestone ? milestoneWindow(milestone) : null;
  const dateLabel = milestone
    ? window
      ? formatPeriodLabel(window.startDate, window.endDate)
      : "日程調整中"
    : formatDateRange(meeting);
  const visibleMilestones = (meeting.milestones ?? []).filter(isVisibleMilestone);
  const url = resolveMeetingUrl(meeting);

  return (
    <aside className={styles.detail} id="calendar-selection-detail" aria-live="polite">
      <div className={styles.detailHead}>
        <span className={`${styles.detailCategory} ${styles[categoryClassName[segment.category]]}`}>
          {categoryLabel}
        </span>
        <h3>{meeting.eventName}</h3>
        <p>{meeting.society}</p>
      </div>

      <dl className={styles.detailFacts}>
        <div>
          <dt>{milestone ? "対象期間" : "開催日時"}</dt>
          <dd className="tabular-nums">{dateLabel}</dd>
        </div>
        <div>
          <dt>開催場所</dt>
          <dd>{meeting.venue ? `${meeting.venue}${meeting.city ? ` / ${meeting.city}` : ""}` : "会場未公表"}</dd>
        </div>
      </dl>

      {visibleMilestones.length > 0 ? (
        <div className={styles.detailMilestones}>
          <h4>募集日程</h4>
          <ul>
            {visibleMilestones.map((item) => {
              const itemWindow = milestoneWindow(item);

              return (
                <li key={item.id}>
                  <span>{milestoneLabel(item)}</span>
                  <strong className="tabular-nums">
                    {itemWindow ? formatPeriodLabel(itemWindow.startDate, itemWindow.endDate) : "日程調整中"}
                  </strong>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      {url ? (
        <Button href={url} external variant="secondary" size="sm" className={styles.detailAction}>
          公式サイトを見る
          <ArrowSquareOutIcon size={15} aria-hidden="true" />
        </Button>
      ) : null}
    </aside>
  );
}

function OverflowChip({ overflow }: { overflow: CalendarRowOverflow }) {
  return (
    <span className={styles.overflowChip} style={segmentPosition(overflow)} title={overflow.title}>
      他{overflow.count}件
    </span>
  );
}

export function CalendarView({ data, today }: CalendarViewProps) {
  const monthKeys = useMemo(() => buildMonthKeys(data.period), [data.period]);
  const [monthIndex, setMonthIndex] = useState(() => initialCalendarIndex(monthKeys, today));
  const [selectedKey, setSelectedKey] = useState("");
  const userNavigatedRef = useRef(false);

  useEffect(() => {
    if (!userNavigatedRef.current) {
      setMonthIndex(initialCalendarIndex(monthKeys, today));
    }
  }, [monthKeys, today]);

  const summaryItems = useMemo(() => {
    const items: string[] = [];

    for (const item of data.meetings) {
      const parts: string[] = [];

      for (const milestone of item.milestones ?? []) {
        if (!isVisibleMilestone(milestone)) {
          continue;
        }

        const window = milestoneWindow(milestone);

        if (!window) {
          continue;
        }

        parts.push(`${milestoneLabel(milestone)} ${formatPeriodLabel(window.startDate, window.endDate)}`);
      }

      if (parts.length > 0) {
        items.push(`${item.eventName}: ${parts.join(" / ")}`);
      }
    }

    return items;
  }, [data.meetings]);

  const monthKey = monthKeys[monthIndex];
  const month = useMemo(
    () => (monthKey ? buildCalendarMonth(data.meetings, monthKey) : null),
    [data.meetings, monthKey]
  );
  const selectedSegment = useMemo(() => {
    if (!month) {
      return null;
    }

    return (
      month.segments.find((segment) => segmentSelectionKey(segment) === selectedKey) ??
      defaultCalendarSegment(month.segments, today)
    );
  }, [month, selectedKey, today]);

  function moveMonth(delta: number) {
    userNavigatedRef.current = true;
    setSelectedKey("");
    setMonthIndex((index) => Math.min(Math.max(index + delta, 0), monthKeys.length - 1));
  }

  return (
    <section className={styles.section} aria-label="学会カレンダー">
      <div className={styles.top}>
        <div className={styles.copyBlock}>
          <h2 className={styles.heading}>学会カレンダー</h2>
          <p className={styles.copy}>開催日と主要な募集日程を、月ごとに確認できます。</p>
        </div>
        <ul className={styles.legend} aria-label="カレンダー凡例">
          <li>
            <span className={`${styles.legendChip} ${styles.catEvent}`}>開催</span>
          </li>
          <li>
            <span className={`${styles.legendChip} ${styles.catAbstract}`}>演題募集</span>
          </li>
          <li>
            <span className={`${styles.legendChip} ${styles.catRegistration}`}>参加登録</span>
          </li>
        </ul>
      </div>

      <div className={styles.summary} role="note">
        {summaryItems.length > 0 ? (
          <ul className={styles.summaryList}>
            {summaryItems.map((item) => (
              <li key={item} className="tabular-nums">
                {item}
              </li>
            ))}
          </ul>
        ) : (
          <p>演題募集・参加登録の期間は、公式情報を追加した学会から順次表示します。</p>
        )}
      </div>

      {month ? (
        <div className={styles.monthCard}>
          <div className={styles.nav}>
            <Button variant="ghost" size="sm" disabled={monthIndex === 0} onClick={() => moveMonth(-1)}>
              <CaretLeftIcon size={14} aria-hidden="true" />
              前の月
            </Button>
            <p className={`${styles.navStatus} tabular-nums`} aria-live="polite">
              {formatMonthLabel(month.monthKey)}
            </p>
            <Button
              variant="ghost"
              size="sm"
              disabled={monthIndex === monthKeys.length - 1}
              onClick={() => moveMonth(1)}
            >
              次の月
              <CaretRightIcon size={14} aria-hidden="true" />
            </Button>
          </div>

          <div className={styles.calendarLayout}>
            <div className={styles.scroller}>
              <div className={styles.gridInner} style={{ "--lane-count": month.laneCount } as CSSProperties}>
                <div className={styles.weekdays} aria-hidden="true">
                  {WEEKDAYS.map((weekday) => (
                    <span key={weekday}>{weekday}</span>
                  ))}
                </div>
                <div className={styles.shell}>
                  <div className={styles.days}>
                    {month.cells.map((cell) => {
                      const isToday = cell.iso === today;
                      const cellClasses = [styles.day];

                      if (cell.isOutside) {
                        cellClasses.push(styles.dayOutside);
                      }

                      if (isToday) {
                        cellClasses.push(styles.dayToday);
                      }

                      return (
                        <div
                          key={cell.iso}
                          className={cellClasses.join(" ")}
                          aria-current={isToday ? "date" : undefined}
                          aria-label={isToday ? `${cell.month}月${cell.day}日 今日` : undefined}
                        >
                          <span className={`${styles.dayNumber} tabular-nums`}>{cell.day}</span>
                        </div>
                      );
                    })}
                  </div>
                  <div className={styles.spanLayer}>
                    {month.segments.map((segment) => {
                      const isSelected = Boolean(
                        selectedSegment && segmentSelectionKey(segment) === segmentSelectionKey(selectedSegment)
                      );

                      return (
                        <CalendarSpan
                          key={segment.key}
                          segment={segment}
                          selected={isSelected}
                          onSelect={() => setSelectedKey(segmentSelectionKey(segment))}
                        />
                      );
                    })}
                    {month.overflows.map((overflow) => (
                      <OverflowChip key={`overflow-${overflow.rowIndex}`} overflow={overflow} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <CalendarDetail data={data} segment={selectedSegment} />
          </div>
        </div>
      ) : (
        <EmptyState title="表示できる日程データがありません。" />
      )}
    </section>
  );
}
