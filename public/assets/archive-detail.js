const dataUtils = window.StudyArchiveDataUtils;

const statusPanelEl = document.querySelector("#detail-status");
const breadcrumbCurrentEl = document.querySelector("#detail-breadcrumb-current");
const heroEl = document.querySelector("#detail-hero");
const titleEl = document.querySelector("#detail-title");
const leadEl = document.querySelector("#detail-lead");
const metaEl = document.querySelector("#detail-meta");
const layoutEl = document.querySelector("#detail-layout");
const emptyEl = document.querySelector("#detail-empty");
const overviewEl = document.querySelector("#detail-overview");
const videoPlayerEl = document.querySelector("#detail-video-player");
const keypointsPanelEl = document.querySelector("#detail-keypoints-panel");
const keypointsEl = document.querySelector("#detail-keypoints");
const chaptersPanelEl = document.querySelector("#detail-chapters-panel");
const chaptersEl = document.querySelector("#detail-chapters");
const materialsEl = document.querySelector("#detail-materials");
const relatedPanelEl = document.querySelector("#detail-related-panel");
const relatedEl = document.querySelector("#detail-related");

function clearElement(element) {
  element.replaceChildren();
}

function normalizeDetailUrl(url) {
  const normalized = dataUtils.normalizeLinkUrl(url, { allowRelative: true, allowHash: false });
  return normalized ? dataUtils.resolveSiteUrl(normalized, "../") : "";
}

