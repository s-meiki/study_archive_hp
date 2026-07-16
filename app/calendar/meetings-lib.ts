import type { AnnualMeeting, AnnualMeetingMilestone } from "../site-data";

export type MeetingsPeriod = {
  start: string;
  end: string;
};

export const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

export const CALENDAR_MAX_LANES = 3;

export type CalendarCategory = "event" | "abstract" | "registration" | "deadline" | "info";

export type CalendarSegment = {
  key: string;
  meetingId: string;
  milestoneId?: string;
  type: "meeting" | "milestone";
  category: CalendarCategory;
  text: string;
  title: string;
  url: string;
  startDate: string;
  endDate: string;
  rowIndex: number;
  startColumn: number;
  endColumn: number;
  laneIndex: number;
  isContinuation: boolean;
};

export type CalendarRowOverflow = {
  rowIndex: number;
  laneIndex: number;
  count: number;
  startColumn: number;
  endColumn: number;
  title: string;
};

export type CalendarCell = {
  iso: string;
  day: number;
  month: number;
  isOutside: boolean;
};

export type CalendarMonthModel = {
  monthKey: string;
  cells: CalendarCell[];
  segments: CalendarSegment[];
  overflows: CalendarRowOverflow[];
  laneCount: number;
  meetingIds: string[];
};

export type MeetingGroup = {
  label: string;
  items: AnnualMeeting[];
};

export type MilestoneCountdown =
  | { kind: "remaining"; days: number }
  | { kind: "upcoming"; days: number };

function pad(value: number) {
  return String(value).padStart(2, "0");
}

