let meetingData = null;
let meetings = [];
const MEETING_CALENDAR_PAGE_SIZE = 1;

const meetingCalendarEl = document.querySelector("#meeting-calendar");
const meetingWindowSummaryEl = document.querySelector("#meeting-window-summary");
const meetingGroupsEl = document.querySelector("#meeting-groups");
const lastVerifiedEl = document.querySelector("#meeting-last-verified");
const pendingNoteEl = document.querySelector("#meeting-pending-note");
const statusPanelEl = document.querySelector("#meeting-status-panel");
const meetingTabButtons = [...document.querySelectorAll("[data-meeting-tab]")];
const meetingTabPanels = [...document.querySelectorAll("[data-meeting-panel]")];

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];
const meetingCalendarState = {
  monthKeys: [],
  startIndex: 0,
};
const meetingViewState = {
  activeTab: "list",
};

function clearElement(element) {
  element.replaceChildren();
}

function setActiveMeetingTab(nextTab) {
  meetingViewState.activeTab = nextTab;

  meetingTabButtons.forEach((button) => {
    const isActive = button.dataset.meetingTab === nextTab;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-selected", String(isActive));
    button.tabIndex = isActive ? 0 : -1;
  });

  meetingTabPanels.forEach((panel) => {
    panel.hidden = panel.dataset.meetingPanel !== nextTab;
  });
}

function setupMeetingTabs() {
  if (meetingTabButtons.length === 0 || meetingTabPanels.length === 0) {
    return;
  }

  setActiveMeetingTab(meetingViewState.activeTab);

  meetingTabButtons.forEach((button, index) => {
    button.addEventListener("click", () => {
      setActiveMeetingTab(button.dataset.meetingTab || "calendar");
    });

    button.addEventListener("keydown", (event) => {
      if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") {
        return;
      }

      event.preventDefault();
      const direction = event.key === "ArrowRight" ? 1 : -1;
      const nextIndex = (index + direction + meetingTabButtons.length) % meetingTabButtons.length;
      const nextButton = meetingTabButtons[nextIndex];
      setActiveMeetingTab(nextButton.dataset.meetingTab || "calendar");
      nextButton.focus();
    });
  });
}

function normalizeExternalUrl(value) {
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
  } catch (error) {
    return "";
  }
}

function applyExternalLinkAttributes(anchor, url) {
  if (!url) {
    return;
  }

  anchor.target = "_blank";
  anchor.rel = "noreferrer noopener";
}

function hasValidMeetingData(data) {
  return Boolean(data) && Array.isArray(data.meetings);
}

function cloneMeetingData(data) {
  return JSON.parse(JSON.stringify(data));
}

function toDate(dateString) {
  return new Date(`${dateString}T00:00:00+09:00`);
}

function pad(value) {
  return String(value).padStart(2, "0");
}

function formatVerifiedDate(dateString) {
  const date = toDate(dateString);
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
}

function formatDateRange(item) {
  if (!item.startDate || !item.endDate) {
    return "会期未公表";
  }

  const start = toDate(item.startDate);
  const end = toDate(item.endDate);
  const startLabel = `${start.getFullYear()}年${start.getMonth() + 1}月${start.getDate()}日(${WEEKDAYS[start.getDay()]})`;

  if (item.startDate === item.endDate) {
    return startLabel;
  }

  if (start.getFullYear() === end.getFullYear() && start.getMonth() === end.getMonth()) {
    return `${startLabel}〜${end.getDate()}日(${WEEKDAYS[end.getDay()]})`;
  }

  return `${startLabel}〜${end.getFullYear()}年${end.getMonth() + 1}月${end.getDate()}日(${WEEKDAYS[end.getDay()]})`;
}

function sortValue(item) {
  return item.sortDate || item.startDate || `${meetingData.period.end.slice(0, 4)}-${pad(item.displayMonth)}-31`;
}

function groupLabel(item) {
  const [year, month] = sortValue(item).split("-");
  return `${year}年${Number(month)}月`;
}

