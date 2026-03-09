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
const heroStatsEl = document.querySelector("#hero-stats");
const emptyStateEl = document.querySelector("#empty-state");
const statusPanelEl = document.querySelector("#status-panel");
const yearFilterEl = document.querySelector("#year-filter");
const searchInputEl = document.querySelector("#search-input");
const assetFilterEl = document.querySelector("#asset-filter");
const clearFiltersEl = document.querySelector("#clear-filters");

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
  yearFilterEl.innerHTML = '<option value="all">年度</option>';
  const yearOptions = [...new Set(archives.map((archive) => archive.date.slice(0, 4)))].sort((a, b) => b.localeCompare(a));

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
    .sort((a, b) => b.date.localeCompare(a.date));
}

function filteredArchives() {
  return archivesForTheme(state.themeId).filter((archive) => {
    const matchesSearch =
      state.search === "" ||
      [archive.title, archive.summary, archive.speaker].some((value) =>
        value.toLowerCase().includes(state.search.toLowerCase()),
      );

    const matchesAsset =
      state.asset === "all" ||
      (state.asset === "recording" && archive.assets.recording) ||
      (state.asset === "slides" && archive.assets.slides) ||
      (state.asset === "notes" && archive.assets.notes) ||
      (state.asset === "references" && archive.assets.references);

    const matchesYear = state.year === "all" || archive.date.startsWith(state.year);

    return matchesSearch && matchesAsset && matchesYear;
  });
}

function featuredArchiveForTheme(themeId) {
  const themeArchives = archivesForTheme(themeId);
  return themeArchives.find((archive) => archive.featured) ?? themeArchives[0];
}

function linkAttributes(url) {
  const isExternal = /^https?:\/\//.test(url);
  return isExternal ? ' target="_blank" rel="noreferrer"' : "";
}

function renderHeroStats() {
  const totalArchives = archives.length;
  const themeCount = themes.length;
  const currentYear = new Date().getFullYear();
  const updatedThisYear = archives.filter((archive) => archive.updatedAt.startsWith(String(currentYear))).length;

  heroStatsEl.innerHTML = `
    <span class="stat-chip">${themeCount}テーマ</span>
    <span class="stat-chip">${totalArchives}件のアーカイブ</span>
    <span class="stat-chip">${updatedThisYear}件を今年更新</span>
  `;
}

function renderFeatured() {
  const theme = themeById(state.themeId);
  const featured = featuredArchiveForTheme(state.themeId);

  if (!featured || !theme) {
    featuredCardEl.innerHTML = "";
    return;
  }

  featuredCardEl.innerHTML = `
    <div class="feature-media" style="--thumb-a: ${featured.thumbnail.start}; --thumb-b: ${featured.thumbnail.end};">
      <span class="feature-badge">Featured</span>
      <span class="play-button" aria-hidden="true"></span>
      <span class="duration">${featured.duration}</span>
    </div>
    <div class="feature-copy-block">
      <div>
        <h2>${featured.title}</h2>
        <p>${theme.name}テーマの注目アーカイブ。最初に見たい1件として表示しています。</p>
      </div>
      <div class="feature-meta">
        <span>${theme.name}</span>
        <span>${formatDate(featured.date)}</span>
        <span>${featured.speaker}</span>
      </div>
    </div>
  `;
}

function renderThemes() {
  themeListEl.innerHTML = "";

  themes.forEach((theme) => {
    const count = archivesForTheme(theme.id).length;
    const button = document.createElement("button");
    button.type = "button";
    button.className = `theme-button${state.themeId === theme.id ? " is-active" : ""}`;
    button.dataset.themeId = theme.id;
    button.innerHTML = `
      <span>
        <span class="theme-title">${theme.name}</span>
        <span class="theme-copy">${theme.summary}</span>
      </span>
      <span class="theme-count">${count}件</span>
    `;

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
  archiveListEl.innerHTML = "";
  renderArchiveHeader(items);

  if (items.length === 0) {
    emptyStateEl.hidden = false;
    return;
  }

  emptyStateEl.hidden = true;

  items.forEach((archive) => {
    const card = document.createElement("article");
    card.className = "panel archive-card";

    const assetMeta = [];
    if (archive.featured) assetMeta.push(`<span class="status">最新</span>`);
    assetMeta.push(`<span>${formatDate(archive.date)}</span>`);
    if (archive.assets.slides) assetMeta.push(`<span>スライドあり</span>`);
    if (archive.assets.notes) assetMeta.push(`<span>要点メモあり</span>`);
    if (archive.assets.references) assetMeta.push(`<span>参考文献あり</span>`);

    const links = [
      archive.links.recording
        ? `<a class="mini-link primary" href="${archive.links.recording}"${linkAttributes(archive.links.recording)}>再生する</a>`
        : "",
      archive.assets.slides && archive.links.slides
        ? `<a class="mini-link" href="${archive.links.slides}"${linkAttributes(archive.links.slides)}>スライド</a>`
        : "",
      archive.assets.notes && archive.links.notes
        ? `<a class="mini-link" href="${archive.links.notes}"${linkAttributes(archive.links.notes)}>要点メモ</a>`
        : "",
      archive.assets.references && archive.links.references
        ? `<a class="mini-link" href="${archive.links.references}"${linkAttributes(archive.links.references)}>参考文献</a>`
        : "",
    ].filter(Boolean);

    const linksMarkup =
      links.length > 0 ? links.join("") : '<span class="mini-link is-muted">リンク準備中</span>';

    card.innerHTML = `
      <div class="archive-media" style="--thumb-a: ${archive.thumbnail.start}; --thumb-b: ${archive.thumbnail.end};">
        <span class="play-button" aria-hidden="true"></span>
        <span class="duration">${archive.duration}</span>
      </div>
      <div class="archive-content">
        <div class="archive-meta">${assetMeta.join("")}</div>
        <h3>${archive.title}</h3>
        <p>${archive.summary}</p>
        <div class="archive-footer">
          <div class="archive-links">${linksMarkup}</div>
          <div class="archive-note">${archive.speaker}</div>
        </div>
      </div>
    `;

    archiveListEl.append(card);
  });
}

function render() {
  renderHeroStats();
  renderFeatured();
  renderThemes();
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
  searchInputEl.value = "";
  assetFilterEl.value = "all";
  yearFilterEl.value = "all";
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
    archiveListEl.innerHTML = "";
    featuredCardEl.innerHTML = "";
    heroStatsEl.innerHTML = "";
    themeListEl.innerHTML = "";

    setStatus("データを読み込めませんでした。data/site-content.js の内容を確認してください。");
  }
}

loadSiteData();
