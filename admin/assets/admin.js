const dataUtils = window.StudyArchiveDataUtils;

const FILE_KINDS = ["slides", "notes", "references"];
const FILE_KIND_LABELS = {
  slides: "スライド",
  notes: "要点メモ",
  references: "参考資料",
};
const HANDLE_DB_NAME = "study-archive-admin";
const HANDLE_STORE_NAME = "file-handles";
const ROOT_HANDLE_KEY = "project-root";

let workingData = dataUtils.getSiteData();
let selectedArchiveId = "";
let projectRootHandle = null;
let isDirty = false;

const pendingUploads = new Map();

const elements = {
  archiveForm: document.querySelector("#archive-form"),
  archiveList: document.querySelector("#archive-admin-list"),
  archiveSearch: document.querySelector("#archive-search"),
  autofillSummary: document.querySelector("#autofill-summary"),
  autofillDetail: document.querySelector("#autofill-detail"),
  connectFolder: document.querySelector("#connect-folder"),
  createArchive: document.querySelector("#create-archive"),
  copyRootPath: document.querySelector("#copy-root-path"),
  deleteArchive: document.querySelector("#delete-archive"),
  downloadData: document.querySelector("#download-data"),
  draftIndicator: document.querySelector("#draft-indicator"),
  editorTitle: document.querySelector("#editor-title"),
  fsSupportNote: document.querySelector("#fs-support-note"),
  libraryPanel: document.querySelector(".admin-library"),
  editorPanel: document.querySelector(".admin-editor"),
  rootPathValue: document.querySelector("#root-path-value"),
  saveProject: document.querySelector("#save-project"),
  stats: document.querySelector("#admin-stats"),
  statusStrip: document.querySelector("#status-strip"),
  fields: {
    title: document.querySelector("#field-title"),
    date: document.querySelector("#field-date"),
    speaker: document.querySelector("#field-speaker"),
    themeId: document.querySelector("#field-theme"),
    duration: document.querySelector("#field-duration"),
    featured: document.querySelector("#field-featured"),
    summary: document.querySelector("#field-summary"),
    detailOverview: document.querySelector("#field-detail-overview"),
    detailKeyPoints: document.querySelector("#field-detail-keypoints"),
    detailChapters: document.querySelector("#field-detail-chapters"),
    detailMaterials: document.querySelector("#field-detail-materials"),
    recording: document.querySelector("#field-recording"),
    slides: document.querySelector("#field-slides"),
    notes: document.querySelector("#field-notes"),
    references: document.querySelector("#field-references"),
  },
  files: {
    slides: document.querySelector("#file-slides"),
    notes: document.querySelector("#file-notes"),
    references: document.querySelector("#file-references"),
  },
  uploadNotes: {
    slides: document.querySelector("#upload-note-slides"),
    notes: document.querySelector("#upload-note-notes"),
    references: document.querySelector("#upload-note-references"),
  },
};

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(dateString) {
  if (!dateString) {
    return "-";
  }

  const date = new Date(dateString);
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
}

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

function createStatChip(text) {
  return createElement("span", { className: "stat-chip", text });
}

function normalizeArchiveLink(kind, value) {
  return dataUtils.normalizeLinkUrl(value, {
    allowRelative: kind !== "recording",
    allowHash: false,
  });
}

function getThemeName(themeId) {
  return workingData.themes.find((theme) => theme.id === themeId)?.name ?? themeId;
}

function getThemeMeta(themeId) {
  return workingData.themes.find((theme) => theme.id === themeId) ?? { id: themeId, name: getThemeName(themeId) };
}

function sortedArchives() {
  return [...workingData.archives].sort((a, b) => b.date.localeCompare(a.date));
}

function selectedArchive() {
  return workingData.archives.find((archive) => archive.id === selectedArchiveId) ?? null;
}

function selectedPendingUploads() {
  return pendingUploads.get(selectedArchiveId) ?? {};
}

function multilineValue(value) {
  return String(value ?? "")
    .split(/\r?\n/)
    .map((line) => dataUtils.normalizeText(line))
    .filter(Boolean);
}

function serializeLines(items) {
  return Array.isArray(items)
    ? items.map((item) => dataUtils.normalizeText(item)).filter(Boolean).join("\n")
    : "";
}