function toIsoDate(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function monthKeyFromDate(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
}

function formatMonthLabel(monthKey) {
  const date = toDate(`${monthKey}-01`);
  return `${date.getFullYear()}年${date.getMonth() + 1}月`;
}

function clampCalendarIndex(startIndex, monthCount) {
  const maxStartIndex = Math.max(0, monthCount - MEETING_CALENDAR_PAGE_SIZE);
  return Math.min(Math.max(startIndex, 0), maxStartIndex);
}

function createCalendarNavStatus(monthKeys, startIndex) {
  const visibleMonths = monthKeys.slice(startIndex, startIndex + MEETING_CALENDAR_PAGE_SIZE);

  if (visibleMonths.length === 0) {
    return "";
  }

  if (visibleMonths.length === 1) {
    return formatMonthLabel(visibleMonths[0]);
  }

  return `${formatMonthLabel(visibleMonths[0])} - ${formatMonthLabel(visibleMonths[visibleMonths.length - 1])}`;
}

function createCalendarNavigation(monthKeys, startIndex, onMove) {
  const controls = document.createElement("div");
  controls.className = "calendar-nav";

  const prevButton = Object.assign(document.createElement("button"), {
    className: "calendar-nav-button",
    textContent: "← 前の月",
    type: "button",
  });
  prevButton.disabled = startIndex === 0;
  prevButton.addEventListener("click", () => {
    onMove(startIndex - MEETING_CALENDAR_PAGE_SIZE);
  });

  const status = document.createElement("div");
  status.className = "calendar-nav-status";
  status.textContent = createCalendarNavStatus(monthKeys, startIndex);

  const nextButton = Object.assign(document.createElement("button"), {
    className: "calendar-nav-button",
    textContent: "次の月 →",
    type: "button",
  });
  nextButton.disabled = startIndex + MEETING_CALENDAR_PAGE_SIZE >= monthKeys.length;
  nextButton.addEventListener("click", () => {
    onMove(startIndex + MEETING_CALENDAR_PAGE_SIZE);
  });

  controls.append(prevButton, status, nextButton);
  return controls;
}

function formatPeriodLabel(startDate, endDate) {
  if (!startDate || !endDate) {
    return "";
  }

  if (startDate === endDate) {
    return formatVerifiedDate(startDate);
  }

  return `${formatVerifiedDate(startDate)} - ${formatVerifiedDate(endDate)}`;
}

function milestoneClassName(category) {
  switch (category) {
    case "abstract":
      return "is-abstract";
    case "registration":
      return "is-registration";
    case "deadline":
      return "is-deadline";
    default:
      return "is-info";
  }
}

function milestoneLabel(milestone) {
  return milestone.label || (milestone.category === "registration" ? "参加登録" : "演題募集");
}

function isVisibleMilestone(milestone) {
  return milestoneLabel(milestone) !== "早期参加登録";
}

function compactEventLabel(item) {
  return `開催 | ${item.society}`;
}

function compactMilestoneLabel(item, milestone) {
  const label = milestoneLabel(milestone);
  const shortLabel = label === "演題募集" ? "演題" : label === "参加登録" ? "登録" : label;
  return `${shortLabel} | ${item.society}`;
}

function continuationLabel(entry) {
  if (entry.type === "meeting") {
    return entry.item?.society || "";
  }

  return "";
}

function hashString(value) {
  return [...String(value ?? "")].reduce((hash, character) => ((hash << 5) - hash + character.charCodeAt(0)) | 0, 0);
}

function calendarTone(item, segmentType) {
  const hue = Math.abs(hashString(item.id || item.society || "")) % 360;
  const saturation = segmentType === "meeting" ? 54 : 48;
  const lightness = segmentType === "meeting" ? 88 : 91;
  const textLightness = segmentType === "meeting" ? 28 : 32;

  return {
    background: `hsl(${hue} ${saturation}% ${lightness}%)`,
    border: `hsl(${hue} ${Math.max(36, saturation - 10)}% ${Math.max(72, lightness - 10)}%)`,
    text: `hsl(${hue} 34% ${textLightness}%)`,
  };
}

function buildCalendarMonths(startDateString, endDateString) {
  const start = toDate(startDateString);
  const end = toDate(endDateString);
  const months = [];
  const cursor = new Date(start);

  cursor.setDate(1);

  while (cursor <= end) {
    months.push(new Date(cursor));
    cursor.setMonth(cursor.getMonth() + 1);
  }

  return months;
}

function summarizeMilestones() {
  if (!meetingWindowSummaryEl) {
    return;
  }

  clearElement(meetingWindowSummaryEl);
  const summaries = [];

  meetings.forEach((item) => {
    const visibleMilestones = (item.milestones || []).filter(isVisibleMilestone);

    if (visibleMilestones.length === 0) {
      return;
    }

    const parts = [];

    visibleMilestones.forEach((milestone) => {
      const startDate = milestone.startDate || milestone.endDate;
      const endDate = milestone.endDate || milestone.startDate;

      if (!startDate || !endDate) {
        return;
      }

      parts.push(`${milestoneLabel(milestone)} ${formatPeriodLabel(startDate, endDate)}`);
    });

    if (parts.length > 0) {
      summaries.push(`${item.eventName}: ${parts.join(" / ")}`);
    }
  });

  if (summaries.length === 0) {
    meetingWindowSummaryEl.textContent = "演題募集・参加登録の期間は、公式情報を追加した学会から順次表示します。";
    return;
  }

  const list = document.createElement("div");
  list.className = "calendar-summary-list";

  summaries.forEach((summary) => {
    list.append(Object.assign(document.createElement("div"), { className: "calendar-summary-item", textContent: summary }));
  });

  meetingWindowSummaryEl.append(list);
}

function daysBetween(startDate, endDate) {
  return Math.round(
    (Date.UTC(endDate.getFullYear(), endDate.getMonth(), endDate.getDate()) -
      Date.UTC(startDate.getFullYear(), startDate.getMonth(), startDate.getDate())) /
      86400000,
  );
}

function dateByAddingDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function buildCalendarSegments(monthDate) {
  const month = monthDate.getMonth();
  const offset = monthDate.getDay();
  const gridStart = new Date(monthDate);
  gridStart.setDate(1 - offset);
  const gridEnd = dateByAddingDays(gridStart, 41);
  const segments = [];

  function pushRange(startDateString, endDateString, entry) {
    if (!startDateString || !endDateString) {
      return;
    }

    const rangeStart = toDate(startDateString);
    const rangeEnd = toDate(endDateString);

    if (rangeEnd < gridStart || rangeStart > gridEnd) {
      return;
    }

    let cursor = new Date(rangeStart < gridStart ? gridStart : rangeStart);
    const clampedEnd = rangeEnd > gridEnd ? gridEnd : rangeEnd;
    let isFirstVisibleSegment = true;

    while (cursor <= clampedEnd) {
      const dayOffset = daysBetween(gridStart, cursor);
      const rowIndex = Math.floor(dayOffset / 7);
      const startColumn = dayOffset % 7;
      const rowEndDate = dateByAddingDays(cursor, 6 - startColumn);
      const segmentEnd = rowEndDate < clampedEnd ? rowEndDate : clampedEnd;
      const endColumn = startColumn + daysBetween(cursor, segmentEnd);

      segments.push({
        ...entry,
        rowIndex,
        startColumn,
        endColumn,
        text: isFirstVisibleSegment ? entry.text : continuationLabel(entry),
        isContinuation: !isFirstVisibleSegment,
      });

      cursor = dateByAddingDays(segmentEnd, 1);
      isFirstVisibleSegment = false;
    }
  }

  meetings.forEach((item) => {
    const monthKey = monthKeyFromDate(monthDate);
    const primaryUrl = normalizeExternalUrl(item.primaryUrl || item.sources?.[0]?.url);

    if (rangeOverlapsMonth(item.startDate, item.endDate, monthKey)) {
      pushRange(item.startDate, item.endDate, {
        key: `${item.id}-${monthKey}-meeting`,
        type: "meeting",
        className: "is-event",
        text: compactEventLabel(item),
        title: `${item.eventName} / ${formatDateRange(item)}`,
        url: primaryUrl,
        tone: calendarTone(item, "meeting"),
        item,
      });
      return;
    }

    const visibleMilestones = (item.milestones || []).filter(isVisibleMilestone);
    const milestone = visibleMilestones.find((entry) =>
      rangeOverlapsMonth(entry.startDate || entry.endDate, entry.endDate || entry.startDate, monthKey),
    );

    if (!milestone) {
      return;
    }

    const startDate = milestone.startDate || milestone.endDate;
    const endDate = milestone.endDate || milestone.startDate;

    pushRange(startDate, endDate, {
      key: `${item.id}-${milestone.id}-${monthKey}`,
      type: "milestone",
      className: milestoneClassName(milestone.category),
      text: compactMilestoneLabel(item, milestone),
      title: `${item.eventName} / ${milestoneLabel(milestone)}${milestone.note ? ` / ${milestone.note}` : ""}`,
      url: primaryUrl,
      tone: calendarTone(item, "milestone"),
      item,
    });
  });

  segments.sort((left, right) => {
    if (left.rowIndex !== right.rowIndex) {
      return left.rowIndex - right.rowIndex;
    }

    if (left.startColumn !== right.startColumn) {
      return left.startColumn - right.startColumn;
    }

    if (left.type !== right.type) {
      return left.type === "meeting" ? -1 : 1;
    }

    return right.endColumn - left.endColumn;
  });

  const laneEndsByRow = Array.from({ length: 6 }, () => []);

  segments.forEach((segment) => {
    const laneEnds = laneEndsByRow[segment.rowIndex];
    let laneIndex = laneEnds.findIndex((lastEndColumn) => lastEndColumn < segment.startColumn);

    if (laneIndex === -1) {
      laneIndex = laneEnds.length;
      laneEnds.push(segment.endColumn);
    } else {
      laneEnds[laneIndex] = segment.endColumn;
    }

    segment.laneIndex = laneIndex;
  });

  return {
    segments,
    maxLaneCount: Math.max(1, ...laneEndsByRow.map((row) => row.length)),
    month,
    gridStart,
  };
}

function createCalendarSpan(segment) {
  const element = segment.url ? document.createElement("a") : document.createElement("span");
  element.className = `calendar-span ${segment.className}${segment.isContinuation ? " is-continuation" : ""}`;
  element.textContent = segment.text;
  element.title = segment.title;
  element.style.gridColumn = `${segment.startColumn + 1} / ${segment.endColumn + 2}`;
  element.style.gridRow = String(segment.rowIndex + 1);
  element.style.marginTop = `calc(var(--calendar-bar-offset) + ${segment.laneIndex} * var(--calendar-lane-step))`;
  if (segment.tone) {
    element.style.setProperty("--calendar-span-bg", segment.tone.background);
    element.style.setProperty("--calendar-span-border", segment.tone.border);
    element.style.setProperty("--calendar-span-text", segment.tone.text);
  }

  if (segment.url) {
    element.href = segment.url;
    applyExternalLinkAttributes(element, segment.url);
  }

  return element;
}

function rangeOverlapsMonth(startDateString, endDateString, monthKey) {
  if (!startDateString || !endDateString) {
    return false;
  }

  const monthStart = toDate(`${monthKey}-01`);
  const monthEnd = new Date(monthStart);
  monthEnd.setMonth(monthEnd.getMonth() + 1);
  monthEnd.setDate(0);

  return !(toDate(endDateString) < monthStart || toDate(startDateString) > monthEnd);
}

function renderMeetingCalendar() {
  if (!meetingCalendarEl || !meetingData) {
    return;
  }

  const monthKeys = buildCalendarMonths(meetingData.period.start, meetingData.period.end)
    .map((monthDate) => monthKeyFromDate(monthDate))
    .filter((monthKey) =>
      meetings.some((item) => {
        if (rangeOverlapsMonth(item.startDate, item.endDate, monthKey)) {
          return true;
        }

        return (item.milestones || []).filter(isVisibleMilestone).some((milestone) =>
          rangeOverlapsMonth(milestone.startDate || milestone.endDate, milestone.endDate || milestone.startDate, monthKey),
        );
      }),
    );

  meetingCalendarState.monthKeys = monthKeys;
  meetingCalendarState.startIndex = clampCalendarIndex(meetingCalendarState.startIndex, monthKeys.length);

  clearElement(meetingCalendarEl);

  if (monthKeys.length === 0) {
    meetingCalendarEl.append(Object.assign(document.createElement("p"), { className: "calendar-empty", textContent: "表示できる日程データがありません。" }));
    return;
  }

  const viewport = document.createElement("div");
  viewport.className = "calendar-month-grid";

  monthKeys.slice(meetingCalendarState.startIndex, meetingCalendarState.startIndex + MEETING_CALENDAR_PAGE_SIZE).forEach((monthKey) => {
    const monthDate = toDate(`${monthKey}-01`);
    const monthSegments = buildCalendarSegments(monthDate);
    const monthCard = document.createElement("section");
    monthCard.className = "calendar-month-card";
    monthCard.style.setProperty("--calendar-lane-count", String(monthSegments.maxLaneCount));

    const navigation = createCalendarNavigation(monthKeys, meetingCalendarState.startIndex, (nextIndex) => {
      meetingCalendarState.startIndex = clampCalendarIndex(nextIndex, meetingCalendarState.monthKeys.length);
      renderMeetingCalendar();
    });
    navigation.classList.add("calendar-nav-embedded");
    monthCard.append(navigation);

    const weekdayRow = document.createElement("div");
    weekdayRow.className = "calendar-weekdays";
    WEEKDAYS.forEach((weekday) => {
      weekdayRow.append(Object.assign(document.createElement("span"), { textContent: weekday }));
    });
    monthCard.append(weekdayRow);

    const shell = document.createElement("div");
    shell.className = "calendar-grid-shell";
    shell.style.setProperty("--calendar-lane-count", String(monthSegments.maxLaneCount));

    const grid = document.createElement("div");
    grid.className = "calendar-days";
    const month = monthDate.getMonth();
    const offset = monthDate.getDay();
    const cursor = new Date(monthDate);
    cursor.setDate(1 - offset);

    for (let index = 0; index < 42; index += 1) {
      const cell = document.createElement("div");
      cell.className = `calendar-day${cursor.getMonth() !== month ? " is-outside" : ""}`;

      const dayNumber = document.createElement("div");
      dayNumber.className = "calendar-day-number";
      dayNumber.textContent = String(cursor.getDate());
      cell.append(dayNumber);

      grid.append(cell);
      cursor.setDate(cursor.getDate() + 1);
    }

    const spans = document.createElement("div");
    spans.className = "calendar-span-layer";
    monthSegments.segments.forEach((segment) => {
      spans.append(createCalendarSpan(segment));
    });

    shell.append(grid, spans);
    monthCard.append(shell);
    viewport.append(monthCard);
  });

  meetingCalendarEl.append(viewport);
}

function setStatus(message = "") {
  if (!message) {
    statusPanelEl.hidden = true;
    statusPanelEl.textContent = "";
    return;
  }

  statusPanelEl.hidden = false;
  statusPanelEl.textContent = message;
}

function createImageLink(item) {
  const destinationUrl = normalizeExternalUrl(item.primaryUrl || item.sources?.[0]?.url);
  const imageUrl = normalizeExternalUrl(item.imageUrl);
  const link = document.createElement("a");
  link.className = "meeting-card-media";
  link.href = destinationUrl || "#";
  link.setAttribute("aria-label", `${item.eventName}の公式サイトを開く`);
  applyExternalLinkAttributes(link, destinationUrl);

  const img = document.createElement("img");
  if (imageUrl) {
    img.src = imageUrl;
  }
  img.alt = `${item.eventName} 公式画像`;
  img.loading = "lazy";
  img.decoding = "async";
  img.className = item.imageFit === "contain" ? "is-contain" : "";
  img.addEventListener("error", () => {
    link.classList.add("is-fallback");
    img.remove();
  });

  const fallback = document.createElement("span");
  fallback.className = "meeting-card-fallback";
  fallback.textContent = item.society;

  if (imageUrl) {
    link.append(img, fallback);
  } else {
    link.classList.add("is-fallback");
    link.append(fallback);
  }

  return link;
}

function createMeetingCard(item) {
  const article = document.createElement("article");
  article.className = `panel meeting-card-simple${item.status === "pending" ? " is-pending" : ""}`;

  const media = createImageLink(item);
  const body = document.createElement("div");
  body.className = "meeting-card-body-simple";

  const labels = document.createElement("div");
  labels.className = "meeting-card-labels";

  if (item.scope === "local") {
    const localChip = document.createElement("span");
    localChip.className = "meeting-card-badge";
    localChip.textContent = "北海道/札幌";
    labels.append(localChip);
  }

  if (item.status === "pending") {
    const pendingChip = document.createElement("span");
    pendingChip.className = "meeting-card-badge is-pending";
    pendingChip.textContent = "未公表";
    labels.append(pendingChip);
  }

  if (labels.children.length > 0) {
    body.append(labels);
  }

  const title = document.createElement("h2");
  title.className = "meeting-card-title";
  const titleLink = document.createElement("a");
  const destinationUrl = normalizeExternalUrl(item.primaryUrl || item.sources?.[0]?.url);
  titleLink.href = destinationUrl || "#";
  applyExternalLinkAttributes(titleLink, destinationUrl);
  titleLink.textContent = item.eventName;
  title.append(titleLink);
  body.append(title);

  const facts = document.createElement("dl");
  facts.className = "meeting-card-facts-simple";

  const scheduleWrap = document.createElement("div");
  const scheduleLabel = document.createElement("dt");
  scheduleLabel.textContent = "開催日時";
  const scheduleValue = document.createElement("dd");
  scheduleValue.className = "meeting-card-date";
  scheduleValue.textContent = formatDateRange(item);
  scheduleWrap.append(scheduleLabel, scheduleValue);
  facts.append(scheduleWrap);

  const venueWrap = document.createElement("div");
  const venueLabel = document.createElement("dt");
  venueLabel.textContent = "開催場所";
  const venueValue = document.createElement("dd");
  venueValue.className = "meeting-card-venue";
  venueValue.textContent = item.venue ? `${item.venue}${item.city ? ` / ${item.city}` : ""}` : "会場未公表";
  venueWrap.append(venueLabel, venueValue);
  facts.append(venueWrap);

  if (item.theme) {
    const themeWrap = document.createElement("div");
    const themeLabel = document.createElement("dt");
    themeLabel.textContent = "テーマ";
    const themeValue = document.createElement("dd");
    themeValue.className = "meeting-card-theme";
    themeValue.textContent = item.theme;
    themeWrap.append(themeLabel, themeValue);
    facts.append(themeWrap);
  }

  body.append(facts);

  if ((item.milestones || []).length > 0) {
    const milestoneList = document.createElement("div");
    milestoneList.className = "meeting-milestone-list";

    item.milestones.forEach((milestone) => {
      const milestoneItem = document.createElement("div");
      milestoneItem.className = "meeting-milestone-item";

      const milestoneLabelEl = document.createElement("strong");
      milestoneLabelEl.textContent = milestoneLabel(milestone);

      const startDate = milestone.startDate || milestone.endDate;
      const endDate = milestone.endDate || milestone.startDate;
      const milestoneText = document.createElement("span");
      milestoneText.textContent = startDate && endDate ? formatPeriodLabel(startDate, endDate) : "日程調整中";

      milestoneItem.append(milestoneLabelEl, milestoneText);
      milestoneList.append(milestoneItem);
    });

    body.append(milestoneList);
  }

  if (item.note) {
    const note = document.createElement("p");
    note.className = "meeting-card-note";
    note.textContent = item.note;
    body.append(note);
  }

  article.append(media, body);
  return article;
}

function renderPendingNote() {
  const pendingItems = meetings.filter((item) => item.status === "pending");

  if (pendingItems.length === 0) {
    pendingNoteEl.hidden = true;
    clearElement(pendingNoteEl);
    return;
  }

  pendingNoteEl.hidden = false;
  clearElement(pendingNoteEl);
  pendingNoteEl.append(
    Object.assign(document.createElement("strong"), { textContent: "未公表" }),
    Object.assign(document.createElement("span"), { textContent: pendingItems[0].note }),
  );
}

function renderGroups() {
  const groups = new Map();

  meetings.forEach((item) => {
    const label = groupLabel(item);

    if (!groups.has(label)) {
      groups.set(label, []);
    }

    groups.get(label).push(item);
  });

  clearElement(meetingGroupsEl);
  meetingGroupsEl.append(statusPanelEl);

  groups.forEach((items, label) => {
    const section = document.createElement("section");
    section.className = "meeting-month-section";

    const heading = document.createElement("h2");
    heading.className = "meeting-month-heading";
    heading.append(Object.assign(document.createElement("span"), { textContent: label }));
    section.append(heading);

    const grid = document.createElement("div");
    grid.className = "meeting-cards-grid";

    items.forEach((item) => {
      grid.append(createMeetingCard(item));
    });

    section.append(grid);
    meetingGroupsEl.append(section);
  });
}

function applyMeetingData(data) {
  meetingData = data;
  meetings = [...data.meetings].sort((a, b) => sortValue(a).localeCompare(sortValue(b)));
  lastVerifiedEl.textContent = `${formatVerifiedDate(data.verifiedAt)} 時点で確認。公開後に変更される可能性があります。`;
  renderPendingNote();
  summarizeMilestones();
  renderMeetingCalendar();
  renderGroups();
  setStatus("");
}

function loadMeetingData() {
  setStatus("データを読み込んでいます。");

  try {
    const data = window.ANNUAL_MEETINGS_2026_DATA;

    if (!hasValidMeetingData(data)) {
      throw new Error("Invalid meeting data");
    }

    applyMeetingData(cloneMeetingData(data));
  } catch (error) {
    console.error(error);
    clearElement(meetingGroupsEl);
    setStatus("データを読み込めませんでした。data/annual-meetings-2026.js の内容を確認してください。");
  }
}

setupMeetingTabs();
loadMeetingData();