function setThumbnailStyles(element, thumbnail, archive = null) {
  const fallback = dataUtils.getThemeColors("");
  element.style.setProperty("--thumb-a", dataUtils.sanitizeColor(thumbnail?.start, fallback.start));
  element.style.setProperty("--thumb-b", dataUtils.sanitizeColor(thumbnail?.end, fallback.end));

  const thumbnailUrl = archive ? dataUtils.getArchiveThumbnailUrl(archive, "../") : "";
  if (thumbnailUrl) {
    element.style.setProperty("--thumb-image", `url("${thumbnailUrl.replace(/"/g, '\\"')}")`);
    return;
  }

  element.style.removeProperty("--thumb-image");
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

function linkAttributes(anchor, url) {
  if (dataUtils.isExternalUrl(url)) {
    anchor.target = "_blank";
    anchor.rel = "noreferrer noopener";
  }
}

function themeById(themes, themeId) {
  return themes.find((theme) => theme.id === themeId);
}

function getRequestedArchiveId() {
  return new URLSearchParams(window.location.search).get("id")?.trim() ?? "";
}

function setMetaDescription(text) {
  const meta = document.querySelector('meta[name="description"]');
  if (meta) {
    meta.setAttribute("content", text);
  }
}

function buildOverviewParagraphs(detail) {
  const overview = detail?.overview || "概要は準備中です。";
  return String(overview)
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function buildMaterialItems(archive) {
  const items = [];
  const seen = new Set();

  const pushItem = (label, url) => {
    const normalizedUrl = normalizeDetailUrl(url);

    if (!label || !normalizedUrl) {
      return;
    }

    const key = `${label}|${normalizedUrl}`;
    if (seen.has(key)) {
      return;
    }

    seen.add(key);
    items.push({ label, url: normalizedUrl });
  };

  if (Array.isArray(archive.detail?.materials)) {
    archive.detail.materials.forEach((item) => pushItem(item.label, item.url));
  }

  if (archive.assets?.slides) {
    pushItem(archive.detail?.slideLabel || "スライド", archive.links?.slides);
  }

  if (archive.assets?.notes) {
    pushItem("要点メモ", archive.links?.notes);
  }

  if (archive.assets?.references) {
    pushItem("参考資料", archive.links?.references);
  }

  return items;
}

function createMetaChip(text) {
  const chip = document.createElement("span");
  chip.className = "detail-meta-chip";
  chip.textContent = text;
  return chip;
}

function renderHero(archive, theme) {
  const overview = buildOverviewParagraphs(archive.detail).join(" ") || archive.summary || "概要は準備中です。";

  document.title = `${archive.title} | 臨床学術ワーキンググループ`;
  setMetaDescription(overview);

  breadcrumbCurrentEl.textContent = archive.title;
  titleEl.textContent = archive.title;
  leadEl.textContent = overview;
  clearElement(metaEl);

  if (theme?.name) {
    metaEl.append(createMetaChip(theme.name));
  }

  if (archive.date) {
    metaEl.append(createMetaChip(formatDate(archive.date)));
  }

  if (archive.speaker) {
    metaEl.append(createMetaChip(archive.speaker));
  }

  if (archive.duration) {
    metaEl.append(createMetaChip(archive.duration));
  }

  if (archive.assets?.recording) {
    metaEl.append(createMetaChip("録画あり"));
  }

  heroEl.hidden = false;
}

function renderOverview(archive) {
  const paragraphs = buildOverviewParagraphs(archive.detail);
  clearElement(overviewEl);

  paragraphs.forEach((text) => {
    const paragraph = document.createElement("p");
    paragraph.textContent = text;
    overviewEl.append(paragraph);
  });
}

function renderVideoSection(archive) {
  const rawRecordingUrl = archive.detail?.video?.url || archive.links?.recording || "";
  const recordingUrl = normalizeDetailUrl(rawRecordingUrl);
  const embedUrl = dataUtils.getYouTubeEmbedUrl(recordingUrl);

  clearElement(videoPlayerEl);

  if (!recordingUrl) {
    const empty = document.createElement("p");
    empty.className = "detail-muted";
    empty.textContent = rawRecordingUrl ? "この回の録画リンクを表示できません。" : "この回の録画は準備中です。";
    videoPlayerEl.append(empty);
    return;
  }

  const shell = document.createElement("div");
  shell.className = "detail-video-shell";
  setThumbnailStyles(shell, archive.thumbnail, archive);

  const disclosure = document.createElement("p");
  disclosure.className = "detail-video-disclosure";
  disclosure.append("再生時には YouTube が読み込まれ、外部サービスへ情報が送信される場合があります。");

  const privacyLink = document.createElement("a");
  privacyLink.href = "/privacy";
  privacyLink.textContent = "プライバシーポリシー";
  disclosure.append(" 詳細は ", privacyLink, " を確認してください。");

  if (embedUrl) {
    const overlay = document.createElement("div");
    overlay.className = "detail-video-overlay";

    const copy = document.createElement("div");
    copy.className = "detail-video-copy";

    const title = document.createElement("strong");
    title.textContent = "ページ内でそのまま視聴できます";

    const note = document.createElement("p");
    note.textContent = "再生するを押した時だけ YouTube を読み込みます。";

    copy.append(title, note);

    const actions = document.createElement("div");
    actions.className = "detail-video-actions";

    const playButton = document.createElement("button");
    playButton.type = "button";
    playButton.className = "button button-primary";
    playButton.textContent = "再生する";

    playButton.addEventListener("click", () => {
      const iframe = document.createElement("iframe");
      iframe.src = embedUrl;
      iframe.title = `${archive.title} の動画`;
      iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
      iframe.allowFullscreen = true;
      iframe.loading = "lazy";
      clearElement(shell);
      shell.append(iframe);
    });

    const externalLink = document.createElement("a");
    externalLink.className = "button button-secondary";
    externalLink.href = recordingUrl;
    externalLink.textContent = "YouTubeで開く";
    linkAttributes(externalLink, recordingUrl);

    actions.append(playButton, externalLink);
    overlay.append(copy, actions);
    shell.append(overlay);
    videoPlayerEl.append(shell, disclosure);
    return;
  }

  const fallback = document.createElement("div");
  fallback.className = "detail-video-overlay";

  const copy = document.createElement("div");
  copy.className = "detail-video-copy";

  const title = document.createElement("strong");
  title.textContent = "外部ページで動画を確認します";

  const note = document.createElement("p");
  note.textContent = "この動画はページ内埋め込みに未対応のため、YouTube 側で開きます。";

  copy.append(title, note);

  const externalLink = document.createElement("a");
  externalLink.className = "button button-primary";
  externalLink.href = recordingUrl;
  externalLink.textContent = "YouTubeで開く";
  linkAttributes(externalLink, recordingUrl);

  fallback.append(copy, externalLink);
  shell.append(fallback);
  videoPlayerEl.append(shell, disclosure);
}

function renderKeyPoints(archive) {
  const items = Array.isArray(archive.detail?.keyPoints) ? archive.detail.keyPoints.filter(Boolean) : [];
  clearElement(keypointsEl);
  keypointsPanelEl.hidden = items.length === 0;

  items.forEach((item) => {
    const listItem = document.createElement("li");
    listItem.textContent = item;
    keypointsEl.append(listItem);
  });
}

function renderChapters(archive) {
  const items = Array.isArray(archive.detail?.chapters) ? archive.detail.chapters.filter((item) => item?.label) : [];
  clearElement(chaptersEl);
  chaptersPanelEl.hidden = items.length === 0;

  items.forEach((item) => {
    const listItem = document.createElement("li");
    listItem.className = "detail-chapter-item";

    const time = document.createElement("span");
    time.className = "detail-time-chip";
    time.textContent = item.time || "--:--";

    const label = document.createElement("span");
    label.textContent = item.label;

    listItem.append(time, label);
    chaptersEl.append(listItem);
  });
}

function renderMaterials(archive) {
  const items = buildMaterialItems(archive);
  clearElement(materialsEl);

  if (items.length === 0) {
    const empty = document.createElement("p");
    empty.className = "detail-muted";
    empty.textContent = "この回に紐づく資料はまだ準備中です。";
    materialsEl.append(empty);
    return;
  }

  items.forEach((item) => {
    const row = document.createElement("div");
    row.className = "detail-link-row";

    const label = document.createElement("div");
    label.className = "detail-link-copy";

    const strong = document.createElement("strong");
    strong.textContent = item.label;

    const meta = document.createElement("span");
    meta.textContent = dataUtils.isExternalUrl(item.url) ? "好きな形式でダウンロード可" : "サイト内資料";

    label.append(strong, meta);

    const anchor = document.createElement("a");
    anchor.className = "mini-link";
    anchor.href = item.url;
    anchor.textContent = "開く";
    linkAttributes(anchor, item.url);

    row.append(label, anchor);
    materialsEl.append(row);
  });
}

function renderRelatedArchives(archive, archives, themes) {
  const relatedArchives = dataUtils.rankRelatedArchives(archive, archives, themes, { limit: 3 });

  clearElement(relatedEl);
  relatedPanelEl.hidden = relatedArchives.length === 0;

  if (relatedArchives.length === 0) {
    return;
  }

  relatedArchives.forEach((entry) => {
    const item = entry.archive;
    const row = document.createElement("a");
    row.className = "detail-related-item";
    row.href = dataUtils.getArchiveDetailUrl(item, "./");

    const title = document.createElement("strong");
    title.textContent = item.title;

    const meta = document.createElement("span");
    const themeName = entry.theme?.name || themeById(themes, item.themeId)?.name || item.themeId;
    const metaParts = [formatDate(item.date), themeName];
    if (entry.reasons.length > 0) {
      metaParts.push(entry.reasons.slice(0, 2).join("・"));
    }
    meta.textContent = metaParts.join(" / ");

    row.append(title, meta);
    relatedEl.append(row);
  });
}

function renderArchivePage(data, archive) {
  const theme = themeById(data.themes, archive.themeId);
  const archiveWithDetail = {
    ...archive,
    detail: dataUtils.buildArchiveDetail(archive, theme),
  };

  renderHero(archiveWithDetail, theme);
  renderOverview(archiveWithDetail);
  renderVideoSection(archiveWithDetail);
  renderMaterials(archiveWithDetail);
  renderKeyPoints(archiveWithDetail);
  renderChapters(archiveWithDetail);
  renderRelatedArchives(archiveWithDetail, data.archives, data.themes);

  emptyEl.hidden = true;
  layoutEl.hidden = false;
  setStatus("");
}

function showEmptyState(message) {
  heroEl.hidden = true;
  layoutEl.hidden = true;
  emptyEl.hidden = false;
  setStatus(message);
}

function loadArchivePage() {
  setStatus("アーカイブ詳細を読み込んでいます。");

  try {
    const data = window.STUDY_ARCHIVE_DATA;

    if (!dataUtils?.hasValidSiteData(data)) {
      throw new Error("Invalid site data");
    }

    const archiveId = getRequestedArchiveId();
    if (!archiveId) {
      showEmptyState("アーカイブIDが指定されていません。");
      return;
    }

    const archive = data.archives.find((item) => item.id === archiveId);

    if (!archive) {
      showEmptyState("指定されたアーカイブが見つかりませんでした。");
      return;
    }

    renderArchivePage(dataUtils.cloneSiteData(data), archive);
  } catch (error) {
    console.error(error);
    showEmptyState("詳細ページのデータを読み込めませんでした。");
  }
}

loadArchivePage();
