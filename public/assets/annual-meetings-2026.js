let meetingData = null;
let meetings = [];

const meetingGroupsEl = document.querySelector("#meeting-groups");
const lastVerifiedEl = document.querySelector("#meeting-last-verified");
const pendingNoteEl = document.querySelector("#meeting-pending-note");
const statusPanelEl = document.querySelector("#meeting-status-panel");

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

function clearElement(element) {
  element.replaceChildren();
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

loadMeetingData();
