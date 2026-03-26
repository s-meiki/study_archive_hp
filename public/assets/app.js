let themes = [];
let archives = [];
const dataUtils = window.StudyArchiveDataUtils;
const ARCHIVE_CALENDAR_PAGE_SIZE = 1;
const SITE_DATA_RETRY_LIMIT = 40;
const SITE_DATA_RETRY_DELAY_MS = 100;

const state = {
  themeId: "",
  search: "",
  asset: "all",
  year: "all",
};

const archiveCalendarState = {
  monthKeys: [],
  startIndex: -1,
};
const homeViewState = {
  activeTab: "list",
};

const themeListEl = document.querySelector("#theme-list");
const archiveListEl = document.querySelector("#archive-list");
const archiveHeadingEl = document.querySelector("#archive-heading");
const archiveDescriptionEl = document.querySelector("#archive-description");
const archiveSummaryEl = document.querySelector("#archive-summary");
const archiveCalendarEl = document.querySelector("#archive-calendar");
const featuredCardEl = document.querySelector("#featured-card");
const entryPicksEl = document.querySelector("#entry-picks");
const emptyStateEl = document.querySelector("#empty-state");
const statusPanelEl = document.querySelector("#status-panel");
const yearFilterEl = document.querySelector("#year-filter");
const searchInputEl = document.querySelector("#search-input");
const assetFilterEl = document.querySelector("#asset-filter");
const clearFiltersEl = document.querySelector("#clear-filters");
const homeTabButtons = [...document.querySelectorAll("[data-home-tab]")];
const homeTabPanels = [...document.querySelectorAll("[data-home-panel]")];

function clearElement(element) {
  element.replaceChildren();
}

function setActiveHomeTab(nextTab) {
  homeViewState.activeTab = nextTab;

  homeTabButtons.forEach((button) => {
    const isActive = button.dataset.homeTab === nextTab;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-selected", String(isActive));
    button.tabIndex = isActive ? 0 : -1;
  });

  homeTabPanels.forEach((panel) => {
    panel.hidden = panel.dataset.homePanel !== nextTab;
  });
}

function setupHomeTabs() {
  if (homeTabButtons.length === 0 || homeTabPanels.length === 0) {
    return;
  }

  setActiveHomeTab(homeViewState.activeTab);

  homeTabButtons.forEach((button, index) => {
    button.addEventListener("click", () => {
      setActiveHomeTab(button.dataset.homeTab || "list");
    });

    button.addEventListener("keydown", (event) => {
      if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") {
        return;
      }

      event.preventDefault();
      const direction = event.key === "ArrowRight" ? 1 : -1;
      const nextIndex = (index + direction + homeTabButtons.length) % homeTabButtons.length;
      const nextButton = homeTabButtons[nextIndex];
      setActiveHomeTab(nextButton.dataset.homeTab || "list");
      nextButton.focus();
    });
  });
}

function createElement(tagName, options = {}) {
  const { className = "", text = null } = options;
  const element = document.createElement(tagName);

  if (className) {
    element.className = className;
  }

  if (text !== null) {
    element.textContent = text;
  }

  return element;
}

function hexToRgb(hexColor) {
  const value = String(hexColor ?? "").trim().replace("#", "");

  if (!/^[0-9a-f]{6}$/i.test(value)) {
    return null;
  }

  return {
    r: Number.parseInt(value.slice(0, 2), 16),
    g: Number.parseInt(value.slice(2, 4), 16),
    b: Number.parseInt(value.slice(4, 6), 16),
  };
}