function parseChapterLine(line) {
  const value = dataUtils.normalizeText(line);
  if (!value) {
    return null;
  }

  const piped = value.split(/\s*[|｜]\s*/).filter(Boolean);
  if (piped.length >= 2) {
    return {
      time: dataUtils.normalizeText(piped.shift()),
      label: dataUtils.normalizeText(piped.join(" | ")),
    };
  }

  const timed = value.match(/^(\d{1,2}:\d{2}(?::\d{2})?)\s+(.+)$/);
  if (timed) {
    return {
      time: timed[1],
      label: dataUtils.normalizeText(timed[2]),
    };
  }

  return {
    time: "",
    label: value,
  };
}

function serializeChapters(items) {
  return Array.isArray(items)
    ? items
        .map((item) => {
          const label = dataUtils.normalizeText(item?.label);
          if (!label) {
            return "";
          }

          const time = dataUtils.normalizeText(item?.time);
          return time ? `${time} | ${label}` : label;
        })
        .filter(Boolean)
        .join("\n")
    : "";
}

function parseMaterialLine(line) {
  const value = dataUtils.normalizeText(line);
  if (!value) {
    return null;
  }

  const piped = value.split(/\s*[|｜]\s*/).filter(Boolean);
  if (piped.length >= 2) {
    return {
      label: dataUtils.normalizeText(piped.shift()),
      url: dataUtils.normalizeText(piped.join(" | ")),
    };
  }

  if (/^(?:[a-z]+:)?\/\//i.test(value) || value.startsWith("/") || (value.includes("/") && !/\s/.test(value))) {
    return {
      label: "追加資料",
      url: value,
    };
  }

  return null;
}

function serializeMaterials(items) {
  return Array.isArray(items)
    ? items
        .map((item) => {
          const label = dataUtils.normalizeText(item?.label);
          const url = dataUtils.normalizeText(item?.url);
          return label && url ? `${label} | ${url}` : "";
        })
        .filter(Boolean)
        .join("\n")
    : "";
}

function emptyArchiveDraft() {
  return {
    id: "",
    themeId: workingData.themes[0]?.id ?? "",
    title: "",
    summary: "",
    speaker: "",
    date: todayIso(),
    updatedAt: todayIso(),
    duration: "未記載",
    featured: false,
    assets: {
      recording: false,
      slides: false,
      notes: false,
      references: false,
    },
    links: {
      recording: "",
      slides: "",
      notes: "",
      references: "",
    },
    detail: {
      overview: "",
      keyPoints: [],
      chapters: [],
      materials: [],
    },
    thumbnail: dataUtils.getThemeColors(workingData.themes[0]?.id ?? ""),
  };
}

function showStatus(message, tone = "") {
  elements.statusStrip.hidden = !message;
  elements.statusStrip.textContent = message;
  elements.statusStrip.className = "status-strip panel";

  if (tone) {
    elements.statusStrip.classList.add(`is-${tone}`);
  }
}

