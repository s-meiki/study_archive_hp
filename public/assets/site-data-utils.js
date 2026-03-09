(function () {
  const THEME_COLORS = {
    cardiology: { start: "#6b5548", end: "#c0a48f" },
    neurology: { start: "#556070", end: "#98a4bb" },
    foundations: { start: "#5d5b47", end: "#b4b08c" },
    "research-career": { start: "#5b4c4c", end: "#baa09b" },
    "ai-utilization": { start: "#365a5c", end: "#9dbab7" },
  };

  function stableHash(input) {
    let hash = 5381;

    for (let index = 0; index < input.length; index += 1) {
      hash = (hash * 33) ^ input.charCodeAt(index);
    }

    return Math.abs(hash >>> 0).toString(36);
  }

  function sanitizeSegment(input, fallback = "item") {
    const value = String(input ?? "").normalize("NFKC").toLowerCase();
    const slug = value.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

    if (slug) {
      return slug.slice(0, 64);
    }

    return `${fallback}-${stableHash(value || fallback).slice(0, 6)}`;
  }

  function normalizeText(value) {
    return String(value ?? "").replace(/\s+/g, " ").trim();
  }

  function cloneSiteData(data) {
    return JSON.parse(JSON.stringify(data));
  }

  function hasValidSiteData(data) {
    return Boolean(data) && Array.isArray(data.themes) && Array.isArray(data.archives);
  }

  function getSiteData() {
    if (!hasValidSiteData(window.STUDY_ARCHIVE_DATA)) {
      return { themes: [], archives: [] };
    }

    return cloneSiteData(window.STUDY_ARCHIVE_DATA);
  }

  function serializeSiteData(data) {
    if (!hasValidSiteData(data)) {
      throw new Error("Invalid site data");
    }

    return `window.STUDY_ARCHIVE_DATA = ${JSON.stringify(data, null, 2)};\n`;
  }

  function createArchiveId(date, title) {
    const day = String(date || "undated").replace(/[^0-9]/g, "").slice(0, 8) || "undated";
    const hash = stableHash(`${date}|${title}`).slice(0, 8);
    return `archive-${day}-${hash}`;
  }

  function getThemeColors(themeId) {
    return THEME_COLORS[themeId] ?? { start: "#365a5c", end: "#9dbab7" };
  }

  function buildSummary(title, themeName) {
    const cleanTitle = normalizeText(title);
    if (!cleanTitle) {
      return "";
    }

    if (themeName) {
      return `${themeName}テーマの勉強会アーカイブ。${cleanTitle}を中心に確認できる回。`;
    }

    return `${cleanTitle}を扱う勉強会アーカイブ。`;
  }

  function createUploadPath(archive, kind, fileName) {
    const month = archive.date ? archive.date.slice(0, 7) : "undated";
    const folder = sanitizeSegment(archive.title || archive.id, "archive");
    const extensionMatch = fileName.match(/\.[a-z0-9]+$/i);
    const extension = extensionMatch ? extensionMatch[0].toLowerCase() : "";
    const baseName = sanitizeSegment(fileName.replace(/\.[^.]+$/, ""), kind);
    return `uploads/${month}/${folder}/${kind}-${baseName}${extension}`;
  }

  window.StudyArchiveDataUtils = {
    buildSummary,
    cloneSiteData,
    createArchiveId,
    createUploadPath,
    getSiteData,
    getThemeColors,
    hasValidSiteData,
    normalizeText,
    sanitizeSegment,
    serializeSiteData,
    stableHash,
  };
})();