function rgbaFromHex(hexColor, alpha) {
  const rgb = hexToRgb(hexColor);

  if (!rgb) {
    return "";
  }

  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

function applyThemeAccent(element, themeId, variant = "soft") {
  const colors = dataUtils.getThemeColors(themeId || "");
  const start = dataUtils.sanitizeColor(colors.start, "#365a5c");
  const end = dataUtils.sanitizeColor(colors.end, "#9dbab7");

  if (variant === "button") {
    element.style.setProperty("--theme-bg", `linear-gradient(135deg, ${rgbaFromHex(start, 0.16)}, ${rgbaFromHex(end, 0.28)})`);
    element.style.setProperty("--theme-border", rgbaFromHex(start, 0.28));
    element.style.setProperty("--theme-text", start);
    element.style.setProperty("--theme-count-bg", rgbaFromHex(start, 0.08));
    return;
  }

  element.style.setProperty("--calendar-entry-bg", `linear-gradient(135deg, ${rgbaFromHex(start, 0.15)}, ${rgbaFromHex(end, 0.24)})`);
  element.style.setProperty("--calendar-entry-border", rgbaFromHex(start, 0.26));
  element.style.setProperty("--calendar-entry-text", start);
}

function setThumbnailStyles(element, thumbnail, archive = null) {
  const fallback = dataUtils.getThemeColors("");
  element.style.setProperty("--thumb-a", dataUtils.sanitizeColor(thumbnail?.start, fallback.start));
  element.style.setProperty("--thumb-b", dataUtils.sanitizeColor(thumbnail?.end, fallback.end));

  const thumbnailUrl = archive ? dataUtils.getArchiveThumbnailUrl(archive, "./") : "";
  if (thumbnailUrl) {
    element.style.setProperty("--thumb-image", `url("${thumbnailUrl.replace(/"/g, '\\"')}")`);
    return;
  }

  element.style.removeProperty("--thumb-image");
}

function normalizePublicUrl(url) {
  const normalized = dataUtils.normalizeLinkUrl(url, { allowRelative: true, allowHash: false });
  return normalized ? dataUtils.resolveSiteUrl(normalized, "./") : "";
}

function applyLinkAttributes(anchor, url) {
  if (dataUtils.isExternalUrl(url)) {
    anchor.target = "_blank";
    anchor.rel = "noreferrer noopener";
  }
}

function appendArchiveLink(container, url, label, className = "mini-link") {
  const resolvedUrl = normalizePublicUrl(url);
  if (!resolvedUrl) {
    return false;
  }

  const anchor = createElement("a", { className, text: label });
  anchor.href = resolvedUrl;
  applyLinkAttributes(anchor, resolvedUrl);
  container.append(anchor);
  return true;
}

function applySiteData(data) {
  themes = data.themes;
  archives = data.archives;
  state.themeId = themes[0]?.id ?? "";
  resetYearOptions();
  render();
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
}

function toCalendarDate(dateString) {
  return new Date(`${dateString}T00:00:00+09:00`);
}

function pad(value) {
  return String(value).padStart(2, "0");
}

function toIsoDate(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function monthKeyFromDate(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
}

function formatMonthLabel(monthKey) {
  const monthDate = toCalendarDate(`${monthKey}-01`);
  return `${monthDate.getFullYear()}年${monthDate.getMonth() + 1}月`;
}

function clampCalendarIndex(startIndex, monthCount) {
  const maxStartIndex = Math.max(0, monthCount - ARCHIVE_CALENDAR_PAGE_SIZE);
  return Math.min(Math.max(startIndex, 0), maxStartIndex);
}

function createCalendarNavStatus(monthKeys, startIndex) {
  const visibleMonths = monthKeys.slice(startIndex, startIndex + ARCHIVE_CALENDAR_PAGE_SIZE);

  if (visibleMonths.length === 0) {
    return "";
  }

  if (visibleMonths.length === 1) {
    return formatMonthLabel(visibleMonths[0]);
  }

  return `${formatMonthLabel(visibleMonths[0])} - ${formatMonthLabel(visibleMonths[visibleMonths.length - 1])}`;
}

function createCalendarNavigation(monthKeys, startIndex, onMove) {
  const controls = createElement("div", { className: "calendar-nav" });
  const prevButton = createElement("button", { className: "calendar-nav-button", text: "← 前の月" });
  prevButton.type = "button";
  prevButton.disabled = startIndex === 0;
  prevButton.addEventListener("click", () => {
    onMove(startIndex - ARCHIVE_CALENDAR_PAGE_SIZE);
  });

  const status = createElement("div", { className: "calendar-nav-status", text: createCalendarNavStatus(monthKeys, startIndex) });

  const nextButton = createElement("button", { className: "calendar-nav-button", text: "次の月 →" });
  nextButton.type = "button";
  nextButton.disabled = startIndex + ARCHIVE_CALENDAR_PAGE_SIZE >= monthKeys.length;
  nextButton.addEventListener("click", () => {
    onMove(startIndex + ARCHIVE_CALENDAR_PAGE_SIZE);
  });

  controls.append(prevButton, status, nextButton);
  return controls;
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

function resetYearOptions() {
  clearElement(yearFilterEl);

  const defaultOption = document.createElement("option");
  defaultOption.value = "all";
  defaultOption.textContent = "年度";
  yearFilterEl.append(defaultOption);

  const yearOptions = [...new Set(archives.map((archive) => String(archive.date ?? "").slice(0, 4)).filter(Boolean))].sort((a, b) =>
    b.localeCompare(a),
  );

  yearOptions.forEach((year) => {
    const option = document.createElement("option");
    option.value = year;
    option.textContent = year;
    yearFilterEl.append(option);
  });
}

function themeById(themeId) {
  return themes.find((theme) => theme.id === themeId);
}

function archivesForTheme(themeId) {
  return archives
    .filter((archive) => archive.themeId === themeId)
    .sort((a, b) => String(b.date ?? "").localeCompare(String(a.date ?? "")));
}

function compareUpdatedArchives(a, b) {
  const updatedOrder = String(b.updatedAt ?? b.date ?? "").localeCompare(String(a.updatedAt ?? a.date ?? ""));
  if (updatedOrder !== 0) {
    return updatedOrder;
  }

  const dateOrder = String(b.date ?? "").localeCompare(String(a.date ?? ""));
  if (dateOrder !== 0) {
    return dateOrder;
  }

  return String(a.id ?? "").localeCompare(String(b.id ?? ""));
}

function latestUpdatedArchiveForTheme(themeId) {
  const themeArchives = archivesForTheme(themeId);
  return [...themeArchives].sort(compareUpdatedArchives)[0] ?? null;
}

function latestUpdatedArchive() {
  return [...archives].sort(compareUpdatedArchives)[0] ?? null;
}

function allArchivesSorted() {
  return [...archives].sort((a, b) => String(b.date ?? "").localeCompare(String(a.date ?? "")));
}

function filteredArchives() {
  const searchTerm = state.search.toLowerCase();

  return archivesForTheme(state.themeId).filter((archive) => {
    const matchesSearch =
      state.search === "" ||
      [archive.title, archive.summary, archive.speaker].some((value) => String(value ?? "").toLowerCase().includes(searchTerm));

    const matchesAsset =
      state.asset === "all" ||
      (state.asset === "recording" && archive.assets.recording) ||
      (state.asset === "slides" && archive.assets.slides) ||
      (state.asset === "notes" && archive.assets.notes) ||
      (state.asset === "references" && archive.assets.references);

    const matchesYear = state.year === "all" || String(archive.date ?? "").startsWith(state.year);

    return matchesSearch && matchesAsset && matchesYear;
  });
}

function featuredArchive() {
  return latestUpdatedArchive();
}

function archiveDetailUrl(archive) {
  return dataUtils.getArchiveDetailUrl(archive, "/archive");
}

function renderFeatured() {
  clearElement(featuredCardEl);

  const featured = featuredArchive();
  const theme = themeById(featured?.themeId ?? "");

  if (!featured || !theme) {
    return;
  }

  const media = createElement("div", { className: "feature-media" });
  setThumbnailStyles(media, featured.thumbnail, featured);
  media.append(createElement("span", { className: "feature-badge", text: "Featured" }));

  if (featured.assets?.recording) {
    const playButton = createElement("span", { className: "play-button" });
    playButton.setAttribute("aria-hidden", "true");
    media.append(playButton);
  }

  media.append(createElement("span", { className: "duration", text: featured.duration || "未記載" }));

  const copyBlock = createElement("div", { className: "feature-copy-block" });
  const primary = document.createElement("div");
  const heading = document.createElement("h2");
  const titleLink = createElement("a", { className: "archive-title-link feature-title-link", text: featured.title || "無題" });
  titleLink.href = archiveDetailUrl(featured);
  heading.append(titleLink);

  const intro = createElement("p", { text: "アーカイブ全体で最新に追加・更新された1件です。" });
  primary.append(heading, intro);

  const meta = createElement("div", { className: "feature-meta" });
  meta.append(
    createElement("span", { text: theme.name }),
    createElement("span", { text: formatDate(featured.date) }),
    createElement("span", { text: featured.speaker || "講師未記載" }),
  );

  copyBlock.append(primary, meta);
  featuredCardEl.append(media, copyBlock);
}

function renderArchiveCalendar() {
  if (!archiveCalendarEl) {
    return;
  }

  const datedArchives = archives
    .filter((archive) => archive.date)
    .sort((a, b) => String(a.date ?? "").localeCompare(String(b.date ?? "")));
  const monthKeys = [...new Set(datedArchives.map((archive) => String(archive.date).slice(0, 7)))];
  const archiveMap = new Map();

  datedArchives.forEach((archive) => {
    const key = String(archive.date ?? "");
    if (!archiveMap.has(key)) {
      archiveMap.set(key, []);
    }
    archiveMap.get(key).push(archive);
  });

  archiveCalendarState.monthKeys = monthKeys;
  if (archiveCalendarState.startIndex < 0 && monthKeys.length > ARCHIVE_CALENDAR_PAGE_SIZE) {
    archiveCalendarState.startIndex = Math.max(0, monthKeys.length - ARCHIVE_CALENDAR_PAGE_SIZE);
  }
  archiveCalendarState.startIndex = clampCalendarIndex(archiveCalendarState.startIndex, monthKeys.length);

  clearElement(archiveCalendarEl);

  if (monthKeys.length === 0) {
    archiveCalendarEl.append(createElement("p", { className: "calendar-empty", text: "表示できる開催日データがありません。" }));
    return;
  }

  const viewport = createElement("div", { className: "calendar-month-grid archive-calendar-grid" });
  monthKeys.slice(archiveCalendarState.startIndex, archiveCalendarState.startIndex + ARCHIVE_CALENDAR_PAGE_SIZE).forEach((monthKey) => {
    const monthDate = toCalendarDate(`${monthKey}-01`);
    const monthCard = createElement("section", { className: "calendar-month-card" });
    const navigation = createCalendarNavigation(monthKeys, archiveCalendarState.startIndex, (nextIndex) => {
      archiveCalendarState.startIndex = clampCalendarIndex(nextIndex, archiveCalendarState.monthKeys.length);
      renderArchiveCalendar();
    });
    navigation.classList.add("calendar-nav-embedded");
    const weekdayRow = createElement("div", { className: "calendar-weekdays" });
    ["日", "月", "火", "水", "木", "金", "土"].forEach((weekday) => {
      weekdayRow.append(createElement("span", { text: weekday }));
    });

    const grid = createElement("div", { className: "calendar-days" });
    const month = monthDate.getMonth();
    const offset = monthDate.getDay();
    const cursor = new Date(monthDate);
    cursor.setDate(1 - offset);

    for (let index = 0; index < 42; index += 1) {
      const cell = createElement("div", { className: `calendar-day${cursor.getMonth() !== month ? " is-outside" : ""}` });
      cell.append(createElement("div", { className: "calendar-day-number", text: String(cursor.getDate()) }));

      const dayArchives = archiveMap.get(toIsoDate(cursor)) || [];
      if (dayArchives.length > 0) {
        const list = createElement("div", { className: "calendar-day-entries" });
        dayArchives.slice(0, 2).forEach((archive) => {
          const link = createElement("a", { className: "calendar-entry is-archive", text: archive.title || "勉強会" });
          link.href = archiveDetailUrl(archive);
          applyThemeAccent(link, archive.themeId, "calendar");
          list.append(link);
        });

        if (dayArchives.length > 2) {
          list.append(createElement("span", { className: "calendar-more", text: `+${dayArchives.length - 2}` }));
        }

        cell.append(list);
      }

      grid.append(cell);
      cursor.setDate(cursor.getDate() + 1);
    }

    monthCard.append(navigation, weekdayRow, grid);
    viewport.append(monthCard);
  });

  archiveCalendarEl.append(viewport);
}

function syncFilterControls() {
  searchInputEl.value = state.search;
  assetFilterEl.value = state.asset;
  yearFilterEl.value = state.year;
}

function activateEntryPick(archive, asset = "all") {
  if (!archive) {
    return;
  }

  state.themeId = archive.themeId;
  state.search = "";
  state.asset = asset;
  state.year = "all";
  syncFilterControls();
  render();
  archiveHeadingEl.scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderEntryPicks() {
  if (!entryPicksEl) {
    return;
  }

  const latest = allArchivesSorted()[0];
  const recording = allArchivesSorted().find((archive) => archive.assets.recording);
  const references = allArchivesSorted().find((archive) => archive.assets.references);

  const picks = [
    {
      id: "latest",
      label: "Latest",
      title: "最新の回から見る",
      archive: latest,
      asset: "all",
    },
    {
      id: "recording",
      label: "Recording",
      title: "録画ありの回から見る",
      archive: recording,
      asset: "recording",
    },
    {
      id: "references",
      label: "Reference",
      title: "参考資料ありの回から見る",
      archive: references,
      asset: "references",
    },
  ].filter((pick) => Boolean(pick.archive));

  clearElement(entryPicksEl);

  picks.forEach((pick) => {
    const archive = pick.archive;
    const button = createElement("button", { className: "entry-pick" });
    button.type = "button";

    const meta = createElement("span", { className: "entry-pick-meta" });
    meta.append(document.createTextNode(archive.title || "無題"));
    meta.append(document.createElement("br"));
    meta.append(
      document.createTextNode(`${formatDate(archive.date)} / ${themeById(archive.themeId)?.name ?? archive.themeId ?? "未分類"}`),
    );

    button.append(
      createElement("span", { className: "entry-pick-label", text: pick.label }),
      createElement("span", { className: "entry-pick-title", text: pick.title }),
      meta,
      createElement("span", { className: "entry-pick-arrow", text: "この入口を使う" }),
    );

    button.addEventListener("click", () => {
      activateEntryPick(archive, pick.asset);
    });

    entryPicksEl.append(button);
  });
}

function renderThemes() {
  clearElement(themeListEl);

  themes.forEach((theme) => {
    const count = archivesForTheme(theme.id).length;
    const button = createElement("button", {
      className: `theme-button${state.themeId === theme.id ? " is-active" : ""}`,
    });
    button.type = "button";
    button.dataset.themeId = theme.id;
    applyThemeAccent(button, theme.id, "button");

    const copyGroup = document.createElement("span");
    copyGroup.append(
      createElement("span", { className: "theme-title", text: theme.name || theme.id }),
      createElement("span", { className: "theme-copy", text: theme.summary || "" }),
    );

    button.append(copyGroup, createElement("span", { className: "theme-count", text: `${count}件` }));

    button.addEventListener("click", () => {
      state.themeId = theme.id;
      render();
    });

    themeListEl.append(button);
  });
}

function renderArchiveHeader(items) {
  const theme = themeById(state.themeId);
  const latest = latestUpdatedArchiveForTheme(state.themeId);

  if (!theme) {
    archiveHeadingEl.textContent = "勉強会アーカイブ";
    archiveDescriptionEl.textContent = "テーマを選ぶと、ここに該当アーカイブを新しい順で並べます。";
    archiveSummaryEl.textContent = "";
    return;
  }

  archiveHeadingEl.textContent = `${theme.name}のアーカイブ`;
  archiveDescriptionEl.textContent = `${theme.summary} を中心に、該当するアーカイブを新しい順で並べています。`;
  archiveSummaryEl.textContent = `${items.length}件 / 最新更新 ${latest ? formatDate(latest.updatedAt) : "-"}`;
}

function renderArchives() {
  const items = filteredArchives();
  const latestUpdatedId = latestUpdatedArchiveForTheme(state.themeId)?.id ?? "";
  clearElement(archiveListEl);
  renderArchiveHeader(items);

  if (items.length === 0) {
    emptyStateEl.hidden = false;
    return;
  }

  emptyStateEl.hidden = true;

  items.forEach((archive) => {
    const card = createElement("article", { className: "panel archive-card" });
    const isLatestUpdated = latestUpdatedId === archive.id;

    const media = createElement("div", { className: "archive-media" });
    setThumbnailStyles(media, archive.thumbnail, archive);
    if (archive.assets?.recording) {
      const playButton = createElement("span", { className: "play-button" });
      playButton.setAttribute("aria-hidden", "true");
      media.append(playButton);
    }
    media.append(createElement("span", { className: "duration", text: archive.duration || "未記載" }));

    const content = createElement("div", { className: "archive-content" });
    const meta = createElement("div", { className: "archive-meta" });

    if (isLatestUpdated) {
      meta.append(createElement("span", { className: "status", text: "最新" }));
    }

    meta.append(createElement("span", { text: formatDate(archive.date) }));

    if (archive.assets.slides) {
      meta.append(createElement("span", { text: "スライドあり" }));
    }
    if (archive.assets.notes) {
      meta.append(createElement("span", { text: "要点メモあり" }));
    }
    if (archive.assets.references) {
      meta.append(createElement("span", { text: "参考文献あり" }));
    }

    const heading = document.createElement("h3");
    const titleLink = createElement("a", { className: "archive-title-link", text: archive.title || "無題" });
    titleLink.href = archiveDetailUrl(archive);
    heading.append(titleLink);

    const summary = createElement("p", { text: archive.summary || "概要は準備中です。" });
    const footer = createElement("div", { className: "archive-footer" });
    const links = createElement("div", { className: "archive-links" });

    let hasLink = false;
    hasLink = appendArchiveLink(links, archive.links?.recording, "再生する", "mini-link primary") || hasLink;

    if (archive.assets.slides) {
      hasLink = appendArchiveLink(links, archive.links?.slides, "スライド") || hasLink;
    }

    if (archive.assets.notes) {
      hasLink = appendArchiveLink(links, archive.links?.notes, "要点メモ") || hasLink;
    }

    if (archive.assets.references) {
      hasLink = appendArchiveLink(links, archive.links?.references, "参考文献") || hasLink;
    }

    if (!hasLink) {
      links.append(createElement("span", { className: "mini-link is-muted", text: "リンク準備中" }));
    }

    footer.append(links, createElement("div", { className: "archive-note", text: archive.speaker || "講師未記載" }));
    content.append(meta, heading, summary, footer);
    card.append(media, content);
    archiveListEl.append(card);
  });
}

function render() {
  renderFeatured();
  renderArchiveCalendar();
  renderThemes();
  renderEntryPicks();
  renderArchives();
  setStatus("");
}

setupHomeTabs();

searchInputEl.addEventListener("input", (event) => {
  state.search = event.target.value.trim();
  renderArchives();
});

assetFilterEl.addEventListener("change", (event) => {
  state.asset = event.target.value;
  renderArchives();
});

yearFilterEl.addEventListener("change", (event) => {
  state.year = event.target.value;
  renderArchives();
});

clearFiltersEl.addEventListener("click", () => {
  state.search = "";
  state.asset = "all";
  state.year = "all";
  syncFilterControls();
  renderArchives();
});

function loadSiteData() {
  setStatus("データを読み込んでいます。");
  const attemptLoad = (attempt = 0) => {
    try {
      if (!dataUtils?.hasValidSiteData || !dataUtils?.cloneSiteData) {
        if (attempt < SITE_DATA_RETRY_LIMIT) {
          window.setTimeout(() => attemptLoad(attempt + 1), SITE_DATA_RETRY_DELAY_MS);
          return;
        }

        throw new Error("Site data utils not ready");
      }

      const data = window.STUDY_ARCHIVE_DATA;

      if (!dataUtils.hasValidSiteData(data)) {
        if (attempt < SITE_DATA_RETRY_LIMIT) {
          window.setTimeout(() => attemptLoad(attempt + 1), SITE_DATA_RETRY_DELAY_MS);
          return;
        }

        throw new Error("Invalid data shape");
      }

      applySiteData(dataUtils.cloneSiteData(data));
    } catch (error) {
      console.error(error);
      emptyStateEl.hidden = true;
      clearElement(archiveListEl);
      clearElement(featuredCardEl);
      clearElement(themeListEl);

      setStatus("データを読み込めませんでした。data/site-content.js の内容を確認してください。");
    }
  };

  attemptLoad();
}

loadSiteData();