export function parseIsoDate(dateString: string) {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function toIsoDate(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function todayInTokyo() {
  const parts = new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(new Date());
  const values: Record<string, string> = {};

  for (const part of parts) {
    values[part.type] = part.value;
  }

  return `${values.year}-${values.month}-${values.day}`;
}

function daysBetween(startDate: Date, endDate: Date) {
  return Math.round(
    (Date.UTC(endDate.getFullYear(), endDate.getMonth(), endDate.getDate()) -
      Date.UTC(startDate.getFullYear(), startDate.getMonth(), startDate.getDate())) /
      86400000
  );
}

export function daysBetweenIso(fromIso: string, toIso: string) {
  return daysBetween(parseIsoDate(fromIso), parseIsoDate(toIso));
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function formatJaDate(dateString: string) {
  const [year, month, day] = dateString.split("-").map(Number);
  return `${year}年${month}月${day}日`;
}

function formatDateWithWeekday(dateString: string) {
  const date = parseIsoDate(dateString);
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日(${WEEKDAYS[date.getDay()]})`;
}

export function formatDateRange(item: Pick<AnnualMeeting, "startDate" | "endDate">) {
  if (!item.startDate || !item.endDate) {
    return "会期未公表";
  }

  const start = parseIsoDate(item.startDate);
  const end = parseIsoDate(item.endDate);
  const startLabel = formatDateWithWeekday(item.startDate);

  if (item.startDate === item.endDate) {
    return startLabel;
  }

  if (start.getFullYear() === end.getFullYear() && start.getMonth() === end.getMonth()) {
    return `${startLabel}〜${end.getDate()}日(${WEEKDAYS[end.getDay()]})`;
  }

  return `${startLabel}〜${formatDateWithWeekday(item.endDate)}`;
}

export function formatPeriodLabel(startDate?: string, endDate?: string) {
  if (!startDate || !endDate) {
    return "";
  }

  if (startDate === endDate) {
    return formatJaDate(startDate);
  }

  return `${formatJaDate(startDate)} - ${formatJaDate(endDate)}`;
}

export function normalizeExternalUrl(value: unknown) {
  const input = String(value ?? "").trim();

  if (!input || input.startsWith("//") || /[\u0000-\u001F\u007F]/.test(input)) {
    return "";
  }

  if (!/^[a-z][a-z0-9+.-]*:/i.test(input)) {
    return "";
  }

  try {
    const parsedUrl = new URL(input);
    return ["http:", "https:"].includes(parsedUrl.protocol) ? parsedUrl.toString() : "";
  } catch {
    return "";
  }
}

export function resolveMeetingUrl(item: AnnualMeeting) {
  return normalizeExternalUrl(item.primaryUrl || item.sources?.[0]?.url);
}

export function milestoneLabel(milestone: AnnualMeetingMilestone) {
  return milestone.label || (milestone.category === "registration" ? "参加登録" : "演題募集");
}

export function isVisibleMilestone(milestone: AnnualMeetingMilestone) {
  return milestoneLabel(milestone) !== "早期参加登録";
}

export function milestoneCategory(milestone: AnnualMeetingMilestone): CalendarCategory {
  switch (milestone.category) {
    case "abstract":
      return "abstract";
    case "registration":
      return "registration";
    case "deadline":
      return "deadline";
    default:
      return "info";
  }
}

export function milestoneWindow(milestone: AnnualMeetingMilestone) {
  const startDate = milestone.startDate || milestone.endDate;
  const endDate = milestone.endDate || milestone.startDate;

  if (!startDate || !endDate) {
    return null;
  }

  return { startDate, endDate };
}

export function milestoneCountdown(
  milestone: AnnualMeetingMilestone,
  todayIso: string
): MilestoneCountdown | null {
  const window = milestoneWindow(milestone);

  if (!window || todayIso > window.endDate) {
    return null;
  }

  if (todayIso < window.startDate) {
    return { kind: "upcoming", days: daysBetweenIso(todayIso, window.startDate) };
  }

  return { kind: "remaining", days: daysBetweenIso(todayIso, window.endDate) };
}

export function isPastMeeting(item: AnnualMeeting) {
  return item.status === "past";
}

/**
 * 開催日未確定レコードの並び替え用フォールバック日付。
 * 旧実装は period.end の年を無条件に使い年度前半月で1年ずれるバグがあったため、
 * displayMonth が年度開始月以降なら period.start の年、それ以外は period.end の年で解決する。
 */
export function fallbackSortValue(displayMonth: number | undefined, period: MeetingsPeriod) {
  const month = displayMonth && displayMonth >= 1 && displayMonth <= 12 ? displayMonth : 12;
  const startMonth = Number(period.start.slice(5, 7));
  const year = Number(month >= startMonth ? period.start.slice(0, 4) : period.end.slice(0, 4));
  return `${year}-${pad(month)}-31`;
}

export function sortValue(item: AnnualMeeting, period: MeetingsPeriod) {
  return item.sortDate || item.startDate || fallbackSortValue(item.displayMonth, period);
}

function compareIso(left: string, right: string) {
  if (left === right) {
    return 0;
  }

  return left < right ? -1 : 1;
}

export function compareMeetingDisplay(left: AnnualMeeting, right: AnnualMeeting, period: MeetingsPeriod) {
  const leftIsPast = isPastMeeting(left);
  const rightIsPast = isPastMeeting(right);

  if (leftIsPast !== rightIsPast) {
    return leftIsPast ? 1 : -1;
  }

  const direction = leftIsPast ? -1 : 1;
  return compareIso(sortValue(left, period), sortValue(right, period)) * direction;
}

export function groupLabel(item: AnnualMeeting, period: MeetingsPeriod) {
  if (isPastMeeting(item)) {
    return "終了した学会";
  }

  const [year, month] = sortValue(item, period).split("-");
  return `${year}年${Number(month)}月`;
}

export function buildListGroups(meetings: AnnualMeeting[], period: MeetingsPeriod): MeetingGroup[] {
  const sorted = [...meetings].sort((left, right) => compareMeetingDisplay(left, right, period));
  const groups: MeetingGroup[] = [];
  const groupsByLabel = new Map<string, MeetingGroup>();

  for (const item of sorted) {
    const label = groupLabel(item, period);
    let group = groupsByLabel.get(label);

    if (!group) {
      group = { label, items: [] };
      groupsByLabel.set(label, group);
      groups.push(group);
    }

    group.items.push(item);
  }

  return groups;
}

export function buildMonthKeys(period: MeetingsPeriod) {
  const start = parseIsoDate(period.start);
  const end = parseIsoDate(period.end);
  const monthKeys: string[] = [];
  const cursor = new Date(start.getFullYear(), start.getMonth(), 1);

  while (cursor <= end) {
    monthKeys.push(`${cursor.getFullYear()}-${pad(cursor.getMonth() + 1)}`);
    cursor.setMonth(cursor.getMonth() + 1);
  }

  return monthKeys;
}

export function initialCalendarIndex(monthKeys: string[], todayIso: string) {
  if (monthKeys.length === 0) {
    return 0;
  }

  const currentMonth = todayIso.slice(0, 7);
  const currentMonthIndex = monthKeys.indexOf(currentMonth);

  if (currentMonthIndex >= 0) {
    return currentMonthIndex;
  }

  const nextMonthIndex = monthKeys.findIndex((monthKey) => monthKey > currentMonth);
  return nextMonthIndex >= 0 ? nextMonthIndex : monthKeys.length - 1;
}

export function formatMonthLabel(monthKey: string) {
  const [year, month] = monthKey.split("-");
  return `${year}年${Number(month)}月`;
}

export function rangeOverlapsMonth(
  startDateString: string | undefined,
  endDateString: string | undefined,
  monthKey: string
) {
  if (!startDateString || !endDateString) {
    return false;
  }

  const [year, month] = monthKey.split("-").map(Number);
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 0);

  return !(parseIsoDate(endDateString) < monthStart || parseIsoDate(startDateString) > monthEnd);
}

function shortMilestoneLabel(label: string) {
  if (label.includes("演題")) {
    return "演題";
  }

  if (label.includes("登録")) {
    return "登録";
  }

  if (label.includes("締切")) {
    return "締切";
  }

  return label;
}

const calendarSocietyLabels: Record<string, string> = {
  "日本TDM学会": "TDM学会",
  "日本医薬品安全性学会": "医薬品安全性学会",
  "日本医療薬学会": "医療薬学会",
  "日本薬理学会": "薬理学会",
  "日本脳卒中学会": "脳卒中学会"
};

export function calendarSocietyLabel(item: Pick<AnnualMeeting, "society">) {
  return calendarSocietyLabels[item.society] ?? item.society;
}

type SegmentSeed = {
  key: string;
  meetingId: string;
  milestoneId?: string;
  type: "meeting" | "milestone";
  category: CalendarCategory;
  text: string;
  title: string;
  url: string;
  startDate: string;
  endDate: string;
};

function collectSegmentSeeds(meetings: AnnualMeeting[], monthKey: string) {
  const seeds: SegmentSeed[] = [];
  const meetingIds: string[] = [];

  for (const item of meetings) {
    const url = resolveMeetingUrl(item);
    const societyLabel = calendarSocietyLabel(item);
    let hasSegment = false;

    if (item.startDate && item.endDate && rangeOverlapsMonth(item.startDate, item.endDate, monthKey)) {
      seeds.push({
        key: `${item.id}-${monthKey}-meeting`,
        meetingId: item.id,
        type: "meeting",
        category: "event",
        text: societyLabel,
        title: `${item.eventName} / ${formatDateRange(item)}`,
        url,
        startDate: item.startDate,
        endDate: item.endDate
      });
      hasSegment = true;
    }

    for (const milestone of item.milestones ?? []) {
      if (!isVisibleMilestone(milestone)) {
        continue;
      }

      const window = milestoneWindow(milestone);

      if (!window || !rangeOverlapsMonth(window.startDate, window.endDate, monthKey)) {
        continue;
      }

      const label = milestoneLabel(milestone);
      seeds.push({
        key: `${item.id}-${milestone.id}-${monthKey}`,
        meetingId: item.id,
        milestoneId: milestone.id,
        type: "milestone",
        category: milestoneCategory(milestone),
        text: `${shortMilestoneLabel(label)}・${societyLabel}`,
        title: `${item.eventName} / ${label}${milestone.note ? ` / ${milestone.note}` : ""}`,
        url,
        startDate: window.startDate,
        endDate: window.endDate
      });
      hasSegment = true;
    }

    if (hasSegment) {
      meetingIds.push(item.id);
    }
  }

  return { seeds, meetingIds };
}

function splitSeedIntoRows(seed: SegmentSeed, gridStart: Date, gridEnd: Date) {
  const segments: CalendarSegment[] = [];
  const rangeStart = parseIsoDate(seed.startDate);
  const rangeEnd = parseIsoDate(seed.endDate);

  if (rangeEnd < gridStart || rangeStart > gridEnd) {
    return segments;
  }

  let cursor = rangeStart < gridStart ? new Date(gridStart) : new Date(rangeStart);
  const clampedEnd = rangeEnd > gridEnd ? gridEnd : rangeEnd;
  let isFirstVisibleSegment = true;

  while (cursor <= clampedEnd) {
    const dayOffset = daysBetween(gridStart, cursor);
    const rowIndex = Math.floor(dayOffset / 7);
    const startColumn = dayOffset % 7;
    const rowEndDate = addDays(cursor, 6 - startColumn);
    const segmentEnd = rowEndDate < clampedEnd ? rowEndDate : clampedEnd;
    const endColumn = startColumn + daysBetween(cursor, segmentEnd);

    segments.push({
      key: `${seed.key}-r${rowIndex}`,
      meetingId: seed.meetingId,
      milestoneId: seed.milestoneId,
      type: seed.type,
      category: seed.category,
      text: isFirstVisibleSegment ? seed.text : "",
      title: seed.title,
      url: seed.url,
      startDate: seed.startDate,
      endDate: seed.endDate,
      rowIndex,
      startColumn,
      endColumn,
      laneIndex: 0,
      isContinuation: !isFirstVisibleSegment
    });

    cursor = addDays(segmentEnd, 1);
    isFirstVisibleSegment = false;
  }

  return segments;
}

export function buildCalendarMonth(
  meetings: AnnualMeeting[],
  monthKey: string,
  maxLanes = CALENDAR_MAX_LANES
): CalendarMonthModel {
  const [year, month] = monthKey.split("-").map(Number);
  const monthStart = new Date(year, month - 1, 1);
  const gridStart = new Date(year, month - 1, 1 - monthStart.getDay());
  const gridEnd = addDays(gridStart, 41);

  const cells: CalendarCell[] = [];
  const cellCursor = new Date(gridStart);

  for (let index = 0; index < 42; index += 1) {
    cells.push({
      iso: toIsoDate(cellCursor),
      day: cellCursor.getDate(),
      month: cellCursor.getMonth() + 1,
      isOutside: cellCursor.getMonth() !== monthStart.getMonth()
    });
    cellCursor.setDate(cellCursor.getDate() + 1);
  }

  const { seeds, meetingIds } = collectSegmentSeeds(meetings, monthKey);
  const segments = seeds.flatMap((seed) => splitSeedIntoRows(seed, gridStart, gridEnd));

  // 開催帯を先に処理して上段レーンを確保する（帯上限あふれ時に開催帯が「他n件」へ
  // 落ちないようにするための優先順位。レーン割当はレーン末尾列の単調増加が保たれる
  // ため、開始列順でなくても帯同士が重ならないことは保証される）
  segments.sort((left, right) => {
    if (left.rowIndex !== right.rowIndex) {
      return left.rowIndex - right.rowIndex;
    }

    if (left.type !== right.type) {
      return left.type === "meeting" ? -1 : 1;
    }

    if (left.startColumn !== right.startColumn) {
      return left.startColumn - right.startColumn;
    }

    return right.endColumn - left.endColumn;
  });

  const laneEndsByRow: number[][] = Array.from({ length: 6 }, () => []);

  for (const segment of segments) {
    const laneEnds = laneEndsByRow[segment.rowIndex];
    let laneIndex = laneEnds.findIndex((lastEndColumn) => lastEndColumn < segment.startColumn);

    if (laneIndex === -1) {
      laneIndex = laneEnds.length;
      laneEnds.push(segment.endColumn);
    } else {
      laneEnds[laneIndex] = segment.endColumn;
    }

    segment.laneIndex = laneIndex;
  }

  const visibleSegments: CalendarSegment[] = [];
  const overflowByRow = new Map<number, CalendarRowOverflow & { texts: string[] }>();

  for (const segment of segments) {
    if (segment.laneIndex < maxLanes) {
      visibleSegments.push(segment);
      continue;
    }

    let entry = overflowByRow.get(segment.rowIndex);

    if (!entry) {
      entry = {
        rowIndex: segment.rowIndex,
        laneIndex: maxLanes,
        count: 0,
        startColumn: segment.startColumn,
        endColumn: segment.endColumn,
        title: "",
        texts: []
      };
      overflowByRow.set(segment.rowIndex, entry);
    }

    entry.count += 1;
    entry.startColumn = Math.min(entry.startColumn, segment.startColumn);
    entry.endColumn = Math.max(entry.endColumn, segment.endColumn);
    entry.texts.push(segment.text);
  }

  const overflows = [...overflowByRow.values()].map(({ texts, ...overflow }) => ({
    ...overflow,
    title: texts.join("、")
  }));

  const laneCount = Math.max(
    1,
    ...laneEndsByRow.map(
      (laneEnds, rowIndex) => Math.min(laneEnds.length, maxLanes) + (overflowByRow.has(rowIndex) ? 1 : 0)
    )
  );

  return { monthKey, cells, segments: visibleSegments, overflows, laneCount, meetingIds };
}