function openHandleDb() {
  return new Promise((resolve, reject) => {
    if (!("indexedDB" in window)) {
      resolve(null);
      return;
    }

    const request = window.indexedDB.open(HANDLE_DB_NAME, 1);

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(HANDLE_STORE_NAME)) {
        database.createObjectStore(HANDLE_STORE_NAME);
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

async function saveStoredRootHandle(handle) {
  const database = await openHandleDb();
  if (!database) {
    return;
  }

  await new Promise((resolve, reject) => {
    const transaction = database.transaction(HANDLE_STORE_NAME, "readwrite");
    transaction.objectStore(HANDLE_STORE_NAME).put(handle, ROOT_HANDLE_KEY);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}

async function loadStoredRootHandle() {
  const database = await openHandleDb();
  if (!database) {
    return null;
  }

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(HANDLE_STORE_NAME, "readonly");
    const request = transaction.objectStore(HANDLE_STORE_NAME).get(ROOT_HANDLE_KEY);
    request.onsuccess = () => resolve(request.result ?? null);
    request.onerror = () => reject(request.error);
  });
}

async function clearStoredRootHandle() {
  const database = await openHandleDb();
  if (!database) {
    return;
  }

  await new Promise((resolve, reject) => {
    const transaction = database.transaction(HANDLE_STORE_NAME, "readwrite");
    transaction.objectStore(HANDLE_STORE_NAME).delete(ROOT_HANDLE_KEY);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}

function setDirtyState(nextDirty) {
  isDirty = nextDirty;
  elements.draftIndicator.textContent = nextDirty ? "フォームに未保存の変更があります" : "一覧の内容は最新です";
  elements.draftIndicator.classList.toggle("is-dirty", nextDirty);
}

function renderThemeOptions() {
  clearElement(elements.fields.themeId);

  workingData.themes.forEach((theme) => {
    const option = document.createElement("option");
    option.value = theme.id;
    option.textContent = theme.name;
    elements.fields.themeId.append(option);
  });
}

function renderStats() {
  if (!elements.stats) {
    return;
  }

  const recordingCount = workingData.archives.filter((archive) => archive.assets.recording).length;
  const referenceCount = workingData.archives.filter((archive) => archive.assets.references).length;

  clearElement(elements.stats);
  elements.stats.append(
    createStatChip(`${workingData.archives.length}件のアーカイブ`),
    createStatChip(`${recordingCount}件に録画あり`),
    createStatChip(`${referenceCount}件に参考資料あり`),
  );
}

function archiveBadges(archive) {
  const badges = [];

  if (archive.assets.recording) badges.push("録画");
  if (archive.assets.slides) badges.push("スライド");
  if (archive.assets.notes) badges.push("メモ");
  if (archive.assets.references) badges.push("参考資料");
  if (archive.detail?.overview || archive.detail?.keyPoints?.length) badges.push("詳細");
  if (archive.featured) badges.push("注目");

  return badges;
}

function archiveMatchesSearch(archive, query) {
  if (!query) {
    return true;
  }

  const haystack = [
    archive.title,
    archive.summary,
    archive.speaker,
    getThemeName(archive.themeId),
    archive.detail?.overview,
    ...(archive.detail?.keyPoints ?? []),
  ]
    .map((value) => String(value ?? ""))
    .join(" ")
    .toLowerCase();
  return haystack.includes(query);
}

function renderArchiveList() {
  const query = elements.archiveSearch.value.trim().toLowerCase();
  const items = sortedArchives().filter((archive) => archiveMatchesSearch(archive, query));
  clearElement(elements.archiveList);

  if (items.length === 0) {
    elements.archiveList.append(createElement("p", { className: "archive-admin-empty", text: "該当するアーカイブがありません。" }));
    return;
  }

  items.forEach((archive) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `archive-admin-item${archive.id === selectedArchiveId ? " is-active" : ""}`;

    const title = createElement("div", { className: "archive-admin-title", text: archive.title || "無題" });
    const meta = createElement("div", { className: "archive-admin-meta" });
    meta.append(
      createElement("span", { text: formatDate(archive.date) }),
      createElement("span", { text: getThemeName(archive.themeId) }),
      createElement("span", { text: archive.speaker || "講師未記載" }),
    );

    const badges = createElement("div", { className: "archive-admin-badges" });
    archiveBadges(archive).forEach((badge) => {
      badges.append(createElement("span", { text: badge }));
    });

    button.append(title, meta, badges);

    button.addEventListener("click", () => {
      selectArchive(archive.id);
    });

    elements.archiveList.append(button);
  });
}

function updateUploadNotes() {
  const archive = selectedArchive();
  const uploads = selectedPendingUploads();

  FILE_KINDS.forEach((kind) => {
    const note = elements.uploadNotes[kind];
    const pendingFile = uploads[kind];
    const currentLink = archive?.links?.[kind] || "";

    if (pendingFile) {
      note.textContent = `保存予定: ${pendingFile.name}。リポジトリへ保存すると public/uploads/ 配下へ配置します。`;
      return;
    }

    if (currentLink) {
      note.textContent = `現在のリンク: ${currentLink}`;
      return;
    }

    note.textContent = "URL を使うか、ファイルを選んで保存できます。";
  });
}

function populateForm(archive) {
  const target = archive ?? emptyArchiveDraft();
  const detail = target.detail ?? {};

  elements.fields.title.value = target.title ?? "";
  elements.fields.date.value = target.date ?? todayIso();
  elements.fields.speaker.value = target.speaker ?? "";
  elements.fields.themeId.value = target.themeId ?? workingData.themes[0]?.id ?? "";
  elements.fields.duration.value = target.duration ?? "未記載";
  elements.fields.featured.checked = Boolean(target.featured);
  elements.fields.summary.value = target.summary ?? "";
  elements.fields.detailOverview.value = detail.overview ?? "";
  elements.fields.detailKeyPoints.value = serializeLines(detail.keyPoints);
  elements.fields.detailChapters.value = serializeChapters(detail.chapters);
  elements.fields.detailMaterials.value = serializeMaterials(detail.materials);
  elements.fields.recording.value = target.links?.recording ?? "";
  elements.fields.slides.value = target.links?.slides ?? "";
  elements.fields.notes.value = target.links?.notes ?? "";
  elements.fields.references.value = target.links?.references ?? "";

  FILE_KINDS.forEach((kind) => {
    elements.files[kind].value = "";
  });

  updateUploadNotes();
  setDirtyState(false);
}

function confirmDiscardChanges() {
  if (!isDirty) {
    return true;
  }

  return window.confirm("保存前の変更があります。破棄して移動しますか？");
}

function selectArchive(archiveId) {
  if (!confirmDiscardChanges()) {
    return;
  }

  selectedArchiveId = archiveId;
  const archive = selectedArchive();
  elements.editorTitle.textContent = archive ? "アーカイブを編集" : "新規アーカイブ";
  populateForm(archive);
  renderArchiveList();
}

function clearPendingUpload(kind) {
  const uploads = selectedPendingUploads();

  if (!uploads[kind]) {
    elements.files[kind].value = "";
    updateUploadNotes();
    return;
  }

  delete uploads[kind];

  if (Object.keys(uploads).length === 0) {
    pendingUploads.delete(selectedArchiveId);
  } else {
    pendingUploads.set(selectedArchiveId, uploads);
  }

  elements.files[kind].value = "";
  updateUploadNotes();
  showStatus(`${kind} のファイル指定をクリアしました。`, "success");
}

function markThemeFeatured(themeId, archiveId, featured) {
  if (!featured) {
    return;
  }

  workingData.archives.forEach((archive) => {
    if (archive.themeId === themeId) {
      archive.featured = archive.id === archiveId;
    }
  });
}

function syncPendingFiles(previousId, nextId) {
  const nextUploads = { ...(pendingUploads.get(previousId) ?? pendingUploads.get(nextId) ?? {}) };

  FILE_KINDS.forEach((kind) => {
    const file = elements.files[kind].files[0];
    if (file) {
      nextUploads[kind] = file;
    }
  });

  pendingUploads.delete(previousId);

  if (Object.keys(nextUploads).length > 0) {
    pendingUploads.set(nextId, nextUploads);
  }
}

function draftArchiveFromFields() {
  const themeId = elements.fields.themeId.value;
  const theme = getThemeMeta(themeId);
  const links = {
    recording: normalizeArchiveLink("recording", elements.fields.recording.value),
    slides: normalizeArchiveLink("slides", elements.fields.slides.value),
    notes: normalizeArchiveLink("notes", elements.fields.notes.value),
    references: normalizeArchiveLink("references", elements.fields.references.value),
  };

  return {
    id: selectedArchiveId,
    themeId,
    title: dataUtils.normalizeText(elements.fields.title.value),
    summary: dataUtils.normalizeText(elements.fields.summary.value) || dataUtils.buildSummary(elements.fields.title.value, theme.name),
    speaker: dataUtils.normalizeText(elements.fields.speaker.value),
    date: elements.fields.date.value,
    duration: dataUtils.normalizeText(elements.fields.duration.value) || "未記載",
    featured: elements.fields.featured.checked,
    assets: {
      recording: Boolean(links.recording),
      slides: Boolean(links.slides || elements.files.slides.files[0]),
      notes: Boolean(links.notes || elements.files.notes.files[0]),
      references: Boolean(links.references || elements.files.references.files[0]),
    },
    links,
    thumbnail: dataUtils.getThemeColors(themeId),
  };
}

function buildDetailFromFields(existingDetail = {}) {
  const overview = elements.fields.detailOverview.value
    .split(/\r?\n/)
    .map((line) => dataUtils.normalizeText(line))
    .filter(Boolean)
    .join("\n");
  const keyPoints = multilineValue(elements.fields.detailKeyPoints.value);
  const chapters = multilineValue(elements.fields.detailChapters.value)
    .map((line) => parseChapterLine(line))
    .filter((item) => item?.label);
  const materials = multilineValue(elements.fields.detailMaterials.value)
    .map((line) => parseMaterialLine(line))
    .map((item) => {
      if (!item) {
        return null;
      }

      const url = normalizeArchiveLink("references", item.url);
      return item.label && url ? { label: item.label, url } : null;
    })
    .filter((item) => item?.label && item?.url);
  const detail = {
    ...existingDetail,
    overview,
    keyPoints,
    chapters,
    materials,
  };
  const hasVisibleDetail = Boolean(overview || keyPoints.length || chapters.length || materials.length);
  const hasPreservedVideo = Boolean(existingDetail?.video?.url || existingDetail?.video?.provider);
  return hasVisibleDetail || hasPreservedVideo ? detail : undefined;
}

function formToArchive() {
  const previousId = selectedArchiveId;
  const archiveId = previousId || dataUtils.createArchiveId(elements.fields.date.value, elements.fields.title.value);
  const themeId = elements.fields.themeId.value;
  const themeName = getThemeName(themeId);
  const colors = dataUtils.getThemeColors(themeId);
  const links = {
    recording: normalizeArchiveLink("recording", elements.fields.recording.value),
    slides: normalizeArchiveLink("slides", elements.fields.slides.value),
    notes: normalizeArchiveLink("notes", elements.fields.notes.value),
    references: normalizeArchiveLink("references", elements.fields.references.value),
  };

  const currentArchive = workingData.archives.find((item) => item.id === previousId || item.id === archiveId);
  const archive = {
    id: archiveId,
    themeId,
    title: dataUtils.normalizeText(elements.fields.title.value),
    summary: dataUtils.normalizeText(elements.fields.summary.value) || dataUtils.buildSummary(elements.fields.title.value, themeName),
    speaker: dataUtils.normalizeText(elements.fields.speaker.value),
    date: elements.fields.date.value,
    updatedAt: todayIso(),
    duration: dataUtils.normalizeText(elements.fields.duration.value) || "未記載",
    featured: elements.fields.featured.checked,
    assets: {
      recording: Boolean(links.recording),
      slides: Boolean(links.slides),
      notes: Boolean(links.notes),
      references: Boolean(links.references),
    },
    links,
    thumbnail: colors,
  };
  const detail = buildDetailFromFields(currentArchive?.detail ?? {});
  if (detail) {
    archive.detail = detail;
  }

  const uploads = pendingUploads.get(previousId) ?? {};
  FILE_KINDS.forEach((kind) => {
    if (uploads[kind] || elements.files[kind].files[0]) {
      archive.assets[kind] = true;
    }
  });

  return archive;
}

function validateArchive(archive) {
  if (!archive.title) {
    throw new Error("タイトルは必須です。");
  }
  if (!archive.date) {
    throw new Error("開催日は必須です。");
  }
  if (!archive.speaker) {
    throw new Error("講師は必須です。");
  }
  if (!archive.themeId) {
    throw new Error("テーマを選択してください。");
  }

  const recordingInput = String(elements.fields.recording.value ?? "").trim();
  if (recordingInput && !archive.links.recording) {
    throw new Error("アーカイブ URL は http:// または https:// から始まる安全な URL を入力してください。");
  }

  FILE_KINDS.forEach((kind) => {
    const inputValue = String(elements.fields[kind].value ?? "").trim();
    if (inputValue && !archive.links[kind]) {
      throw new Error(`${FILE_KIND_LABELS[kind]} の URL は http:// / https:// またはサイト内相対パスだけを使ってください。`);
    }
  });

  multilineValue(elements.fields.detailMaterials.value).forEach((line) => {
    const item = parseMaterialLine(line);
    const url = item ? normalizeArchiveLink("references", item.url) : "";
    if (!item || !url) {
      throw new Error("追加資料は `資料名 | URL` または URL 単体で入力してください。");
    }
  });
}

function upsertCurrentArchive(options = {}) {
  const { quiet = false } = options;
  const previousId = selectedArchiveId;
  const archive = formToArchive();

  validateArchive(archive);
  syncPendingFiles(previousId, archive.id);

  const index = workingData.archives.findIndex((item) => item.id === previousId || item.id === archive.id);
  if (index >= 0) {
    workingData.archives[index] = archive;
  } else {
    workingData.archives.push(archive);
  }

  if (archive.featured) {
    markThemeFeatured(archive.themeId, archive.id, true);
  }

  selectedArchiveId = archive.id;
  renderStats();
  renderArchiveList();
  populateForm(archive);

  if (!quiet) {
    showStatus("一覧へ反映しました。公開データへ反映するには保存かダウンロードを実行してください。", "success");
  }
}

function downloadTextFile(filename, text) {
  const blob = new Blob([text], { type: "text/javascript;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function pendingUploadCount() {
  return Array.from(pendingUploads.values()).reduce((count, uploads) => count + Object.keys(uploads).length, 0);
}

function expectedRootPath() {
  const fallbackPath = "/Users/meiki/Devloper/study_archive_hp";

  try {
    if (window.location.protocol !== "file:") {
      return fallbackPath;
    }

    return decodeURIComponent(new URL("../", window.location.href).pathname).replace(/\/$/, "");
  } catch (error) {
    return fallbackPath;
  }
}

async function queryReadwritePermission(handle) {
  if (typeof handle.queryPermission !== "function") {
    return "prompt";
  }

  return handle.queryPermission({ mode: "readwrite" });
}

async function copyRootPath() {
  const path = expectedRootPath();

  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(path);
    showStatus("保存先パスをコピーしました。", "success");
    return;
  }

  const helper = document.createElement("textarea");
  helper.value = path;
  helper.setAttribute("readonly", "");
  helper.style.position = "absolute";
  helper.style.left = "-9999px";
  document.body.append(helper);
  helper.select();
  document.execCommand("copy");
  helper.remove();
  showStatus("保存先パスをコピーしました。", "success");
}

async function isProjectRootHandle(handle) {
  try {
    const publicDir = await handle.getDirectoryHandle("public");
    const adminDir = await handle.getDirectoryHandle("admin");
    await publicDir.getFileHandle("index.html");
    await adminDir.getFileHandle("index.html");
    return true;
  } catch (error) {
    return false;
  }
}

async function resolveProjectRootHandle(handle) {
  if (await isProjectRootHandle(handle)) {
    return handle;
  }

  const repoName = expectedRootPath().split("/").filter(Boolean).at(-1);

  try {
    const childHandle = await handle.getDirectoryHandle(repoName);
    if (await isProjectRootHandle(childHandle)) {
      return childHandle;
    }
  } catch (error) {
    // Ignore and fall through to the explicit error below.
  }

  throw new Error(`保存先フォルダには ${expectedRootPath()} を選んでください。`);
}

async function connectProjectFolder() {
  if (typeof window.showDirectoryPicker !== "function") {
    throw new Error("このブラウザは直接保存に未対応です。Chrome または Edge を使ってください。");
  }

  const handle = await window.showDirectoryPicker({ mode: "readwrite" });
  projectRootHandle = await resolveProjectRootHandle(handle);
  await saveStoredRootHandle(projectRootHandle);
  elements.fsSupportNote.textContent = "接続済みです。このままリポジトリへ保存を押せます。";
  showStatus("リポジトリを接続しました。このまま「リポジトリへ保存」を押せます。", "success");
}

async function ensureDirectory(rootHandle, pathParts) {
  let directoryHandle = rootHandle;

  for (const part of pathParts) {
    directoryHandle = await directoryHandle.getDirectoryHandle(part, { create: true });
  }

  return directoryHandle;
}

async function writeTextFile(rootHandle, relativePath, text) {
  const pathParts = relativePath.split("/");
  const fileName = pathParts.pop();
  const directoryHandle = await ensureDirectory(rootHandle, pathParts);
  const fileHandle = await directoryHandle.getFileHandle(fileName, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(text);
  await writable.close();
}

async function writeBinaryFile(rootHandle, relativePath, file) {
  const pathParts = relativePath.split("/");
  const fileName = pathParts.pop();
  const directoryHandle = await ensureDirectory(rootHandle, pathParts);
  const fileHandle = await directoryHandle.getFileHandle(fileName, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(await file.arrayBuffer());
  await writable.close();
}

async function persistPendingUploads() {
  const archivesById = new Map(workingData.archives.map((archive) => [archive.id, archive]));

  for (const [archiveId, uploads] of pendingUploads.entries()) {
    const archive = archivesById.get(archiveId);
    if (!archive) {
      continue;
    }

    for (const [kind, file] of Object.entries(uploads)) {
      const relativePath = dataUtils.createUploadPath(archive, kind, file.name);
      await writeBinaryFile(projectRootHandle, `public/${relativePath}`, file);
      archive.links[kind] = relativePath;
      archive.assets[kind] = true;
    }
  }

  pendingUploads.clear();
}

async function saveProjectFiles() {
  upsertCurrentArchive({ quiet: true });

  if (!projectRootHandle) {
    await connectProjectFolder();
  }

  await persistPendingUploads();
  await writeTextFile(projectRootHandle, "public/data/site-content.js", dataUtils.serializeSiteData(workingData));

  updateUploadNotes();
  showStatus("リポジトリへ保存しました。public/index.html を再読み込みすると反映を確認できます。", "success");
}

function updateSupportNote() {
  if (projectRootHandle) {
    elements.fsSupportNote.textContent = "接続済みです。このままリポジトリへ保存を押せます。";
    return;
  }

  if (typeof window.showDirectoryPicker === "function") {
    elements.fsSupportNote.textContent = "初回だけリポジトリを接続してください。以後は自動で再接続を試します。";
    return;
  }

  elements.fsSupportNote.textContent = "直接保存は未対応です。Chrome / Edge かダウンロード運用を使ってください。";
}

function syncLibraryHeight() {
  if (!elements.libraryPanel || !elements.editorPanel) {
    return;
  }

  if (window.matchMedia("(max-width: 1180px)").matches) {
    elements.libraryPanel.style.removeProperty("--library-panel-height");
    return;
  }

  const editorHeight = Math.ceil(elements.editorPanel.getBoundingClientRect().height);
  if (editorHeight > 0) {
    elements.libraryPanel.style.setProperty("--library-panel-height", `${editorHeight}px`);
  }
}

async function restoreStoredProjectRootHandle() {
  if (typeof window.showDirectoryPicker !== "function") {
    return;
  }

  try {
    const storedHandle = await loadStoredRootHandle();
    if (!storedHandle) {
      return;
    }

    const resolvedHandle = await resolveProjectRootHandle(storedHandle);
    const permission = await queryReadwritePermission(resolvedHandle);

    if (permission !== "granted") {
      updateSupportNote();
      return;
    }

    projectRootHandle = resolvedHandle;
    updateSupportNote();
    showStatus("前回接続したリポジトリを自動で再接続しました。", "success");
  } catch (error) {
    projectRootHandle = null;
    await clearStoredRootHandle().catch(() => {});
    updateSupportNote();
  }
}

function startNewArchive() {
  if (!confirmDiscardChanges()) {
    return;
  }

  selectedArchiveId = "";
  elements.editorTitle.textContent = "新規アーカイブ";
  populateForm(emptyArchiveDraft());
  renderArchiveList();
  showStatus("新規アーカイブを入力中です。", "success");
}

function deleteCurrentArchive() {
  const archive = selectedArchive();
  if (!archive) {
    startNewArchive();
    return;
  }

  if (!window.confirm(`「${archive.title}」を削除します。よければ続けてください。`)) {
    return;
  }

  workingData.archives = workingData.archives.filter((item) => item.id !== archive.id);
  pendingUploads.delete(archive.id);
  selectedArchiveId = sortedArchives()[0]?.id ?? "";

  renderStats();
  renderArchiveList();

  if (selectedArchiveId) {
    populateForm(selectedArchive());
  } else {
    populateForm(emptyArchiveDraft());
  }

  showStatus("アーカイブを削除しました。公開データへ反映するには保存かダウンロードを実行してください。", "success");
}

function handleDownload() {
  upsertCurrentArchive({ quiet: true });

  if (pendingUploadCount() > 0) {
    throw new Error("ファイルアップロードが含まれています。リポジトリへ保存を使うか、URL入力へ切り替えてください。");
  }

  downloadTextFile("site-content.js", dataUtils.serializeSiteData(workingData));
  showStatus("site-content.js をダウンロードしました。public/data/ に置き換えれば反映できます。", "success");
}

function attachEvents() {
  elements.archiveForm.addEventListener("submit", (event) => {
    event.preventDefault();

    try {
      upsertCurrentArchive();
    } catch (error) {
      showStatus(error.message, "error");
    }
  });

  elements.archiveSearch.addEventListener("input", () => {
    renderArchiveList();
  });

  elements.createArchive.addEventListener("click", () => {
    startNewArchive();
  });

  elements.autofillSummary.addEventListener("click", () => {
    const themeName = getThemeName(elements.fields.themeId.value);
    elements.fields.summary.value = dataUtils.buildSummary(elements.fields.title.value, themeName);
    setDirtyState(true);
    showStatus("一覧カード用の概要を自動入力しました。必要なら表現だけ手直ししてください。", "success");
  });

  elements.autofillDetail.addEventListener("click", () => {
    const draft = draftArchiveFromFields();
    const theme = getThemeMeta(draft.themeId);
    const detail = dataUtils.buildArchiveDetail(draft, theme);

    elements.fields.detailOverview.value = detail.overview || "";
    elements.fields.detailKeyPoints.value = serializeLines(detail.keyPoints);
    setDirtyState(true);
    showStatus("詳細ページ用の要約と学習ポイントを自動入力しました。叩き台として調整してください。", "success");
  });

  elements.deleteArchive.addEventListener("click", () => {
    deleteCurrentArchive();
  });

  elements.downloadData.addEventListener("click", () => {
    try {
      handleDownload();
    } catch (error) {
      showStatus(error.message, "error");
    }
  });

  elements.connectFolder.addEventListener("click", async () => {
    try {
      await connectProjectFolder();
    } catch (error) {
      showStatus(error.message, "error");
    }
  });

  elements.copyRootPath.addEventListener("click", async () => {
    try {
      await copyRootPath();
    } catch (error) {
      showStatus("パスをコピーできませんでした。手動でコピーしてください。", "error");
    }
  });

  elements.saveProject.addEventListener("click", async () => {
    try {
      await saveProjectFiles();
    } catch (error) {
      showStatus(error.message, "error");
    }
  });

  Object.values(elements.fields).forEach((field) => {
    field.addEventListener("input", () => {
      setDirtyState(true);
    });
    field.addEventListener("change", () => {
      setDirtyState(true);
    });
  });

  FILE_KINDS.forEach((kind) => {
    elements.files[kind].addEventListener("change", () => {
      updateUploadNotes();
      setDirtyState(true);
    });
  });

  document.querySelectorAll("[data-clear-upload]").forEach((button) => {
    button.addEventListener("click", () => {
      clearPendingUpload(button.dataset.clearUpload);
      setDirtyState(true);
    });
  });

  window.addEventListener("beforeunload", (event) => {
    if (!isDirty) {
      return;
    }

    event.preventDefault();
    event.returnValue = "";
  });

  window.addEventListener("resize", () => {
    syncLibraryHeight();
  });
}

async function initialize() {
  elements.rootPathValue.textContent = expectedRootPath();
  renderThemeOptions();
  renderStats();
  updateSupportNote();
  attachEvents();

  selectedArchiveId = sortedArchives()[0]?.id ?? "";

  if (selectedArchiveId) {
    populateForm(selectedArchive());
  } else {
    populateForm(emptyArchiveDraft());
  }

  renderArchiveList();
  syncLibraryHeight();

  if ("ResizeObserver" in window && elements.editorPanel) {
    const observer = new ResizeObserver(() => {
      syncLibraryHeight();
    });
    observer.observe(elements.editorPanel);
  }

  await restoreStoredProjectRootHandle();
  syncLibraryHeight();
}

initialize();
