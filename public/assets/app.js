let themes = [];
let archives = [];
const dataUtils = window.StudyArchiveDataUtils;

const state = {
  themeId: "",
  search: "",
  asset: "all",
  year: "all",
};

const themeListEl = document.querySelector("#theme-list");
const archiveListEl = document.querySelector("#archive-list");
const archiveHeadingEl = document.querySelector("#archive-heading");
const archiveDescriptionEl = document.querySelector("#archive-description");
const archiveSummaryEl = document.querySelector("#archive-summary");
const featuredCardEl = document.querySelector("#featured-card");
const entryPicksEl = document.querySelector("#entry-picks");
const emptyStateEl = document.querySelector("#empty-state");
const statusPanelEl = document.querySelector("#status-panel");
const yearFilterEl = document.querySelector("#year-filter");
const searchInputEl = document.querySelector("#search-input");
const assetFilterEl = document.querySelector("#asset-filter");
const clearFiltersEl = document.querySelector("#clear-filters");

function clearElement(element) {
  element.replaceChildren();
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

function setThumbnailStyles(element, thumbnail) {
  const fallback = dataUtils.getThemeColors("");
  element.style.setProperty("--thumb-a", dataUtils.sanitizeColor(thumbnail?.start, fallback.start));
  element.style.setProperty("--thumb-b", dataUtils.sanitizeColor(thumbnail?.end, fallback.end));
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

function featuredArchiveForTheme(themeId) {
  const themeArchives = archivesForTheme(themeId);
  return themeArchives.find((archive) => archive.featured) ?? themeArchives[0];
}

function archiveDetailUrl(archive) {
  return dataUtils.getArchiveDetailUrl(archive, "./archive/");
}

function renderFeatured() {
  clearElement(featuredCardEl);

  const theme = themeById(state.themeId);
  const featured = featuredArchiveForTheme(state.themeId);

  if (!featured || !theme) {
    return;
  }

  const media = createElement("div", { className: "feature-media" });
  setThumbnailStyles(media, featured.thumbnail);
  media.append(
    createElement("span", { className: "feature-badge", text: "Featured" }),
    createElement("span", { className: "play-button" }),
    createElement("span", { className: "duration", text: featured.duration || "未記載" }),
  );
  media.querySelector(".play-button").setAttribute("aria-hidden", "true");

  const copyBlock = createElement("div", { className: "feature-copy-block" });
  const primary = document.createElement("div");
  const heading = document.createElement("h2");
  const titleLink = createElement("a", { className: "archive-title-link feature-title-link", text: featured.title || "無題" });
  titleLink.href = archiveDetailUrl(featured);
  heading.append(titleLink);

  const intro = createElement("p", { text: `${theme.name}テーマで最初に確認したい1件です。` });
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
  const latest = archivesForTheme(state.themeId)[0];

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
  clearElement(archiveListEl);
  renderArchiveHeader(items);

  if (items.length === 0) {
    emptyStateEl.hidden = false;
    return;
  }

  emptyStateEl.hidden = true;

  items.forEach((archive) => {
    const card = createElement("article", { className: "panel archive-card" });

    const media = createElement("div", { className: "archive-media" });
    setThumbnailStyles(media, archive.thumbnail);
    const playButton = createElement("span", { className: "play-button" });
    playButton.setAttribute("aria-hidden", "true");
    media.append(playButton, createElement("span", { className: "duration", text: archive.duration || "未記載" }));

    const content = createElement("div", { className: "archive-content" });
    const meta = createElement("div", { className: "archive-meta" });

    if (archive.featured) {
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
  renderThemes();
  renderEntryPicks();
  renderArchives();
  setStatus("");
}

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

  try {
    const data = window.STUDY_ARCHIVE_DATA;

    if (!dataUtils.hasValidSiteData(data)) {
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
}

loadSiteData();
